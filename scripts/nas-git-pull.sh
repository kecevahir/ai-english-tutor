#!/bin/sh
# NAS cron — fast deploy (izin-style):
#   1) git pull
#   2) docker exec rebuild-if-needed  (old site still up)
#   3) docker restart                 (boot only — no npm ci)
#
# */2 * * * * /volume1/Docker/englishtutor/scripts/nas-git-pull.sh >> /volume1/Docker/englishtutor_git_pull.log 2>&1
set -eu

PATH="/usr/local/bin:/usr/bin:/bin:/usr/syno/bin:${PATH:-}"
APP_DIR="${APP_DIR:-/volume1/Docker/englishtutor}"
BRANCH="${DEPLOY_BRANCH:-cursor/englishtutor-vite-skeleton-c272}"
LOCK="/tmp/englishtutor-nas-git-pull.lock"
DOCKER_BIN=""

if [ -x /usr/local/bin/docker ]; then
  DOCKER_BIN=/usr/local/bin/docker
elif command -v docker >/dev/null 2>&1; then
  DOCKER_BIN="$(command -v docker)"
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
chmod +x "$APP_DIR/scripts/"*.sh 2>/dev/null || true

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

echo "$(date -Iseconds) updated $BEFORE → $AFTER"
echo "$AFTER" > "$APP_DIR/.deploy-head"

if [ -f "$APP_DIR/.env" ] && ! grep -q '^AUTH_SECRET=' "$APP_DIR/.env"; then
  echo "AUTH_SECRET=\"englishtutor-auto-$(date +%s)\"" >> "$APP_DIR/.env"
fi

if [ -z "$DOCKER_BIN" ]; then
  echo "$(date -Iseconds) ERROR: docker not found"
  exit 1
fi

if ! "$DOCKER_BIN" ps --format '{{.Names}}' | grep -q '^englishtutor-app$'; then
  echo "$(date -Iseconds) container not running — compose up (one-time)"
  cd "$APP_DIR"
  "$DOCKER_BIN" compose up -d
  # wait for first boot rebuild
  sleep 5
  "$DOCKER_BIN" exec englishtutor-app sh /app/scripts/rebuild-if-needed.sh || true
  "$DOCKER_BIN" restart englishtutor-app
else
  echo "$(date -Iseconds) rebuild inside running container…"
  if "$DOCKER_BIN" exec englishtutor-app sh /app/scripts/rebuild-if-needed.sh; then
    echo "$(date -Iseconds) restart (fast boot)…"
    "$DOCKER_BIN" restart englishtutor-app
  else
    echo "$(date -Iseconds) exec rebuild failed — restart fallback"
    "$DOCKER_BIN" restart englishtutor-app
  fi
fi

echo "$(date -Iseconds) deploy done ($AFTER)"
echo "$AFTER $(date -Iseconds)" > "$APP_DIR/.deployed-commit"
