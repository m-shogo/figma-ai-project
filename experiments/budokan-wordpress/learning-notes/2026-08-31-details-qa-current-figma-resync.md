# Gutenberg details QA variant resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP QA accordion `1399:18857`
- PC QA accordion `1157:8324`

Owner remains `css/blocks/wp-block-details-style.css`. Normal accordion type/geometry from #304/#305 is unchanged. `parts.php` / `field.php` were not changed.

## Finding

Q/A is a hugged Roboto Medium 24 / gold glyph with a 16px gap, not a 32px slot. SP QA title is `pl 20 / py 20`. PC QA title is `pl 32 / py 24` and content `p 32`. The QA minus bar is `#ca9957`, while the normal accordion plus/minus stays `#bf3e2b`.

## Cause

The previous master treated Q/A as a 32px alignment box and reused the normal plus color. Current Parts hug the glyph and paint the QA control gold.

## Fix

`._qa` `::before` width `auto`, SP title padding-block 20, `align-items: center`, QA plus/minus `--color-accent`. Remove the PC `width: 32px` override.

## Lesson

A FAQ accordion is not the same chrome as the normal details family. Re-read the Q glyph box and the minus paint on the QA specimen rather than copying the 32px slot and primary-red control from the previous file.

Columns / background boxes (`1157:8200`, `1399:18742`) already match gap 24 and inset 30/32, so they were not part of this PR.
