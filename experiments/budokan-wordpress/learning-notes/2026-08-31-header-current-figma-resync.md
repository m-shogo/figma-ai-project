# Shared Header resync to current Figma — 2026-08-31

## Scope

Current visual authority is file `fKYDn9ikpJk1nW7IWFtaUx` (Human Authority 2026-08-31). Live re-read in this run:

- PC Header `2209:9850` (1380×100)
- SP open header-sp `2169:10018` (375×60)
- SP closed shell `446:10020`

Theme ownership remains `template-parts/_header.php` + `css/layout/global_header.css` + PC GNavi rules in `global_navigation.css`. No new shell, ACF, or menu contract.

## Finding

The previous Header notes were measured against the superseded file `w7SGVY63FuW6JpaQVKjxm2` and no longer match.

| item | old Theme / notes | current Figma |
| --- | --- | --- |
| PC logo rail | white full-width, padding 60/20 | 340px `#2c3036` rail, white wordmark, right pad 30 |
| PC GNavi | Noto Serif 15px, current = red text | Zen Old Mincho 16px/500, current = 600 + underline, text stays `#333` |
| SP actions | 52×60 | 60×60 flush |
| SP logo | mark 36×35, wordmark 137×32, pad 12 | mark 28.85×28, wordmark 106.4×25, pad 20 |

## Cause / first failed method

Treating “already QA’d Header” as still true after the Figma file key changed. Old HEADER_FOOTER_NOTES also said GNavi was “約15px” and that Zen fonts could wait; live `get_design_context` on `2209:9863` is 16px Zen Old Mincho.

## Fix

- SP-first: 60px actions, smaller logo, 20px left padding, Zen Kaku Gothic New on EN
- PC: dark 340px logo rail, remove full-width bottom border, GNavi 16px Zen Old Mincho, current/hover underline at y=81
- Load Zen Old Mincho / Zen Kaku Gothic New via the existing Google Fonts link; add Theme tokens without replacing `--font-serif-ja` globally

## Lesson

When Human Authority changes the Figma file key, do not reuse stored font/size/spacing from the previous file or from “already passed” Header QA. Re-read the current Header nodes before editing. Do not promote the old 15px GNavi note into the new file.
