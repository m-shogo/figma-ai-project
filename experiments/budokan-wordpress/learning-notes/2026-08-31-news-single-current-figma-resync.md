# News single type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP article title `1451:5621` in `SP_post` `1451:5197`
- PC article title `1235:6639` in `post` `1235:6361`

Owner remains `module_titleSingle.css`. PHP / ACF / featured-image contract / pager / breadcrumb geometry were not changed.

## Finding

The 2026-08-29 note locked SP to Zen Kaku Medium 22 and PC to Mincho Bold 32. LIVE is Zen Old Mincho Bold on both breakpoints: SP 24 / PC 28, line-height 1.4, tracking 5%. Date and category label are Zen Kaku Medium 14 / 13. Caption is Kaku Medium (SP 12 / PC 14).

Hardcoded `"Zen Kaku Gothic New"` on SP and `"Zen Old Mincho"` 32px on PC were stale. Date/label/caption still inherited body Noto.

## Fix

Title uses `--font-zen-old-mincho` Bold 24/28. Date, label, and featured caption name `--font-zen-kaku-gothic`. Gutenberg body/headings stay on their existing shared masters.

## Lesson

The News single title is a page-title-family Mincho heading, not an archive-list Kaku title. Re-read the article title node itself; do not keep the archive row's family on the detail heading.
