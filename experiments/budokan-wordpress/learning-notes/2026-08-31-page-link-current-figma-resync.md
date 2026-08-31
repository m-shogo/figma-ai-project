# Page-link resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP item `1399:18936`
- PC master `1198:4686`

Owner remains `css/blocks/wp-block-inPageLink-style.css`. `acf/blocks/inPageLink.php` was not changed. SP 58 / PC 56 geometry, 12/16 padding, 10px gap, and the dark octagon were not changed.

## Finding

Label is Zen Kaku Gothic New Medium 16. Theme already had 16/500; the anchor had no family and inherited Noto from `body`.

## Cause

Parts labels moved to Zen Kaku with the design-adjustment file. The page-link module never set a family.

## Fix

Set `font-family: var(--font-zen-kaku-gothic)` on `.module_inPageLink-01 .inPageLink a`.

## Lesson

A page-link can already match height/padding/icon and still miss visual parity because the label inherits `body`. After a Figma file-key change, re-read the label text node, not only the 26px octagon.
