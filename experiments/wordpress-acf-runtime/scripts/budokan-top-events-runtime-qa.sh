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
  echo "FAIL Budokan TOP Events QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan TOP Events QA" \
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
  --post_title='Budokan TOP Events QA' \
  --post_name='budokan-top-events-qa' \
  --porcelain)"
[[ "$front_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create TOP Events QA front page." >&2
  exit 1
}

docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$front_id" >/dev/null

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$WP_URL/")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL TOP Events QA returned final HTTP ${http_code}." >&2
  cat "$html" >&2 || true
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'id="top_events-01"' \
  'class="te_layout"' \
  'class="te_featured_banner"' \
  'id="top_calendar"' \
  'data-view="dayGridMonth"' \
  'data-view="listMonth"' \
  'class="te_sns"' \
  '大会・イベント情報' \
  '注目の大会・募集' \
  'イベント一覧を表示'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required TOP Events runtime marker missing: ${required}" >&2
    exit 1
  }
done

card_count="$(grep -o 'class="te_card"' "$html" | wc -l | tr -d ' ')"
[[ "$card_count" == "4" ]] || {
  echo "FAIL expected exactly four fallback TOP Event cards; got ${card_count}." >&2
  exit 1
}

for script in \
  '/js/fullcalendar.min.js' \
  '/js/fullcalendar-google-calendar.min.js' \
  '/js/home.js'; do
  grep -Fq "$script" "$html" || {
    echo "FAIL expected front-page calendar script missing: ${script}" >&2
    exit 1
  }
done

rm -f "$html"

echo "PASS Budokan TOP Events rendered through the real Theme front-page path."
echo "PASS FullCalendar and Google Calendar plugin are enqueued; empty credentials remain sample-data mode."
echo "NOTE Real Event post date/status semantics and production Google Calendar credentials remain external authority."

if [[ "${BUDOKAN_TOP_EVENTS_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/."
fi
