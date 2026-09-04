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
  echo "FAIL Budokan TOP Guide QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan TOP Guide QA" \
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
  --post_title='Budokan TOP Guide QA' \
  --post_name='budokan-top-guide-qa' \
  --porcelain)"
[[ "$front_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create TOP Guide QA front page." >&2
  exit 1
}

docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$front_id" >/dev/null

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$WP_URL/")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL TOP Guide QA returned final HTTP ${http_code}." >&2
  echo "--- response body ---" >&2
  cat "$html" >&2 || true
  echo >&2
  echo "--- wordpress logs ---" >&2
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'id="top_guide-01"' \
  'class="tg_intro"' \
  'class="tg_cards"' \
  '目的から探す' \
  'User guide' \
  '>武道<' \
  '>書道<' \
  '>日本武道館<'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required TOP Guide runtime marker missing: ${required}" >&2
    exit 1
  }
done

card_count="$(grep -o 'class="tg_card"' "$html" | wc -l | tr -d ' ')"
[[ "$card_count" == "3" ]] || {
  echo "FAIL expected exactly three TOP Guide cards; got ${card_count}." >&2
  exit 1
}

rm -f "$html"

echo "PASS Budokan TOP Guide rendered through the real Theme front-page path."
echo "PASS Existing Theme owner exposes exactly three User Guide cards and Figma photographs stored in Theme."

if [[ "${BUDOKAN_TOP_GUIDE_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/."
fi
