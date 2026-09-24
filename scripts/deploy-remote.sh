#!/usr/bin/env bash
# Deploy AI English Tutor beside dmportal Express/nginx.
# Requires: SSH access to the origin host, Docker (or Node 22 + Postgres).
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:?Set REMOTE_HOST, e.g. user@origin.dmportal.com.tr}"
REMOTE_DIR="${REMOTE_DIR:-/opt/englishtutor}"
BRANCH="${BRANCH:-main}"

ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  ./ "$REMOTE_HOST:$REMOTE_DIR/"

ssh "$REMOTE_HOST" "bash -s" <<EOF
set -euo pipefail
cd '$REMOTE_DIR'
if command -v docker >/dev/null 2>&1; then
  docker compose up -d --build
else
  echo "Docker not found on remote. Install Docker or run Node manually."
  exit 1
fi
echo "Deployed. Ensure nginx includes deploy/nginx-englishtutor.conf and reloads."
EOF
