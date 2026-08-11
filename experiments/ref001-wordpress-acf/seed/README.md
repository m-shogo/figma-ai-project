# REF-001 WordPress Seed Flow

Purpose: populate a disposable First Pass Page **after** ACF field configuration exists, without bypassing ACF's field-key references.

This is a learning workflow, not a production deployment script.

## Why not `wp post meta update` for ACF values?

The seed payload carries stable `field_*` keys from `artifacts/acf-export.json` and `seed-ref001.php` writes values through `update_field( $field_key, ... )`.

This is deliberate: a new ACF value needs the field-key reference so ACF can associate stored data with the field settings. Directly writing only the visible meta name would not exercise the same ACF contract.

## 1. Build the deterministic seed payload

From the repository root:

```bash
python scripts/build_ref001_wordpress_seed.py \
  --output /tmp/ref001-seed.json
```

The builder joins:

- `fixture-content.yaml` — Page/content intent
- `artifacts/acf-export.json` — stable field keys/types

It does **not** invent attachment IDs. Missing media remains `UNRESOLVED` and the WP seed runner skips it visibly.

## 2. Probe the actual WordPress + ACF runtime first

Do not assume WP-CLI, WordPress, ACF, or the ACF JSON CLI command exists merely because this repository contains a seed script.

Use the read-only preflight first:

```bash
python scripts/probe_ref001_acf_runtime.py \
  --wp-path /absolute/path/to/wordpress \
  --require-ready
```

Optional multisite/site targeting:

```bash
python scripts/probe_ref001_acf_runtime.py \
  --wp-path /absolute/path/to/wordpress \
  --site-url https://example.test \
  --require-ready
```

The probe performs the same explicit WP-CLI capability check that can be run manually:

```bash
wp cli has-command "acf json import"
```

The probe records:

- WP-CLI availability
- WordPress installation presence and version
- active ACF version
- whether ACF meets the currently documented `6.8+` requirement for `wp acf json`
- whether `acf json import` is actually registered in that runtime

A missing capability returns `BLOCKED` rather than silently changing the project's plugin/runtime.

Official ACF documentation verified on 2026-08-12:

- `wp acf json` requires ACF 6.8 or later and WP-CLI 2.0 or later
- `wp acf json import <file>` imports ACF JSON and is documented as replicating the Admin import functionality

Canonical upstream docs:

- `https://www.advancedcustomfields.com/resources/wp-acf-json/`
- `https://www.advancedcustomfields.com/resources/wp-acf-json-import/`

## 3. Choose the import evidence level deliberately

### A. CLI import smoke — automatable

Only on an explicitly disposable/test runtime:

```bash
python scripts/probe_ref001_acf_runtime.py \
  --wp-path /absolute/path/to/wordpress \
  --execute-import \
  --ack-disposable-runtime \
  --output-json /tmp/ref001-acf-runtime.json
```

This:

1. imports `artifacts/acf-import-bundle.json` with `wp acf json import`
2. reads the expected REF-001 field groups back through ACF runtime APIs
3. records `cli_import_smoke: PASS` only when all expected group keys are present

The mutation requires **both** `--execute-import` and `--ack-disposable-runtime`; preflight alone never imports anything.

### B. Interactive WordPress Admin import smoke — separate evidence

A CLI PASS does **not** claim that a person/browser clicked through WordPress Admin → ACF Tools → Import.

The probe therefore keeps:

```text
admin_ui_interactive_smoke: NOT_RUN
```

even after a successful CLI import.

If the experiment/run contract explicitly requires interactive Admin UI evidence, that blocker remains open until a real browser/Admin smoke is executed and recorded. This avoids treating functional equivalence as fabricated interaction evidence.

## 4. Manual fallback when the CLI command is unavailable

Do not silently install/upgrade ACF just to make this learning script pass.

If the target project's approved runtime does not expose `acf json import`:

1. record `ACF_JSON_IMPORT_COMMAND_UNAVAILABLE`
2. use the project's approved **ACF Tools admin import** path if permitted
3. preserve the actual ACF/WordPress/plugin versions in evidence
4. continue to the seed step only after the field groups really exist

## 5. Seed an existing fixture Page

If a Page with slug `ref001-learning` already exists:

```bash
wp eval-file \
  experiments/ref001-wordpress-acf/seed/seed-ref001.php \
  /tmp/ref001-seed.json
```

The runner:

- finds the Page by slug
- assigns `page-templates/template-ref001.php`
- uses `update_field()` with stable field keys
- reads each scalar value back with `get_field(..., false)`
- reports unresolved media separately
- treats an unchanged value as valid when the read-back matches

## 6. Create a disposable fixture Page explicitly

Page creation is opt-in. Pass the positional word `create`:

```bash
wp eval-file \
  experiments/ref001-wordpress-acf/seed/seed-ref001.php \
  /tmp/ref001-seed.json \
  create
```

The fixture content defaults to `draft` status. This avoids publishing test content merely because a seed command ran.

## 7. Media remains a separate step

`fixture-content.yaml` currently keeps WordPress attachment IDs as `null` because the completed Blind Clean Replay did not have persistent exact Figma source bytes available in its execution runtime.

For short-lived Figma MCP asset URLs, use the repository's secret-safe intake flow first:

- `docs/figma-asset-intake.md`
- `scripts/ingest_figma_mcp_asset.py`

When exact assets are available in the disposable WordPress environment:

1. upload/import the exact source image
2. record the resulting attachment ID in `fixture-content.yaml`
3. rebuild `/tmp/ref001-seed.json`
4. re-run `seed-ref001.php`

PC/SP do not get duplicate attachment fields when they share the same source image; crop/layout remains in CSS.

## Safety boundaries

- runtime probe is read-only unless `--execute-import` is explicitly supplied
- import additionally requires `--ack-disposable-runtime`
- seed script refuses a missing Page unless `create` is explicitly passed
- ACF must already be active and the field group imported/synced
- media IDs must be positive integers
- field keys must begin with `field_`
- no production target theme is inferred
- no production publish step is automated here
- target PHP/WordPress/ACF versions remain reconnaissance inputs, not fixture assumptions
- CLI import evidence and interactive Admin UI evidence are recorded separately
