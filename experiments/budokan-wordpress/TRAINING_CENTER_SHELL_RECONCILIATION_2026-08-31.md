# Budokan Training Center shell reconciliation — 2026-08-31

## Gate result

Current Figma authority was re-read from `w7SGVY63FuW6JpaQVKjxm2` before choosing more page work:

- SP `1468:6595`
- PC `1137:5348`

The page remains content/data-authority blocked, but the Theme shell dependency can now be stated more precisely.

## Correct shell owner

`page.php` is **not** the closest existing shell for the current Training Center redesign. It renders:

`_visual` → `_dropdown-navigation` → `.global_inner._column` → `.gc_main` + `.gc_sub`

At PC, `_column` is a two-column grid with a 260px sidebar. The current Training Center Figma has no such sidebar in the authored page body; it uses a centered ~962px content rail.

Existing `templates/template-oneColumn.php` instead renders:

`_visual` → `.global_inner._content` → `.gc_main._oneColumn` → `the_content()`

`_content` uses the existing `--width-content: 960px` contract on PC, which is the correct reuse direction for the Figma ~962px body. No Training-Center-specific PHP template or ACF schema is justified.

This corrects the earlier audit wording that called ordinary `page.php` the owner candidate. It does **not** assign the production page to a template; production page-template assignment remains WordPress/Human authority.

## Responsive evidence and remaining SP mismatch

The live Figma contexts also reconfirmed:

### SP

- canvas 375px
- fixed-page visual 278px
- visual image area 240px
- title begins at y=199 and uses the existing fixed-page 335px title panel
- Training Center body begins at y=421
- body rail is approximately 327px, i.e. 24px side insets
- major body-section rhythm is 64px
- gallery is 2 columns, ~156×96px, 15px gap, 32px zoom control

### PC

- canvas 1380px
- fixed-page visual 321px
- content begins at y=421
- body rail is approximately 962px
- major body-section rhythm is 80px
- gallery is 3 columns, 300×200px, 40px row/column rhythm, 50px zoom control

The shared fixed-page visual CSS already matches these authored SP/PC visual dimensions closely. No visual-master change is needed from this re-check.

The one unresolved shell-level visual difference is the SP body rail: Theme `--padding-SP` is 20px, so shared `.global_inner._content` yields 335px at a 375px viewport, while this Training Center Figma body uses about 24px insets / 327px rail.

Do **not** change `--padding-SP` globally from this one page. Other verified pages intentionally use the shared 20px inset. A Training-Center-scoped 24px derivative, if needed, must be proven from a real WordPress page using the canonical editor content and production template assignment.

## Why no production implementation was made in this gate

The current repository still does not contain authoritative Training Center Gutenberg content/export that proves:

- final block tree and section ownership
- six production gallery attachment IDs/assets
- News lifecycle/data source for the inline News section
- exact destinations for pricing and guide links
- production page-template assignment

Figma text and temporary Figma asset URLs are not substituted for those WordPress authorities.

## Reusable lesson

A page can be blocked on editorial/CMS data while its shell dependency is still resolvable. Compare the actual Theme render tree, not only filenames or prior audit labels: a generic `page.php` can be less reusable than an existing one-column template when the generic page injects a sidebar absent from Figma.

Also keep context-owned spacing local. A single 24px-inset page does not justify changing a global 20px mobile token already used by other verified page families.

## Next safe gate

Once canonical Training Center WordPress content/template authority is available:

1. use `templates/template-oneColumn.php` as the starting shell unless production assignment proves otherwise;
2. seed/use the canonical Gutenberg content without hard-coding it into Theme PHP;
3. verify SP first against `1468:6595`;
4. determine from runtime visual diff whether the 24px body inset needs a page-scoped derivative;
5. verify PC under `min-width:768px` against `1137:5348`;
6. only then promote any repeated shared-master findings.

No Theme PHP/CSS/JS, ACF schema, `parts.php`, or Form/Formidable implementation is changed by this reconciliation.