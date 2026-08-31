# Shared Page Title resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP `page_title-sp` `1399:18544` (375×180)
- PC `page_title-pc` `2169:10270` (1380×220)

Theme owner remains `_visual.php` + `global_mainVisual.css`. `_fixedPage` image-title is a separate derivative and was not redesigned here.

## Finding

The previous News QA locked SP to sans Medium 22px on a photo + 25% white overlay. Current `page_title-sp` / `page_title-pc` are a solid gold `#ca9957` bar with white Zen Old Mincho Bold (SP 24px / PC 32px, tracking 5%, line-height 1.4).

## Cause

That sans/photo contract came from the superseded Figma file’s News full-page frames. After the file-key change, the shared title *component* is the gold Mincho bar.

## Fix

Default `.global_mainVisual` is now the gold bar. The CMS image layer stays in markup for `_fixedPage` but is `display:none` on the shared title family. Existing News archive browser QA was updated to the current contract instead of adding a parallel workflow.

## Lesson

A shared title *component* can disagree with an older full-page News frame. After a Figma file-key change, re-read `page_title-sp` / `page_title-pc` rather than keeping the last News QA numbers.
