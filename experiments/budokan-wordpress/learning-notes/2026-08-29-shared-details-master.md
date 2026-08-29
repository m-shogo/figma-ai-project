# Budokan shared Gutenberg details/accordion master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- SP Parts accordion group: `1399:18836`
  - normal collapsed: `1399:18837`
  - normal expanded: `1399:18849`
  - QA expanded: `1399:18857`
- PC Parts accordion group: `1157:8301`
  - normal collapsed: `1157:8302`
  - normal expanded: `1157:8314`
  - QA expanded: `1157:8324`
- Shared Theme owner: `css/blocks/wp-block-details-style.css`
- Runtime owner: native Gutenberg `core/details`; WordPress augments the saved `<details><summary>…` markup at render time with `.wp-block-details__title`, `.wp-block-details__button`, `.wp-block-details__content`, and `.wp-block-details__inner` wrappers.

## Concrete findings

1. The accordion is a shared Gutenberg master, not a page-specific component. Existing Theme ownership is correct and should remain in `wp-block-details-style.css`.
2. Live WordPress + ACF PRO runtime confirmed that current WordPress render output supplies the Theme's expected BEM-like detail wrappers. The CSS selectors are not dead/editor-only assumptions.
3. Figma uses a dedicated 68px action rail at both breakpoints: 24px + 20px plus/minus primitive + 24px. The old Theme used 52px on SP and 68px plus an extra 8px summary gap on PC, which placed the control rail inconsistently on both breakpoints.
4. Figma SP keeps 24px title/content insets for normal expanded and QA details. Figma PC keeps the short collapsed title at 24px, but expanded title/content and QA title/content use 32px on the left/content edges.
5. Figma's content separator is the content frame's full-width top border. The old Theme drew an inset line using `left: var(--_padding-inline)` and a reduced width.
6. The existing typography and interaction primitives were already compatible: 16px/500/1.5/0.1em title, 20×2 plus/minus bars, 17px/1.6 content text, 24px gold Q/A markers, and 24px vertical title/content padding.

## Fix

- Standardize `--_button-width` to 68px on SP and PC.
- Remove the synthetic 8px `--_summary-gap`; the Figma title region and action rail are adjacent responsibilities.
- Draw the expanded separator from `left: 0` at `inline-size: 100%`.
- Keep SP insets at 24px.
- Under `min-width: 768px`, preserve 24px for the normal collapsed title, but set the normal `[open]` title-left/content-inline and the QA title-left/content-inline to 32px.
- Do not introduce a page-specific accordion derivative.

## Runtime QA

A disposable real WordPress + ACF PRO runtime seeds three native Gutenberg details blocks: normal collapsed, normal expanded, and expanded `_qa`. It uses the established viewport contract (browser 390 → authored 375 SP, browser 1395 → authored 1380 PC) and checks HTTP/runtime/overflow plus the master primitives.

Validated after the fix:

- SP: summary left 24px / right 68px, content inline 24px, action rail 68px, plus/minus bars 20×2, full-width separator.
- PC collapsed: summary left 24px / right 68px.
- PC expanded + QA: summary left 32px / right 68px and content inline 32px.
- Both breakpoints: title 16px with 24px line-height and 1.6px tracking, body 17px with 27.2px line-height, Q/A 24px gold, no page errors and no horizontal overflow.

## Mistake / cause / fix

The pre-fix CSS looked plausible because individual numbers (24px padding, 20px icon, 68px desktop button) appeared in the Figma design. The mismatch only became obvious when the layout responsibility was decomposed into **title region / action rail / separator / open-state inset**. The old SP action rail was 16px too narrow, while the old PC summary effectively reserved 76px because it combined a correct 68px rail with an invented 8px gap.

The first runtime probe also measured the native WordPress output before changing renderer logic. That prevented an unnecessary custom render filter: WordPress already supplies the wrapper structure the Theme expects.

## Reusable lesson

For composite disclosure controls, do not validate spacing variables independently. Reconstruct the authored responsibility boundaries: content inset, action-rail width, gap between regions, and state-specific insets. Also inspect real core-block render output before adding markup transforms; saved Gutenberg HTML and runtime HTML can differ. Keep this lesson project-local until independently repeated.
