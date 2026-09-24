#!/bin/sh
# Bind-mounted entrypoint (izin-style). Rebuild Next only when git HEAD changed.
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

# Host mount may not have node_modules yet (first boot / after lockfile change)
if [ ! -x node_modules/.bin/next ] || [ package-lock.json -nt node_modules ]; then
  echo "[englishtutor] npm ci…"
  npm ci
fi

npx prisma generate
npx prisma migrate deploy

if npx tsx prisma/seed.ts; then
  echo "[englishtutor] seed ok"
else
  echo "[englishtutor] seed skipped/failed (continuing)"
fi

HEAD="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
BUILT="$(cat .next/GIT_HEAD 2>/dev/null || echo none)"

if [ ! -d .next ] || [ "$HEAD" != "$BUILT" ]; then
  echo "[englishtutor] next build ($BUILT → $HEAD)…"
  npm run build
  echo "$HEAD" > .next/GIT_HEAD
else
  echo "[englishtutor] next build up to date ($HEAD)"
fi

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
