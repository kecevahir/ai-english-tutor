#!/bin/sh
# Fast NAS deploy:
#   git pull → docker exec build (site STAYS UP) → restart only if build OK
set -eu

PATH="/usr/local/bin:/usr/bin:/bin:/usr/syno/bin:${PATH:-}"
APP_DIR="${APP_DIR:-/volume1/Docker/englishtutor}"
BRANCH="${DEPLOY_BRANCH:-cursor/englishtutor-vite-skeleton-c272}"
LOCK="/tmp/englishtutor-nas-git-pull.lock"

if [ -x /usr/local/bin/docker ]; then
  DOCKER_BIN=/usr/local/bin/docker
elif command -v docker >/dev/null 2>&1; then
  DOCKER_BIN="$(command -v docker)"
else
  echo "$(date -Iseconds) ERROR: docker missing"
  exit 1
fi

cd "$APP_DIR" || exit 1

if [ -f "$LOCK" ]; then
  if [ -n "$(find "$LOCK" -mmin +40 2>/dev/null)" ]; then
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
  echo "$(date -Iseconds) no changes"
  exit 0
fi

echo "$(date -Iseconds) updated $BEFORE → $AFTER"

# Ensure container is running BEFORE build so traffic can continue
if ! "$DOCKER_BIN" ps --format '{{.Names}}' | grep -q '^englishtutor-app$'; then
  echo "$(date -Iseconds) starting container…"
  "$DOCKER_BIN" compose up -d
  # First boot may need a full rebuild; wait for it
  for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    if "$DOCKER_BIN" ps --format '{{.Names}}' | grep -q '^englishtutor-app$'; then
      break
    fi
    sleep 5
  done
fi

echo "$(date -Iseconds) building in-container (old site still up)…"
if "$DOCKER_BIN" exec -e DEPLOY_HEAD="$AFTER" englishtutor-app sh /app/scripts/rebuild-if-needed.sh; then
  echo "$(date -Iseconds) build OK — brief restart"
  "$DOCKER_BIN" restart englishtutor-app
  echo "$AFTER $(date -Iseconds)" > "$APP_DIR/.deployed-commit"
  echo "$(date -Iseconds) deploy done"
else
  echo "$(date -Iseconds) BUILD FAILED — keeping previous running container (no restart)"
  exit 1
fi
