# PC hamburger overlay resync — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` PC open menu `2096:6235` / panel `2183:9964`. Owner is `_header.php` + `css/layout/global_navigation.css` + `global_header.css`. Closed PC GNavi `2209:9850` and hover mega stay. Overlay EN `2182:9959` is not duplicated; `.gh_lang` already owns language.

## Finding

LIVE PC hamburger overlay is a two-column panel under the 100px header: left utility (Kaku Medium 14 / octagon / 1 col / gap 24) + SNS 40px / search 300×50; right accordion 375px, L2 Mincho SemiBold 18. Theme hid submenu / SNS / search at `min-width:768px` and unset overlay `clip-path`, so the PC hamburger was a no-op.

## Cause

Header resync measured the closed 1380×100 bar. SP overlay chrome was added later. PC `body._open-menu` was written to preserve the always-visible GNavi + hover mega, which made the canonical PC overlay specimen look like a non-owner.

## Fix

`body._open-menu` at 768+ turns `.global_navigation` into the 888px right overlay and restores accordion Disclosure (not the Figma expanded tree). SNS 40/14 on PC overlay only; SP stays 48/16. Hover mega remains for the closed bar.

## Lesson

A closed Header with carets is not proof that hamburger is SP-only. Re-read the PC `menu` frame on the same page before treating `_open-menu` as a mobile-only clip.
