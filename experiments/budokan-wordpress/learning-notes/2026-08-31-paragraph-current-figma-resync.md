# Gutenberg paragraph resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP paragraph `1399:18729`
- PC paragraph `1157:8182`

Owner remains `css/blocks/wp-block-text-style.css`. Global `body` / `--font-sansSerif-ja` were not changed. Marker highlight `1399:18739` is a separate Parts item.

## Finding

Size 17px, weight 400, line-height 1.6, tracking 5%, color `#333` already matched. The remaining miss was family: Gutenberg `p` inherited Noto Sans JP from `normalize.css` `body`.

## Cause

Parts body copy moved to Zen Kaku Gothic New in the design-adjustment file. The paragraph module never set a family, so it kept the old global sans.

## Fix

Set `font-family: var(--font-zen-kaku-gothic)` on the existing Gutenberg paragraph selector only.

## Lesson

A paragraph can already have the right size and still be the wrong face because it inherits `body`. After a Figma file-key change, re-read the Parts `p` node rather than treating “17px already matches” as visual parity.
