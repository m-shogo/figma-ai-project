# News archive type resync — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP archive `1399:14225`
- PC archive `413:2191`
- PC pager instance `1619:9557` / component `1137:4996`
- SP pager `2189:10281`

Geometry contract stays in `2026-08-29-news-archive-master.md`. This pass is type only.

Owner remains `module_newsList-01.css`. PHP / ACF / taxonomy / TOP `top_news.css` were not changed.

## Finding

LIVE type is Zen Kaku Gothic New throughout the archive list:

- tabs: Medium 14
- date: Medium 14
- category label: Medium 13
- title: Medium 16
- pager numbers: Medium 16, current Bold 16

CSS already had the sizes, but families fell through to Noto (`--font-sansSerif-ja`) and pager numbers used Roboto (`--font-sansSerif-en`). Date/label/title weights were Regular 400 except PC label.

## Fix

Module-level `--font-zen-kaku-gothic` plus Medium 500 (current pager Bold 700 stays). Global body Noto tokens were not replaced.

## Lesson

Archive pager digits are Japanese Zen Kaku, not English Roboto. A `--font-sansSerif-en` token on page numbers is not justified by the current specimen.
