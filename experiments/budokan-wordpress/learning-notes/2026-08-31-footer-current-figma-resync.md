# Shared Footer resync to current Figma — 2026-08-31

## Scope

Current visual authority `fKYDn9ikpJk1nW7IWFtaUx` was re-read for Footer in this run:

- PC `2106:9471` `footer_subpage` (1380×372)
- SP `2189:10106` `footer-sp` (375×347)

Theme ownership remains `_footer.php` + `global_footer.css`. No ACF/Form/`parts.php` change.

## Finding

The previous SP Footer was a dark `#404040` bar with inverted logo, grayscale map, hidden SNS, and a red Page Top. Current Figma SP is a **white** subpage footer: dark wordmark, no map, SNS 48px, gold Page Top, copyright 12px on `#2c3036`.

PC was already close (white, two link columns, gold Page Top). Remaining PC gaps were Zen Kaku Gothic New on body copy and tokenizing copyright to `#2c3036` / `#e6e6e6`.

## Cause

Old HEADER_FOOTER_NOTES treated `560:2524` dark mapped footer as current SP authority. That node family is from the superseded file. Live `footer-sp` `2189:10106` is the current SP master.

## Fix

Mobile-first white footer, show SNS at 48px, hide map globally, gold Page Top on SP, dark wordmark on SP. PC only adds the two-column links, 40px SNS, 60px copyright bar, and 170px Page Top label.

Sticky お問い合わせ/アクセス is not in `footer-sp`; it stays as the existing SP subpage overlay until a current full-page frame shows it removed.

## Lesson

Do not keep a dark mapped SP Footer because an older named frame had one. Re-read the current `footer-sp` / `footer_subpage` components after a file-key change.
