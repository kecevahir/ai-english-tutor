#!/bin/sh
# Container entrypoint — migrate, optional seed, start Next.js
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

npx prisma generate
npx prisma migrate deploy

# Seed must not kill the app on re-run / transient errors
if npx tsx prisma/seed.ts; then
  echo "[englishtutor] seed ok"
else
  echo "[englishtutor] seed skipped/failed (continuing)"
fi

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
