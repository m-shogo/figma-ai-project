#!/usr/bin/env python3
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'fixtures'
THEME = ROOT / 'theme' / 'sample-theme'


def fail(message: str) -> None:
    raise SystemExit(f'FAIL {message}')


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as error:
        fail(f'invalid JSON at {path.relative_to(ROOT)}: {error}')


def load_fixture(name: str) -> dict[str, Any]:
    value = load_json(FIXTURES / f'{name}.json')
    if not isinstance(value, dict):
        fail(f'{name} must be a JSON object')
    return value


def validate_link(value: Any, location: str) -> None:
    if value is None:
        return
    if not isinstance(value, dict):
        fail(f'{location} link must be an object or null')
    unknown = set(value) - {'url', 'title', 'target'}
    if unknown:
        fail(f'{location} link has unsupported keys: {sorted(unknown)}')
    if not isinstance(value.get('url'), str) or not value['url'].strip():
        fail(f'{location} link requires a non-empty url')
    if not isinstance(value.get('title', ''), str):
        fail(f'{location} link title must be a string')
    if value.get('target', '') not in {'', '_self', '_blank'}:
        fail(f'{location} link target must be empty, _self, or _blank')


def fixture_image_aspect(seed: str) -> str:
    shape_index = int(hashlib.md5(seed.encode('utf-8')).hexdigest()[:2], 16) % 3
    return ('landscape', 'portrait', 'square')[shape_index]


required_theme_files = {'style.css', 'functions.php', 'index.php', 'page-lp.php'}
missing_theme_files = sorted(name for name in required_theme_files if not (THEME / name).is_file())
if missing_theme_files:
    fail(f'classic fixture theme missing required files: {missing_theme_files}')

compose_text = (ROOT / 'compose.yml').read_text(encoding='utf-8')
if 'name: ${COMPOSE_PROJECT_NAME:-figma-ai-wordpress-acf-runtime}' not in compose_text:
    fail('Compose project name must remain overrideable for concurrent worktrees')
if '127.0.0.1:${WP_PORT:-8088}:80' not in compose_text:
    fail('WordPress fixture HTTP port must bind to loopback only')
if '0.0.0.0:${WP_PORT' in compose_text:
    fail('WordPress fixture must not bind HTTP to all interfaces')

# The runtime must stay reusable for a supplied production theme, and must keep
# defaulting to the disposable sample when nothing is dropped in.
theme_mount = (
    '${THEME_SOURCE_DIR:-./theme/sample-theme}'
    ':/var/www/html/wp-content/themes/${THEME_SLUG:-sample-theme}:ro'
)
if compose_text.count(theme_mount) != 2:
    fail('both WordPress and CLI services must mount the overrideable theme source')
if './theme/sample-theme:/var/www/html' in compose_text:
    fail('theme mount must not be hard-coded to the disposable sample')

runtime_env_text = (ROOT / 'scripts' / 'runtime-env.sh').read_text(encoding='utf-8')
for required in ('THEME_SOURCE_DIR', 'THEME_SLUG', 'THEME_IS_SAMPLE', 'Theme Name:'):
    if required not in runtime_env_text:
        fail(f'runtime-env.sh must resolve and validate the theme under test: {required}')

setup_text = (ROOT / 'scripts' / 'setup.sh').read_text(encoding='utf-8')
if 'theme activate sample-theme' in setup_text:
    fail('setup must activate the resolved theme, not the hard-coded sample')
if 'THEME_IS_SAMPLE' not in setup_text:
    fail('setup must skip sample-only ACF/fixture steps for a supplied theme')

gitignore_text = (ROOT / '.gitignore').read_text(encoding='utf-8')
if 'theme-dropin/*' not in gitignore_text or '!theme-dropin/.gitkeep' not in gitignore_text:
    fail('a supplied client theme must never be committable through theme-dropin/')
if not (ROOT / 'theme-dropin' / '.gitkeep').is_file():
    fail('theme-dropin/ drop-in path must exist in a fresh checkout')

export = load_json(ROOT / 'acf-export.json')
local = load_json(THEME / 'acf-json' / 'group_standalone_lp_sample.json')
if export != [local]:
    fail('acf-export.json and Local JSON must remain structurally identical')

required_field_keys = {
    'field_lp_hero_title',
    'field_lp_hero_body',
    'field_lp_hero_cta',
    'field_lp_cards',
    'field_lp_card_title',
    'field_lp_card_body',
    'field_lp_card_image',
    'field_lp_card_link',
}


def collect_field_keys(fields: list[dict[str, Any]]) -> set[str]:
    keys: set[str] = set()
    for field in fields:
        key = field.get('key')
        if isinstance(key, str):
            keys.add(key)
        sub_fields = field.get('sub_fields', [])
        if isinstance(sub_fields, list):
            keys |= collect_field_keys([item for item in sub_fields if isinstance(item, dict)])
    return keys


if not isinstance(local, dict) or local.get('key') != 'group_standalone_lp_sample':
    fail('ACF group key must remain stable: group_standalone_lp_sample')
fields = local.get('fields')
if not isinstance(fields, list):
    fail('ACF group fields must be an array')
actual_field_keys = collect_field_keys([field for field in fields if isinstance(field, dict)])
missing_field_keys = sorted(required_field_keys - actual_field_keys)
if missing_field_keys:
    fail(f'ACF stable field keys missing: {missing_field_keys}')

fixture_paths = sorted(path for path in FIXTURES.glob('*.json') if path.name != 'schema.json')
if not fixture_paths:
    fail('no fixture JSON files found')

fixture_ids: set[str] = set()
for path in fixture_paths:
    fixture = load_json(path)
    if not isinstance(fixture, dict):
        fail(f'{path.name} must be a JSON object')
    fixture_id = fixture.get('id')
    if not isinstance(fixture_id, str) or not fixture_id:
        fail(f'{path.name} requires a non-empty id')
    if fixture_id != path.stem:
        fail(f'{path.name} id must match filename stem ({path.stem})')
    if fixture_id in fixture_ids:
        fail(f'duplicate fixture id: {fixture_id}')
    fixture_ids.add(fixture_id)

    page = fixture.get('page')
    if not isinstance(page, dict):
        fail(f'{path.name} page must be an object')
    if not isinstance(page.get('slug'), str) or not page['slug'].strip():
        fail(f'{path.name} page.slug must be non-empty')
    if not isinstance(page.get('title'), str) or not page['title'].strip():
        fail(f'{path.name} page.title must be non-empty')

    fixture_fields = fixture.get('fields')
    if not isinstance(fixture_fields, dict):
        fail(f'{path.name} fields must be an object')
    for scalar_name in ('hero_title', 'hero_body'):
        if not isinstance(fixture_fields.get(scalar_name, ''), str):
            fail(f'{path.name} fields.{scalar_name} must be a string')
    validate_link(fixture_fields.get('hero_cta'), f'{path.name} fields.hero_cta')

    cards = fixture_fields.get('cards')
    if not isinstance(cards, list):
        fail(f'{path.name} fields.cards must be an array')
    card_ids: set[str] = set()
    for index, card in enumerate(cards):
        location = f'{path.name} card[{index}]'
        if not isinstance(card, dict):
            fail(f'{location} must be an object')
        card_id = card.get('id')
        if not isinstance(card_id, str) or not card_id:
            fail(f'{location} requires a non-empty id')
        if card_id in card_ids:
            fail(f'{path.name} has duplicate card id: {card_id}')
        card_ids.add(card_id)
        for scalar_name in ('title', 'body'):
            if not isinstance(card.get(scalar_name, ''), str):
                fail(f'{location}.{scalar_name} must be a string')
        image = card.get('image')
        if image is not None and (not isinstance(image, str) or not image.strip()):
            fail(f'{location}.image must be a non-empty string or null')
        validate_link(card.get('link'), f'{location}.link')

baseline = load_fixture('figma-baseline')
one = load_fixture('repeater-1-item')
eight = load_fixture('repeater-8-items')
missing = load_fixture('missing-image')
reordered = load_fixture('reordered-items')
long_text = load_fixture('long-text')
empty = load_fixture('empty')

if len(baseline['fields']['cards']) != 4:
    fail('figma-baseline must contain 4 cards')
if len(one['fields']['cards']) != 1:
    fail('repeater-1-item must contain 1 card')
if len(eight['fields']['cards']) != 8:
    fail('repeater-8-items must contain 8 cards')
if len(empty['fields']['cards']) != 0:
    fail('empty must contain 0 cards')
if not any(card.get('image') is None for card in missing['fields']['cards']):
    fail('missing-image must contain a missing image')
base_ids = [card['id'] for card in baseline['fields']['cards']]
reordered_ids = [card['id'] for card in reordered['fields']['cards']]
if sorted(base_ids) != sorted(reordered_ids) or base_ids == reordered_ids:
    fail('reordered-items must preserve members and change order')
if max(len(card['body']) for card in long_text['fields']['cards']) < 300:
    fail('long-text must contain a substantial copy mutation')

baseline_aspects = {
    fixture_image_aspect(card['image'])
    for card in baseline['fields']['cards']
    if isinstance(card.get('image'), str) and card['image']
}
if baseline_aspects != {'landscape', 'portrait', 'square'}:
    fail(f'figma-baseline image seeds must cover landscape/portrait/square, got {sorted(baseline_aspects)}')

for file in ROOT.rglob('*'):
    if not file.is_file():
        continue
    relative = file.relative_to(ROOT).as_posix()
    if relative == '.env':
        fail('.env must never be committed')
    if file.suffix.lower() == '.zip':
        fail(f'plugin/archive must not be committed: {relative}')
    if 'advanced-custom-fields-pro/' in relative:
        fail('ACF PRO plugin files must not be committed')

print('PASS fixture schema, stable ACF keys, theme/network contract, image-aspect coverage, mutation coverage, and secret/plugin boundaries')
