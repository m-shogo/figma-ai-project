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

export FIXTURE_ROOT FIXTURE_RUNTIME_ID
