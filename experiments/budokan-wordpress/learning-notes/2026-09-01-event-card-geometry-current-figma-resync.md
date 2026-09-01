# Event card geometry resync — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC Event archive grid `1630:9911` / card `1630:9912` in `1619:9554`
- Parts has no card specimen. This module is the Event card owner (`archive.php` + `_list-card.php` + event `customPostList`).

Type families from `2026-08-31-event-card-current-figma-resync.md` are unchanged. Dedicated SP Event archive page remains UNDETERMINED.

## Finding

LIVE PC article is a 2-column wrap (448 + 64 + 448), row-gap 24. Each card is horizontal: thumb 200×150, gap 24, text 224. Stack is labels → date → title (label-to-date 24, date-to-title 16). Theme was a 3-column vertical stack (360/240 image on top, date beside labels).

## Cause

`module_newsCard-01` kept a generic news-card grid after the file-key change. Event archive is the only live consumer; News archive uses `module_newsList-01`.

## Fix

PC `@media (min-width: 768px)` becomes 2-col / 24×64 gap and a 200×150 + text CSS grid. PHP prints labels before the date so the DOM matches Figma without a wrapper. Date `width: 100px` is removed so range text can follow content. SP stays stacked 2-col; TOP SP `1399:11868` is a different owner (1-col featured list) and is not used to invent Event archive SP.

Date format `開催日：` prefix stays fail-closed (PHP semantics). Year/month calendar chrome on Event Figma stays fail-closed.

## Lesson

A shared card module named “news” can still be an Event-only owner. Re-read the archive grid after a file-key change; type-only resync will leave a 3-col vertical stack sitting on a 2-col horizontal specimen.
