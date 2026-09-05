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

if [[ "$THEME_SLUG" != "nipponbudokan" ]]; then
  echo "FAIL Budokan content interaction QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
  exit 2
fi

cleanup() {
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

docker compose up -d db wordpress
ready=0
for _ in $(seq 1 90); do
  if docker compose exec -T wordpress test -f /var/www/html/wp-includes/version.php >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != "1" ]]; then
  docker compose logs wordpress
  echo "FAIL WordPress files were not initialized." >&2
  exit 1
fi

if ! docker compose run --rm cli core is-installed >/dev/null 2>&1; then
  docker compose run --rm cli core install \
    --url="$WP_URL" \
    --title="Budokan Content Interaction QA" \
    --admin_user="fixture-admin" \
    --admin_password="fixture-admin-change-me" \
    --admin_email="fixture@example.invalid" \
    --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli option update permalink_structure '/%postname%/' >/dev/null
docker compose run --rm cli plugin install advanced-custom-fields --activate >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null
# Apache receives WP_ENVIRONMENT_TYPE through WORDPRESS_CONFIG_EXTRA; the
# separate WP-CLI service needs the local-only guard value explicitly.
docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-budokan-content-interaction-qa.php >/dev/null

page_id="$(docker compose run --rm cli option get budokan_content_interaction_qa_page_id)"
[[ "$page_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL content interaction QA page id was not seeded." >&2
  exit 1
}

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$WP_URL/?page_id=$page_id")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL content interaction QA page returned final HTTP ${http_code}." >&2
  cat "$html" >&2 || true
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'data-qa-control="default"' \
  'data-qa-control="cta"' \
  'data-qa-control="outline"' \
  'data-qa-control="small"' \
  'data-qa-control="inline"' \
  'id="qa-anchor-target"'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required normal-page interaction fixture marker missing: ${required}" >&2
    rm -f "$html"
    exit 1
  }
done
rm -f "$html"

echo "PASS Budokan normal-page content interaction fixture rendered through real WordPress page content."

if [[ "${BUDOKAN_CONTENT_INTERACTION_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/?page_id=${page_id}"
fi
