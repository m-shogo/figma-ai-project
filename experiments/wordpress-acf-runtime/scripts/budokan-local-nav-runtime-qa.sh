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
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null
# The disposable fixture deliberately refuses non-local environments. The
# Apache service receives WP_ENVIRONMENT_TYPE through WORDPRESS_CONFIG_EXTRA,
# while the separate WP-CLI service does not inherit that container setting.
# Pass the environment explicitly to this one QA mutation instead of weakening
# the fixture's production safety guard.
docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-budokan-local-nav-qa.php >/dev/null

page_id="$(docker compose run --rm cli option get budokan_local_nav_qa_page_id)"
[[ "$page_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL fixture did not expose a numeric current page id." >&2
  exit 1
}

template="$(docker compose run --rm cli post meta get "$page_id" _wp_page_template)"
[[ "$template" == "templates/template-oneColumnLocalNav.php" ]] || {
  echo "FAIL QA page template mismatch: ${template}." >&2
  exit 1
}

html="$(mktemp)"
# WordPress may canonically redirect ?page_id=N to the pretty permalink after
# permalink_structure is enabled. Follow only a small bounded redirect chain
# and assert the final response is 200; a normal canonical redirect is not a
# product/runtime failure.
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$WP_URL/?page_id=$page_id")"
[[ "$http_code" == "200" ]] || {
  echo "FAIL Local Navigation fixture returned final HTTP ${http_code}." >&2
  exit 1
}

for required in \
  'class="local_navigation"' \
  '武道 振興・普及事業' \
  '指導者研修・指導法研究' \
  '全国武道指導者研修会' \
  '地域社会武道指導者研修会' \
  '中学校武道授業指導法研究事業' \
  'ローカルナビゲーション' \
  'lnl_item-02' \
  'lnl_item-03' \
  'lnl_item-04'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required Local Navigation runtime marker missing: ${required}" >&2
    exit 1
  }
done

child_count="$(grep -o 'lnl_item-04' "$html" | wc -l | tr -d ' ')"
if (( child_count < 4 )); then
  echo "FAIL expected at least four depth-04 Local Navigation items; got ${child_count}." >&2
  exit 1
fi

grep -Eq 'current-menu-item|current_page_item' "$html" || {
  echo "FAIL WordPress current-item state was not emitted by the sidebar walker." >&2
  exit 1
}

rm -f "$html"

echo "PASS Budokan Local Navigation disposable WordPress hierarchy rendered."
echo "PASS Walker exposes broad family at depth 02, subgroup at depth 03, and four children at depth 04."
echo "PASS Current page uses templates/template-oneColumnLocalNav.php and WordPress current-item classes."
echo "NOTE This is structural runtime evidence only; SP open-state and production menu/template assignment remain Human/WordPress authority gates."
