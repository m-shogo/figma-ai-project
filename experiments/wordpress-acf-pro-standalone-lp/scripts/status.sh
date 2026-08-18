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

echo "Compose project: ${COMPOSE_PROJECT_NAME}"
echo "WordPress URL: ${WP_URL}"
docker compose ps

running_services="$(docker compose ps --status running --services)"
if ! printf '%s\n' "$running_services" | grep -qx 'wordpress'; then
  echo "WordPress runtime: stopped"
  exit 0
fi

wordpress_version="$(docker compose exec -T wordpress php -r 'require "/var/www/html/wp-includes/version.php"; echo $wp_version;')"
echo "WordPress runtime: running (${wordpress_version})"

if docker compose exec -T wordpress test -d /var/www/html/wp-content/plugins/advanced-custom-fields-pro; then
  echo "ACF PRO files: present"
else
  echo "ACF PRO files: absent"
fi
