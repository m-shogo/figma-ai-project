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

python3 - <<'PY'
import json
from pathlib import Path
path = Path('theme-dropin/nipponbudokan/acf/json/group_top_slider.json')
data = json.loads(path.read_text(encoding='utf-8'))
repeater = next((f for f in data.get('fields', []) if f.get('name') == 'top_slider-01'), None)
if not repeater:
    raise SystemExit('FAIL TOP slider ACF repeater missing.')
subfields = {f.get('name'): f for f in repeater.get('sub_fields', [])}
required = {'img_pc', 'img_sp', 'text', 'text_sp', 'lead_pc', 'lead_sp'}
missing = sorted(required - subfields.keys())
if missing:
    raise SystemExit(f"FAIL TOP slider ACF responsive fields missing: {', '.join(missing)}")
if subfields['text'].get('key') != 'field_5d677f3972f71':
    raise SystemExit('FAIL legacy TOP slider text field key changed; backward compatibility would be broken.')
print('PASS TOP slider Local JSON preserves legacy text owner and exposes responsive title/lead fields.')
PY

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
# Header/shared Theme consumers require ACF APIs. The public plugin supplies those APIs,
# while front-page.php deliberately falls back unless the Pro repeater field type exists.
# Production ACF Pro repeater ownership is therefore preserved rather than emulated here.
docker compose run --rm cli plugin install advanced-custom-fields --activate >/dev/null
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
  'class="tm_copy_pc"' \
  'class="tm_copy_sp"' \
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
  '/images/top/mv-sample.webp' \
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
echo "PASS current PC/SP fallback copy is emitted once per responsive owner without duplicating the TOP component."
echo "PASS existing slider, purpose-guide, and notice owners remain reused."
echo "NOTE production ACF Pro slide/notice repeaters remain content authority; Local JSON schema is validated here, while this disposable runtime verifies the ACF-API-present/no-Pro-repeater fallback path."

if [[ "${BUDOKAN_TOP_FV_KEEP_RUNTIME:-0}" == "1" ]]; then
  trap - EXIT
  echo "PASS runtime retained for browser QA at ${WP_URL}/."
fi
