# Navigation Large resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP `ナビゲーション` `1399:18870` / card title `1399:18888`
- PC `ナビゲーション` `1157:8339` / card title `1300:9409`

Owner remains `css/blocks/wp-block-navigation-style.css` → `.module_navigation.--large`. `navigationLarge.php` / ACF JSON / `--small` were not changed.

## Finding

Card geometry already matched: SP one column gap 24, PC three columns gap 40, content `24×20` / gap 16, copy 15 / 400 / lh 1.6. Title type did not. LIVE title is Zen Old Mincho SemiBold 18 / 600 on **both** SP and PC. Copy is Zen Kaku Regular 15.

## Cause

The previous master treated SP as semantic sans Medium 500 and PC as Noto Serif, because Zen fonts were not yet a Theme token. Current Parts uses Mincho SemiBold at both breakpoints, and `--font-zen-old-mincho` / `--font-zen-kaku-gothic` now exist.

## Fix

`--large` title uses `--font-zen-old-mincho` / 600 on all breakpoints. Copy uses `--font-zen-kaku-gothic`. The PC-only serif override was removed.

## Lesson

Do not keep a SP sans / PC serif split after the live specimen has unified the title to Mincho SemiBold. Geometry can stay frozen while type tokens catch up.
