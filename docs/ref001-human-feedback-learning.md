# REF-001 Human Feedback Learning

This note turns REF-001 Human Review feedback into reusable design-to-code learning. It is intentionally evidence-led: a complaint becomes a reusable rule only after the underlying cause is identified.

## Feedback taxonomy

Every visual mismatch should be classified before editing:

1. typography — font family/weight/metrics, line-height, tracking, wrapping, hierarchy
2. asset identity — wrong image/icon/logo/source layer
3. crop/focal point — right asset, wrong mask/crop/object-position
4. geometry — x/y/width/height, overlap, section envelope, internal offsets
5. spacing — padding/gap/margin/rhythm
6. decoration — borders, colored silhouette, background, strokes, gradients, shadows
7. responsive behavior — breakpoint, fluid interpolation, overflow, mobile-only line breaks
8. content/semantics — text/link/alt/interactive structure
9. runtime integrity — image decode, missing alpha, lazy loading, horizontal overflow

Do not fix a category with a workaround from another category. Examples: do not fix a wrong SVG with CSS approximation; do not fix a crop issue by replacing the raster; do not use `nowrap` to hide a breakpoint problem.

## Where REF-001 accumulated the most feedback

### 1. Typography and text hierarchy — highest recurrence

Symptoms included wrong title scale, line-height, forced wrapping, headline hierarchy, and text that was technically present but visually unlike Figma.

Root causes:
- first-pass generic typography was scaled instead of reading each authored text node
- PC and SP typography were treated as one system even where Figma authored different endpoint metrics
- font metrics and visual hierarchy were inferred from screenshots instead of node-level values

Current correction:
- read PC and SP Figma text nodes independently
- preserve the semantic HTML, but map authored size/line-height/tracking hierarchy explicitly
- validate the visual block, not only individual CSS declarations

Reusable gate:
- before section completion, record the dominant heading/subheading/body metrics for both 1380 and 375 endpoints
- compare line breaks and block bounds, not only font-size

### 2. Raster crop / image geometry — very frequent

Symptoms included correct photos looking wrong, subjects shifted, and images being cropped twice.

Root causes:
- final visible Figma mask/group renders were placed inside legacy placeholder boxes using `object-fit: cover`
- asset correctness and layout correctness were not separated early enough
- source-resolution work (WebP / SP 3x) was mixed mentally with display geometry

Current correction:
- canonical rendered assets remain authoritative when their identity is verified
- final visible mask/group bounds drive display geometry at acceptance endpoints
- SP source pixels may be 3x while CSS display size remains 1x

Reusable gate:
- for every raster slot store: source node, exported pixel dimensions, Figma visible bounds, display bounds, crop mode, focal point, alpha status
- if the asset is already a final visible masked render, default to `contain` / exact bounds rather than applying a second crop

### 3. Layout / spacing / breakpoint behavior — frequent

Symptoms included intermediate-width overflow, endpoint-looking layouts that broke between endpoints, and mobile dimensions reused too literally below 375px.

Root causes:
- fixed-width grids and placeholder dimensions survived too long
- breakpoint assumptions were not confirmed from the design
- endpoint matching and responsive continuity were tested as separate late phases instead of together

Current correction:
- confirmed 768px seam is treated explicitly
- endpoint geometry can be exact while intermediate widths use fluid constraints
- runtime QA covers 320, 360, 375, 390, 430, 767, 768, 769, 1024, 1200, 1380

Reusable gate:
- a section is not complete when only 1380 and 375 match
- it must also have zero horizontal overflow and no destructive wrap/crop changes across the intermediate matrix

#### New evidence: endpoint fidelity and continuity are separate contracts

The Links section exposed a specific repeatable failure. The exact PC Figma group is 1112px wide (four 260px visual groups with 24px gaps). Applying that exact group at every width from the desktop breakpoint upward made the 1380px endpoint correct while producing deterministic overflow at 768, 769, and 1024px.

The correct model is:
- **acceptance endpoint contract** — use the exact authored geometry where it physically fits (1380 / 375)
- **continuity contract** — between authored endpoints, preserve each component's visual identity but reflow or interpolate the parent layout

For Links, the individual 260px desktop tile remains unchanged at tablet widths, but the parent reflows from 4-up to 2x2 until the 1112px four-up group fits again.

Reusable gate:
- before activating fixed endpoint geometry across a breakpoint range, calculate its minimum intrinsic width
- if `intrinsicWidth > availableViewportWidth`, define a continuity layout instead of clipping/hiding overflow
- never solve this class of failure with `overflow-x: hidden`
- run the full viewport matrix immediately after every endpoint-exact layout change, not only at the end of the section

### 4. Icons, logos and decorative vectors — high-value feedback despite fewer items

Footer SNS was a clear example: generic hand-authored outline icons were semantically correct but visually wrong. The circular chrome was invented and not present in Figma.

Root cause:
- icon names were matched semantically instead of comparing the actual glyph/vector
- generic substitutes were accepted too early

Current correction:
- exact Figma-exported brand glyphs are authoritative unless an existing project icon is visually identical
- explicit width and height are set from the Figma vector bounds

Reusable gate:
- never approve an icon by name alone
- compare silhouette, viewBox/bounds, fill/stroke treatment and surrounding chrome

### 5. Composite decorative assets / transparency — costly but instructive

CTA people exposed another failure mode: treating the subject as just a person image lost the authored colored silhouette layer, while trusting RGBA capability did not prove useful alpha.

Root causes:
- group semantics were simplified before inspecting child layers
- "RGBA source" was treated as equivalent to "transparent cutout"
- decorative silhouette was mistaken for disposable background/shadow

Reusable gate:
- inspect the complete visible layer stack before extracting a composite asset
- empirically validate alpha pixels
- distinguish person cutout, colored silhouette/decorative layer, and section background
- prefer a transparent composite of person + authored silhouette when that gives the most robust fidelity while keeping the section background editable

## Why the first pass drifted

The largest systemic issue was not one bad CSS rule. It was **premature abstraction**: generic components, placeholder media boxes, semantic icon substitutes and shared typography rules were introduced before enough node-level evidence had been collected.

That made the first implementation fast and structurally useful, but it also converted authored design differences into generic approximations. Human feedback then had to recover those lost specifics.

## New operating sequence

For every section from the next run onward:

1. inspect the section node in Figma for PC and SP
2. inventory text, raster, vectors, masks, decoration, and visible bounds
3. identify what is shared vs deliberately different between endpoints
4. implement semantic structure using existing project patterns
5. materialize exact assets before styling substitutes
6. match endpoint internal geometry
7. calculate the endpoint layout's minimum intrinsic width before extending it across a breakpoint range
8. define the intermediate continuity layout when the endpoint composition cannot fit
9. run intermediate-width continuity checks immediately
10. capture runtime screenshot
11. classify every remaining mismatch using the taxonomy above
12. fix the root category only
13. record whether the feedback is local or generalizable

## Feedback ledger format

Use one row/item per meaningful feedback point:

- section
- viewport
- observed mismatch
- category
- Figma evidence/node ID
- root cause
- fix
- local-only vs reusable rule
- regression test / capture evidence

This makes it possible to answer quantitatively later: where feedback clustered, which causes repeated, and whether a later run is actually improving.

## Improvement target

REF-001 should be treated as the learning run. The next comparable replay should require fewer Human Review corrections specifically in the three dominant categories:

- typography/hierarchy
- crop/image geometry
- responsive layout/spacing

A process improvement counts only if those categories show fewer or smaller corrections in a later run; otherwise the rule remains a hypothesis rather than learned behavior.
