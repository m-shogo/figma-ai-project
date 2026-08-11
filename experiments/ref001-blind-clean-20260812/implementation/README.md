# REF-001 Blind Clean Replay — implementation navigation

This directory is the human entry point for the isolated WordPress-compatible REF-001 benchmark implementation. It does **not** claim the unresolved production WordPress theme/route/runtime.

## Start here

- Theme / section ownership map: [`theme/README.md`](theme/README.md)
- Importable ACF field group: [`acf-export.json`](acf-export.json)
- Page integration: [`theme/page-ref001-clean.php`](theme/page-ref001-clean.php)
- Shared/global bootstrap: [`theme/functions.php`](theme/functions.php)
- FIRST PASS CSS: [`theme/style.css`](theme/style.css)
- Runtime continuity owner: [`theme/responsive-continuity.css`](theme/responsive-continuity.css)
- Post-freeze visual repair only: [`theme/visual-repair.css`](theme/visual-repair.css)

## Editing rule

For section-local content or layout changes, locate the section in `theme/README.md` first. Shared CTA changes belong to its single shared partial; the fixed seven-course identity/order/color domain belongs to `theme/inc/course-domain.php`; page text/image candidates belong to the fixed ACF schema. URLs or interactions without Figma evidence remain unresolved rather than being invented.

The immutable FIRST PASS code SHA and post-freeze repair evidence are recorded in `../run.yaml` and `../run.first-pass.json`.
