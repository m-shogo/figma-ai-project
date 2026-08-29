# Budokan shared Gutenberg button master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- Training Center SP page: `1468:6595`
  - representative current default `button_L`: `1468:7314`
- Training Center PC page: `1137:5348`
  - representative current default `button_L`: `1296:8808`
- Shared Theme owner: `css/blocks/wp-block-buttonLink-style.css`
- Rendering surface: native Gutenberg `.wp-block-buttons > .wp-block-button > .wp-block-button__link`.

## Concrete findings

1. The Training Center buttons are instances of the same authored `button_L` family on SP and PC, so a page-specific button implementation would duplicate an existing master responsibility.
2. The existing Theme master already matched the important structural geometry: 60px minimum height, 15px/500 text, 16px left and 20px right padding, 12px icon/text gap, 3px radius, 1px `#d7d4d4` outer border, 26×26 arrow tile, and 8px primary arrow.
3. Two visual details were missing from the default Theme family even though they are explicit Figma children:
   - the arrow tile is white with a gray 1px octagonal edge, not an accent-filled tile;
   - `Line 168` is a primary 26×2 underline at x=16 along the button bottom edge.
4. The change is intentionally scoped to `.wp-block-button:not(.is-style-outline)` because this run proves only the default `button_L` family. Outline-style siblings keep their current contract until independent Figma authority is checked.
5. The underline is implemented as a link background layer instead of consuming `::after`, because `::after` already owns external/PDF/file affordances in the shared master. Reusing that pseudo-element would silently break existing file-link behavior.

## Runtime QA

A disposable real WordPress + ACF PRO runtime seeded a deterministic native Gutenberg default button and checked SP and PC using the established authored-canvas viewport contract.

- SP browser 390 → authored content 375: HTTP 200, no page errors, no horizontal overflow; link height 60, font 15/500, padding L16/R20, radius 3, border `rgb(215, 212, 212)`, arrow 26×26 / 8px / primary, white arrow tile, primary 26×2 bottom background line.
- PC browser 1395 → authored content 1380: HTTP 200, no page errors, no horizontal overflow; the same shared master measurements pass. The default no-custom-width fixture resolves to the existing Theme minimum width of 270px, confirming width remains layout/context-owned rather than hard-coded to one Training Center instance.

The runtime screenshots were inspected after both passes. The first implementation used a single `drop-shadow(0 0 0.7px ...)`; its computed geometry passed but the octagonal edge was too visually weak at 1× capture. The follow-up replaced it with four zero-blur directional 1px drop-shadows so the clipped octagon keeps a crisp authority-colored edge without introducing an extra wrapper or pseudo-element.

## Mistake / cause / fix

The initial audit could have stopped at matching height/padding/font and declared the shared button correct. Reading the Figma instance descendants exposed that the visible polygon stroke and bottom line were separate authored children, while the Theme master had neither treatment. The correction stayed inside the existing Gutenberg master rather than creating a Training Center derivative.

A second subtle issue was implementation-slot pressure: `::before` already represents the arrow and `::after` represents file/external state. Adding the underline as another pseudo-element would collide with existing behavior. A background layer on the default link preserves both contracts.

## Reusable lesson

For reusable controls, compare **descendant visual primitives** as well as bounding-box geometry. A component can match width/height/padding and still omit authored strokes or accents. Before adding a pseudo-element, inventory the shared component's existing semantic/pseudo-element responsibilities; choose a non-destructive CSS primitive when those slots are already occupied. Keep this evidence project-local until the same pattern is independently repeated.
