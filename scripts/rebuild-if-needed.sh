#!/bin/sh
# Inside container. Build while the OLD next process can still serve.
# Usage: docker exec -e DEPLOY_HEAD=<sha> englishtutor-app sh /app/scripts/rebuild-if-needed.sh
set -eu
cd /app

HEAD="${DEPLOY_HEAD:-}"
if [ -z "$HEAD" ]; then
  HEAD="$(cat .deploy-head 2>/dev/null || true)"
fi
if [ -z "$HEAD" ]; then
  HEAD="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
fi

BUILT="$(cat .next/GIT_HEAD 2>/dev/null || echo none)"
echo "[rebuild] target=$HEAD built=$BUILT"

LOCK_HASH="$(cksum package-lock.json 2>/dev/null | awk '{print $1"-"$2}' || echo none)"
LOCK_STAMP="$(cat node_modules/.ci-lock 2>/dev/null || echo none)"

if [ ! -x node_modules/.bin/next ] \
  || [ ! -d node_modules/@tailwindcss/postcss ] \
  || [ "$LOCK_STAMP" != "$LOCK_HASH" ]; then
  echo "[rebuild] npm ci (lock changed or deps missing)…"
  npm ci --include=dev
  echo "$LOCK_HASH" > node_modules/.ci-lock
else
  echo "[rebuild] skip npm ci"
fi

npx prisma generate >/dev/null
npx prisma migrate deploy >/dev/null || true

if [ -f .next/BUILD_ID ] && [ "$HEAD" = "$BUILT" ]; then
  echo "[rebuild] already current — nothing to do"
  exit 0
fi

echo "[rebuild] next build…"
# Build into a temp dir if possible; Next writes to .next — site may briefly
# see partial files only after restart, so we build then stamp.
NODE_ENV=production npm run build
echo "$HEAD" > .next/GIT_HEAD
echo "$HEAD" > .deploy-head
echo "[rebuild] OK $HEAD"
