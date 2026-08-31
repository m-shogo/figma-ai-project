# TOP Guide type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1603:7370`
- SP `1455:5672`

Owner remains `_top-guide.php` + `css/project/top_guide.css`. PHP and the SP purpose sticky were not changed.

## Finding

Geometry already matched. Type still inherited Noto / Crimson.

LIVE:

- SP JA heading: Zen Kaku Medium 30. PC JA heading: Zen Old Mincho Medium 32.
- SP `User Guide`: Roboto Regular 14 / accent. PC: Zen Old Mincho Medium 22.
- SP card titles: Zen Kaku Medium 18. PC: Zen Old Mincho Medium 20.
- Lead/body: Zen Kaku Regular (SP 16/15, PC 16/16).

## Cause

`--font-serif-ja` / `--font-sansSerif-ja` are still Noto. Guide copied those tokens even though LIVE is Zen, and SP/PC heading+title families differ.

## Fix

Module Zen tokens. SP/PC family split on heading and card title. Roboto on SP EN. Geometry QA kept.

## Deferred

SP sticky `1360:9370` is now 64px / Zen Old Mincho 18 / `#4e5055`. The 56px / 16px / `#333` contract is from an older file. Separate PR; do not mix with this type pass.

## Lesson

The same SP-Kaku / PC-Mincho heading split appears on Events and Guide. Sticky derivatives can drift independently of the section master after a file-key change.
