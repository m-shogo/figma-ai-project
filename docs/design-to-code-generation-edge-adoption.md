# Design-to-Code Generation Edge Adoption

This note records external design-to-code workflow ideas that may improve first-pass generation. External product behavior is E0 evidence until reproduced by this repository.

## Proven local rule: resolve authored identity before choosing Web representation

REF-001 Human Review exposed a repeatable first-pass failure: the footer university wordmark looked like ordinary text, but the Figma source was a single authored 240×61 vector identity. Rebuilding it as a mark SVG plus Japanese/English Web text introduced avoidable font-metric drift.

Before generating markup/CSS for a visible element, classify the authored identity:

- brand mark / wordmark / outlined lettering / authored vector identity → preserve the exact vector or a validated canonical render; do not reconstruct it as Web text merely because it looks textual;
- photographic or image-fill identity → follow the canonical raster/final-visible-node policy and preserve crop, mask, alpha, and PC/SP identity;
- editable editorial text → generate semantic Web text, but validate visible bounds, authored wraps, and runtime font metrics rather than blindly copying nominal font-size values;
- repeated component/token identity → resolve existing code/design-system/component mappings before generating a substitute;
- structural layout/shape → implement as layout/CSS/vector according to the authored structure instead of baking it into unrelated text or image fixes.

Visual Diff triage must preserve the same distinction. Repair material asset/crop/mask/shape/position/spacing/wrap/color differences. Do not mutate geometry solely to suppress antialiasing, subpixel, or fallback-font edge noise.

This rule is local evidence, not vendor prior art: the REF-001 footer inspection confirmed the Figma vector identity and the Web text reconstruction as the root-cause class. Exact asset promotion still follows the repository asset validation policy.

## Candidate: section/frame scoped generation

Prefer an authored section/frame as the normal generation unit rather than sending a large page as one undifferentiated conversion task.

Why it fits this project:
- preserves local Figma evidence and ownership;
- keeps text, asset, mask, and geometry context bounded;
- makes Section Diff diagnosis attributable to the section that generated the code;
- supports clean replay and learning per section.

Do not fragment below the level that destroys necessary composition context.

## Candidate: project-style conditioning

Before generation, supply the target implementation profile, existing component patterns, naming conventions, code samples, and framework/CMS constraints. Prefer matching the project's established code style over generic generated markup.

Why it fits this project:
- human editability is a delivery requirement;
- existing WordPress/ACF/HTML/React targets have different output contracts;
- a visually correct result that ignores project architecture creates avoidable rework.

## Candidate: component/design-system resolution before generation

Resolve whether a Figma element maps to an existing component/token/asset before generating a new substitute. Reuse exact project components only when identity and semantics actually match.

Do not force reuse when the authored Figma element is materially different.

## Candidate: iterative IDE/agent refinement, not isolated export

Treat generated code as the first implementation state inside the repository workflow. Immediately run runtime capture, visual evidence, responsive checks, and Human Review instead of treating a one-time export as completion.

## Promotion

These remain external/candidate guidance until controlled runs show fewer first-pass errors or repair rounds. Promote through `docs/knowledge-promotion.md`; do not call a vendor pattern a proven repository rule without local evidence.
