# WordPress + ACF PRO Standalone LP runtime fixture

Disposable **validation infrastructure**, not a standard production theme. It proves that a one-page LP can be populated through ACF PRO, rendered by real WordPress, mutated as CMS data, and inspected in Chromium without reusing REF-001 V2/V3 implementation or assets.

## Boundary

Shared here: WordPress runtime, MariaDB, WP-CLI, safe ACF PRO attachment/resolution path, fixture loader, browser capture, runtime robustness checks, and optional pixel-diff mechanics.

Not standardized here: future LP HTML/PHP structure, section model, CSS/JS architecture, breakpoints, slider behavior, component granularity, or ACF field architecture. A real Figma/company repository must be observed before those choices are frozen.

## Hosting a supplied production theme

The runtime is reusable infrastructure. It hosts either the disposable sample theme or a **supplied production theme**, without changing anything else.

Drop the theme in and run:

```bash
cp -R /path/to/supplied-theme theme-dropin/
make smoke
```

`theme-dropin/` is git-ignored: a client theme must never be committed to this repository. The directory itself stays tracked so the drop-in path always exists.

If the theme lives elsewhere on disk, point at it instead of copying:

```bash
THEME_SOURCE_DIR=/absolute/path/to/supplied-theme make smoke
```

Resolution order is: explicit `THEME_SOURCE_DIR`, then the single directory inside `theme-dropin/`, then the disposable sample. `THEME_SLUG` defaults to the theme directory name and can be overridden when the target install expects a different directory name.

Before mounting anything, `scripts/runtime-env.sh` verifies that the source directory exists, contains `style.css`, and that `style.css` carries a `Theme Name:` header. Two themes in `theme-dropin/` is an explicit failure rather than an arbitrary pick, and `THEME_SLUG` must be a safe directory name.

When a supplied theme is active, the sample-only steps are skipped rather than faked: the sample `acf-export.json` import and the sample CMS mutation fixtures do not run, because a supplied theme owns its own field architecture. `make smoke` and the WordPress/ACF PRO runtime path stay identical.

## Local isolation

This fixture is not a preview server for public/LAN exposure. Docker publishes WordPress only on `127.0.0.1`, setup forces WordPress `blog_public=0`, and the runtime smoke also verifies that `robots.txt` disallows crawling. The sample credentials are intentionally disposable local-fixture credentials and must never be reused for a real environment.

When `COMPOSE_PROJECT_NAME`, `WP_PORT`, and `WP_URL` are left empty, `scripts/runtime-env.sh` derives a stable runtime identity from the fixture/worktree path. Separate worktrees therefore receive separate Compose project names and localhost ports automatically. CI asserts that two different worktree seeds resolve to different project names/ports. Explicit values in a private `.env` remain authoritative when a developer intentionally needs a fixed port or project name, but `WP_URL` must always match `http://127.0.0.1:<WP_PORT>`.

## ACF PRO safety

ACF PRO is licensed software. This directory intentionally contains **no plugin files and no license key**.

Preferred local FULL E2E path:

```bash
cp .env.example .env
# Edit only your private local .env.
ACF_PRO_LICENSE_KEY="your-real-license-key"
make qa
```

When `ACF_PRO_LICENSE_KEY` is present and neither local artifact override is supplied, `scripts/setup.sh` resolves ACF PRO from the official private Composer repository using ephemeral `COMPOSER_AUTH`. The key is the HTTP Basic username and is never written to the repository. The downloaded plugin lives only under `.runtime/` and is copied into the disposable WordPress volume. Setup also defines `ACF_PRO_LICENSE` only inside that disposable `wp-config.php`, so the real PRO field runtime is licensed without logging the key.

Offline/local artifact overrides remain supported and take precedence over Composer resolution:

```bash
ACF_PRO_PLUGIN_ZIP="/absolute/path/advanced-custom-fields-pro.zip"
# or
ACF_PRO_PLUGIN_DIR="/absolute/path/advanced-custom-fields-pro"
```

`.env`, archives, runtime files, Composer-resolved plugin files, and an `advanced-custom-fields-pro/` source directory are ignored. The fixture never prints the license key. `.env.example` is intentionally valid shell syntax because the setup/QA scripts source the private `.env`; CI syntax-checks the example to prevent a copy-and-run failure.

For GitHub Actions, the canonical repository secret is **`ACF_PRO_LICENSE_KEY`**. No direct-download URL secret is used.

## Commands

Secret-free real WordPress runtime smoke:

```bash
make smoke
```

That performs: clean disposable start → per-worktree runtime isolation → MariaDB health → WordPress install → WP-CLI DB check → standalone fixture theme activation → loopback-only publication/port contract → search-engine visibility + robots check → real HTTP 200 fallback render → confirmation that ACF PRO was **not** installed. This proves the runtime independently from licensed-plugin availability.

Full ACF PRO + CMS + browser QA:

```bash
make qa
```

That performs: official Composer resolution when only `ACF_PRO_LICENSE_KEY` is provided (or uses an approved local ZIP/directory override) → Docker start → WordPress install → local-only/noindex guard → theme activation → disposable ACF license definition → ACF PRO activation → ACF JSON import when the installed ACF supports the official CLI command → baseline fixture load → all CMS mutation fixtures → Playwright screenshots/runtime checks.

All shell entrypoints are invoked explicitly through `bash`, so the fixture does not depend on executable-bit preservation when files move through GitHub/API-based workflows.

Use `make status` to print the resolved Compose project, WordPress URL, and the resolved theme source/slug. Use `make reset` for a destructive reset of **only that resolved Compose project** plus `.runtime`. Use `make fixture FIXTURE=repeater-8-items` to switch one validated case.

## Theme contract

`standalone-lp-sample` is intentionally minimal and disposable. `index.php` exists only because a classic WordPress theme requires a valid fallback template and because the secret-free runtime smoke needs a non-ACF page it can render. The actual CMS fixture is `page-lp.php`; future production LP structures must not inherit this sample layout by default.

## Fixture contract

`tests/validate-fixtures.py` is the machine-readable gate for this sample. It keeps fixture IDs aligned with filenames, prevents duplicate card IDs, validates native ACF Link shapes, preserves the stable ACF group/field keys, requires the classic-theme fallback files, enforces loopback-only Compose publication, and asserts that portable `acf-export.json` and committed Local JSON remain structurally equivalent. Mutation-specific contracts also prove 1/4/8/empty cardinalities, missing-image coverage, reordered membership, and substantial long-copy coverage.

## QA layers

1. **FIGMA FIDELITY** — only the `figma-baseline` content state is eligible. This sample repo does not contain a V2/V3 or invented Figma screenshot, so pixel diff is explicitly `SKIP` until a real reference is supplied. Capture at the exact reference viewport, then run `tests/visual-diff.mjs`. No universal tolerance is baked in; without `VISUAL_DIFF_MAX_RATIO`, the tool reports `MEASURE_ONLY`.

2. **CMS ROBUSTNESS** — `repeater-1-item`, `repeater-8-items`, `long-text`, `missing-image`, `reordered-items`, and `empty`. These are not pixel-diffed against Figma. Playwright checks HTTP/runtime errors, console errors, page errors, horizontal overflow, readable-text clipping, and captures SP/intermediate/PC screenshots. It also compares the real frontend against each fixture's expected hero title, card count, card-title order, and missing-image placeholder count, so a successful mutation must change the rendered CMS content—not merely avoid a layout crash. Default widths are sample robustness probes only; set `QA_VIEWPORTS` to the real project's reference/boundary contract.

3. **ACF EDITABILITY** — the same mutations are written through `update_field()` against stable field keys and then verified on the frontend. Admin-click smoke is intentionally secondary because machine-repeatable mutation is the stronger baseline.

## Browser dependency isolation

Playwright, `pixelmatch`, and `pngjs` are installed under `.runtime/playwright/`, not into the repository root. The ESM test files resolve that isolated runtime package explicitly rather than relying on `NODE_PATH` or global modules. This keeps generated dependencies uncommitted while making the FULL path deterministic once ACF PRO is supplied.

## ACF delivery

- `acf-export.json`: portable bundle.
- `theme/standalone-lp-sample/acf-json/group_standalone_lp_sample.json`: Local JSON source.
- Keys are stable and intentionally human-readable.
- Repeater exists because this **sample fixture explicitly tests editor add/remove/reorder capability**; it is not inferred from visual repetition.

The committed theme/Local JSON is mounted read-only. If ACF writes JSON while importing/saving, `functions.php` redirects that runtime output to `wp-content/uploads/acf-json-runtime` inside the disposable WordPress volume, so executing the fixture cannot rewrite source evidence.

ACF 6.8+ exposes official `wp acf json import/sync` commands. `scripts/setup.sh` uses the import command when present. Older ACF PRO versions remain usable through Local JSON, but setup reports the CLI import as `SKIP`; it never claims an unexecuted import passed.

## CI

The dedicated workflow has three levels:

- **LIGHT** (always): branch scope guard, Docker Compose config, PHP/bash/env/Node syntax, worktree runtime-isolation contract, isolated browser-module resolution, repository ACF export validator, mutation schema/parity/stable-key/theme/network-contract validation, and plugin/secret boundary checks.
- **WORDPRESS RUNTIME SMOKE** (always): starts real WordPress + MariaDB, runs WP-CLI install/DB checks, verifies the derived Compose project/port, loopback-only/noindex/robots isolation, activates the classic fixture theme, and verifies an HTTP 200 render without installing ACF PRO.
- **FULL E2E** (conditional): if repository secret `ACF_PRO_LICENSE_KEY` exists, `make qa` uses the same `scripts/setup.sh` path as local development to resolve ACF PRO from the official Composer repository, define the license only in the disposable runtime, activate the plugin, apply every fixture mutation, run Playwright, and upload `.runtime/qa`. If absent, the workflow summary says `SKIP_NO_ACF_PRO_LICENSE_KEY`.

The runtime smoke is deliberately not reported as an ACF PRO pass. FULL remains authoritative for Repeater/CMS mutation/Playwright validation with the licensed plugin.

The scope guard allows changes only in this fixture directory and its dedicated workflow. It therefore prevents accidental V2/V3 edits in this branch.
