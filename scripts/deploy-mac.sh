#!/usr/bin/env bash
# Mac: commit + push. NAS cron pulls and builds. Do NOT npm run build on Mac.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MSG="${1:-chore: update}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repo. Run scripts/setup-git.sh first."
  exit 1
fi

git add -A
if git diff --cached --quiet; then
  echo "No local changes to commit."
else
  git commit -m "$MSG"
fi

BRANCH="$(git branch --show-current)"
git push -u origin "$BRANCH"
echo "Pushed to origin/$BRANCH"
echo "NAS pulls every ~2 min. Then hard-refresh https://dmportal.com.tr/englishtutor/"
