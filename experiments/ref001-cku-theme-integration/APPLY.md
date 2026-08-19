# Applying this overlay to the supplied `cku` theme

This directory does not contain the supplied `cku` theme itself (see
`theme-intake.yaml` for why: a client-supplied production theme is never
committed to this repository, per
`experiments/wordpress-acf-pro-standalone-lp/README.md`). It contains only
the **new, additive files** this integration contributes on top of that
theme, laid out at the exact paths they occupy inside `cku/` once applied.

## What gets added (all brand-new files/dirs; nothing in `cku/` is deleted)

```
cku/
├── page-ref001.php                          [NEW] page template
├── functions/
│   └── ref001-integration.php               [NEW] helpers + conditional enqueue
├── template-parts/ref001/                   [NEW] 9 section partials
│   ├── main-visual.php / reason.php / education.php / shared-cta.php
│   ├── student-voice.php   <- ACF-aware (repeater: ref001_student_voices)
│   ├── messages.php        <- ACF-aware (repeater: ref001_swiper_slides)
│   └── courses.php / links.php / cta-value.php
├── inc/                                     [NEW] fixture/data helpers
│   ├── fixture-content.php / asset-map.php / course-domain.php / figma-authority.php
├── assets-ref001/                           [NEW] REF-001's own frozen CSS/JS/images
│   └── assets/{css,js,icons,mv,images}/...
└── acf-json/                                [NEW] ACF PRO Local JSON (auto-loaded by ACF)
    ├── group_ref001_student_voice.json
    └── group_ref001_swiper.json
```

## The one existing-file touch-point

`cku/functions.php` needs exactly one additive line so the new helpers/enqueue
load, following the same pattern already used there for
`functions/EnqueueScript.php` / `functions/EnqueueStyle.php`:

```php
require_once get_theme_file_path('/functions/ref001-integration.php');
```

Add it anywhere after the existing `get_template_part('functions/EnqueueStyle');`
/ `get_template_part('functions/EnqueueScript');` lines (functions.php:408-419
in the observed export) so `EnqueueStyle`/`EnqueueScript` classes already
exist when `ref001-integration.php` references them. No other line in
`functions.php` is touched, removed, or reordered.

`cku/acf-json/` did not exist in the observed export (no prior Local JSON
convention); ACF PRO auto-discovers any `acf-json/` directory at the theme
root, so simply having this folder present is sufficient -- no additional
`acf_json_save_point`/`acf_json_load_point` filter wiring is required, but if
the target WordPress environment customizes those filters elsewhere, point
them at (or additionally include) this directory.

## Mechanical steps

1. Copy this directory's contents (everything except `theme-intake.yaml`,
   `APPLY.md`, `DEPLOY.md`, `ref001-section-geometry-evidence.md`, and
   `scripts/`) into the root of the real `cku` theme, i.e.
   `rsync -a overlay/ /path/to/cku/`.
2. Add the one `require_once` line to `cku/functions.php` as shown above.
3. Activate `cku`, create/point a WordPress Page at the
   "REF-001 千葉経済大学 Fidelity Page" template.
4. Activate ACF PRO; the two field groups in `cku/acf-json/` are picked up
   automatically. Populate `ref001_student_voices` / `ref001_swiper_slides`
   repeaters, or leave them empty -- the page renders REF-001's original
   Human-Reviewed fixture content either way (see
   `functions/ref001-integration.php`'s `ref001_repeater_or_fixture()`).

`scripts/apply-overlay.sh` in this directory automates step 1 for local QA
against the `experiments/wordpress-acf-pro-standalone-lp` runtime harness's
`theme-dropin/` mount point.
