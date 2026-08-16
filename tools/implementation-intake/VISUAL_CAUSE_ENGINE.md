# Visual Cause Engine

The Fast Loop should not stop at `N px different`.

Its next question is: **what kind of owner could plausibly create that difference, and what evidence would falsify that hypothesis?**

This layer stays inside `tools/implementation-intake/`; it is not a second Visual QA framework.

## 1. Layout bounds vs render bounds

Figma layout geometry and visual paint geometry are different concepts. Shadows, strokes, blur and other effects can extend the visible result beyond the layout box.

`visual_cause.compare_render_bounds()` records that overflow explicitly. A layout-aligned node with render overhang should route to effect/stroke diagnosis before margin/position edits.

## 2. Typography fingerprint

Capture records more than CSS font tokens:

- font family / size / weight / line-height / letter-spacing
- text fragment rectangles
- canvas glyph width
- actual glyph ascent/descent/left/right metrics when the browser exposes them

A line-count change is a different failure mode from a shadow or container offset. Typography diagnosis distinguishes font selection, wrapping/line-height, glyph advance and glyph-shape metrics.

## 3. Render stability gate

After fonts and section-local images are ready, capture samples the target box across animation frames.

Default policy:

- tolerance: `0.25px`
- required consecutive stable frames: `3`
- bounded timeout: `900ms`

The screenshot still has a bounded path. Stability evidence tells diagnosis whether a visual delta may have been captured while layout was moving.

## 4. Document coordinates are the geometry authority

Browser viewport coordinates are not stable page coordinates after `scrollIntoViewIfNeeded()`.

A real controlled `translateX(12px)` experiment exposed this: the browser horizontally scrolled enough to hide the transform if only `getBoundingClientRect().x` was compared.

Capture therefore stores:

- `x/y` as document coordinates: `rect + scrollX/scrollY`
- `viewportX/viewportY` only as secondary evidence
- document coordinates for text rects too

This keeps runtime measurements directly comparable with page/Figma coordinates and prevents scroll from cancelling real drift.

## 5. CSS cause candidates and cascade evidence

Section capture records matching stylesheet rules and relevant declarations for the root and declared probes.

The runtime implementation learned two browser-specific lessons:

1. `CSSStyleDeclaration` extraction must use indexed `style.item(i)` access rather than assume direct iteration everywhere.
2. Modern Chromium style rules can expose nested `cssRules`; a style rule must be matched **before** recursively visiting nested rules, otherwise CSS Nesting support can accidentally cause ordinary rules to be skipped.

Capture now records:

- declarations
- `!important` priority
- source order
- active `@media` / `@supports` filtering
- stylesheet accessibility diagnostics

`rank_css_root_causes()` uses direct property relevance, priority, specificity and source order. A direct important `transform` for an x-delta outranks generic padding candidates.

## 6. Counterfactual repair evidence

`choose_counterfactual()` compares temporary repair outcomes with the baseline.

A candidate is accepted only when it improves the measured visual result without a runtime regression. Rejected candidates remain evidence and are labelled separately as `visual-regression`, `runtime-regression`, `no-visual-gain`, or insufficient gain.

This encodes the practical lesson already observed in REF-001:

- PR #134: smallest correct visual owner improved PC Education.
- PR #136: a more literal Figma construction worsened the measured Web result and was rejected.

The real read-only browser smoke reproduced the same principle:

- Education baseline: `5.440503%`
- no-op transform: `5.440503%` → `no-visual-gain`
- child `+24px` counterfactual: `16.888508%` → `visual-regression`

The bad candidate never reaches source code.

## 7. Multi-scale classification

`multiscale_diff.py` measures the same image pair at `1.0`, `0.5`, and `0.25` scale.

`classify_multiscale()` interprets retention:

- difference collapses under downsampling → edge / anti-aliasing / stroke / DPR candidate
- difference persists → structure / content / asset / layout candidate
- intermediate retention → mixed

Real Education evidence:

- 1.0: `5.440503%`
- 0.5: `5.713620%`
- 0.25: `4.864819%`
- classification: `structural-difference-persists`

So the remaining Education residual is not explained away as edge anti-aliasing noise.

## 8. DPR diagnosis

The real browser smoke captures the same authored Education section at DPR1 and DPR2, then normalizes DPR2 back to CSS-pixel dimensions before comparison.

Observed:

- DPR1: `5.440503%`
- DPR2 normalized: `5.102869%`
- spread: `0.337634` percentage points
- classification: `dpr-stable`

Learning: DPR/Retina is not the first cause to blame for this section's remaining mismatch. DPR remains a diagnostic axis for future small stroke/SVG/raster cases.

## 9. Semantic regions and asset provenance

`section_capture.mjs` records semantic region evidence for text, images, vectors and controls. `cause_bundle.py` keeps that evidence separate from geometry.

Image evidence includes:

- current asset URL/slot
- natural dimensions
- object-fit/object-position
- rendered bounds

`asset_provenance_diff()` separates:

- wrong asset / wrong slot
- intrinsic aspect mismatch
- wrong crop / object-position
- geometry-only mismatch

For the controlled Education `+12px` transform fault:

- text regions: `20 → 20`
- image regions: `21 → 21`
- images: `23 → 23`
- asset provenance: aligned
- semantic structure: aligned

So the engine does not misdiagnose a pure position fault as missing content or a wrong image.

## 10. Exact controlled CSS fault

The real read-only browser workflow injects:

`transform: translateX(12px) !important`

without changing V2 source.

Observed document-space x delta is exactly `+12px`. After cascade-aware ranking, the first cause candidate is the injected `.ref-education` rule and its direct `transform` declaration, ahead of existing padding rules.

This is the intended target behavior: **detect the difference, locate the likely owner, then measure a candidate before editing source.**

## 11. Responsive topology

`detect_breakpoint_topology()` does not assume a universal breakpoint.

It groups observed widths by composition signature and reports transitions between measured states. Dedicated CI reads existing REF-001 runtime probes and verifies the observed stacked/wide geometry transition between `767` and `768` without modifying V2.

`768px` remains evidence for REF-001, not a universal project rule.

## 12. Figma layout and variable intent

`figma_intent.py` consumes layout/token metadata only when it is actually available.

Observed Auto Layout semantics such as vertical/horizontal flow, HUG/FILL/FIXED behavior, wrapping, gap and min/max constraints become **implementation hypotheses**, not literal CSS copies of the frame dimensions.

Bound variables are compared with an explicit project token map. Missing mappings stay `unmapped`; the tool does not invent a global token.

If layout metadata is absent, intent stays unavailable instead of inferring Auto Layout from a `1380×684` frame size.

## 13. Cause prediction calibration

`calibrate_cause_predictions()` compares a predicted cause/confidence with later measured outcomes.

It records:

- hit rate
- mean declared confidence
- Brier score
- calibration gap

This lets future projects learn whether an `80% typography` diagnosis is actually earned rather than treating model confidence as authority.

## 14. Information-value QA scheduling

`rank_observation_candidates()` prioritizes the next observation using transparent factors:

- uncertainty
- severity
- shared-pattern potential
- prior failure rate
- late-discovery risk
- whether the relevant source changed
- estimated capture cost

It is a scheduler hint only. It does not declare Section-first or any other strategy a universal winner.

## 15. Failure archetype benchmark

`failure-archetypes.json` + `failure_benchmark.py` turn supported diagnosis lessons into a regression suite.

Current archetypes cover:

- render effect overflow
- font/wrap growth
- unstable layout
- major height owner
- cascade-aware transform ownership
- rejected literal repair
- accepted owner-only repair
- anti-aliasing/edge-dominant diff
- persistent structural diff
- wrong asset provenance
- DPR sensitivity
- missing semantic control
- prediction overconfidence
- information-value priority
- responsive composition switch

New real failures become benchmark cases only when the cause/outcome is supported by evidence. The benchmark exists so the diagnosis engine cannot silently forget previously learned failure modes.

## Capture evidence

`section_capture.mjs` records:

- render stability samples
- document + viewport geometry
- extended paint/style properties
- typography fingerprint
- active matching CSS rules and cascade metadata
- stylesheet diagnostics
- intrinsic image dimensions and asset slots
- semantic regions
- browser version
- DPR / user agent / locale / viewport / scroll
- font loading status

This keeps evidence close to section capture and avoids a separate tracing platform.

## Guardrails

- REF-001 V2/V3 implementation paths are read-only in this work.
- A cause hint is not an automatic source edit.
- Large deltas do not justify subtracting the same number from CSS without diagnosis.
- Small deltas are still retained as evidence.
- Counterfactual regressions are learning data, not failures to hide.
- Breakpoints are inferred per project; `768px` is not promoted to a universal rule.
- Figma dimensions are not automatically copied into fixed CSS dimensions.
- Missing variable/layout evidence stays unknown instead of being invented.
- Human-visible fidelity and maintainable semantic implementation remain final quality dimensions.
