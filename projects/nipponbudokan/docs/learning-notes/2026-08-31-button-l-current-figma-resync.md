# Gutenberg button_L resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP instance `1468:7314`
- PC instance `1296:8808`

Owner remains `css/blocks/wp-block-buttonLink-style.css`. Outline / `.small` / hover were not changed. `parts.php` was not changed.

## Finding

60px height, 15px/500, padding 16/20, 26px octagon, and the primary 26×2 bottom line already matched. Remaining misses:

- label inherited Noto Sans JP from `body`
- icon/text `gap` was 12px; current Figma Frame 805 places text at x=34 after a 26px arrow → 8px

## Cause

Parts labels moved to Zen Kaku Gothic New Medium. The previous file’s 12px gap was kept after the file-key change.

## Fix

Set `font-family: var(--font-zen-kaku-gothic)` on `.wp-block-button__link` and `gap: 8px`.

## Lesson

After a Figma file-key change, re-read the button instance descendants (arrow box + label x) rather than treating “60×15 already matches” as visual parity. The inner gap is not the outer 12px flex gap of the Parts group.
