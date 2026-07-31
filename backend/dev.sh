#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

.venv/bin/pip install -q -r requirements.txt

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created backend/.env — add OPENAI_API_KEY and CHAT_ACCESS_PASSWORD if needed."
fi

exec .venv/bin/uvicorn app.main:app --reload --port 8000
