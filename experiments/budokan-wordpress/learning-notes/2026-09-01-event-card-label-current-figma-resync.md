# Event card category chip — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` PC Event card `1630:9912`:

- Category chip `1630:9919`: Zen Kaku Medium 13 / `#333` / stroke `#e7e7e7` / radius 2 / height 20 / padding 10
- Status chip `1630:9917` `募集中`: same size, primary stroke/text. No Theme/ACF owner

Owner remains `module_newsCard-01.css`. PHP / ACF unchanged. SP Event archive remains UNDETERMINED.

## Finding

LIVE category is a gray outline chip. Theme still used primary red border/text leftover from the old news-card label.

## Fix

Restyle `.label` to the category chip. Do not invent `募集中`; a missing status field is not permission to recast `event_cat` as recruitment state.

## Lesson

Two chips side by side are not one token. Read which chip the existing taxonomy renderer owns before copying the red status specimen onto `.label`.
