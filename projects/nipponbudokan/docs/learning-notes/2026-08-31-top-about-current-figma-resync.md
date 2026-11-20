# TOP About type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1603:7273`
- SP `1392:11708`

Owner remains `_top-about.php` + `css/project/top_about.css`. PHP, media, and destination URLs were not changed.

## Finding

Geometry (SP 30 / 335 panel / 240×320 cards; PC vertical heading / 220+60 rail / 3:4) already matched. Type still inherited Noto / Crimson, and PC `About us` was a 13px `#d5e3ec` chip.

LIVE:

- SP JA: Zen Kaku Medium 30. EN: Roboto Regular 14.
- PC JA: Zen Old Mincho Medium 36 vertical. EN: Zen Old Mincho Medium 30 over a 72px `#b4c5d9` octagon, not inside it.
- Lead/CTA: Zen Kaku 16. SP overlay 14 Regular; PC overlay 16 Regular.
- Card labels: SP Kaku 16; PC Mincho SemiBold 18.

## Cause

The previous About pass used whole-frame screenshots, so the PC EN octagon was treated as a text chip. Child-node measurement shows a separate 72px polygon plus rotated 30px Mincho.

## Fix

Zen tokens and LIVE sizes on the existing owner. PC EN clip-path removed; 72px octagon is a decorative `::before` overlay.

## Lesson

A screenshot of a vertical heading + octagon is not enough to decide that the English marker lives *inside* the octagon. Measure the instance and the text node separately.
