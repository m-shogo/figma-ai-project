#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
# shellcheck disable=SC1091
source "$ROOT/scripts/runtime-env.sh"
ROOT="$FIXTURE_ROOT"
cd "$ROOT"

docker compose down -v --remove-orphans
rm -rf .runtime
echo "PASS fixture runtime reset: ${COMPOSE_PROJECT_NAME}."
