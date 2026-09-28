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
  echo "FAIL Budokan TOP About QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan TOP About QA" \
    --admin_user="fixture-admin" \
    --admin_password="fixture-admin-change-me" \
    --admin_email="fixture@example.invalid" \
    --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli plugin install advanced-custom-fields --activate >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null

front_id="$(docker compose run --rm cli post create \
  --post_type=page \
  --post_status=publish \
  --post_title='Budokan TOP About QA' \
  --post_name='budokan-top-about-qa' \
  --porcelain)"
[[ "$front_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create TOP About QA front page." >&2
  exit 1
}

docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$front_id" >/dev/null

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$WP_URL/")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL TOP About QA returned final HTTP ${http_code}." >&2
  echo "--- response body ---" >&2
  cat "$html" >&2 || true
  echo >&2
  echo "--- wordpress logs ---" >&2
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'id="top_about-01"' \
  'class="ta_stage"' \
  'class="ta_panel"' \
  'class="ta_actions"' \
  'class="ta_cards"' \
  '日本武道館とは' \
  'class="ta_heading_en_text"' \
  'パンフレット（1.2MB）' \
  'ご紹介動画'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required TOP About runtime marker missing: ${required}" >&2
    exit 1
  }
done

card_count="$(grep -o 'class="swiper-slide ta_card"' "$html" | wc -l | tr -d ' ')"
[[ "$card_count" == "4" ]] || {
  echo "FAIL expected exactly four TOP About cards; got ${card_count}." >&2
  exit 1
}

placeholder_count="$(grep -o '/images/top/about-card-0[1-4].webp' "$html" | wc -l | tr -d ' ')"
if (( placeholder_count < 4 )); then
  echo "FAIL expected durable Figma About card photos in Theme; got ${placeholder_count}." >&2
  exit 1
fi

grep -Fq '/images/top/about-bg-sp.webp' "$html" || {
  echo "FAIL expected durable Figma About stage photo in Theme." >&2
  exit 1
}

rm -f "$html"

echo "PASS Budokan TOP About rendered through the real Theme front-page path."
echo "PASS Existing Theme owner exposes the About heading/actions, four cards, and Figma photos stored in Theme."

if [[ "${BUDOKAN_TOP_ABOUT_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/."
fi
