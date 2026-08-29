# Budokan shared Gutenberg gallery layout master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- SP training-center facility page: `1468:6595`
- PC counterpart: `1137:5348`
- Shared Theme surfaces:
  - `css/blocks/wp-block-gallery-style.css`
  - `css/blocks/wp-block-image-style.css`
  - `css/module/module_zoom-button.css`
- WordPress rendering surface: `page.php` → `.block-editor_wrap` → native Gutenberg content.

## Concrete findings

1. The facility photo area is not a page-specific card family. It is a six-image instance of the existing native Gutenberg gallery master.
2. The Figma SP page shows the six images as a two-column grid; the PC page shows the same content as a three-column grid. The current shared Theme master already encodes this dependency correctly: two columns below 768px and three columns at `min-width: 768px`.
3. Real WordPress + ACF PRO runtime QA at the established authored-canvas contract passed without a Theme change:
   - SP browser 390 → content 375: 2 columns, 16px gap, six items, image ratio 3:2, HTTP 200, no page errors, no horizontal overflow.
   - PC browser 1395 → content 1380: 3 columns, 40px gap, six items, image ratio 3:2, HTTP 200, no page errors, no horizontal overflow.
4. Runtime visual captures were inspected after geometry passed. The responsive grid structure and crop behavior are stable, so adding a training-center-specific gallery selector would duplicate an already-correct master.

## Boundary / remaining visual check

The deterministic runtime fixture intentionally validated the **gallery layout and crop master** with unlinked images. The authored Figma facility images also show a zoom affordance. That affordance is owned separately by the existing `module_zoom-button.css` / lightbox-link contract and was not treated as evidence for its exact SP/PC control size in this run. Do not change zoom dimensions from screenshot estimation alone; verify its exact Figma node/instance authority before changing that shared interaction master.

## Failed approach / cause

Before pivoting to this independent gallery audit, the TOP lower-banner blocker was re-checked. Figma still exposes the exact raw 1050×700 JPEG via a short-lived MCP asset URL, but the current execution sandbox cannot resolve that URL into local bytes and the GitHub connector accepts repository text/base64 rather than the Figma connector's temporary URL. Persisting the URL or substituting an approximate asset would violate the durable-asset rule, so no speculative banner commit was made.

## Reusable lesson

When a Figma page contains a visually distinctive section, first separate the section into existing Theme responsibilities before creating page-specific CSS. Here, **gallery layout/crop** is one shared Gutenberg master and **zoom/lightbox affordance** is another shared interaction master. Verify and change each master against its own authority; do not bundle an unverified child behavior into an otherwise proven section. Keep this evidence project-local until repeated independently.
