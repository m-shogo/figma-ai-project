# ACF JSON Delivery Contract

When an Implementation Profile resolves to WordPress + ACF, field configuration is part of the implementation deliverable. PHP templates without portable field-group configuration are incomplete.

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

The validator checks portable structure. It does not replace a real ACF import/sync smoke.

## Local JSON

If the existing project uses ACF Local JSON, preserve that architecture instead of forcing only an export bundle.

Default ACF Local JSON directory is commonly:

```text
<theme>/acf-json/
```

A project may customize the save/load path. Follow existing filters and repository conventions.

When Local JSON is required, delivery should contain both:

```text
acf-export.json      # explicit portable/importable bundle
acf-json/*.json      # repository-native sync/version-control representation
```

The two artifacts serve different operational needs and should not be conflated.

## Import / sync smoke

A completed ACF run needs evidence that the field configuration can actually be consumed by WordPress.

Accepted methods are declared in the frozen Implementation Profile and may include:

- `ADMIN_UI` — ACF Tools import in WordPress admin
- `WP_CLI_IMPORT` — `wp acf json import <file>` when the installed ACF version/tooling supports it
- `LOCAL_JSON_SYNC` — ACF Local JSON sync workflow
- `WP_CLI_SYNC` — `wp acf json sync` when supported
- `OTHER` — only with explicit evidence

For database-mutating CLI sync, use the available dry-run capability first when applicable.

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
      method: ADMIN_UI
      evidence:
        - "Imported field group Hero in disposable/test WordPress environment"
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

- export JSON evidence is missing
- export JSON structure is invalid
- JSON validation status is not `PASS`
- required import/sync smoke did not pass
- chosen smoke method is not allowed by the frozen profile
- required Local JSON evidence is missing

This prevents the common handoff failure where templates are complete but the recipient has to rebuild all ACF fields manually.
