#!/usr/bin/env bash
# Cloud Agent start — ensure Postgres is up and schema is migrated (must return).
set -euo pipefail
cd /workspace

if command -v pg_isready >/dev/null 2>&1; then
  sudo service postgresql start >/dev/null 2>&1 || true
  # Wait briefly for readiness
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if sudo -u postgres pg_isready -q 2>/dev/null || pg_isready -h 127.0.0.1 -q 2>/dev/null; then
      break
    fi
    sleep 1
  done
fi

if [ ! -f .env ]; then
  cat > .env <<'EOF'
DATABASE_URL="postgresql://englishtutor:englishtutor@localhost:5432/englishtutor?schema=public"
AUTH_SECRET="englishtutor-cloud-agent-dev-secret"
AUTH_URL="http://127.0.0.1:3000"
AI_PROVIDER="mock"
SPEECH_STT_PROVIDER="web"
SPEECH_TTS_PROVIDER="web"
EOF
fi

# Fill missing keys without overwriting agent/user secrets already present.
ensure_env() {
  local key="$1" value="$2"
  if ! grep -q "^${key}=" .env 2>/dev/null; then
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}
ensure_env AUTH_SECRET '"englishtutor-cloud-agent-dev-secret"'
ensure_env AUTH_URL '"http://127.0.0.1:3000"'
ensure_env AI_PROVIDER '"mock"'

if [ ! -f .env.local ]; then
  cp .env .env.local
fi

# Ensure role/db exist (local agent VM)
if command -v psql >/dev/null 2>&1; then
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='englishtutor'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE USER englishtutor WITH PASSWORD 'englishtutor' SUPERUSER;"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='englishtutor'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE DATABASE englishtutor OWNER englishtutor;"
fi

npx prisma migrate deploy
npx prisma db seed || true

echo "[env-start] postgres + prisma ready"
