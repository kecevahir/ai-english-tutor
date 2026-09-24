#!/bin/sh
# NAS: run via Task Scheduler every 2 minutes as root.
# /volume1/Docker/englishtutor/scripts/nas-git-pull.sh >> /volume1/Docker/englishtutor_git_pull.log 2>&1
set -eu

APP_DIR="${APP_DIR:-/volume1/Docker/englishtutor}"
# Until PR is merged to main, deploy the live feature branch
BRANCH="${DEPLOY_BRANCH:-cursor/englishtutor-vite-skeleton-c272}"
LOCK="/tmp/englishtutor-nas-git-pull.lock"

cd "$APP_DIR" || exit 1

# Avoid overlapping cron runs
if [ -f "$LOCK" ]; then
  if [ -n "$(find "$LOCK" -mmin +20 2>/dev/null)" ]; then
    rm -f "$LOCK"
  else
    echo "$(date -Iseconds) skip: lock held"
    exit 0
  fi
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT

git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

BEFORE="$(git rev-parse HEAD 2>/dev/null || echo none)"
echo "$(date -Iseconds) pull origin/$BRANCH (was $BEFORE)"
git fetch origin "$BRANCH"
git checkout "$BRANCH" 2>/dev/null || git checkout -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"
AFTER="$(git rev-parse HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "$(date -Iseconds) no changes"
  exit 0
fi

echo "$(date -Iseconds) updated $BEFORE → $AFTER — rebuilding"

# Ensure AUTH_SECRET exists for NextAuth
if [ -f "$APP_DIR/.env" ] && ! grep -q '^AUTH_SECRET=' "$APP_DIR/.env"; then
  echo "AUTH_SECRET=\"englishtutor-auto-$(date +%s)\"" >> "$APP_DIR/.env"
  echo "$(date -Iseconds) added AUTH_SECRET to .env"
fi

if command -v docker >/dev/null 2>&1 && [ -f "$APP_DIR/docker-compose.yml" ]; then
  cd "$APP_DIR"
  if [ -x /usr/local/bin/docker ]; then
    /usr/local/bin/docker compose up -d --build
  else
    docker compose up -d --build
  fi
  echo "$(date -Iseconds) docker compose up -d --build done"
  exit 0
fi

echo "$(date -Iseconds) ERROR: docker compose not available"
exit 1
