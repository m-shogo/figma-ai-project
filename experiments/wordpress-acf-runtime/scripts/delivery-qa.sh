#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${ACF_PRO_LICENSE_KEY:?Fresh delivery QA requires ACF_PRO_LICENSE_KEY; no fake ACF fallback is permitted.}"

# Resolve the ordinary development runtime first. This is intentionally a real
# WordPress/ACF runtime whose DB will later be destroyed before reconstruction.
# shellcheck disable=SC1091
source "$ROOT/scripts/runtime-env.sh"
SOURCE_PROJECT="$COMPOSE_PROJECT_NAME"
SOURCE_PORT="$WP_PORT"
SOURCE_URL="$WP_URL"
SOURCE_THEME_DIR="$THEME_SOURCE_DIR"
SOURCE_THEME_SLUG="$THEME_SLUG"

PACKAGE_ROOT="$ROOT/.runtime/delivery-package"
EVIDENCE_DIR="$ROOT/.runtime/delivery-qa"
FRESH_PROJECT="${SOURCE_PROJECT}-fresh-delivery"
if (( SOURCE_PORT >= 65535 )); then
  FRESH_PORT="$((SOURCE_PORT - 1))"
else
  FRESH_PORT="$((SOURCE_PORT + 1))"
fi
FRESH_URL="http://127.0.0.1:${FRESH_PORT}"
FRESH_THEME_SLUG="sample-theme-delivery"
FRESH_THEME_DIR="$PACKAGE_ROOT/theme/$FRESH_THEME_SLUG"

cleanup() {
  set +e
  COMPOSE_PROJECT_NAME="$FRESH_PROJECT" \
    WP_PORT="$FRESH_PORT" \
    WP_URL="$FRESH_URL" \
    THEME_SOURCE_DIR="$FRESH_THEME_DIR" \
    THEME_SLUG="$FRESH_THEME_SLUG" \
    docker compose down -v >/dev/null 2>&1 || true
  COMPOSE_PROJECT_NAME="$SOURCE_PROJECT" \
    WP_PORT="$SOURCE_PORT" \
    WP_URL="$SOURCE_URL" \
    THEME_SOURCE_DIR="$SOURCE_THEME_DIR" \
    THEME_SLUG="$SOURCE_THEME_SLUG" \
    docker compose down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

rm -rf "$PACKAGE_ROOT" "$EVIDENCE_DIR"
mkdir -p "$PACKAGE_ROOT/theme" "$PACKAGE_ROOT/acf" "$PACKAGE_ROOT/docs" "$EVIDENCE_DIR"

# ---------------------------------------------------------------------------
# Stage 1: development runtime + export
# ---------------------------------------------------------------------------
echo "== Development runtime =="
COMPOSE_PROJECT_NAME="$SOURCE_PROJECT" \
  WP_PORT="$SOURCE_PORT" \
  WP_URL="$SOURCE_URL" \
  THEME_SOURCE_DIR="$SOURCE_THEME_DIR" \
  THEME_SLUG="$SOURCE_THEME_SLUG" \
  bash "$ROOT/scripts/setup.sh"

# Marker exists only in the development DB. If it appears in the fresh runtime,
# the delivery gate proves that database state leaked across environments.
COMPOSE_PROJECT_NAME="$SOURCE_PROJECT" WP_PORT="$SOURCE_PORT" WP_URL="$SOURCE_URL" \
  THEME_SOURCE_DIR="$SOURCE_THEME_DIR" THEME_SLUG="$SOURCE_THEME_SLUG" \
  docker compose run --rm cli option update delivery_source_runtime_marker source-only >/dev/null

# Package theme/code/assets, but deliberately remove Local JSON. This fixture's
# fresh gate is specifically proving the explicit acf-export.json import path.
mkdir -p "$FRESH_THEME_DIR"
tar -C "$SOURCE_THEME_DIR" --exclude='./acf-json' -cf - . | tar -C "$FRESH_THEME_DIR" -xf -
cp "$ROOT/delivery/INSTALL.md" "$PACKAGE_ROOT/docs/INSTALL.md"
cp "$ROOT/delivery/ACF-FIELD-MAP.md" "$PACKAGE_ROOT/docs/ACF-FIELD-MAP.md"

# Reuse ACF's official export command rather than implementing an exporter.
if ! COMPOSE_PROJECT_NAME="$SOURCE_PROJECT" WP_PORT="$SOURCE_PORT" WP_URL="$SOURCE_URL" \
  THEME_SOURCE_DIR="$SOURCE_THEME_DIR" THEME_SLUG="$SOURCE_THEME_SLUG" \
  docker compose run --rm cli help acf json export >/dev/null 2>&1; then
  echo "FAIL installed ACF does not expose official 'wp acf json export'; fresh-delivery fixture requires ACF 6.8+." >&2
  exit 4
fi
COMPOSE_PROJECT_NAME="$SOURCE_PROJECT" WP_PORT="$SOURCE_PORT" WP_URL="$SOURCE_URL" \
  THEME_SOURCE_DIR="$SOURCE_THEME_DIR" THEME_SLUG="$SOURCE_THEME_SLUG" \
  docker compose run --rm -T cli acf json export \
    --field-groups=group_standalone_lp_sample --stdout > "$PACKAGE_ROOT/acf/acf-export.json"
python "$REPO_ROOT/scripts/validate_acf_export.py" "$PACKAGE_ROOT/acf/acf-export.json"

# Delivery artifacts must not contain licensed plugin binaries, credentials, or
# a database backup. The runtime's private .runtime Composer materialization is
# intentionally outside PACKAGE_ROOT.
if find "$PACKAGE_ROOT" -type f \( -name '*.sql' -o -name 'wp-config.php' -o -name '.env' -o -name '*.zip' \) -print -quit | grep -q .; then
  echo "FAIL delivery package contains forbidden runtime/database material." >&2
  exit 5
fi
if find "$PACKAGE_ROOT" -type d -name 'advanced-custom-fields-pro' -print -quit | grep -q .; then
  echo "FAIL delivery package contains ACF PRO plugin files." >&2
  exit 5
fi
if grep -R -n --exclude='INSTALL.md' 'ACF_PRO_LICENSE_KEY=' "$PACKAGE_ROOT" >/dev/null 2>&1; then
  echo "FAIL delivery package contains a license assignment." >&2
  exit 5
fi

# Destroy the entire development Compose state, including its named DB volume.
COMPOSE_PROJECT_NAME="$SOURCE_PROJECT" WP_PORT="$SOURCE_PORT" WP_URL="$SOURCE_URL" \
  THEME_SOURCE_DIR="$SOURCE_THEME_DIR" THEME_SLUG="$SOURCE_THEME_SLUG" \
  docker compose down -v

# ---------------------------------------------------------------------------
# Stage 2: second fresh WordPress + fresh database, artifacts only
# ---------------------------------------------------------------------------
echo "== Fresh delivery reconstruction =="
export COMPOSE_PROJECT_NAME="$FRESH_PROJECT"
export WP_PORT="$FRESH_PORT"
export WP_URL="$FRESH_URL"
export THEME_SOURCE_DIR="$FRESH_THEME_DIR"
export THEME_SLUG="$FRESH_THEME_SLUG"

bash "$ROOT/scripts/setup.sh"

if docker compose run --rm cli option get delivery_source_runtime_marker >/dev/null 2>&1; then
  echo "FAIL fresh WordPress inherited the development database marker." >&2
  exit 6
fi

# With Local JSON deliberately absent, no ACF field-group DB state may exist
# before the declared portable JSON is imported.
pre_import_groups="$(docker compose run --rm cli post list --post_type=acf-field-group --format=count | tr -d '\r[:space:]')"
if [[ "$pre_import_groups" != "0" ]]; then
  echo "FAIL fresh WordPress already has ${pre_import_groups} ACF field group(s) before delivery JSON import." >&2
  exit 6
fi

if ! docker compose run --rm cli help acf json import >/dev/null 2>&1; then
  echo "FAIL installed ACF does not expose official 'wp acf json import'; fresh-delivery fixture requires ACF 6.8+." >&2
  exit 7
fi
docker compose run --rm cli acf json import /fixture/.runtime/delivery-package/acf/acf-export.json

docker compose run --rm cli eval '
$found = false;
foreach (acf_get_field_groups() as $group) {
    if (($group["key"] ?? "") === "group_standalone_lp_sample") { $found = true; break; }
}
if (!$found) { WP_CLI::error("Delivered field group not available after import."); }
WP_CLI::success("Delivered field group imported.");
'

# QA fixture input is test data, not a delivery artifact. It exercises the same
# Page Template assignment and attachment-ID field path a recipient will use.
bash "$ROOT/scripts/apply-fixture.sh" figma-baseline
page_id="$(docker compose run --rm cli option get page_on_front | tr -d '\r[:space:]')"
template="$(docker compose run --rm cli post meta get "$page_id" _wp_page_template | tr -d '\r')"
if [[ "$template" != "page-lp.php" ]]; then
  echo "FAIL Page Template assignment did not survive fresh reconstruction: ${template}" >&2
  exit 8
fi

# Reuse the existing Playwright robustness harness rather than creating another
# browser test stack. It verifies frontend render, responsive overflow, images,
# text clipping, ordering and mutation cases on the fresh database.
bash "$ROOT/scripts/qa.sh"

cat > "$EVIDENCE_DIR/result.json" <<JSON
{
  "status": "PASS",
  "developmentProject": "$SOURCE_PROJECT",
  "freshProject": "$FRESH_PROJECT",
  "developmentDatabaseDestroyedBeforeFreshStart": true,
  "sourceDatabaseCopied": false,
  "sourceAcfDbStateReused": false,
  "localJsonExcludedForPortableImportProof": true,
  "package": {
    "themeCode": ".runtime/delivery-package/theme/$FRESH_THEME_SLUG",
    "assets": ".runtime/delivery-package/theme/$FRESH_THEME_SLUG/assets",
    "acfExport": ".runtime/delivery-package/acf/acf-export.json",
    "installDoc": ".runtime/delivery-package/docs/INSTALL.md",
    "acfFieldMap": ".runtime/delivery-package/docs/ACF-FIELD-MAP.md",
    "acfProPluginIncluded": false,
    "licenseIncluded": false,
    "databaseIncluded": false
  },
  "steps": {
    "THEME_CODE_INSTALL": "PASS",
    "ACF_JSON_IMPORT": "PASS",
    "PAGE_TEMPLATE_ASSIGNMENT": "PASS",
    "FIXTURE_INPUT": "PASS",
    "FRONTEND_RENDER": "PASS",
    "PLAYWRIGHT": "PASS"
  }
}
JSON

cat "$EVIDENCE_DIR/result.json"
echo "PASS fresh WordPress delivery reconstruction from code/assets/acf-export only."
