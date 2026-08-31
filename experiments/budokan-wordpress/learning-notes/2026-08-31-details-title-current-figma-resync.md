# Gutenberg details title resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP title `1399:18840`
- PC title `1157:8305`

Owner remains `css/blocks/wp-block-details-style.css`. `inc/field.php` render wrapper was not changed. Padding / action-rail geometry is a follow-up.

## Finding

Title is Zen Old Mincho SemiBold 18px, lh 1.5. SP tracking 5%, PC tracking 10%. Theme was 16px / 500 with no family (Noto inherit) and 0.1em on both bands.

Body copy inside the expanded panel is Zen Kaku 17 and already comes from the paragraph module.

## Cause

Parts accordion titles moved to Mincho 18 SemiBold in the design-adjustment file. The previous master treated 16/500 sans as compatible.

## Fix

Set title to `--font-zen-old-mincho` / 600 / 18px, SP `letter-spacing: 0.05em`, PC `0.1em`.

## Follow-up (not this PR)

LIVE SP rail is 59px with title/content inset 20px. Theme still uses 68px / 24px from the previous file. That geometry pass stays separate so this PR does not mix type with chrome.

## Lesson

Accordion title is not body copy. Re-read the title text node after a file-key change even when height/plus-minus already look familiar.
