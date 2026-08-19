# REF-001 x cku: what this integration actually touches

Plain-language version of `APPLY.md`, for a quick "what changes on the real
site" read.

## New files only (12 new files, all additive, nothing deleted or overwritten)

- 1 new page template: `page-ref001.php`
- 1 new helper/config file: `functions/ref001-integration.php`
- 9 new section files: `template-parts/ref001/*.php` (7 static, 2 ACF-aware:
  Student Voice and Swiper/Messages)
- 4 new small data files: `inc/*.php` (fixture copy, asset map, course data,
  Figma node-id map -- used for fallback content and diagnostics only)
- 1 new self-contained assets folder: `assets-ref001/` (REF-001's already
  Human-Reviewed CSS/JS/icons/images, untouched bytes)
- 2 new ACF PRO field-group definitions: `acf-json/group_ref001_student_voice.json`,
  `acf-json/group_ref001_swiper.json`

## Existing-file touch points: exactly one line, in one file

`cku/functions.php` gets one additive `require_once` line added near its
existing enqueue-loader lines. Nothing else in that file, or in any other
existing `cku` file (`header.php`, `footer.php`, `front-page.php`, `page.php`,
any SCSS file, any other template), is edited, reordered, or removed.

## What this does NOT touch

- cku's real front page, header, footer, staff pages, library pages, news
  pages, forms -- all untouched.
- cku's SCSS build/pipeline -- untouched; REF-001's CSS ships as its own
  already-compiled file, loaded only on the new page template.
- cku's global Swiper enqueue -- reused as-is; no second Swiper library is
  added.

## Where it renders

Only on a WordPress Page whose template is set to
"REF-001 千葉経済大学 Fidelity Page" (`page-ref001.php`). Every other URL on
the real site is unaffected.
