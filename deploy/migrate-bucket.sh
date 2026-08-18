#!/usr/bin/env bash
# Copy only the storage objects belonging to the users that migrate-data.sh
# imported, from the Railway bucket into the local MinIO.
#
#   SRC_S3_ENDPOINT='https://...' SRC_S3_BUCKET='...' \
#   SRC_S3_ACCESS_KEY='...' SRC_S3_SECRET_KEY='...' \
#   ./deploy/migrate-bucket.sh
#
# Run this AFTER migrate-data.sh: the set of objects to copy is derived from
# the send_history rows that actually landed locally, so the bucket and the
# database stay in step.
#
# saveEpub uploads a whole run folder — the markdown, the epub, and an images/
# subtree — and only the two file keys are recorded in the database. So the
# unit of copy is the folder containing a recorded key, not the key itself,
# or the epub's images would be left behind.
set -euo pipefail

: "${SRC_S3_ENDPOINT:?}" "${SRC_S3_BUCKET:?}" "${SRC_S3_ACCESS_KEY:?}" "${SRC_S3_SECRET_KEY:?}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Read .env by parsing rather than sourcing: values legitimately contain
# characters bash would treat as syntax (RESEND_FROM_EMAIL holds angle
# brackets, for one), and sourcing them fails or, worse, executes them.
env_get() {
  [ -f "$ROOT/.env" ] || return 0
  sed -n "s/^$1=//p" "$ROOT/.env" | tail -1 \
    | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}
POSTGRES_USER="${POSTGRES_USER:-$(env_get POSTGRES_USER)}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(env_get POSTGRES_PASSWORD)}"
POSTGRES_DB="${POSTGRES_DB:-$(env_get POSTGRES_DB)}"
S3_BUCKET="${S3_BUCKET:-$(env_get S3_BUCKET)}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-$(env_get S3_ACCESS_KEY)}"
S3_SECRET_KEY="${S3_SECRET_KEY:-$(env_get S3_SECRET_KEY)}"
DST_DATABASE_URL="${DST_DATABASE_URL:-postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@host.docker.internal:8094/${POSTGRES_DB:-bettersent}}"
DST_BUCKET="${S3_BUCKET:-bettersent}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
PG_IMAGE="${PG_IMAGE:-postgres:17-alpine}"

# Strip the trailing filename to get the run folder. Done with a regex rather
# than a fixed segment count so it holds whatever STORAGE_S3_PREFIX is set to,
# including empty.
folders=$(docker run --rm --add-host=host.docker.internal:host-gateway "$PG_IMAGE" \
  psql "$DST_DATABASE_URL" -Atc "
    SELECT DISTINCT regexp_replace(p, '/[^/]+\$', '')
      FROM (
        SELECT markdown_path AS p FROM send_history WHERE markdown_path IS NOT NULL AND markdown_path <> ''
        UNION
        SELECT epub_path     AS p FROM send_history WHERE epub_path     IS NOT NULL AND epub_path     <> ''
      ) s
     WHERE p LIKE '%/%'
     ORDER BY 1")

if [ -z "$folders" ]; then
  echo "No storage-backed history rows locally — nothing to copy."
  exit 0
fi

count=$(printf '%s\n' "$folders" | wc -l | tr -d '[:space:]')
echo "==> $count run folder(s) to copy"

# One container for the whole batch: spawning a container per folder would
# dominate the runtime for what is otherwise a few seconds of copying.
printf '%s\n' "$folders" > "$WORKDIR/folders.txt"

docker run --rm --add-host=host.docker.internal:host-gateway \
  -e EP="$SRC_S3_ENDPOINT" -e BKT="$SRC_S3_BUCKET" \
  -e AK="$SRC_S3_ACCESS_KEY" -e SK="$SRC_S3_SECRET_KEY" \
  -e DST_BUCKET="$DST_BUCKET" \
  -e DAK="$S3_ACCESS_KEY" -e DSK="$S3_SECRET_KEY" \
  -v "$WORKDIR:/work" --entrypoint /bin/sh minio/mc:latest -c '
    set -e
    mc alias set src "$EP" "$AK" "$SK" >/dev/null
    mc alias set dst "http://host.docker.internal:8092" "$DAK" "$DSK" >/dev/null
    failed=0
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      if ! mc mirror --overwrite --quiet "src/$BKT/$f/" "dst/$DST_BUCKET/$f/" >/dev/null 2>&1; then
        echo "FAILED: $f" >&2
        failed=$((failed+1))
      fi
    done < /work/folders.txt
    echo "failed folders: $failed"
    echo -n "objects now in local bucket: "
    mc ls --recursive "dst/$DST_BUCKET/" | wc -l
    [ "$failed" -eq 0 ]
  '
