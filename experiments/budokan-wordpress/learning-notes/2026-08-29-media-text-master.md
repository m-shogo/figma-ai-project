# Budokan Media + Text master — 2026-08-29

## Scope

Parts / 「テキスト+画像」。既存 Theme の native Gutenberg `core/media-text` owner を再利用し、別PHP componentやTOP専用duplicateは作らない。

## Figma authority

Canonical file: `w7SGVY63FuW6JpaQVKjxm2`.

### SP

- outer: `1399:18747` (`テキスト+画像`), 327px wide
- content: `1399:18749`
- text/media stack: `1399:18751`
- text: `1399:18752`
- image + caption: `1399:18753`
- authored order: text -> image
- text/media gap: 30px

### PC

- outer: `1157:8205`, 960px wide in Parts specimen
- content: `1157:8207`
- row: `1157:8209`
- text: `1157:8210`
- image + caption: `1157:8211`
- authored order: text left -> image right
- text/media gap: 30px
- image rail is 330px in the 960px specimen, but this remains content/block geometry rather than a global fixed Theme width.

## Existing Theme ownership

`wp-block-media-text-style.css` already owned native `.wp-block-media-text`, with zero content padding and first-child margin neutralization. The previous gap contract was `32px 16px` on mobile and `40px` on desktop, so this was a correction to the existing master rather than a new implementation.

## Runtime finding and failed approach

The first real WordPress + ACF PRO probe correctly computed the new 30px gap, but SP visual order was wrong: Gutenberg core's `is-stacked-on-mobile` behavior placed `.wp-block-media-text__media` on row 1 and `.wp-block-media-text__content` on row 2. The first assertion expected Figma's text-first order and therefore failed.

The failure was useful: it proved that matching `gap` alone is insufficient for responsive composite blocks. A second diagnostic run persisted computed rectangles and screenshots before assertions. It showed:

- SP viewport 390: media top 444.5, content top 714.5 — media-first, contrary to Figma.
- PC viewport 1395: content left 110, media left 677.609, 30px physical gap — PC order already correct.

## Successful fix

The fix is deliberately narrow to the verified derivative:

- `.wp-block-media-text.is-stacked-on-mobile.has-media-on-the-right`
- under 768px, force one column and place content row 1 / media row 2
- retain 30px gap
- leave media-left variants unchanged because this run did not establish their Figma authority
- at `min-width:768px`, keep the native side-by-side layout and 30px gap

Final real WordPress + ACF PRO runtime evidence:

- SP 390: HTTP 200, no page errors, content first, media second, physical vertical gap 30px, no positive page overflow.
- PC 1395: HTTP 200, no page errors, text left, media right, physical horizontal gap 30px, no positive page overflow.
- Final screenshots were reviewed after computed-style assertions passed.

## Reusable lessons

1. For responsive Gutenberg composites, verify both geometry and authored visual order; `gap` can be correct while CSS grid placement is wrong.
2. Core responsive behavior is not automatically project design authority. Override it only for the verified variant/context, not all media-text blocks.
3. Persist runtime rectangles/screenshots before assertions when diagnosing a layout failure; otherwise a fail can hide the actual computed state.
4. Keep content-owned width contracts content-owned. The 330px PC media rail in a 960px Figma specimen does not justify forcing 330px on narrower real content containers.
5. A Figma master that maps cleanly to a native Gutenberg block should remain a thin Theme correction, not become a duplicate custom component.
