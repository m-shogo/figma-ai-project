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

## 2. Determine how ACF configuration can be imported

Do not assume every project has the current ACF CLI command.

Check capability:

```bash
wp cli has-command "acf json import"
```

### If available

Current ACF CLI environments can import the portable export directly:

```bash
wp acf json import \
  experiments/ref001-wordpress-acf/artifacts/acf-export.json
```

### If unavailable

Use the ACF Tools admin import for the same `acf-export.json`, then continue with the seed step.

Do not silently replace the project plugin/version just to make this learning script work.

## 3. Seed an existing fixture Page

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

## 4. Create a disposable fixture Page explicitly

Page creation is opt-in. Pass the positional word `create`:

```bash
wp eval-file \
  experiments/ref001-wordpress-acf/seed/seed-ref001.php \
  /tmp/ref001-seed.json \
  create
```

The fixture content defaults to `draft` status. This avoids publishing test content merely because a seed command ran.

## 5. Media remains a separate step

`fixture-content.yaml` currently keeps WordPress attachment IDs as `null` because this environment cannot persist the exact temporary Figma asset downloads into a WordPress Media Library.

When exact assets are available in the disposable WordPress environment:

1. upload/import the exact source image
2. record the resulting attachment ID in `fixture-content.yaml`
3. rebuild `/tmp/ref001-seed.json`
4. re-run `seed-ref001.php`

PC/SP do not get duplicate attachment fields when they share the same source image; crop/layout remains in CSS.

## Safety boundaries

- seed script refuses a missing Page unless `create` is explicitly passed
- ACF must already be active and the field group imported/synced
- media IDs must be positive integers
- field keys must begin with `field_`
- no production target theme is inferred
- no production publish step is automated here
- target PHP/WordPress/ACF versions remain reconnaissance inputs, not fixture assumptions
