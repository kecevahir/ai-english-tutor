#!/bin/sh
# Boot only. Assumes rebuild-if-needed already produced .next for this commit.
# If somehow mismatched, rebuild once (should be rare).
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

HEAD="$(cat .deploy-head 2>/dev/null || echo unknown)"
BUILT="$(cat .next/GIT_HEAD 2>/dev/null || echo none)"

if [ ! -f .next/BUILD_ID ] || [ ! -x node_modules/.bin/next ]; then
  echo "[englishtutor] no build present — rebuilding…"
  DEPLOY_HEAD="$HEAD" sh /app/scripts/rebuild-if-needed.sh
elif [ "$HEAD" != "$BUILT" ] && [ "$HEAD" != "unknown" ]; then
  echo "[englishtutor] stamp mismatch ($BUILT → $HEAD) — rebuilding…"
  DEPLOY_HEAD="$HEAD" sh /app/scripts/rebuild-if-needed.sh
else
  echo "[englishtutor] serving $BUILT"
fi

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
