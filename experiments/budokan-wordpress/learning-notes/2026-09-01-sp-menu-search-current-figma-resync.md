# SP hamburger search field resync — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` SP open menu search `2169:10220` in `2169:10017`. Owner is `.gn_search` in `css/layout/global_navigation.css`, contextual on existing `module_search-01`. `search.php` / `404.php` keep the shared 40px primary module. PHP / Form were not changed.

## Finding

LIVE menu search is 300×50: white input with `#4e5055` stroke, 50×50 `#4e5055` submit, white FA Regular 13 zoom. Theme reused the archive search: 40px height, 86px primary-red button, visible `検索` label, 16px icon.

## Cause

`module_search-01` is shared with search results. Menu overlay copied that module without a contextual override after the file-key change.

## Fix

`.global_navigation .gn_search .module_search-01` becomes 50px / 50px icon / `--color-header-search`. The submit `検索` text stays in the DOM (accessible name) and is visually replaced by the 13px icon. Do not retarget search.php.

## Lesson

A search field inside the hamburger is not the search-results module. Scope the menu instance on `.gn_search`; a Parts-less search.php page is not permission to restyle every `module_search-01`.
