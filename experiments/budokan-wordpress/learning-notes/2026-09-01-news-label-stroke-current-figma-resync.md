# News archive category label stroke — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC label component `1137:4997` in archive `413:2191`: 80×23 / radius 2 / stroke `#333`
- SP instances in `1399:14225` (`I1455:5827;1363:11398` etc.): same 80×23 / `#333`

Owner remains `module_newsList-01.css`. PHP / ACF / taxonomy unchanged. TOP `top_news.css` already overrides label color and stays.

## Finding

LIVE News labels are `#333` outline chips. Theme used `--color-line` (`#d7d4d4`) and `min-height: 24px`. News single title-band labels already used `--color-text` / 23px.

## Fix

Archive `.news_item_label` uses `--color-text` stroke and `min-height: 23px`. Do not copy Event card `#e7e7e7` chips onto News; they are a different specimen.

## Lesson

`--color-line` is the row/separator token, not the News category chip. Read the label component stroke before assuming list rules share the article hairline.
