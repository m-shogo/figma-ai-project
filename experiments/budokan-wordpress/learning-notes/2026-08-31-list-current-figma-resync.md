# Gutenberg list resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP unordered body `1399:18762` / item text `2194:5169`
- PC unordered `1157:8221`

Owner remains `css/blocks/wp-block-list-style.css`. Global `body` / `--font-sansSerif-ja` were not changed.

## Finding

Item gap 16, gold 6×6 bullet, nested 12/8, ordered rail 26 / text x=36, and annotation `※` already matched. Remaining misses:

- list items inherited Noto Sans JP from `body`
- SP unordered `padding-left` was 21px; current Figma text inset is 18px on both bands (6px bullet + 12px gap)

## Cause

Parts body copy moved to Zen Kaku Gothic New. The list module never set a family, and the SP-only 21px inset was a leftover from the previous file.

## Fix

Set `font-family: var(--font-zen-kaku-gothic)` on list items / ordered markers / annotation `※`, and use 18px unordered inset on SP as well as PC.

## Lesson

A list can already have the right bullet and gap and still miss visual parity because item copy inherits `body`. After a Figma file-key change, re-read the Parts list node rather than treating “gold bullet already matches” as done.
