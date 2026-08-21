#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

: "${ACF_PRO_LICENSE_KEY:?ACF_PRO_LICENSE_KEY is required for the frozen WordPress + ACF PRO benchmark runtime}"
WP_URL="http://127.0.0.1:8088"
THEME_SLUG="ref001-benchmark-clean"

cleanup_composer_auth() {
  unset COMPOSER_AUTH ACF_COMPOSER_KEY ACF_COMPOSER_SITE_URL || true
}
trap cleanup_composer_auth EXIT

rm -rf .runtime/acf-pro-composer
mkdir -p .runtime/acf-pro-composer
cat > .runtime/acf-pro-composer/composer.json <<'JSON'
{
  "repositories": [
    {"type": "composer", "url": "https://connect.advancedcustomfields.com"}
  ],
  "require": {
    "wpengine/advanced-custom-fields-pro": "^6.0"
  },
  "config": {
    "allow-plugins": {
      "composer/installers": true
    }
  },
  "extra": {
    "installer-paths": {
      "wp-content/plugins/{$name}/": ["type:wordpress-plugin"]
    }
  }
}
JSON

export ACF_COMPOSER_KEY="$ACF_PRO_LICENSE_KEY"
export ACF_COMPOSER_SITE_URL="$WP_URL"
export COMPOSER_AUTH="$(php -r '$key=getenv("ACF_COMPOSER_KEY"); $url=getenv("ACF_COMPOSER_SITE_URL"); echo json_encode(["http-basic"=>["connect.advancedcustomfields.com"=>["username"=>$key,"password"=>$url]]], JSON_UNESCAPED_SLASHES);')"
composer install --working-dir=.runtime/acf-pro-composer --no-interaction --no-progress --no-dev --prefer-dist
cleanup_composer_auth

ACF_DIR="$ROOT/.runtime/acf-pro-composer/wp-content/plugins/advanced-custom-fields-pro"
test -f "$ACF_DIR/acf.php"
echo "PASS official ACF PRO package materialized"

docker compose up -d db wordpress
ready=0
for _ in $(seq 1 60); do
  if docker compose exec -T wordpress test -f /var/www/html/wp-includes/version.php >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != "1" ]]; then
  docker compose logs wordpress
  exit 1
fi

docker compose exec -T wordpress sh -c "printf 'User-agent: *\nDisallow: /\n' > /var/www/html/robots.txt"
if ! docker compose run --rm cli core is-installed >/dev/null 2>&1; then
  docker compose run --rm cli core install \
    --url="$WP_URL" \
    --title="REF-001 Clean Replay" \
    --admin_user="ref001-admin" \
    --admin_password="ref001-clean-replay-local-only" \
    --admin_email="ref001@example.invalid" \
    --skip-email
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli option update permalink_structure '/%postname%/' >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null

docker compose run --rm cli config set ACF_PRO_LICENSE "$ACF_PRO_LICENSE_KEY" --type=constant --quiet >/dev/null
docker compose exec -T wordpress mkdir -p /var/www/html/wp-content/plugins/advanced-custom-fields-pro
docker compose cp "$ACF_DIR/." wordpress:/var/www/html/wp-content/plugins/advanced-custom-fields-pro/ >/dev/null
docker compose run --rm cli plugin activate advanced-custom-fields-pro >/dev/null

docker compose run --rm cli plugin is-active advanced-custom-fields-pro >/dev/null
acf_version="$(docker compose run --rm cli plugin get advanced-custom-fields-pro --field=version)"
echo "PASS ACF PRO active: ${acf_version}"

page_id="$(docker compose run --rm cli post list --post_type=page --name=ref001-clean-replay --field=ID 2>/dev/null | head -1)"
if [[ -z "$page_id" ]]; then
  page_id="$(docker compose run --rm cli post create \
    --post_type=page \
    --post_status=publish \
    --post_title='REF-001 Clean Replay' \
    --post_name='ref001-clean-replay' \
    --meta_input='{"_wp_page_template":"page-templates/template-ref001-benchmark.php"}' \
    --porcelain)"
fi
docker compose run --rm cli post meta update "$page_id" _wp_page_template page-templates/template-ref001-benchmark.php >/dev/null
docker compose run --rm cli option update show_on_front page >/dev/null
docker compose run --rm cli option update page_on_front "$page_id" >/dev/null

docker compose run --rm cli eval 'if (!function_exists("acf_get_field_group") || !acf_get_field_group("group_ref001_benchmark_clean_replay_20260821")) { fwrite(STDERR, "field group missing\n"); exit(1); } echo "PASS ACF Local JSON group loaded\n";'

html="$(curl --fail --silent --show-error "$WP_URL/")"
grep -q 'data-first-pass-authority="clean-replay"' <<<"$html"
grep -q '# STUDENTS_VOICE' <<<"$html"
grep -q '未来につながる' <<<"$html"
echo "PASS server-rendered benchmark page: ${WP_URL}/"
echo "PASS page template: page-templates/template-ref001-benchmark.php"
