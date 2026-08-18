#!/usr/bin/env bash
set -euo pipefail

FIXTURE_ROOT="${FIXTURE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

fixture_digest() {
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$FIXTURE_ROOT" | shasum -a 256 | awk '{print substr($1,1,8)}'
  elif command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$FIXTURE_ROOT" | sha256sum | awk '{print substr($1,1,8)}'
  else
    printf '%08x' "$(printf '%s' "$FIXTURE_ROOT" | cksum | awk '{print $1}')"
  fi
}

FIXTURE_RUNTIME_ID="$(fixture_digest)"

if [[ -z "${COMPOSE_PROJECT_NAME:-}" ]]; then
  export COMPOSE_PROJECT_NAME="figma-ai-wp-lp-${FIXTURE_RUNTIME_ID}"
fi

if [[ -z "${WP_PORT:-}" ]]; then
  # Stable localhost-only port per worktree. Explicit .env values always win.
  WP_PORT="$((20000 + (16#${FIXTURE_RUNTIME_ID:0:4} % 20000)))"
  export WP_PORT
fi

if [[ ! "$WP_PORT" =~ ^[0-9]+$ ]] || (( WP_PORT < 1024 || WP_PORT > 65535 )); then
  echo "FAIL WP_PORT must be an unprivileged TCP port (1024-65535): ${WP_PORT}" >&2
  return 2 2>/dev/null || exit 2
fi

expected_url="http://127.0.0.1:${WP_PORT}"
if [[ -z "${WP_URL:-}" ]]; then
  export WP_URL="$expected_url"
elif [[ "$WP_URL" != "$expected_url" ]]; then
  echo "FAIL WP_URL must match the localhost fixture port exactly: ${expected_url}" >&2
  return 2 2>/dev/null || exit 2
fi


# --- Theme under test -------------------------------------------------------
# The runtime is reusable infrastructure: it can host the disposable sample
# theme or a supplied production theme. Resolution order:
#   1. explicit THEME_SOURCE_DIR
#   2. the single directory dropped into theme-dropin/ (git-ignored)
#   3. the disposable sample theme
# Anchored to this script, not to FIXTURE_ROOT: FIXTURE_ROOT is a runtime-identity
# seed that callers may point at a synthetic path to prove per-worktree isolation.
FIXTURE_SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAMPLE_THEME_DIR="$FIXTURE_SOURCE_ROOT/theme/standalone-lp-sample"
SAMPLE_THEME_SLUG="standalone-lp-sample"

resolve_theme_source() {
  if [[ -n "${THEME_SOURCE_DIR:-}" ]]; then
    printf '%s' "$THEME_SOURCE_DIR"
    return 0
  fi

  local dropin="$FIXTURE_SOURCE_ROOT/theme-dropin"
  local -a found=()
  if [[ -d "$dropin" ]]; then
    local previous_nullglob
    previous_nullglob="$(shopt -p nullglob)"
    shopt -s nullglob
    found=("$dropin"/*/)
    eval "$previous_nullglob"
  fi

  if (( ${#found[@]} == 1 )); then
    printf '%s' "${found[0]%/}"
    return 0
  fi
  if (( ${#found[@]} > 1 )); then
    echo "FAIL theme-dropin/ holds more than one theme; set THEME_SOURCE_DIR explicitly:" >&2
    printf '  - %s\n' "${found[@]}" >&2
    return 2
  fi

  printf '%s' "$SAMPLE_THEME_DIR"
}

theme_candidate="$(resolve_theme_source)" || { return 2 2>/dev/null || exit 2; }

if [[ ! -d "$theme_candidate" ]]; then
  echo "FAIL theme source directory does not exist: ${theme_candidate}" >&2
  return 2 2>/dev/null || exit 2
fi

THEME_SOURCE_DIR="$(cd "$theme_candidate" && pwd)"

# A WordPress theme is identified by a style.css header, not by directory naming.
if [[ ! -f "$THEME_SOURCE_DIR/style.css" ]]; then
  echo "FAIL theme source has no style.css: ${THEME_SOURCE_DIR}" >&2
  return 2 2>/dev/null || exit 2
fi
if ! grep -q 'Theme Name:' "$THEME_SOURCE_DIR/style.css"; then
  echo "FAIL theme style.css has no 'Theme Name:' header: ${THEME_SOURCE_DIR}/style.css" >&2
  return 2 2>/dev/null || exit 2
fi

if [[ -z "${THEME_SLUG:-}" ]]; then
  THEME_SLUG="$(basename "$THEME_SOURCE_DIR")"
fi
if [[ ! "$THEME_SLUG" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
  echo "FAIL THEME_SLUG must be a safe theme directory name: ${THEME_SLUG}" >&2
  return 2 2>/dev/null || exit 2
fi

# Sample-only steps (ACF sample import, CMS mutation fixtures) must not run
# against a supplied theme that knows nothing about them.
if [[ "$THEME_SOURCE_DIR" == "$SAMPLE_THEME_DIR" && "$THEME_SLUG" == "$SAMPLE_THEME_SLUG" ]]; then
  THEME_IS_SAMPLE=1
else
  THEME_IS_SAMPLE=0
fi

export THEME_SOURCE_DIR THEME_SLUG THEME_IS_SAMPLE FIXTURE_SOURCE_ROOT
export FIXTURE_ROOT FIXTURE_RUNTIME_ID
