#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/runtime-env.sh"

if [[ "$THEME_SLUG" != "nipponbudokan" ]]; then
  echo "FAIL publication QA requires nipponbudokan theme; got ${THEME_SLUG}." >&2
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
    --title="Budokan Publication QA" \
    --admin_user="fixture-admin" \
    --admin_password="fixture-admin-change-me" \
    --admin_email="fixture@example.invalid" \
    --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli option update permalink_structure '/%postname%/' >/dev/null
docker compose run --rm cli plugin install advanced-custom-fields --activate >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null

docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-budo-detail-qa.php >/dev/null
docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-budo-back-qa.php >/dev/null
docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-shodou-publication-qa.php >/dev/null
docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-tankoubon-detail-qa.php >/dev/null
docker compose run --rm -e WP_ENVIRONMENT_TYPE=local cli eval-file /fixture/scripts/seed-publications-visual-qa-pages.php >/dev/null

pages_json="$(docker compose run --rm cli option get budokan_publication_visual_qa_pages --format=json)"
budo_json="$(docker compose run --rm cli option get budokan_budo_detail_qa_ids --format=json)"
shodou_json="$(docker compose run --rm cli option get budokan_shodou_publication_qa_ids --format=json)"
tankoubon_json="$(docker compose run --rm cli option get budokan_tankoubon_detail_qa_ids --format=json)"
read_json_int() {
  if command -v php >/dev/null 2>&1; then
    php -r '$v=json_decode($argv[1], true); echo (int)($v[$argv[2]] ?? 0);' "$1" "$2"
  else
    printf '%s' "$1" | docker compose exec -T wordpress php -r '$v=json_decode(stream_get_contents(STDIN), true); echo (int)($v[$argv[1]] ?? 0);' "$2"
  fi
}
budo_back_id="$(read_json_int "$pages_json" budo_back)"
shodou_back_id="$(read_json_int "$pages_json" shodou_back)"
budo_full_id="$(read_json_int "$budo_json" full)"
shodou_full_id="$(read_json_int "$shodou_json" full)"
tankoubon_standard_id="$(read_json_int "$tankoubon_json" standard)"

if [[ "$budo_back_id" -le 0 || "$budo_full_id" -le 0 || "$shodou_back_id" -le 0 || "$shodou_full_id" -le 0 || "$tankoubon_standard_id" -le 0 ]]; then
  echo "FAIL publication fixtures did not expose numeric Budo + Shodou + Tankoubon QA ids." >&2
  exit 1
fi

for url in \
  "$WP_URL/?page_id=$budo_back_id" \
  "$WP_URL/?p=$budo_full_id&post_type=budo-book" \
  "$WP_URL/?page_id=$shodou_back_id" \
  "$WP_URL/?p=$shodou_full_id&post_type=shodou-book"; do
  html="$(mktemp)"
  code="$(curl --silent --show-error --location --max-redirs 3 --output "$html" --write-out '%{http_code}' "$url")"
  if [[ "$code" != "200" ]]; then
    echo "FAIL publication fixture returned HTTP ${code}: ${url}" >&2
    cat "$html" >&2 || true
    exit 1
  fi
  grep -Fq 'publication_budo-shell' "$html" || {
    echo "FAIL publication shared shell missing: ${url}" >&2
    exit 1
  }
  rm -f "$html"
done

tankoubon_url="$WP_URL/?p=$tankoubon_standard_id&post_type=tankoubon"
tankoubon_html="$(mktemp)"
tankoubon_code="$(curl --silent --show-error --location --max-redirs 3 --output "$tankoubon_html" --write-out '%{http_code}' "$tankoubon_url")"
if [[ "$tankoubon_code" != "200" ]]; then
  echo "FAIL tankoubon detail fixture returned HTTP ${tankoubon_code}: ${tankoubon_url}" >&2
  cat "$tankoubon_html" >&2 || true
  exit 1
fi
grep -Fq 'publication_book-head' "$tankoubon_html" || {
  echo "FAIL tankoubon detail production head missing: ${tankoubon_url}" >&2
  exit 1
}
grep -Fq 'publication_book-content' "$tankoubon_html" || {
  echo "FAIL tankoubon detail the_content owner missing: ${tankoubon_url}" >&2
  exit 1
}
rm -f "$tankoubon_html"

echo "PASS Budo + Shodou + Tankoubon detail fixture data rendered through real WordPress + ACF."
echo "PASS pages_json=${pages_json}"
echo "PASS budo_json=${budo_json}"
echo "PASS shodou_json=${shodou_json}"
echo "PASS tankoubon_json=${tankoubon_json}"

if [[ "${BUDOKAN_PUBLICATIONS_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for Playwright QA at ${WP_URL}."
fi
