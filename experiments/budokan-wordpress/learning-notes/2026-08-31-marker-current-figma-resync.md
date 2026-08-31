# Gutenberg marker highlight resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP specimen `1399:18739`
- marker paint `1399:18740` (`#ca9957` / opacity 30% / 8px / y=17 on 17px/lh 1.6 copy)

Owner remains `css/blocks/wp-block-text-style.css`. Gutenberg underline still ships as `span[style*='text-decoration: underline']`. `parts.php` was not changed. Global `body` was not changed.

PC Parts shows the plain paragraph (`1157:8182`) without a separate marker specimen; the same inline treatment applies on both bands.

## Finding

Theme was painting a 1px `text-decoration` underline. Current Figma is a gold marker bar behind the glyphs, not a standard underline.

## Cause

The active rule was the “thin underline” fallback. A thicker gold gradient existed only as a commented draft and used `--color-primary` at 40%, which is not the current paint.

## Fix

Replace the 1px underline with a per-line background tile: transparent for 1em, then `color-mix(accent 30%, transparent)` for 8px, tiled at `1.6em`. No `position: absolute`.

## Lesson

A Parts layer named 下線 can still be a marker overlay. Read the paint node (`1399:18740`) rather than mapping the Japanese label to CSS `text-decoration`.
