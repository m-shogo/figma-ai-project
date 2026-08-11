#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPERIMENT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${REF001_PREVIEW_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/visual-preview/"

php -S "127.0.0.1:${PORT}" -t "$EXPERIMENT_ROOT" >"${TMPDIR:-/tmp}/ref001-visual-preview-php.log" 2>&1 &
SERVER_PID=$!
cleanup() {
	kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

for _ in {1..30}; do
	if curl -fsS "$URL" >/dev/null 2>&1; then
		break
	fi
	sleep 0.2
done
curl -fsS "$URL" >/dev/null

cd "$SCRIPT_DIR"
npx --yes --package=playwright@1.55.0 node asset-check.mjs "$URL"
