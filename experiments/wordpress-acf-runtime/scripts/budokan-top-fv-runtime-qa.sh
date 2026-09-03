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
  echo "FAIL Budokan TOP FV QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan TOP FV QA" \
    --admin_user="fixture-admin" \
    --admin_password="fixture-admin-change-me" \
    --admin_email="fixture@example.invalid" \
    --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
# This disposable fixture intentionally exercises the Theme fallback path.
# Production TOP content is owned by ACF Pro repeaters; installing free ACF here
# exposes get_field() without the Pro repeater data and is not a valid ACF-backed fixture.
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null

front_id="$(docker compose run --rm cli post create \
  --post_type=page \
  --post_status=publish \
  --post_title='Budokan TOP FV QA' \
  --post_name='budokan-top-fv-qa' \
  --porcelain)"
[[ "$front_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create TOP FV QA front page." >&2
  exit 1
}

docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$front_id" >/dev/null

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$WP_URL/")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL TOP FV QA returned final HTTP ${http_code}." >&2
  cat "$html" >&2 || true
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'class="top_mainVisual"' \
  'class="tm_stage"' \
  'class="swiper tm_swiper-container"' \
  'class="tm_background"' \
  'class="tm_inner"' \
  'class="tm_title"' \
  'class="tm_lead"' \
  'class="tm_guide"' \
  'class="top_notice-01"' \
  '伝統を未来へつなぐ' \
  '武道文化の中心地' \
  '武道、書道の普及・振興、公益目的事業の拠点として活動しています。' \
  '目的から探す' \
  '令和8年8月4日(火) 令和8年熊本地震　お見舞い'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required TOP FV runtime marker missing: ${required}" >&2
    exit 1
  }
done

for asset in \
  '/images/top/mv-sample.png' \
  '/images/top/ico-budo.svg' \
  '/images/top/ico-calligraphy.svg' \
  '/images/top/ico-budokan.svg' \
  '/images/top/ico-attention.svg' \
  '/js/home.js'; do
  grep -Fq "$asset" "$html" || {
    echo "FAIL expected TOP FV asset/script missing: ${asset}" >&2
    exit 1
  }
done

rm -f "$html"

echo "PASS Budokan TOP FV rendered through the real Theme front-page path."
echo "PASS existing slider, purpose-guide, and notice owners remain reused without a duplicate TOP component."
echo "NOTE production ACF Pro slide/notice data remains content authority; this disposable runtime intentionally verifies the no-ACF fallback presentation path."

if [[ "${BUDOKAN_TOP_FV_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/."
fi
