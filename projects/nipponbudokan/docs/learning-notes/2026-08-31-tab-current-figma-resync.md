# Tab resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP tab `1399:19390` (327×68, 3×2 grid)
- PC tab `1663:5661` (120×48, gap 12)

Owner remains `css/module/module_tab.css`. ACF tab container/panel PHP was not changed.

## Finding

SP/PC geometry already matched the 2026-08-29 master. Label type did not: LIVE is Zen Kaku Gothic New Medium 14 / 500. Theme inherited body Noto.

## Cause

Tab CSS set size/weight/tracking but not the family token after Zen fonts were added to the Theme.

## Fix

`.tab-button` uses `--font-zen-kaku-gothic`. Geometry, active `#333`, and SP grid / PC 120×48 wrap are unchanged.

## Lesson

Once a shared primitive's geometry is frozen, re-read label fills and family on the current file. A Noto body fallback is not the Parts label.
