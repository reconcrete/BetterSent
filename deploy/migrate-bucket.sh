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
[ -f "$ROOT/.env" ] && set -a && . "$ROOT/.env" && set +a
DST_DATABASE_URL="${DST_DATABASE_URL:-postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@host.docker.internal:8094/${POSTGRES_DB:-bettersent}}"
DST_BUCKET="${S3_BUCKET:-bettersent}"
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

mc_run() {
  docker run --rm --add-host=host.docker.internal:host-gateway \
    --entrypoint /bin/sh minio/mc:latest -c "$1"
}

setup="mc alias set src '$SRC_S3_ENDPOINT' '$SRC_S3_ACCESS_KEY' '$SRC_S3_SECRET_KEY' >/dev/null && \
mc alias set dst 'http://host.docker.internal:8092' '$S3_ACCESS_KEY' '$S3_SECRET_KEY' >/dev/null"

failed=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  echo "    $f"
  if ! mc_run "$setup && mc mirror --overwrite --quiet 'src/$SRC_S3_BUCKET/$f/' 'dst/$DST_BUCKET/$f/'"; then
    echo "    ^ FAILED" >&2
    failed=$((failed + 1))
  fi
done <<< "$folders"

echo "==> Copied $((count - failed))/$count folder(s)"
echo "==> Objects now in the local bucket:"
mc_run "$setup && mc ls --recursive 'dst/$DST_BUCKET/' | wc -l"
[ "$failed" -eq 0 ] || exit 1
