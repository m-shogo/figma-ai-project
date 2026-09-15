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
  echo "FAIL Budokan Local Navigation QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan Local Navigation QA" \
    --admin_user="fixture-admin" \
    --admin_password="fixture-admin-change-me" \
    --admin_email="fixture@example.invalid" \
    --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli option update permalink_structure '/%postname%/' >/dev/null
docker compose run --rm cli plugin install advanced-custom-fields --activate >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null
docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-budokan-local-nav-qa.php >/dev/null

page_id="$(docker compose run --rm cli option get budokan_local_nav_qa_page_id)"
[[ "$page_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL fixture did not expose a numeric current page id." >&2
  exit 1
}

template="$(docker compose run --rm cli post meta get "$page_id" _wp_page_template 2>/dev/null || true)"
# Default page.php leaves _wp_page_template empty / absent.
if [[ -n "${template}" && "$template" != "default" ]]; then
  echo "FAIL QA page template should be default page.php; got: ${template}." >&2
  exit 1
fi

acf_menu="$(docker compose run --rm cli post meta get "$page_id" page_local_nav)"
[[ "$acf_menu" =~ ^[0-9]+$ ]] || {
  echo "FAIL page_local_nav was not set on QA page: ${acf_menu}." >&2
  exit 1
}

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$WP_URL/?page_id=$page_id")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL Local Navigation fixture returned final HTTP ${http_code}." >&2
  echo "--- response body ---" >&2
  cat "$html" >&2 || true
  echo >&2
  echo "--- wordpress logs ---" >&2
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'class="local_navigation"' \
  '大会・イベント' \
  '全日本少年少女武道錬成大会' \
  '合気道' \
  '地方青少年武道錬成大会' \
  '日本武道館で武道を体験してみよう' \
  'lnl_item-02' \
  'lnl_item-03' \
  'lnl_item-04'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required Local Navigation runtime marker missing: ${required}" >&2
    exit 1
  }
done

child_count="$(grep -o 'lnl_item-04' "$html" | wc -l | tr -d ' ')"
if (( child_count < 15 )); then
  echo "FAIL expected at least fifteen depth-04 Local Navigation items; got ${child_count}." >&2
  exit 1
fi

grep -Eq 'current-menu-item|current_page_item' "$html" || {
  echo "FAIL WordPress current-item state was not emitted by the sidebar walker." >&2
  exit 1
}

rm -f "$html"

echo "PASS Budokan Local Navigation ACF menu rendered (Figma 2108:10846; 3-level)."
echo "PASS page_local_nav=${acf_menu}; template=page.php (default); page_id=${page_id}."

if [[ "${BUDOKAN_LOCAL_NAV_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for follow-up browser QA at ${WP_URL}/?page_id=${page_id}."
fi
