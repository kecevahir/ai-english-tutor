#!/bin/sh
# NAS: run via Task Scheduler every 2 minutes as root.
# /volume1/Docker/englishtutor/scripts/nas-git-pull.sh >> /volume1/Docker/englishtutor_git_pull.log 2>&1
set -eu

APP_DIR="${APP_DIR:-/volume1/Docker/englishtutor}"
BRANCH="${DEPLOY_BRANCH:-main}"
LOCK="/tmp/englishtutor-nas-git-pull.lock"

cd "$APP_DIR" || exit 1

# Avoid overlapping cron runs
if [ -f "$LOCK" ]; then
  # stale lock older than 20 minutes → remove
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

BEFORE="$(git rev-parse HEAD)"
echo "$(date -Iseconds) pull origin/$BRANCH (was $BEFORE)"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
AFTER="$(git rev-parse HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "$(date -Iseconds) no changes"
  exit 0
fi

echo "$(date -Iseconds) updated $BEFORE → $AFTER — rebuilding"

# Prefer docker restart with rebuild if compose is present
if command -v docker >/dev/null 2>&1 && [ -f "$APP_DIR/docker-compose.yml" ]; then
  cd "$APP_DIR"
  docker compose up -d --build
  echo "$(date -Iseconds) docker compose up -d --build done"
  exit 0
fi

# Fallback: in-place Node build (if container exec / host node available)
if [ -f "$APP_DIR/package.json" ]; then
  cd "$APP_DIR"
  npm ci --omit=dev || npm install
  npx prisma generate
  npx prisma migrate deploy || true
  npm run build
  # Restart app process if a pid file / docker name is known
  if command -v docker >/dev/null 2>&1; then
    docker restart englishtutor-app 2>/dev/null || true
  fi
  echo "$(date -Iseconds) local rebuild done"
fi
