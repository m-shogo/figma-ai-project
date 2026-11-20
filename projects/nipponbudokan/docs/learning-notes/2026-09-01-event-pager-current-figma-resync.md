# Event archive pager reuse — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC Event archive pager instance `1619:9557` / component `1137:4996` in `1619:9554`
- Same family as News SP pager `2189:10281`

Owner is the existing News pager in `module_newsList-01.css` + `_pagination.php` variant `news`. Dedicated SP Event archive page remains UNDETERMINED. Search.php stays on generic `module_pager-01`.

## Finding

LIVE type is Zen Kaku Gothic New: current Bold 16, others Medium 16, octagon arrows 40, underline numbers 50×40. WordPress Event archive (`archive.php` → `_list-card.php`) still called generic circular `module_pager-01` with undefined `--enText`.

Event Figma also shows a year/month calendar rail, category chips, and `2026年8月` h2. Those have no current Theme owner on Event archive (dropdown + sidebar instead). They stay fail-closed. This pass is pager only.

## Fix

Unscope News pager rules from `.news_archive .news_pager` to `.news_pager`. Pass `variant => 'news'` from `_list-card.php` when `get_current_post_type() === 'event'`. PHP markup for News is unchanged. Generic pager-01 (`:not(.news_pager)`) still covers search.

## Lesson

When Figma reuses a component instance, share the existing owner. Do not retarget generic pager-01 geometry, and do not invent Event calendar/month chrome from the archive screenshot.
