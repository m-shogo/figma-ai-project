# Image Page Title resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP `page_title-img-sp` `1465:6339` (375×273)
- PC `page_title-img-pc` `1450:5147` (1380×321)

Theme owner remains `_visual.php` + `._fixedPage` in `global_mainVisual.css`. No new ACF field.

## Finding

The previous SP contract was a dark `#333` panel, Noto Sans 22/500, 40% black overlay, 278px shell. Current SP is a white Mincho 24/700 panel overlapping a 240px photo with no overlay. PC already had the white 360×79 panel, but used `--font-serif-ja` (Noto Serif JP) instead of Zen Old Mincho.

## Cause

The 2026-08-29 fixed-page visual note locked the old file's SP dark-panel numbers. After the file-key change those numbers were stale.

## Fix

Keep one renderer. SP/PC title overlay uses negative margin in normal flow instead of `top:` absolute coordinates. Photo stays `page_img` / noimage. Paper texture is not hotlinked; `--color-secondary` is the durable fill.

## Lesson

`._fixedPage` is a presentation derivative of the shared visual, not a second data contract. After a Figma file-key change, re-read `page_title-img-sp` / `page_title-img-pc` instead of keeping the last dark-panel QA.
