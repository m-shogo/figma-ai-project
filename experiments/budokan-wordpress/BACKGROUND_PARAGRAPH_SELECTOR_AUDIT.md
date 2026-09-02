# Background Paragraph Selector Audit

更新: 2026-09-02

## Scope

Current Nippon Budokan Figma authority and the supplied WordPress Theme were compared for the shared background paragraph/text-box primitive.

- Current Figma file: `fKYDn9ikpJk1nW7IWFtaUx`
- Shared body typography: SP `1399:18729`, PC `1157:8182`
- Background paragraph/text box: PC `1157:8201` (same 17px / 1.6 body typography inside the bordered background surface)
- Theme owner: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/css/blocks/wp-block-text-style.css`

No page-specific component, ACF field, CPT, JavaScript, or PHP wrapper is required.

## Failure

The shared paragraph typography selector accepted unclassed paragraphs, `.wp-block-paragraph`, editor-rich-text, and text-alignment classes, but did not include `.has-background`.

A Gutenberg paragraph with a background is rendered as a class-bearing `p.has-background...`. Therefore it is excluded by `:not([class])`, and front-end paragraph markup does not need to carry `.wp-block-paragraph`.

The same stylesheet separately gave `p.has-background` its padding, border, radius, and fill. This produced a split contract: the surface geometry was owned, but the authored body typography was not guaranteed by the shared paragraph owner.

## Resolution

Add `.has-background` to the existing shared paragraph typography selector.

This keeps:

- the Figma-authored 17px / 1.6 body contract,
- Gutenberg/editor ownership of the paragraph content and background state,
- the existing shared padding/border/radius rules,
- all page families on one canonical text owner.

Do not create a background-box page stylesheet or duplicate the typography in the background-surface rule.

## Boundary

This is not evidence that every Gutenberg modifier class belongs in every base selector. The reusable check is narrower: when a CMS modifier is an authorized variant of the same semantic primitive, verify that adding the modifier does not accidentally opt the element out of its base visual contract.

`parts.php`, Form/Formidable, Slider, Calendar, Search, ACF, CPT, and data-model ownership are unchanged.
