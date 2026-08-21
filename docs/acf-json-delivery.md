# ACF JSON Delivery Contract

When an Implementation Profile resolves to WordPress + ACF, field configuration is part of the implementation deliverable. PHP templates without portable field-group configuration are incomplete.

## Upstream-first rule

Do not build or maintain a custom ACF import/export engine when the installed ACF/WP-CLI versions already provide one.

For **ACF 6.8+ and WP-CLI 2.0+**, prefer the official commands when the Project contract permits:

```bash
wp acf json status
wp acf json sync
wp acf json import ./acf-export.json
wp acf json export --type=field-group
```

These commands own ACF Local JSON import/export/synchronization behavior. Project scripts may orchestrate them and capture evidence, but should not duplicate their internal behavior.

Older ACF versions, restricted hosting, or projects without WP-CLI may use the accepted fallback methods below. Record the capability/version reason rather than silently selecting a custom path.

## Required portable bundle

Default required artifact:

```text
acf-export.json
```

Contract:

- `.json` extension
- top-level export array
- at least one ACF field group (`group_*`)
- stable unique field-group keys
- stable unique field keys (`field_*`), including nested Repeater/Flexible Content fields
- field-group title
- fields array
- field-group location rules
- committed/copy-preserved as experiment evidence

Validate before completion:

```bash
python scripts/validate_acf_export.py path/to/acf-export.json
```

The validator checks portable structure and evidence expectations. **It does not replace ACF's own import/export/sync implementation and does not replace a real ACF import/sync smoke.**

## Local JSON

If the existing project uses ACF Local JSON, preserve that architecture instead of forcing only an export bundle.

Default ACF Local JSON directory is commonly:

```text
<theme>/acf-json/
```

A project may customize the save/load path. Follow existing filters and repository conventions.

When Local JSON is required, delivery should contain both when the Project contract needs both operational forms:

```text
acf-export.json      # explicit portable/importable bundle
acf-json/*.json      # repository-native sync/version-control representation
```

Do not generate duplicate formats merely to satisfy a universal checklist when the target project's established deployment flow requires only one. The Implementation Profile resolves the deliverables.

## Import / sync smoke

A completed ACF run needs evidence that the field configuration can actually be consumed by WordPress.

Preferred resolution:

```text
Existing project ACF workflow
→ official `wp acf json` when ACF 6.8+ / WP-CLI 2.0+ supports it
→ Local JSON sync
→ Admin UI import
→ smallest project-specific fallback
```

Accepted methods are declared in the frozen Implementation Profile and may include:

- `WP_CLI_IMPORT` — `wp acf json import <file>` when supported
- `WP_CLI_SYNC` — `wp acf json sync` when supported
- `LOCAL_JSON_SYNC` — ACF Local JSON sync workflow
- `ADMIN_UI` — ACF Tools import in WordPress admin
- `OTHER` — only with explicit evidence explaining why official/project-native paths were insufficient

For database-mutating CLI sync, use available status/dry-run/safety mechanisms first when applicable and run against disposable/test WordPress unless the Project contract explicitly authorizes another environment.

Record in the run:

```yaml
deliverables:
  acf:
    export_json:
      target_repo_path: acf-export.json
      evidence_json_path: experiments/EXP-.../artifacts/acf-export.json
      validation_status: PASS
    import_smoke:
      status: PASS
      method: WP_CLI_IMPORT
      evidence:
        - "ACF 6.8+ / WP-CLI 2.0+ official wp acf json import consumed the portable bundle in disposable WordPress"
```

## Key stability

Do not regenerate group/field keys casually between Repair or Clean Replay.

Stable keys matter because WordPress/ACF uses those identities to match field definitions and previously stored values. If keys intentionally change, record it as a migration, not a cosmetic implementation edit.

## Fields vs design values

Do not turn every Figma number into ACF.

Good field candidates:

- copy
- images/media
- links
- repeatable content rows
- editor-owned labels
- explicit visibility/configuration controls

Usually code/design-system owned:

- breakpoint values
- spacing tokens
- typography scale
- decorative geometry
- gradient stop positions
- animation timing
- DOM structure
- accessibility behavior

## ACF Blocks

For ACF Blocks, the delivery package may additionally include:

- `block.json`
- render template/callback
- block-scoped CSS/JS
- ACF field groups in the same portable JSON contract
- editor preview QA evidence

The presence of `block.json` does not remove the requirement to deliver the ACF field configuration when fields are used.

## Completion gate

`scripts/validate_run_deliverables.py` checks completed runs. If the pinned Implementation Profile requires ACF, completion fails when:

- required export JSON evidence is missing
- export JSON structure is invalid
- JSON validation status is not `PASS`
- required import/sync smoke did not pass
- chosen smoke method is not allowed by the frozen profile
- required Local JSON evidence is missing

This prevents the common handoff failure where templates are complete but the recipient has to rebuild all ACF fields manually, while avoiding a second custom ACF import/export engine.

External integration/retirement policy: `docs/frontend-external-integration-matrix.md`.