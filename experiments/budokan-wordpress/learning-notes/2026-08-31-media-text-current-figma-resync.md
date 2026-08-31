# Media & Text resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP `テキスト+画像` `1399:18747` / caption `1399:18759` / zoom `1399:18757`
- PC `テキスト+画像` `1157:8205` / caption `1157:8217` / zoom `1157:8214`

Owners: `wp-block-media-text-style.css`, `wp-block-image-style.css`, `module_zoom-button.css`. `parts.php` was not changed.

Gallery layout (Training Center `1468:7234` / `1295:8324`) already matches the existing 2-col / 3-col / 3:2 master, so it was not part of this PR. The SP instance gap 15px stays page-rail evidence and was not promoted.

## Finding

Text/media gap 30 and SP text-first order were already correct. Caption was still primary-red 16px / lh 1.5 sans. LIVE caption is Zen Kaku Medium 14 / `#333` / lh 1.6 / tracking 5% / margin 20. Zoom on this specimen (and post images) is 50×50 `#333` at 70% opacity on both breakpoints; gallery keeps the 32px SP size.

## Cause

The previous caption contract used `--color-primary` and `--wp-block-margin-small` (16px). The layer name still says SP 16px, but current Auto Layout `itemSpacing` is 20 on both breakpoints. Generic zoom still used primary red after the gallery-only dark override.

## Fix

Caption type/color/gap 20 on image and media-text figcaption. Shared zoom tile fill `#333` / 70%. Gallery SP 32px override remains.

## Lesson

A caption layer name can lag the live Auto Layout gap. Read `itemSpacing` and the painted fill, not the leftover "SP 16px" annotation. Do not promote Training Center's 15px gallery gutter into the shared Gutenberg gallery master without a Parts gallery specimen.
