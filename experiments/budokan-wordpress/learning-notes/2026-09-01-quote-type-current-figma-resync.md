# Quote type on current Figma — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` PC Parts quote body `1157:8394` in group `1157:8388`.

Owner remains `css/blocks/wp-block-quote-style.css`. Geometry from 2026-08-29 stays. `parts.php` was not changed.

## Finding

LIVE body is Zen Kaku Gothic New Regular 17 / 400. Inner `p` already received that family from the paragraph master. The quote wrapper itself had no family, so a cite or unwrapped text node still inherited body Noto.

## Fix

Set `font-family: var(--font-zen-kaku-gothic)` on `.wp-block-quote`. Size/line-height stay on the paragraph master.

## Lesson

Quote rails can match while quote copy still falls through to `body`. Re-read the Parts body text node after a file-key change; do not treat “inner p is already Kaku” as enough if the wrapper can host other text.
