#!/usr/bin/env bash
# One-time: ensure remote exists and push current branch.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE_URL="${REMOTE_URL:-https://github.com/kecevahir/ai-english-tutor.git}"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
fi

git remote set-url origin "$REMOTE_URL"
BRANCH="$(git branch --show-current)"
git push -u origin "$BRANCH"
echo "origin → $REMOTE_URL ($BRANCH)"
