# Gutenberg table resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC header cell `1157:8286` / body cell `1157:8291`
- SP scroll specimen `1451:5690`

Owner remains `css/blocks/wp-block-table-style.css`. Row height 54, padding 15/30, stripe `#f2f2f2`, header `#424242`, and SP 5px scroll were not changed.

## Finding

Cell copy is Zen Kaku Gothic New Regular 15. Theme already had size, padding, and colors; `th`/`td` had no family and inherited Noto from `body`.

## Cause

Parts table labels moved to Zen Kaku with the design-adjustment file. The table module never set a family.

## Fix

Set `font-family: var(--font-zen-kaku-gothic)` on the existing cell selector.

## Lesson

A table can already be 54px / 15px / centered and still miss visual parity because cell copy inherits `body`. After a Figma file-key change, re-read a header cell and a body cell, not only the 960×54 bounding box.
