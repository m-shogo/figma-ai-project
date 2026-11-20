# TOP vs subpage Footer — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- TOP PC `1901:13409` `footer` (1380×553, map 600×320)
- TOP SP `1360:9369` `footer-sp-top` (375×547, map 315×168)
- Subpage PC `2106:9471` `footer_subpage` (no map)
- Subpage SP `2189:10106` `footer-sp` (no map)

Owner remains `_footer.php` + `global_footer.css` + existing `footer-map.png`. Toggle is `get_footer( null, array( 'map' => true ) )` → `_footer.php` `map` → class `_hasMap`. `front-page.php` is the only caller that passes it. Do not use `body.home` or `is_front_page()` for the map. No new footer shell, ACF, or Form.

## Finding

Shared Footer resync hid `.gf_map` on every page so the subpage master would win. TOP Figma still has a map, and TOP PC stacks identity → links → SNS on the left with the map on the right. Subpage PC keeps identity+SNS left and links right.

## Cause

`footer_subpage` / `footer-sp` were treated as the only Footer authority. TOP sticky「目的から探す」was correctly kept out of the global footer; the map was incorrectly treated the same way.

## Fix

Keep map off by default. When `map` is true, show the existing map asset at SP 315×168 / PC 600×320 radius 5. `display: contents` on `_hasMap` `.gf_information` lets links sit above SNS on PC without a second footer template.

## Lesson

A global hide to protect the subpage master is not permission to blank the TOP specimen. Gate the map with an explicit `map` arg from the calling template (`get_footer`), not `body.home` or `is_front_page()`.
