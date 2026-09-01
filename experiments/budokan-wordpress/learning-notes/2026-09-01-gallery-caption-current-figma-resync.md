# Gallery caption reuses image caption master — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` Parts image+caption `1157:8217` (SP counterpart `1399:18759`): Zen Kaku Gothic New Medium 14 / `#333` / gap 20 / center.

Owner remains `css/blocks/wp-block-gallery-style.css`. `parts.php` was not changed. No new gallery specimen, ACF, or slider contract.

## Finding

Gallery figcaption still used `--color-primary` and `--wp-block-margin-small` (16px) after the image/media-text caption master moved to `#333` / 20px. Parts has no separate gallery caption; Gutenberg gallery captions are the same `.wp-element-caption` family as `wp-block-image`.

## Fix

Point gallery captions at the existing image caption master: Kaku Medium 14 / `#333` / gap 20. Keep 2-col/3-col geometry.

## Lesson

A missing Parts gallery caption is not permission to keep WordPress overlay red. If the Gutenberg caption element already has a master, reuse that owner instead of waiting for a second specimen.
