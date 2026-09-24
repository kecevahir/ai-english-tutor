#!/bin/sh
# Run inside the app container (docker exec). Rebuild only when needed.
set -eu
cd /app

HEAD="$(cat .deploy-head 2>/dev/null || true)"
if [ -z "$HEAD" ]; then
  HEAD="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
fi
BUILT="$(cat .next/GIT_HEAD 2>/dev/null || echo none)"

LOCK_STAMP="$(cat node_modules/.ci-lock 2>/dev/null || echo none)"
LOCK_HASH="$(checksum package-lock.json 2>/dev/null || cksum package-lock.json 2>/dev/null | awk '{print $1}' || echo none)"

if [ ! -x node_modules/.bin/next ] \
  || [ ! -d node_modules/@tailwindcss/postcss ] \
  || [ "$LOCK_STAMP" != "$LOCK_HASH" ]; then
  echo "[rebuild] npm ci --include=dev…"
  npm ci --include=dev
  echo "$LOCK_HASH" > node_modules/.ci-lock
else
  echo "[rebuild] node_modules ok"
fi

npx prisma generate >/dev/null
npx prisma migrate deploy >/dev/null || true

if [ ! -f .next/BUILD_ID ] || [ "$HEAD" != "$BUILT" ]; then
  echo "[rebuild] next build ($BUILT → $HEAD)…"
  rm -rf .next
  NODE_ENV=production npm run build
  echo "$HEAD" > .next/GIT_HEAD
  echo "[rebuild] build done"
else
  echo "[rebuild] next already up to date ($HEAD)"
fi
