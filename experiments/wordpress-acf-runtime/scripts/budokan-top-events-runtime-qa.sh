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
  docker compose run --rm cli core install     --url="$WP_URL"     --title="Budokan TOP Events QA"     --admin_user="fixture-admin"     --admin_password="fixture-admin-change-me"     --admin_email="fixture@example.invalid"     --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli plugin install advanced-custom-fields --activate >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null

front_id="$(docker compose run --rm cli post create   --post_type=page   --post_status=publish   --post_title='Budokan TOP Events QA'   --post_name='budokan-top-events-qa'   --porcelain)"
[[ "$front_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create TOP Events QA front page." >&2
  exit 1
}

docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$front_id" >/dev/null

primary_term_id="$(docker compose run --rm cli term create event_cat 'QA Primary' --slug=qa-primary --porcelain)"
secondary_term_id="$(docker compose run --rm cli term create event_cat 'QA Secondary' --slug=qa-secondary --porcelain)"
[[ "$primary_term_id" =~ ^[0-9]+$ && "$secondary_term_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create event taxonomy fixtures." >&2
  exit 1
}

create_event() {
  local title="$1"
  local event_date="$2"
  local status="$3"
  local time_text="$4"
  local host_text="$5"
  local term_slug="$6"
  local post_date="$7"
  local external_url="${8:-}"

  local post_id
  post_id="$(docker compose run --rm cli post create     --post_type=event     --post_status=publish     --post_title="$title"     --post_date="$post_date"     --porcelain)"
  [[ "$post_id" =~ ^[0-9]+$ ]] || {
    echo "FAIL could not create Event fixture: $title" >&2
    exit 1
  }

  docker compose run --rm cli post meta update "$post_id" event_date "$event_date" >/dev/null
  docker compose run --rm cli post meta update "$post_id" event_status "$status" >/dev/null
  docker compose run --rm cli post meta update "$post_id" event_time "$time_text" >/dev/null
  docker compose run --rm cli post meta update "$post_id" event_host "$host_text" >/dev/null
  docker compose run --rm cli post term set "$post_id" event_cat "$term_slug" --by=slug >/dev/null

  if [[ -n "$external_url" ]]; then
    docker compose run --rm cli post meta update "$post_id" post_type url >/dev/null
    docker compose run --rm cli post meta update "$post_id" postType_url "$external_url" >/dev/null
    docker compose run --rm cli post meta update "$post_id" postType_target 1 >/dev/null
  fi
}

create_event "武道学園 入学案内" "20990801" "recruiting" $'開場：10:00\n開演：11:00' "日本武道協議会 03-3216-5100（月〜金 午前10時〜午後5時まで）" "qa-primary" "2026-09-01 10:00:01"
create_event "昭和100年記念 令和8年度 全日本少年少女武道錬成大会" "20990802" "ongoing" $'開場：10:00\n開演：11:00' "日本武道協議会 03-3216-5100（月〜金 午前10時〜午後5時まで）" "qa-primary" "2026-09-01 10:00:02" "https://example.com/budokan-event"
create_event "第62回全日本書初め大展覧会" "20990803" "closed" $'開場：10:00\n開演：11:00' "日本武道協議会 03-3216-5100（月〜金 午前10時〜午後5時まで）" "qa-primary" "2026-09-01 10:00:03"
create_event "武道学園 入学案内 第二期" "20990804" "recruiting" $'開場：10:00\n開演：11:00' "日本武道協議会 03-3216-5100（月〜金 午前10時〜午後5時まで）" "qa-primary" "2026-09-01 10:00:04"
create_event "近日開催 QA Secondary" "20990805" "ongoing" $'開場：10:00\n開演：11:00' "日本武道協議会 03-3216-5100（月〜金 午前10時〜午後5時まで）" "qa-secondary" "2026-09-01 10:00:05"

assert_home() {
  local target_url="$1"
  local expected_upcoming_count="$2"
  local html
  html="$(mktemp)"

  local http_code
  http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$target_url")"
  if [[ "$http_code" != "200" ]]; then
    echo "FAIL TOP Events QA returned final HTTP ${http_code}: ${target_url}" >&2
    cat "$html" >&2 || true
    docker compose logs wordpress >&2 || true
    rm -f "$html"
    exit 1
  fi

  for required in     'id="top_events-01"'     'class="te_layout"'     'class="te_featured"'     'class="te_upcoming"'     'name="top_event_cat"'     '大会・イベント情報'     '注目の主催事業'     '近日開催の行事予定'     '一覧を表示'; do
    grep -Fq "$required" "$html" || {
      echo "FAIL required TOP Events runtime marker missing: ${required}" >&2
      rm -f "$html"
      exit 1
    }
  done

  if grep -Fq 'id="top_calendar"' "$html" || grep -Fq 'class="te_cal_view"' "$html"; then
    echo "FAIL legacy TOP calendar markup is still rendered." >&2
    rm -f "$html"
    exit 1
  fi

  card_count="$(grep -o 'class="te_card"' "$html" | wc -l | tr -d ' ')"
  [[ "$card_count" == "4" ]] || {
    echo "FAIL expected exactly four featured TOP Event cards; got ${card_count}." >&2
    rm -f "$html"
    exit 1
  }

  upcoming_count="$(grep -o 'class="te_upcoming_item"' "$html" | wc -l | tr -d ' ')"
  [[ "$upcoming_count" == "$expected_upcoming_count" ]] || {
    echo "FAIL expected ${expected_upcoming_count} upcoming Event rows; got ${upcoming_count}." >&2
    rm -f "$html"
    exit 1
  }

  rm -f "$html"
}

assert_home "$WP_URL/" "5"
assert_home "$WP_URL/?top_event_cat=qa-secondary" "1"

echo "PASS Budokan TOP Events renders the current featured + upcoming CPT layout."
echo "PASS TOP-only category filtering stays on the front page and does not use the event_cat taxonomy query var."
echo "PASS legacy FullCalendar markup is absent from the rendered TOP Events section."

if [[ "${BUDOKAN_TOP_EVENTS_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/."
fi
