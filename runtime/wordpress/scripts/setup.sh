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
ROOT="$FIXTURE_ROOT"
cd "$ROOT"

: "${WP_SITE_TITLE:=Sample Theme Fixture}"
: "${WP_ADMIN_USER:=fixture-admin}"
: "${WP_ADMIN_PASSWORD:=fixture-admin-change-me}"
: "${WP_ADMIN_EMAIL:=fixture@example.invalid}"
: "${FIXTURE:=figma-baseline}"

resolve_acf_pro_from_license() {
  [[ -n "${ACF_PRO_LICENSE_KEY:-}" ]] || return 1
  command -v composer >/dev/null 2>&1 || {
    echo "FAIL ACF_PRO_LICENSE_KEY is set but Composer is unavailable." >&2
    return 2
  }
  command -v php >/dev/null 2>&1 || {
    echo "FAIL ACF_PRO_LICENSE_KEY is set but PHP is unavailable for safe Composer auth encoding." >&2
    return 2
  }

  local work="$ROOT/.runtime/acf-pro-composer"
  rm -rf "$work"
  mkdir -p "$work"
  cat > "$work/composer.json" <<'JSON'
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
  composer install --working-dir="$work" --no-interaction --no-progress --no-dev --prefer-dist
  unset COMPOSER_AUTH ACF_COMPOSER_KEY ACF_COMPOSER_SITE_URL

  ACF_PRO_PLUGIN_DIR="$work/wp-content/plugins/advanced-custom-fields-pro"
  export ACF_PRO_PLUGIN_DIR
  [[ -f "$ACF_PRO_PLUGIN_DIR/acf.php" ]] || {
    echo "FAIL Composer did not materialize ACF PRO plugin directory." >&2
    return 3
  }
  echo "PASS ACF PRO materialized through official Composer repository."
}

if [[ -z "${ACF_PRO_PLUGIN_ZIP:-}" && -z "${ACF_PRO_PLUGIN_DIR:-}" && -n "${ACF_PRO_LICENSE_KEY:-}" ]]; then
  resolve_acf_pro_from_license
fi

docker compose up -d db wordpress
ready=0
for _ in $(seq 1 60); do
  if docker compose exec -T wordpress test -f /var/www/html/wp-includes/version.php >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != "1" ]]; then
  docker compose logs wordpress
  echo "FAIL WordPress files were not initialized." >&2
  exit 1
fi

published_port="$(docker compose port wordpress 80)"
case "$published_port" in
  127.0.0.1:*) ;;
  *)
    echo "FAIL WordPress fixture must publish only on loopback; got ${published_port}." >&2
    exit 1
    ;;
esac

# Keep crawl prevention independent from WordPress rewrite/permalink behavior.
docker compose exec -T wordpress sh -c "printf 'User-agent: *\nDisallow: /\n' > /var/www/html/robots.txt"

if ! docker compose run --rm cli core is-installed >/dev/null 2>&1; then
  docker compose run --rm cli core install \
    --url="$WP_URL" \
    --title="$WP_SITE_TITLE" \
    --admin_user="$WP_ADMIN_USER" \
    --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL" \
    --skip-email
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
docker compose run --rm cli option update permalink_structure '/%postname%/' >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null

# The key exists only in the disposable WordPress runtime. Do not print it or
# persist it to repository files. ACF officially supports ACF_PRO_LICENSE in
# wp-config.php for non-interactive activation.
if [[ -n "${ACF_PRO_LICENSE_KEY:-}" ]]; then
  if ! docker compose run --rm cli config set ACF_PRO_LICENSE "$ACF_PRO_LICENSE_KEY" --type=constant --quiet >/dev/null 2>&1; then
    echo "FAIL unable to define ACF_PRO_LICENSE in disposable wp-config.php." >&2
    exit 4
  fi
  echo "PASS ACF PRO license key defined in disposable runtime without logging its value."
fi

if docker compose run --rm cli plugin is-active advanced-custom-fields-pro >/dev/null 2>&1; then
  echo "PASS ACF PRO already active."
elif [[ -n "${ACF_PRO_PLUGIN_ZIP:-}" ]]; then
  [[ -f "$ACF_PRO_PLUGIN_ZIP" ]] || { echo "FAIL ACF_PRO_PLUGIN_ZIP does not exist." >&2; exit 2; }
  docker compose cp "$ACF_PRO_PLUGIN_ZIP" wordpress:/var/www/html/wp-content/acf-pro-fixture.zip >/dev/null
  docker compose run --rm cli plugin install /var/www/html/wp-content/acf-pro-fixture.zip --activate --force
  docker compose exec -T wordpress rm -f /var/www/html/wp-content/acf-pro-fixture.zip
elif [[ -n "${ACF_PRO_PLUGIN_DIR:-}" ]]; then
  [[ -d "$ACF_PRO_PLUGIN_DIR" ]] || { echo "FAIL ACF_PRO_PLUGIN_DIR does not exist." >&2; exit 2; }
  docker compose exec -T wordpress mkdir -p /var/www/html/wp-content/plugins/advanced-custom-fields-pro
  docker compose cp "$ACF_PRO_PLUGIN_DIR/." wordpress:/var/www/html/wp-content/plugins/advanced-custom-fields-pro/ >/dev/null
  docker compose run --rm cli plugin activate advanced-custom-fields-pro
else
  echo "FAIL FULL E2E requires ACF_PRO_LICENSE_KEY or an approved ACF PRO ZIP/directory; no fake fallback is allowed." >&2
  exit 3
fi

acf_version="$(docker compose run --rm cli plugin get advanced-custom-fields-pro --field=version)"
echo "PASS ACF PRO active: ${acf_version}"

if [[ "$THEME_IS_SAMPLE" == "1" ]]; then
  if docker compose run --rm cli help acf json import >/dev/null 2>&1; then
    docker compose run --rm cli acf json import /fixture/acf-export.json
    echo "PASS ACF JSON imported through official WP-CLI command."
  else
    echo "SKIP ACF CLI import unavailable in this installed ACF version; theme Local JSON remains active."
  fi

  bash "$ROOT/scripts/apply-fixture.sh" "$FIXTURE"
else
  echo "SKIP sample ACF export import; a supplied theme owns its own field architecture."
  echo "SKIP sample CMS mutation fixture; supplied-theme fixtures must be defined for that theme."
fi
echo "PASS WordPress runtime ready: ${WP_URL}"
echo "PASS Compose project: ${COMPOSE_PROJECT_NAME}"
echo "PASS loopback-only publication: ${published_port}"
echo "PASS search-engine visibility disabled + static robots.txt"
echo "PASS Theme: ${THEME_SLUG} (${THEME_SOURCE_DIR})"
if [[ "$THEME_IS_SAMPLE" == "1" ]]; then
  echo "PASS Fixture: ${FIXTURE}"
else
  echo "SKIP Fixture: supplied theme, no sample fixture applied"
fi
