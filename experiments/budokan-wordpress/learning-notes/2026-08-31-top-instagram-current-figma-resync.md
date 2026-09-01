# TOP Instagram type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1603:7173`
- SP `1360:9389`

Owner remains `_top-instagram.php` + `css/project/top_instagram.css`. PHP was not changed.

## Finding

SP title is Zen Kaku Medium 22; `Instagram` is Roboto Regular 14; lead is Zen Kaku Regular 15. PC title/label are Zen Old Mincho Medium 24/16 with the existing 28px octagon. Heading/lead still used Noto.

## Fix

Zen tokens on the existing owner. Thumbnail grid stays.

## CI host

Instagram has no dedicated workflow. Type asserts ride on the existing TOP About front-page runtime.
