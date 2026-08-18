# Figma MCP Capability Audit — 2026-08-18

Evidence maturity: **E1 runtime-verified on REF-002 Budokan**

This note records capabilities that were actually exercised against the current Figma MCP/runtime while completing the Budokan benchmark. It is intentionally separate from permanent cross-project rules: a capability becomes a default only after it proves useful on multiple real projects and does not conflict with company/project-specific conventions.

## Why this audit exists

The REF-002 asset work exposed an avoidable blind spot: Figma had a stronger Plugin API path available than the workflow was using. The old workflow over-focused on short-lived asset URLs and the Drive bridge. The audit therefore checks the current runtime before adding more infrastructure.

Operational principle:

> Before inventing a new bridge or abstraction, inspect the current Figma MCP + `use_figma` capability surface and test the smallest real node first.

## Verified high-value capabilities

### 1. `use_figma` + `node.exportAsync()` can return durable asset bytes

Verified on real Budokan nodes.

Useful formats in this runtime:

- `PNG` → `Uint8Array`
- `JPG` → `Uint8Array`
- `SVG_STRING` → editable SVG text

This enabled the first direct Figma-rendered binary materialization into Git without storing a temporary Figma asset URL in Git history.

Rules:

- Prefer `SVG_STRING` for logos/icons/vector authority.
- Prefer rendered node export for authored composites containing masks/rotation/blend.
- Prefer source-image bytes only when the source image itself is the intended authority.
- Keep temporary MCP URLs out of repository evidence.

### 2. `figma.io.write(path, data)` is available and works

Verified with a real authored Budokan image composite.

It can write `Uint8Array`/text from `exportAsync()` to the tool response without first converting the bytes into a giant base64 string in JavaScript.

Current limitation:

- It is **not yet proven** to expose a reusable cross-connector `file_uri` that can be handed directly to Google Drive/GitHub connectors.
- Therefore it is a useful output/debug path, but it is **not yet authority for automated Figma → Drive/Git handoff**.

Do not add a new transport abstraction around it until cross-connector handoff is actually proven.

### 3. `get_screenshot(... enableBase64Response: true)` is a valid fallback

Verified on a real 40×40 Budokan asset node.

Use when the environment cannot fetch Figma's short-lived screenshot URL. It returns the screenshot inline as base64 image content while still returning natural/output dimensions.

Rules:

- Default to URL mode because it is cheaper.
- Use inline base64 only when outbound fetch is unavailable.
- Use `maxDimension` deliberately for high-detail Visual QA; do not request giant full-page base64 renders by default.

### 4. `node.query()` makes large-file inspection much cheaper

Verified by scanning the Budokan PC frame.

A single read-only scan covered **872 nodes** and found:

- 31 prototype reactions
- 53 component instances
- 579 nodes with variable bindings
- 43 nodes with image fills

Use CSS-like node selectors for targeted inspection instead of repeated broad `findAll` traversals where possible.

### 5. Prototype `reactions` are real implementation authority

Budokan contains 31 reactions even though motion-context inspection returned no animated nodes.

Observed reaction contracts:

- 30 × `ON_HOVER` → `CHANGE_TO`
- transition: `DISSOLVE`
- easing: `EASE_OUT`
- duration: approximately `0.3s`
- one `ON_CLICK` reaction has no action and must be treated as an incomplete prototype stub, not implemented behavior

Operational rule:

> Interaction extraction must inspect prototype reactions separately from motion/timeline extraction. `get_motion_context = []` does **not** mean the design has no interactions.

For interactive projects, derive the implementation/QA state matrix from authored reaction triggers/actions before guessing behavior from screenshots.

### 6. Figma Variables should be read before sampling visual values

`get_variable_defs` works on the real Budokan frame and returned exact used tokens including:

- `color/sec--gold = #ca9957`
- `color/white = #ffffff`
- `color/text = #333333`
- `color/main--red = #bf3e2b`
- `color/separator = #d7d4d4`
- `color/base--lightgray = #f2f2f2`

The direct Plugin API scan also showed **579 variable-bound nodes**.

Operational rule:

> Prefer bound variable/token authority over color sampling or manually retyping values. Report unbound hardcoded exceptions separately instead of silently converting everything into invented global tokens.

Current file note:

- local variables have empty `codeSyntax` objects, so this file does not provide an authoritative CSS variable name mapping.
- Do not invent CSS token names from the Figma variable name unless the project/company profile defines that mapping.

### 7. Component instances are useful even without Code Connect

Budokan contains 53 component instances. Their `mainComponent` relationships can be read through the Plugin API.

Use this to detect repeated design primitives before writing duplicate markup/components.

However, component existence alone does not prove the production codebase has an equivalent component. Final `REUSE / ADAPT / NEW` decisions still require repository evidence.

### 8. `get_libraries` / `search_design_system` are useful but must be scoped carefully

The Budokan file is subscribed to multiple community libraries. Subscription does **not** mean those libraries are project authority.

Operational rule:

- library presence is discovery evidence only
- prefer components/variables actually used in the target subtree
- prefer company-owned/project-owned libraries when available
- never replace a bespoke design with a community component merely because that library is subscribed

### 9. Motion context is a separate authority channel

`get_motion_context(recursive=true)` returned no animated nodes for the Budokan root.

That result is useful and honest for this project, but must be combined with prototype reactions (see above). Future projects with timeline/keyframe animation should route through `get_motion_context` and include easing/duration/timeline evidence in browser QA.

## Runtime/doc mismatches discovered

The current documentation/type surface contains APIs that the present `use_figma` execution context does not support. Runtime behavior wins.

Verified unsupported in this context:

- `exportAsync({ format: "JSON_REST_V1" })`
- `devStatus`
- `getDevResourcesAsync()`
- `WEBP` export through the current `use_figma` export discriminator

Do not build workflows assuming these work merely because they exist in Plugin API typings/docs. Maintain a runtime capability matrix and re-test after meaningful Figma MCP updates.

## Code Connect status

The current account/seat returned a plan restriction when attempting whole-file Code Connect inspection: a Dev or Full seat on an Organization/Enterprise plan is required for that capability.

Therefore Code Connect remains optional and must never block the normal repo-aware implementation path.

## Default discovery order learned from this audit

For a real Figma → Web implementation, prefer this order before inventing new tooling:

1. `get_metadata` for page/section outline.
2. `get_design_context` for targeted visual/structural context.
3. `get_variable_defs` for used token values.
4. `use_figma` read-only query for:
   - component instances
   - bound variables
   - image hashes/fills
   - prototype reactions
   - exact special-case properties
5. `download_assets` for normal asset inventory/raw sources.
6. `exportAsync()` for exact authored composite/vector output when needed.
7. `get_screenshot` for Visual Truth, with inline base64 only as a network-restricted fallback.
8. Code Connect/design-system search only when the company/file actually provides authoritative mappings/libraries.

## Promotion rule

This is **E1** evidence from one real benchmark.

Promote an item into a general project default only when:

- it is reproduced on additional real Figma projects,
- it improves implementation time or fidelity measurably,
- it does not erase company/designer-specific conventions,
- its failure modes and runtime availability are understood.

The key learning is not "always use every Figma API". The key learning is:

> **Capability discovery comes before new infrastructure, and Figma-authored semantic evidence comes before visual inference when that evidence exists.**
