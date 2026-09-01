# Event archive category tabs — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` PC Event archive `1619:9554`. Category chips are Parts `tab` (`1663:5663`) — the same 120×48 PC / 3-col SP family as News archive tabs. Owner is `_news-tabs.php` + `news_tabs_archive` CSS, composed by `_event-archive.php`. Year/month calendar and `カレンダーで見る` (`btn-02`) still have no Theme owner and stay fail-closed.

## Finding

LIVE Event archive is gold title → year/month chrome → h2 month → tab chips → 2-col cards → News pager. WordPress Event archive used dropdown + sidebar (`_dropdown-archive` + `sidebar-archive`) which Figma does not show.

## Fix

Event / `event_cat` archives reuse the News tab chip family against `event_cat` terms, then the existing card grid + News pager. Do not invent the month calendar. News archive PHP path is unchanged.

## Lesson

A shared Parts `tab` instance on Event archive is not permission to keep a leftover dropdown chrome. Reuse `news_tabs_archive`; do not add a second tab CSS owner. Calendar chrome without an existing WP query surface stays fail-closed even when it is the largest remaining page-level gap.
