# Fixed-page visual learning — 2026-08-29

Scope: ordinary WordPress fixed-page main visual (`_visual.php` / `global_mainVisual.css`).

## What happened

The supplied Theme had one shared `_visual.php` renderer and one centered-title visual style for every context. A whole-Figma dependency re-check showed that ordinary fixed pages use a different `page_title-img` presentation family from archive/search/error pages, while still using the same WordPress/ACF page-image authority.

The first PC runtime pass also failed even though the intended visual dimensions looked correct in isolation. The cause was not the new component itself: the existing `.global_inner` PC max-width centered the background at x=50 with width 1280. Fresh Figma metadata showed the authored PC image starts at x=60 and is 1320px wide, while the title starts at x=0. The fixed-page modifier therefore has to neutralize the generic `.global_inner` width only for this visual family and then place the image independently.

A second discrepancy came from trusting the parent component height too literally. Figma metadata reports the PC page-title symbol as 321px high, but its title child starts at y=253 and is 79px high, visibly overflowing to y=332. Runtime QA initially asserted a 68px title and failed. Re-reading the child node corrected the assertion instead of forcing CSS to a mistaken parent-derived value.

## Successful fix

- Keep one `_visual.php` renderer and the existing `page_img` ACF contract.
- Add a WordPress-context modifier (`_fixedPage`) only for ordinary non-front fixed pages.
- Keep SP as the base: 375×278 visual, 375×240 image, black 40% overlay, 335×79 title panel at y=199.
- Under `min-width: 768px`, use the PC geometry from the live child metadata: 321px layout visual, image x=60 / w=1320 / h=320 on a 1380 canvas, title x=0 / y=253 / w=360 / h=79.
- Preserve archive/search/error presentation unchanged.
- Do not persist the short-lived Figma texture URL. The exact title-panel texture remains a visual asset gap; Theme color tokens are the durable fallback until an authoritative durable asset exists.

## Reusable lesson

1. A shared WordPress data/markup contract may legitimately have multiple Figma presentation families. Prefer one renderer plus a semantic context modifier before duplicating a template.
2. When a measured component is unexpectedly shifted by a constant amount, inspect inherited global container rules before changing component coordinates.
3. In Figma, parent bounds are not sufficient authority when children overflow. QA important children directly (`x/y/w/h`) before converting the parent size into an assertion.
4. A failed geometry assertion is useful evidence only after classifying whether the mismatch came from implementation, inherited layout, or an incorrect test assumption.

This is one Budokan-specific evidence point. Do not promote it to higher frontend standards until the same pattern repeats elsewhere.
