#!/bin/sh
# Fast boot after nas-git-pull already built via docker exec.
# Does NOT run npm ci / next build on every restart.
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

# Safety net: if somehow never built, build once
if [ ! -f .next/BUILD_ID ] || [ ! -x node_modules/.bin/next ]; then
  echo "[englishtutor] missing build — running rebuild-if-needed…"
  sh /app/scripts/rebuild-if-needed.sh
fi

npx prisma migrate deploy >/dev/null 2>&1 || true

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
