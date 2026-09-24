#!/usr/bin/env bash
# Cloud Agent install — idempotent dependency refresh (must terminate).
set -euo pipefail
cd /workspace

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npx prisma generate
