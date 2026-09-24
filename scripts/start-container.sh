#!/bin/sh
# Bind-mounted entrypoint. Always ensure build deps, then next build if needed.
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "[englishtutor] npm ci --include=dev…"
npm ci --include=dev

npx prisma generate
npx prisma migrate deploy

if npx tsx prisma/seed.ts; then
  echo "[englishtutor] seed ok"
else
  echo "[englishtutor] seed skipped/failed (continuing)"
fi

HEAD="$(cat .deploy-head 2>/dev/null || true)"
if [ -z "$HEAD" ]; then
  HEAD="$(git rev-parse HEAD 2>/dev/null || date +%s)"
fi
BUILT="$(cat .next/GIT_HEAD 2>/dev/null || echo none)"

if [ ! -f .next/BUILD_ID ] || [ "$HEAD" != "$BUILT" ] || [ ! -d node_modules/@tailwindcss/postcss ]; then
  echo "[englishtutor] next build ($BUILT → $HEAD)…"
  rm -rf .next
  NODE_ENV=production npm run build
  echo "$HEAD" > .next/GIT_HEAD
else
  echo "[englishtutor] next build up to date ($HEAD)"
fi

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
