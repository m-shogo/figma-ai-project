# SP hamburger SNS resync — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` SP open menu `2169:10224` in `2169:10017`. Owner is `_header.php` + `css/layout/global_navigation.css`. Footer SNS `2189:10106` stays the footer owner. EN in the Figma menu (`2169:10231`) is not duplicated; it already lives on `.gh_lang`.

## Finding

LIVE menu SNS is three 48px `#333` circles, gap 24, white FA Brands Regular 16 (YouTube / Instagram / X). The overlay had utility + search but no SNS. Footer already had the same primitive.

## Cause

Header resync measured the 60px bar and GNavi labels. The overlay chrome after the accordion (utility / SNS / search) was read later, and SNS was skipped because footer already showed the icons.

## Fix

Insert `.gn_sns` between `.gn_subMenu` and `.gn_search` (Figma order: utility → SNS → search; EN stays in the header bar). Same 48/24/16 tokens as footer-sp. Hide on `min-width: 768px` with the rest of the overlay.

## Lesson

Footer SNS is not a substitute for menu SNS. Same primitive, different owner. A gold EN chip inside the overlay is not a second language control when the header bar already has `.gh_lang`.
