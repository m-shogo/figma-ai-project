#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPERIMENT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="${1:-$SCRIPT_DIR/captures}"
PORT="${REF001_PREVIEW_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/visual-preview/"

mkdir -p "$OUTPUT_DIR"

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

npx --yes playwright@1.55.0 screenshot \
	--viewport-size="1380,900" \
	--full-page \
	"$URL" \
	"$OUTPUT_DIR/ref001-pc-1380.png"

npx --yes playwright@1.55.0 screenshot \
	--viewport-size="375,844" \
	--full-page \
	"$URL" \
	"$OUTPUT_DIR/ref001-sp-375.png"

printf 'REF-001 visual captures written to %s\n' "$OUTPUT_DIR"
