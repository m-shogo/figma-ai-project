# WordPress + ACF Runtime Capability

## Why this exists

A Figma-to-WordPress implementation can have valid PHP templates and valid ACF JSON while still being unproven against the **actual target WordPress runtime**.

REF-001 exposed three different layers that must not be collapsed into one claim:

1. deterministic ACF artifact generation/validation
2. a real WordPress runtime that can bootstrap the intended ACF plugin
3. the required browser `ADMIN_UI` import smoke

Passing layer 1 does not prove 2 or 3. Passing layer 2 does not prove 3.

## Probe the real runtime

Run inside the target WordPress environment, or from a shell where WP-CLI can bootstrap it:

```bash
python scripts/probe_wordpress_acf_runtime.py \
  --wp-path /path/to/wordpress \
  --output /tmp/acf-runtime-capability.json
```

To use it as a hard precondition:

```bash
python scripts/probe_wordpress_acf_runtime.py \
  --wp-path /path/to/wordpress \
  --require-runtime-ready
```

The probe is read-only. It does not import field groups, modify plugin state, create users, or seed content.

## What is actually checked

The probe distinguishes:

- WP-CLI executable unavailable
- WP-CLI available but the target WordPress installation cannot bootstrap
- WordPress version available
- active theme stylesheet
- site URL
- supported ACF plugin slug detected
- ACF plugin active/inactive state
- ACF field-group API loaded in the bootstrapped runtime
- at least one administrator account exists for a later browser smoke

It supports both the free and PRO plugin directory names, preferring PRO when both are detectable.

## State model

### `CLI_UNAVAILABLE`

No WP-CLI executable is available in the current execution environment.

### `WORDPRESS_BOOTSTRAP_UNAVAILABLE`

WP-CLI exists, but it cannot bootstrap the target installation. Common causes belong to the target environment: wrong path, unavailable database, missing config, or an otherwise non-runnable installation.

The probe reports the boundary; it does not invent the cause.

### `RUNTIME_BLOCKED`

WordPress boots, but one or more runtime prerequisites are missing, for example:

- no supported ACF installation detected
- ACF detected but inactive
- ACF API not loaded
- no administrator exists for a future ADMIN_UI check

### `RUNTIME_READY_UI_UNVERIFIED`

The real WordPress runtime boots, ACF is active and callable, and an administrator exists.

**This is still not `ADMIN_UI_SMOKE_PASS`.**

The probe intentionally emits:

```json
"admin_ui_smoke_executed": false
```

because a CLI capability check cannot prove browser interaction that never happened.

## REF-001 execution order

For REF-001, use the generic runtime capability probe first, then the REF-001-specific import-readiness probe:

```bash
python scripts/probe_wordpress_acf_runtime.py \
  --wp-path /path/to/wordpress \
  --require-runtime-ready

python scripts/probe_ref001_acf_runtime.py \
  --wp-path /path/to/wordpress \
  --require-ready
```

These probes intentionally answer different questions:

- `probe_wordpress_acf_runtime.py` verifies the supplied runtime can bootstrap WordPress/ACF, identifies the active theme and ACF edition/version, and confirms an administrator exists for a later browser smoke.
- `probe_ref001_acf_runtime.py` verifies the REF-001 deterministic bundle can use the installed ACF JSON CLI path and, only with explicit disposable-runtime acknowledgement, can perform the separate CLI import/readback smoke.

Neither probe upgrades `admin_ui_smoke_executed` to true. Browser `ADMIN_UI_SMOKE_PASS` remains a separate evidence step.

## Required next step for `ADMIN_UI_SMOKE_PASS`

When the actual target runtime and credentials are available, the browser smoke must use that target and the deterministic import bundle for the run. At minimum, evidence must show:

1. successful administrator login
2. ACF field-group import tooling is reachable in the installed ACF version
3. the exact intended import bundle is selected
4. the import action completes successfully
5. the expected field groups exist afterward
6. the Page/template/editor path that consumes those groups still loads without a runtime error

Do not store passwords, session cookies, authorization headers, or other credentials in Git evidence.

If the target company/browser policy requires multiple browser environments, the ADMIN_UI smoke follows that policy rather than inventing a repository-wide browser requirement.

## REF-001 boundary

Until an actual production WordPress target is connected, REF-001 remains a learning/benchmark fixture. This probe makes the missing dependency executable and explicit, but it does not choose:

- the production theme repository
- target branch/starting commit
- Classic vs Hybrid theme classification
- production Page template path
- WordPress version
- ACF version/edition
- existing Local JSON architecture
- global Header/Footer/CTA ownership

Those values must come from the connected target codebase/company policy/runtime evidence.

## Why not auto-install ACF here?

A readiness probe should describe the supplied target, not silently mutate it into a different environment. Installing or activating a plugin just to make the probe green would erase the very evidence the probe is intended to capture.

A disposable integration environment may install dependencies explicitly as part of its own documented setup, but its result must be labeled as a disposable integration smoke rather than production-target proof.
