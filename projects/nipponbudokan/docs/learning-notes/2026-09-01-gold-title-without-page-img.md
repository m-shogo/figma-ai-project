# Gold page title when `page_img` is empty — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- Gold bar: SP `page_title-sp` `1399:18544` / PC `page_title-pc` `2169:10270`
- Image title: SP `page_title-img-sp` `1465:6339` / PC `page_title-img-pc` `1450:5147`
- Parts catalog (gold, no photo): PC `1163:4245` / SP `1399:19144`

Owner remains `_visual.php` + `global_mainVisual.css`. Existing `page_img` ACF field is the opt-in. `parts.php` was not changed. No new ACF field.

## Finding

Local FULL PAGE of Parts showed the image-title shell (No image photo + white Mincho panel) while the current Parts frames use the gold bar. `_fixedPage` was attached to every inner `is_page()`, so the noimage fallback still switched presentation families.

## Cause

The 2026-08-29 note keyed `_fixedPage` off page identity (`is_page()`). After the gold bar became the shared default, that made every photo-less page look like `page_title-img` with a placeholder.

## Fix

`_fixedPage` opts in only when `page_img` is present. Pages without a photo, including Parts, keep the gold bar. Training Center and other pages with `page_img` stay on the image-title derivative. Runtime QA attaches `page_img` to `/budokan-fixed-page-qa/` and asserts gold on `/parts/`.

## Lesson

A presentation modifier should follow the feature it represents (`page_img`), not the WordPress page type. Default-off / opt-in matches the gold-bar master; page-name coupling would have forced Parts onto the image-title family.
