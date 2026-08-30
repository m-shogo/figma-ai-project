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
  echo "FAIL Budokan News archive QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan News Archive QA" \
    --admin_user="fixture-admin" \
    --admin_password="fixture-admin-change-me" \
    --admin_email="fixture@example.invalid" \
    --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli plugin install advanced-custom-fields --activate >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null

front_id="$(docker compose run --rm cli post create --post_type=page --post_status=publish --post_title='Budokan QA Home' --post_name='budokan-qa-home' --porcelain)"
news_id="$(docker compose run --rm cli post create --post_type=page --post_status=publish --post_title='お知らせ' --post_name='news' --porcelain)"
[[ "$front_id" =~ ^[0-9]+$ && "$news_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create News archive routing pages." >&2
  exit 1
}

docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$front_id" >/dev/null
docker compose run --rm cli option update page_for_posts "$news_id" >/dev/null

declare -a labels=('武道' '書道' '刊行物' '研修' '事務局')
declare -a term_ids=()
for label in "${labels[@]}"; do
  term_id="$(docker compose run --rm cli term create category "$label" --porcelain)"
  [[ "$term_id" =~ ^[0-9]+$ ]] || {
    echo "FAIL could not create News category: ${label}" >&2
    exit 1
  }
  term_ids+=("$term_id")
done

for index in $(seq 1 25); do
  post_id="$(docker compose run --rm cli post create \
    --post_type=post \
    --post_status=publish \
    --post_title="Budokan News QA ${index}" \
    --post_date="2026-08-$(printf '%02d' $(( (index - 1) % 28 + 1 ))) 12:00:00" \
    --porcelain)"
  term_index=$(( (index - 1) % ${#term_ids[@]} ))
  docker compose run --rm cli post term set "$post_id" category "${term_ids[$term_index]}" --by=id >/dev/null
done

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "${WP_URL}/news/")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL News archive returned final HTTP ${http_code}." >&2
  cat "$html" >&2 || true
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'class="news_archive"' \
  'class="news_tabs news_tabs_archive"' \
  'class="module_newsList-01"' \
  'class="news_pager module_pager-01"' \
  '>すべて<' \
  '>武道<' \
  '>書道<' \
  '>刊行物<' \
  '>研修<' \
  '>事務局<'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required News archive runtime marker missing: ${required}" >&2
    exit 1
  }
done

tab_count="$(grep -o 'class="news_tabs_item' "$html" | wc -l | tr -d ' ')"
row_count="$(grep -o 'class="news_item"' "$html" | wc -l | tr -d ' ')"
[[ "$tab_count" == "6" ]] || {
  echo "FAIL expected six News category tabs; got ${tab_count}." >&2
  exit 1
}
[[ "$row_count" == "20" ]] || {
  echo "FAIL expected 20 News rows on page one; got ${row_count}." >&2
  exit 1
}

grep -Fq 'page-numbers' "$html" || {
  echo "FAIL expected News archive pagination for 25 posts." >&2
  exit 1
}

rm -f "$html"

echo "PASS Budokan News archive rendered through the real Posts-page Theme path."
echo "PASS Six authored category tabs, 20 rows and pagination are present."

if [[ "${BUDOKAN_NEWS_ARCHIVE_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/news/."
fi
