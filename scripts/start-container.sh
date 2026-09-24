#!/bin/sh
# Fast boot. Rebuild only when deploy-head != built commit (no blind npm ci).
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

HEAD="$(cat .deploy-head 2>/dev/null || true)"
if [ -z "$HEAD" ]; then
  HEAD="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
fi
BUILT="$(cat .next/GIT_HEAD 2>/dev/null || echo none)"

if [ ! -f .next/BUILD_ID ] || [ "$HEAD" != "$BUILT" ] || [ ! -x node_modules/.bin/next ]; then
  echo "[englishtutor] rebuild needed ($BUILT → $HEAD)"
  sh /app/scripts/rebuild-if-needed.sh
else
  echo "[englishtutor] build ok ($HEAD)"
fi

npx prisma migrate deploy >/dev/null 2>&1 || true

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
