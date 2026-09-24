#!/bin/sh
# Bind-mounted entrypoint (izin-style). Rebuild Next only when source changed.
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

# Production image sets NODE_ENV=production which makes npm ci skip
# build-time deps (tailwind, typescript). Always include them for builds.
if [ ! -x node_modules/.bin/next ] \
  || [ ! -d node_modules/@tailwindcss/postcss ] \
  || [ package-lock.json -nt node_modules ]; then
  echo "[englishtutor] npm ci --include=dev…"
  npm ci --include=dev
fi

npx prisma generate
npx prisma migrate deploy

if npx tsx prisma/seed.ts; then
  echo "[englishtutor] seed ok"
else
  echo "[englishtutor] seed skipped/failed (continuing)"
fi

# Prefer host-written stamp (nas-git-pull); fall back to git if available
HEAD="$(cat .deploy-head 2>/dev/null || true)"
if [ -z "$HEAD" ]; then
  HEAD="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
fi
BUILT="$(cat .next/GIT_HEAD 2>/dev/null || echo none)"

if [ ! -f .next/BUILD_ID ] || [ "$HEAD" != "$BUILT" ]; then
  echo "[englishtutor] next build ($BUILT → $HEAD)…"
  NODE_ENV=production npm run build
  echo "$HEAD" > .next/GIT_HEAD
else
  echo "[englishtutor] next build up to date ($HEAD)"
fi

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
