#!/bin/sh
# Container entrypoint for Synology / Portainer (Command field).
# Expected workdir mount: /volume1/Docker/englishtutor → /app
set -eu
cd /app

echo "[englishtutor] starting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

npx prisma generate
npx prisma migrate deploy || true

# Seed is idempotent enough for demo learner; ignore failures on re-run
npx tsx prisma/seed.ts || true

if [ ! -d .next ]; then
  echo "[englishtutor] no .next — building…"
  npm run build
fi

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
