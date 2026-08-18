#!/usr/bin/env bash
# Print a one-time sign-in link for a user.
#
#   ./deploy/login-link.sh antonmorozoff64@gmail.com
#
# This is the way in when Google OAuth has no redirect URI registered for this
# deployment's domain. It needs ENABLE_MAGIC_LINK=1 and MAGIC_LINK_LOG=1 (the
# link is read back out of the API container's logs). The same link is also
# emailed via Resend, so normally you can just use the form at /sign-in — this
# script is the fallback for when mail is not arriving.
#
# The link is single-use and expires after MAGIC_LINK_TTL seconds (default 3600).
set -euo pipefail

EMAIL="${1:-}"
[ -n "$EMAIL" ] || { echo "usage: $0 <email>" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_get() {
  sed -n "s/^$1=//p" "$ROOT/.env" | tail -1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}
API_URL="${API_URL:-$(env_get API_URL)}"
WEB_URL="${WEB_URL:-$(env_get WEB_URL)}"

# A marker makes the right line findable even when several links are in flight.
before=$(docker logs --tail 400 bettersent-api 2>&1 | grep -c "\[magic-link\] $EMAIL" || true)

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API_URL/api/auth/sign-in/magic-link" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"callbackURL\":\"$WEB_URL/\"}")
[ "$code" = "200" ] || { echo "request failed (HTTP $code) — is $EMAIL a known user?" >&2; exit 1; }

for _ in $(seq 1 20); do
  line=$(docker logs --tail 400 bettersent-api 2>&1 | grep "\[magic-link\] $EMAIL" | tail -1 || true)
  now=$(docker logs --tail 400 bettersent-api 2>&1 | grep -c "\[magic-link\] $EMAIL" || true)
  [ "$now" -gt "$before" ] && { echo "${line##*-> }"; exit 0; }
  sleep 1
done
echo "link did not appear in the logs — check MAGIC_LINK_LOG=1 and restart the API" >&2
exit 1
