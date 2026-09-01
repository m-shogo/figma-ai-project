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
  echo "FAIL Budokan News single QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan News Single QA" \
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
  echo "FAIL could not create News single routing pages." >&2
  exit 1
}

docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$front_id" >/dev/null
docker compose run --rm cli option update page_for_posts "$news_id" >/dev/null
docker compose run --rm cli rewrite structure '/%postname%/' --hard >/dev/null

term_id="$(docker compose run --rm cli term create category '書道' --porcelain)"
[[ "$term_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create News category." >&2
  exit 1
}

# Keep the fixture safely in the past relative to the CI runner clock. A future
# post_date can make WordPress schedule the post and turn this route into a
# false 404 even when the Theme implementation is correct.
post_id="$(docker compose run --rm cli post create \
  --post_type=post \
  --post_status=publish \
  --post_title='Budokan News Single QA' \
  --post_name='budokan-news-single-qa' \
  --post_date='2026-08-30 12:00:00' \
  --post_content='<p>Budokan detail pager runtime fixture.</p>' \
  --porcelain)"
[[ "$post_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create News single fixture." >&2
  exit 1
}
docker compose run --rm cli post term set "$post_id" category "$term_id" --by=id >/dev/null

html="$(mktemp)"
http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "${WP_URL}/budokan-news-single-qa/")"
if [[ "$http_code" != "200" ]]; then
  echo "FAIL News single returned final HTTP ${http_code}." >&2
  cat "$html" >&2 || true
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'class="module_titleSingle"' \
  'class="module_pager-02"' \
  'class="back"' \
  '>一覧へ戻る<' \
  'datetime="2026-08-30"' \
  '>2026.08.30<'; do
  grep -Fq "$required" "$html" || {
    echo "FAIL required News single runtime marker missing: ${required}" >&2
    exit 1
  }
done

grep -Fq 'class="prev _hidden"' "$html" || {
  echo "FAIL single-post fixture should preserve conditional previous navigation as hidden when absent." >&2
  exit 1
}
grep -Fq 'class="next _hidden"' "$html" || {
  echo "FAIL single-post fixture should preserve conditional next navigation as hidden when absent." >&2
  exit 1
}

news_back_url="$(docker compose run --rm cli eval 'echo get_permalink((int) get_option("page_for_posts"));')"
grep -Fq "href=\"${news_back_url}\"" "$html" || {
  echo "FAIL News detail return link does not use the configured posts page URL: ${news_back_url}" >&2
  exit 1
}

rm -f "$html"

# Event uses the same single.php detail pager. Its display label is Japanese
# (イベント), while WordPress owns the canonical archive route for post type
# `event`. The return action must follow the archive API, never a label-derived
# path.
event_id="$(docker compose run --rm cli post create \
  --post_type=event \
  --post_status=publish \
  --post_title='Budokan Event Single QA' \
  --post_name='budokan-event-single-qa' \
  --post_date='2026-08-30 13:00:00' \
  --post_content='<p>Budokan Event detail archive-link fixture.</p>' \
  --porcelain)"
[[ "$event_id" =~ ^[0-9]+$ ]] || {
  echo "FAIL could not create Event single fixture." >&2
  exit 1
}

event_url="$(docker compose run --rm cli post url "$event_id")"
event_archive_url="$(docker compose run --rm cli eval 'echo get_post_type_archive_link("event");')"
[[ -n "$event_url" && -n "$event_archive_url" ]] || {
  echo "FAIL WordPress did not resolve Event single/archive URLs." >&2
  exit 1
}

event_html="$(mktemp)"
event_http_code="$(curl --silent --show-error --location --max-redirs 3 --output "$event_html" --write-out '%{http_code}' "$event_url")"
if [[ "$event_http_code" != "200" ]]; then
  echo "FAIL Event single returned final HTTP ${event_http_code}: ${event_url}" >&2
  cat "$event_html" >&2 || true
  docker compose logs wordpress >&2 || true
  exit 1
fi

for required in \
  'class="module_titleSingle"' \
  'class="module_pager-02"' \
  'class="back"' \
  '>一覧へ戻る<'; do
  grep -Fq "$required" "$event_html" || {
    echo "FAIL required Event single runtime marker missing: ${required}" >&2
    exit 1
  }
done

grep -Fq "href=\"${event_archive_url}\"" "$event_html" || {
  echo "FAIL Event detail return link does not use WordPress archive ownership: ${event_archive_url}" >&2
  exit 1
}

rm -f "$event_html"

echo "PASS Budokan News and Event details rendered through the real WordPress single.php path."
echo "PASS Return links use WordPress-owned posts/archive URLs; date and absent-adjacent semantics are preserved."

if [[ "${BUDOKAN_NEWS_SINGLE_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/budokan-news-single-qa/."
fi
