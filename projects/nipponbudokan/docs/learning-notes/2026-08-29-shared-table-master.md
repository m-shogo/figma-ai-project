# Budokan shared Gutenberg table master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- SP Parts table authority: `1451:5690` and its authored wide table content under the SP Parts page.
- PC Parts table authority: `1157:8281`.
- Shared Theme owner: `css/blocks/wp-block-table-style.css`.
- Runtime owner: native Gutenberg `core/table` plus the Theme/runtime wrapper generated around the rendered table.

## Concrete findings

1. The table is a shared Gutenberg master, not a page-specific component. Existing Theme ownership is correct; no new Budokan-only table component is needed.
2. Figma PC authors a 960px, four-column table. Each ordinary column is about 240px; the sample merged middle body cell spans about 480px.
3. Header/body rows are authored at 54px. Typography is 15px / 24px, regular, centered. With 15px vertical padding, separators must not add layout height if the runtime is to remain exactly 54px.
4. Header cells use `#424242` with white text and `#d7d4d4` separators. The first body row is white and the second is `#f2f2f2`.
5. The SP design keeps the wide table geometry and exposes it through a narrow horizontal-scroll viewport rather than collapsing the four columns. The scrollbar primitive is 5px high with the project gold thumb and gray track.
6. Real WordPress runtime inserts an additional wrapper between the Gutenberg figure and `table`. Therefore a direct-child selector such as `.is-scroll-on-mobile > table` does not reach the live table even though it looks correct against saved block markup.
7. Desktop content width is contextual. The Parts design demonstrates the 960px table master, but a real page fixture can have a narrower content container. Forcing 960px outside mobile scroll mode would incorrectly override the consuming page's layout contract.

## Fix

- Keep shared ownership in `wp-block-table-style.css`.
- Align table cell padding to Figma: 15px block / 30px inline, 15px text, 24px line-height, centered.
- Render separators as inset box-shadows rather than layout-contributing cell borders so `15 + 24 + 15` remains exactly 54px.
- Make the non-stacked stripe pattern begin with white and apply `#f2f2f2` to the even body row.
- Under `max-width: 767px`, target the descendant runtime `table`, preserve the authored 960px width/min-width, and keep 240px minimum ordinary cells.
- Align the mobile scrollbar to the 5px Figma primitive.
- Do not force the 960px Parts-canvas width on desktop consumers; keep the desktop table fluid to its actual container.

## Runtime QA

A disposable real WordPress + ACF PRO runtime seeds one native Gutenberg table with four header cells, two body rows, a merged middle body cell, `is-style-stripes`, and `is-scroll-on-mobile`. It uses the established viewport contract: browser 390 for authored 375 SP and browser 1395 for authored 1380 PC.

The runtime probe checks HTTP/page errors/overflow plus cell geometry, typography, colors, stripe order, separator rendering, and the distinction between the visible mobile viewport and the authored table scroll width.

Validated geometry before the final stricter pass already established:

- SP: visible wrapper about 335px wide; inner table 960px wide; header and body rows 54px; ordinary cells 240px; no page-level horizontal overflow.
- PC fixture: table remains fluid to its actual ~860px content container with four equal columns; header/body rows stay 54px; no page-level horizontal overflow.

The final stricter pass additionally asserts 30px inline padding, Figma color/weight/alignment, white-first/even-gray striping, 5px mobile scrollbar, 960px SP scroll content, and equal desktop column distribution.

## Mistake / cause / fix

Three plausible implementations were wrong for different reasons:

1. **Direct-child mobile selector** — saved Gutenberg markup suggested the `table` was a direct child of the figure, but runtime WordPress/Theme output inserts a wrapper. The mobile 960px rule therefore did not materialize until the live DOM was inspected and the selector was scoped to the descendant table.
2. **Odd-row striping** — the generic stripe assumption made the first body row gray, while Figma clearly starts white and stripes the second row. The fix is limited to the non-stacked table family so stacked-mobile behavior is not generalized without authority.
3. **Layout borders on exact-height cells** — 1px cell borders can inflate the authored 54px box. Inset separators preserve the Figma visual rule without changing row geometry.

A fourth potential mistake was deliberately avoided: taking the 960px width from the Parts canvas and forcing it on desktop pages. The real fixture showed that viewport/container geometry and authored table-content geometry are separate responsibilities.

## Reusable lesson

For responsive tables, validate **two geometries separately**: the consuming viewport/container and the authored table content. Mobile may intentionally preserve a wide content geometry behind horizontal scrolling, while desktop should usually remain fluid to its real container. Also inspect real Gutenberg runtime DOM before changing selectors; saved block markup is not sufficient evidence. Keep this lesson project-local until independently repeated.
