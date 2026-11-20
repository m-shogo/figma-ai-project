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

fixture_name="${1:-}"
if [[ -z "$fixture_name" ]]; then
  echo "Usage: bash scripts/apply-fixture.sh <fixture-name>" >&2
  exit 2
fi
if [[ ! "$fixture_name" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "FAIL invalid fixture name: ${fixture_name}" >&2
  exit 2
fi
fixture_file="$ROOT/fixtures/${fixture_name}.json"
if [[ ! -f "$fixture_file" ]]; then
  echo "FAIL fixture does not exist: fixtures/${fixture_name}.json" >&2
  exit 2
fi

docker compose run --rm cli eval-file /fixture/scripts/apply-fixture.php "/fixture/fixtures/${fixture_name}.json"
echo "PASS applied fixture: ${fixture_name} (${COMPOSE_PROJECT_NAME})"
