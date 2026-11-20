# Budokan shared gallery zoom/lightbox master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- SP training-center page: `1468:6595`
  - representative zoom node: `1468:7237`
  - control: 32×32
  - icon node: `1468:7238`, 15×15
- PC training-center page: `1137:5348`
  - representative zoom node: `1295:8350`
  - control: 50×50
  - icon node: `1295:8351`, 18×18
- Shared Theme owner: `css/module/module_zoom-button.css`
- Rendering surface: native Gutenberg gallery/lightbox (`.wp-block-gallery .wp-lightbox-container .lightbox_wrap`).

## Concrete findings

1. The zoom tile is a shared interaction responsibility, not a training-center-specific overlay component. The existing `module_zoom-button.css` already owns the lightbox pseudo-element and should remain the single implementation surface.
2. The existing PC geometry was already correct at 50×50 with an 18px Font Awesome zoom glyph, but its generic primary-color background did not match this verified gallery authority. Figma uses `#333` at 70% opacity.
3. The existing mobile override only targeted `.wp-block-columns.is-not-stacked-on-mobile .lightbox_wrap`; native gallery/lightbox instances therefore inherited the 50px desktop control. Live Figma explicitly requires 32×32 with a 15px glyph on SP.
4. The fix is intentionally scoped to `.wp-block-gallery .wp-lightbox-container .lightbox_wrap`: dark 70%-opaque background on both breakpoints, plus 32px / 15px geometry below 768px. Standalone linked-image and media-text affordances retain their previous contract until separately verified.

## Runtime QA

A disposable real WordPress + ACF PRO runtime seeded a deterministic native gallery/lightbox fixture and measured the computed `::after` pseudo-element at the established authored-canvas viewport contract:

- SP browser 390 → authored content 375: HTTP 200, no page errors, no horizontal overflow, 32×32 control, 15px glyph, `rgba(51, 51, 51, 0.7)` background.
- PC browser 1395 → authored content 1380: HTTP 200, no page errors, no horizontal overflow, 50×50 control, 18px glyph, `rgba(51, 51, 51, 0.7)` background.

The runtime fixture isolates the interaction master; gallery column/crop geometry was already independently verified in the preceding shared-gallery audit and was not reimplemented here.

## Mistake / cause / fix

The prior gallery-layout audit correctly refused to infer zoom dimensions from a screenshot. In this run the exact child nodes were read from Figma instead. That exposed a subtle dependency problem: the generic module looked superficially compatible because its PC size was 50px, but its color and SP selector scope were not the authored gallery contract. The safe fix was not to rewrite the whole module; it was to preserve the generic owner and add the narrowest authority-backed gallery override.

## Reusable lesson

When a shared module partially matches Figma, verify **geometry, visual token, and selector reach** independently. Matching one dimension is not evidence that the whole master is correct. Prefer an authority-scoped override when only one usage family has been proven, and avoid broadening the change to sibling surfaces without repeated evidence. Keep this lesson project-local until independently repeated.