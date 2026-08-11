# REF-001 ACF artifacts

These files are learning artifacts for the REF-001 WordPress + ACF experiment. They are not a frozen production CMS contract.

## Recommended import file

Use:

```text
acf-import-bundle.json
```

in **ACF → Tools → Import Field Groups** when you want the currently scoped REF-001 field groups in one import.

The bundle currently contains exactly two independent field groups:

1. `group_ref001_top_page` — MV + Reason + Education baseline
2. `group_ref001_courses` — seven fixed Course identities with page-editable description/recommendation copy

The generated bundle contains **56 fields total** (`35 + 21`). The two groups intentionally remain separate inside the JSON array; bundling them for import does not merge their ownership models.

## Source authority

Do not hand-edit `acf-import-bundle.json`.

Its source exports are:

- `acf-export.json`
- `courses.acf-export.json`

Regenerate the bundle with:

```bash
python scripts/build_ref001_acf_import_bundle.py
```

Verify the committed bundle has no drift with:

```bash
python scripts/build_ref001_acf_import_bundle.py --check
python scripts/validate_acf_export.py
```

CI runs both checks.

## Intentionally not included

The full visual fixture contains more sections than this CMS bundle. Do not infer missing ACF fields from visual completeness.

Not included until stronger target-theme/product evidence exists:

- Header/Footer/global CTA ownership
- Student Voice disclosure behavior or invented expanded content for items 2/3
- Messages records 2–4 or carousel configuration
- Course URLs, icons, or shared Course/CPT ownership
- target-theme-specific Local JSON paths or field-group conventions

When the real WordPress target repository is connected, reconcile these learning groups against its existing CPTs, taxonomies, options, reusable blocks, template conventions, ACF tier/version, and Local JSON setup before production freeze.
