#!/usr/bin/env bash
# Apply this integration's overlay/ on top of a real cku theme checkout, and
# add the one required functions.php require line, for LOCAL QA only.
#
# Usage:
#   scripts/apply-overlay.sh /path/to/unzipped/cku
#
# Never commits the theme itself. Intended target is
# experiments/wordpress-acf-pro-standalone-lp/theme-dropin/cku (git-ignored).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OVERLAY="$HERE/overlay"
TARGET="${1:?usage: apply-overlay.sh /path/to/cku}"

if [ ! -f "$TARGET/style.css" ]; then
  echo "FAIL: $TARGET does not look like a WordPress theme (no style.css)" >&2
  exit 1
fi
if ! grep -q "^Theme Name:" "$TARGET/style.css"; then
  echo "FAIL: $TARGET/style.css has no 'Theme Name:' header" >&2
  exit 1
fi

rsync -a --exclude ".gitkeep" "$OVERLAY/" "$TARGET/"

REQUIRE_LINE="require_once get_theme_file_path('/functions/ref001-integration.php');"
if ! grep -qF "$REQUIRE_LINE" "$TARGET/functions.php"; then
  {
    echo ""
    echo "// REF-001 integration (experiments/ref001-cku-theme-integration)"
    echo "$REQUIRE_LINE"
  } >> "$TARGET/functions.php"
  echo "Added REF-001 require line to $TARGET/functions.php"
else
  echo "REF-001 require line already present in $TARGET/functions.php"
fi

echo "Overlay applied to $TARGET"
