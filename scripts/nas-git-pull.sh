#!/bin/sh
# NAS: run via cron every 2 minutes as root.
# */2 * * * * /volume1/Docker/englishtutor/scripts/nas-git-pull.sh >> /volume1/Docker/englishtutor_git_pull.log 2>&1
set -eu

PATH="/usr/local/bin:/usr/bin:/bin:/usr/syno/bin:${PATH:-}"
APP_DIR="${APP_DIR:-/volume1/Docker/englishtutor}"
BRANCH="${DEPLOY_BRANCH:-cursor/englishtutor-vite-skeleton-c272}"
LOCK="/tmp/englishtutor-nas-git-pull.lock"
DOCKER_BIN="${DOCKER_BIN:-}"

if [ -z "$DOCKER_BIN" ]; then
  if [ -x /usr/local/bin/docker ]; then
    DOCKER_BIN=/usr/local/bin/docker
  elif command -v docker >/dev/null 2>&1; then
    DOCKER_BIN="$(command -v docker)"
  fi
fi

cd "$APP_DIR" || exit 1

if [ -f "$LOCK" ]; then
  if [ -n "$(find "$LOCK" -mmin +40 2>/dev/null)" ]; then
    echo "$(date -Iseconds) stale lock removed"
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
  echo "$(date -Iseconds) no changes ($AFTER)"
  exit 0
fi

echo "$(date -Iseconds) updated $BEFORE → $AFTER — rebuilding"

if [ -f "$APP_DIR/.env" ] && ! grep -q '^AUTH_SECRET=' "$APP_DIR/.env"; then
  echo "AUTH_SECRET=\"englishtutor-auto-$(date +%s)\"" >> "$APP_DIR/.env"
  echo "$(date -Iseconds) added AUTH_SECRET to .env"
fi

if [ -z "$DOCKER_BIN" ]; then
  echo "$(date -Iseconds) ERROR: docker not found in PATH=$PATH"
  exit 1
fi

cd "$APP_DIR"
"$DOCKER_BIN" compose up -d --build
echo "$(date -Iseconds) docker compose up -d --build done (commit $AFTER)"
echo "$AFTER $(date -Iseconds)" > "$APP_DIR/.deployed-commit"
