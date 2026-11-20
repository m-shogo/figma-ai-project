# Gutenberg details geometry resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP collapsed `1399:18837`
- SP expanded `1399:18849`
- PC collapsed `1157:8302`
- PC expanded `1157:8314`

Owner remains `css/blocks/wp-block-details-style.css`. Title type from #304 is unchanged. `inc/field.php` was not changed. QA `_qa` Q/A slot width (Theme 32px vs glyph hug ~17px) is a follow-up.

## Finding

The previous file used a 68px rail and 24px insets on both bands. Current SP is a 59px rail with title `20×16` and expanded content `20`. PC collapsed stays `24/68`; PC open title is `pl 32 / py 24` and content is `32` all around. Plus/minus bars are `--color-primary` (`#bf3e2b`), not `#333`.

## Cause

SP chrome shrank in the design-adjustment file. Title padding and content padding are no longer the same CSS token. The plus paint was never re-read after the file-key change.

## Fix

SP tokens: title padding-block 16, inline 20, content 20, rail 59. PC restores 24/68 and open content `padding: 32px`. Plus/minus use `--color-primary`.

## Lesson

Do not keep one `--_padding-block` for both summary and content after a Figma file-key change. Re-read the plus paint node; a 20×2 bar can already match size and still be the wrong color.
