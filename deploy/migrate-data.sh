#!/usr/bin/env bash
# Copy a chosen set of users (and only their rows) from the Railway database
# into the local one.
#
#   SRC_DATABASE_URL='postgres://...railway...' \
#   USER_EMAILS='a@example.com,b@example.com' \
#   ./deploy/migrate-data.sh
#
# Runs psql inside a container, so no local postgres client is needed. The
# target defaults to the compose database published on 127.0.0.1:8094.
#
# The schema is a clean tree rooted at "user", so a per-table predicate is
# enough — but note two tables that carry no foreign key to user and so cannot
# be filtered by one:
#   * telegram_session is keyed by Telegram chat id and links to a user only
#     through its JSON payload, hence the data->>'userId' predicate.
#   * verification is short-lived login state and is deliberately skipped.
#
# send_history rows carry S3 object keys in markdown_path/epub_path, so this
# script must be paired with deploy/migrate-bucket.sh or the history preview
# will 500 on rows whose objects were never copied.
set -euo pipefail

: "${SRC_DATABASE_URL:?set SRC_DATABASE_URL to the Railway connection string}"
: "${USER_EMAILS:?set USER_EMAILS to a comma-separated list}"

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

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
PG_IMAGE="${PG_IMAGE:-postgres:17-alpine}"

psql_in() {
  docker run --rm -i \
    --add-host=host.docker.internal:host-gateway \
    -v "$WORK:/work" \
    -e PGCONNECT_TIMEOUT=15 \
    "$PG_IMAGE" psql "$@"
}

# Quoted, ordinal-ordered column list taken from the TARGET, so the copy does
# not depend on the two databases having the same physical column order.
cols_of() {
  psql_in "$DST_DATABASE_URL" -Atc \
    "SELECT string_agg(quote_ident(column_name), ',' ORDER BY ordinal_position)
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name='$1'"
}

emails_sql="$(printf "%s" "$USER_EMAILS" | awk -F, '{for(i=1;i<=NF;i++){gsub(/^ +| +$/,"",$i); printf "%s'\''%s'\''", (i>1?",":""), $i}}')"
USERS="SELECT id FROM \"user\" WHERE email IN ($emails_sql)"
HIST="SELECT id FROM send_history WHERE user_id IN ($USERS)"

echo "==> Users matched on the source:"
psql_in "$SRC_DATABASE_URL" -c "SELECT id, name, email FROM \"user\" WHERE email IN ($emails_sql)"

n=$(psql_in "$SRC_DATABASE_URL" -Atc "SELECT count(*) FROM \"user\" WHERE email IN ($emails_sql)" | tr -d '[:space:]')
want=$(printf "%s" "$USER_EMAILS" | awk -F, '{print NF}')
if [ "$n" != "$want" ]; then
  echo "ERROR: matched $n users but expected $want. Check the addresses and re-run." >&2
  exit 1
fi

copy_table() {
  local t="$1" where="$2" c
  c="$(cols_of "$t")"
  [ -n "$c" ] || { echo "ERROR: table $t not found in target" >&2; exit 1; }
  psql_in "$SRC_DATABASE_URL" -c "\\copy (SELECT $c FROM \"$t\" $where) TO '/work/$t.csv' WITH (FORMAT csv)"
  psql_in "$DST_DATABASE_URL" -c "\\copy \"$t\" ($c) FROM '/work/$t.csv' WITH (FORMAT csv)"
  local rows
  rows=$(psql_in "$DST_DATABASE_URL" -Atc "SELECT count(*) FROM \"$t\"" | tr -d '[:space:]')
  printf '    %-22s -> %s rows\n' "$t" "$rows"
}

echo "==> Copying"
copy_table user                 "WHERE id IN ($USERS)"
copy_table account              "WHERE user_id IN ($USERS)"
copy_table session              "WHERE user_id IN ($USERS)"
copy_table device_code          "WHERE user_id IN ($USERS)"
copy_table subscription         "WHERE user_id IN ($USERS)"
copy_table usage_record         "WHERE user_id IN ($USERS)"
copy_table kindle_email_address "WHERE user_id IN ($USERS)"
copy_table send_history         "WHERE user_id IN ($USERS)"
copy_table reference            "WHERE history_id IN ($HIST)"
copy_table telegram_session     "WHERE data->>'userId' IN ($USERS)"

echo
echo "==> S3 keys referenced by the copied history (feed these to migrate-bucket.sh):"
psql_in "$DST_DATABASE_URL" -Atc \
  "SELECT count(*) FROM send_history WHERE markdown_path IS NOT NULL OR epub_path IS NOT NULL"

echo "==> Done."
