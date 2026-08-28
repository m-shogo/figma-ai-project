# TOP lower banner — authority / implementation audit

Updated: 2026-08-29

## Scope

TOP lower banner only. `parts.php`, form/Formidable, Footer variants, and unrelated TOP sections are out of scope.

## Dependency decision

- Data authority stays the existing ACF Repeater `top_banner-01`.
- TOP must not invent a second CMS contract.
- Rendering is isolated in `template-parts/_top-banner.php`; `front-page.php` stays compositional.
- The legacy ACF `img` field remains part of the existing CMS contract even though the current Figma presentation does not render it.
- Production URLs are unknown, so fallback items are runtime/visual fixtures only and do not invent destinations.

## Live Figma authority

File: `w7SGVY63FuW6JpaQVKjxm2`

### SP `1360:9354`

- root `bnr_area`: 375 × 216
- normal-flow vertical composition: 40px top/bottom padding
- card 1: 270 × 60
- card 2: 270 × 60
- card gap: 16px
- card border radius: 3px
- arrow component: 26 × 26 octagon with subtle separator outline
- text: 15px medium, 0.05em tracking
- external icon: 16px
- section background: root-frame image fill + 70% black overlay

The actual background authority was rechecked programmatically from the live node rather than inferred from the screenshot:

- root imageHash: `0439889a806e458e2c3e35d11a392dfc78c8cb62`
- source size: 1050 × 700 JPEG
- source bytes: 235687
- FNV-1a 32: `310ada8b`
- Figma scaleMode: `CROP`
- Figma imageTransform: `[[0.5470459461212158,0,0.23260705173015594],[0,0.44638949632644653,0.26084211468696594]]`

### PC `1603:7145`

The Figma content node itself is 648 × 80 at x=366 inside the authored 1380-wide section composition:

- cards: 300 × 80
- gap: 48px
- text: 16px
- external icon: 14px
- no SP background-image treatment in the PC presentation

This confirms the safe responsive model is one DOM: stacked 270px cards on SP → 300px horizontal cards at `min-width:768px`.

## Runtime QA

Real WordPress + ACF PRO + actual `nipponbudokan` Theme + Playwright Chromium ran in Actions run `33200613196` and passed.

### SP authored content width 375

- HTTP 200
- page errors: 0
- horizontal overflow: none
- section: 375 × 216
- inner: 375 × 136
- list: 270 × 136
- first item/link: 270 × 60
- first arrow: 26 × 26
- first external icon: 16 × 16
- item count: 2

### PC authored content width 1380

- HTTP 200
- page errors: 0
- horizontal overflow: none
- section: 1380 × 160
- list: 648 × 80
- first item/link: 300 × 80
- first arrow: 26 × 26
- first external icon: 14 × 14
- item count: 2

The first runtime capture revealed that `filter: drop-shadow(...)` on the clipped white arrow shape did not reproduce the authored octagon outline reliably. Cause: the white clipped shape against a white card leaves the outline visually too weak. Fix: render a separator-colored clipped outer octagon with a 1px-inset white clipped inner layer, while keeping the arrow glyph as a separate child. This uses absolute positioning only for the tiny decorative inner outline layer, not for section/card layout.

## Maintainability / absolute-position review

The section layout uses normal flow + flex:

- section spacing via padding
- cards via flex column/row
- responsive extension only under `min-width:768px`
- no coordinate-by-coordinate Figma recreation

`position:absolute` is limited to decorative micro-layers such as the 2px card accent line and the octagon inner fill. It does not control card placement, section placement, or responsive geometry.

## Asset materialization blocker

The exact Figma background source is identified, but it is not yet a durable Theme file. Short-lived MCP URLs must not be committed or hotlinked.

A temporary base64-chunk transfer experiment was attempted and immediately rejected: the connector write path did not preserve the expected 16,000-character chunk boundary (the staged file reported a different byte count), so continuing would risk silent binary corruption. The temporary file was deleted. Do not repeat this transfer method without a verifiable byte-preserving transport.

Smallest remaining requirement before merge: materialize the identified Figma background image into a durable Theme asset through a byte-safe path, then set it as the default SP background, rerun SP visual QA, and remove the temporary runtime workflow.

## Reusable lesson

When a design image is ambiguous, inspect the live Figma fill/imageHash and source dimensions before guessing. When binary transport cannot prove byte preservation, stop rather than committing a visually plausible but unverified asset. This is evidence for the existing authority-first / durable-asset rule, not a new project-wide standard by itself.
