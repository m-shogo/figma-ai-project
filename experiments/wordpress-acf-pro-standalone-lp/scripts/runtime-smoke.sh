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

cleanup() {
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup
docker compose up -d db wordpress

published_port="$(docker compose port wordpress 80)"
case "$published_port" in
  127.0.0.1:*) ;;
  *)
    echo "FAIL WordPress fixture must publish only on loopback; got ${published_port}." >&2
    exit 1
    ;;
esac
expected_port="${WP_PORT}"
actual_port="${published_port##*:}"
[[ "$actual_port" == "$expected_port" ]] || {
  echo "FAIL published port ${actual_port} does not match runtime contract ${expected_port}." >&2
  exit 1
}

ready=0
for _ in $(seq 1 90); do
  if docker compose exec -T wordpress test -f /var/www/html/wp-includes/version.php >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != "1" ]]; then
  docker compose logs
  echo "FAIL WordPress files were not initialized." >&2
  exit 1
fi

# Keep crawl prevention deterministic and independent from rewrite/permalink behavior.
docker compose exec -T wordpress sh -c "printf 'User-agent: *\nDisallow: /\n' > /var/www/html/robots.txt"

if ! docker compose run --rm cli core is-installed >/dev/null 2>&1; then
  docker compose run --rm cli core install \
    --url="$WP_URL" \
    --title="Standalone LP Runtime Smoke" \
    --admin_user="fixture-admin" \
    --admin_password="fixture-admin-change-me" \
    --admin_email="fixture@example.invalid" \
    --skip-email >/dev/null
fi

docker compose run --rm cli option update blog_public 0 >/dev/null
blog_public="$(docker compose run --rm cli option get blog_public)"
[[ "$blog_public" == "0" ]] || { echo "FAIL fixture must remain search-engine hidden." >&2; exit 1; }

wordpress_version="$(docker compose run --rm cli core version)"
docker compose run --rm cli db check >/dev/null
docker compose run --rm cli theme activate "$THEME_SLUG" >/dev/null
active_theme="$(docker compose run --rm cli option get stylesheet)"
[[ "$active_theme" == "$THEME_SLUG" ]] || { echo "FAIL theme was not activated: expected ${THEME_SLUG}, got ${active_theme}." >&2; exit 1; }

http_code="$(curl --silent --show-error --output /tmp/standalone-lp-smoke.html --write-out '%{http_code}' "$WP_URL/")"
[[ "$http_code" == "200" ]] || {
  docker compose logs wordpress
  echo "FAIL WordPress fallback render returned HTTP ${http_code}." >&2
  exit 1
}
grep -q 'Standalone LP Fixture' /tmp/standalone-lp-smoke.html || {
  echo "FAIL fallback theme marker missing from rendered HTML." >&2
  exit 1
}
grep -Eiq 'name="robots"|name='"'"'robots'"'"'' /tmp/standalone-lp-smoke.html || {
  echo "FAIL rendered HTML must contain a robots meta tag." >&2
  exit 1
}
grep -Eiq 'noindex' /tmp/standalone-lp-smoke.html || {
  echo "FAIL rendered HTML must contain a noindex robots directive." >&2
  exit 1
}

robots_body="$(curl --silent --show-error "$WP_URL/robots.txt")"
printf '%s' "$robots_body" | grep -Eq 'Disallow:[[:space:]]*/' || {
  echo "FAIL robots.txt must disallow crawling for the disposable fixture." >&2
  exit 1
}

if docker compose run --rm cli plugin is-installed advanced-custom-fields-pro >/dev/null 2>&1; then
  echo "FAIL secret-free runtime smoke must not install ACF PRO." >&2
  exit 1
fi

echo "PASS WordPress runtime: ${wordpress_version}"
echo "PASS MariaDB connectivity through WP-CLI"
echo "PASS WP-CLI core install + theme activation"
echo "PASS isolated Compose project: ${COMPOSE_PROJECT_NAME}"
echo "PASS loopback-only HTTP publication: ${published_port}"
echo "PASS search-engine visibility disabled + HTML noindex + static robots.txt"
echo "PASS HTTP fallback render: ${WP_URL}/"
echo "PASS ACF PRO intentionally absent in runtime smoke"
