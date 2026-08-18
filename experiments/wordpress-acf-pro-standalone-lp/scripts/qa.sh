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

NODE_DIR="$ROOT/.runtime/playwright"
OUT_DIR="$ROOT/.runtime/qa"
mkdir -p "$NODE_DIR" "$OUT_DIR"

if [[ ! -d "$NODE_DIR/node_modules/playwright" ]]; then
  (
    cd "$NODE_DIR"
    npm init -y >/dev/null 2>&1
    npm install playwright@1.54.2 pixelmatch@7.1.0 pngjs@7.0.0 >/dev/null
    if [[ "${CI:-}" == "true" ]]; then
      npx playwright install --with-deps chromium
    else
      npx playwright install chromium
    fi
  )
fi

cases=(figma-baseline repeater-1-item repeater-8-items long-text missing-image reordered-items empty)
for case_name in "${cases[@]}"; do
  fixture_path="$ROOT/fixtures/${case_name}.json"
  bash "$ROOT/scripts/apply-fixture.sh" "$case_name"
  WP_URL="$WP_URL" \
    QA_CASE="$case_name" \
    QA_FIXTURE_PATH="$fixture_path" \
    QA_OUTPUT="$OUT_DIR/$case_name" \
    node "$ROOT/tests/runtime.mjs"
done

echo "PASS CMS robustness + mutation verification completed. Evidence: $OUT_DIR"
echo "PASS isolated Compose project: ${COMPOSE_PROJECT_NAME}"
echo "FIGMA FIDELITY: SKIP unless an actual Figma reference is supplied to tests/visual-diff.mjs."
