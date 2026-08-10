# Phase 02 — Section Implement

目的: Section Inspect briefから、**Company Policy + resolved Environment Contract + pinned Structure Profileに従い、人間の途中介入なしで担当SectionのFIRST_PASSを作る**。

## Prompt

```text
Implement only the assigned Figma section using the approved Section Inspect brief.

Inputs:
- ACTIVE Company Policy: <COMPANY_POLICY>
- Company Policy SHA-256: <COMPANY_POLICY_HASH>
- frozen reference manifest: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- resolved Environment Contract: <ENVIRONMENT_CONTRACT>
- Figma Structure Profile: <FIGMA_STRUCTURE_PROFILE>
- Figma Structure Profile SHA-256: <FIGMA_STRUCTURE_PROFILE_HASH>
- exact section structure profile entry: <SECTION_STRUCTURE_PROFILE>
- verified foundation commit: <FOUNDATION_COMMIT>
- section manifest entry: <SECTION_ENTRY>
- approved inspect brief: <INSPECT_BRIEF>

Technical implementation precedence:
1. ACTIVE Company Policy
2. Existing codebase/design system at pinned foundation
3. Figma implementation evidence
4. Agent inference for non-material unresolved details only

Visual/design source of truth remains the frozen reference.

Environment rules:
- Follow Environment Contract required_profiles, canonical_profile, runtime_detection, foundation, viewport, interaction, and effective_overrides exactly.
- Do not classify device behavior from viewport width alone.
- Use hover/pointer capability queries independently from layout breakpoints.
- Use `any-hover`/`any-pointer` only when secondary input availability is material.
- Prefer feature detection / `@supports` where appropriate; do not assume it proves bug-free partial implementations.
- Browser/UA-specific branch requires Company Policy permission + concrete compatibility evidence.
- Do not create a device-specific full reset unless Environment Contract explicitly allows it.
- Reset/base/environment foundation files are shared/coordinator-owned unless Section Manifest explicitly grants write ownership.
- Respect per-environment smooth-scroll, hover, touch, viewport, scroll-lock, animation, and image profiles.
- Reduced-motion/contrast/forced-colors are preference states, not device classes.

Mobile/environment-sensitive rules when relevant:
- do not use legacy `100vh` as an unquestioned fullscreen solution
- follow the resolved `svh/lvh/dvh`/fallback policy
- apply safe-area policy when edge-to-edge/viewport-fit requires it
- preserve layout-vs-visual viewport behavior for software keyboard/fixed UI
- preserve browser gestures by default; `touch-action:none` requires explicit evidence
- do not treat `overscroll-behavior` as a universal scroll-lock solution
- platform form appearance/text sizing follows Company/Existing/Environment policy

Authority:
1. frozen reference for visual/design
2. frozen Company/Shared/Environment implementation contracts
3. Section Manifest ownership/dependency contract
4. existing repository contracts that must be preserved

Evidence interpretation is translation-mode dependent; do not use one fixed source order for every section.

STRUCTURE_FIRST:
- translate trusted structured Figma semantics into native code/CSS
- preserve component/token resolutions
- verify against screenshots

HYBRID:
- use trusted_structure directly
- use screenshot/codebase evidence for untrusted/missing/UNDETERMINED structure
- do not silently promote weak evidence to hard structure

VISUAL_FIRST:
- reconstruct semantic native code from reference visual geometry/content/assets + codebase conventions
- use weak Figma structure only as supporting evidence
- never paste the screenshot as the UI

CODEBASE_FIRST:
- compose the approved existing production components/tokens first
- configure them to match reference visual/behavior
- use Figma structure as supporting evidence where trustworthy

Signal states:
- OBSERVED → use according to evidence/confidence
- NONE → capability was inspected and absent; do not fabricate a mapping
- UNDETERMINED → use the conservative fallback from the Inspect brief and record the limitation
- UNKNOWN → stop; active implementation should never receive unresolved profile state

Scope rules:
- Modify only Section Manifest allowed paths.
- Treat shared files, Company Policy, Shared/Environment Contract, resolution tables, root composition, and other sections as read-only.
- Do not redesign or "improve" the UI.
- Do not create duplicate shared primitives.
- Do not alter the pinned Structure Profile during the worker run.

Component/token rules:
- Follow Shared Contract component_resolution and token_resolution exactly.
- Do not locally change REUSE/EXTEND/CREATE/LOCAL decisions.
- Missing shared primitive → PROPOSE_SHARED_CHANGE, not direct shared mutation.

Breakpoint rules:
- Use Shared Contract breakpoint values/query semantics exactly.
- Implement this Section's behavior at those shared boundaries.
- Do not add a new local threshold.
- Necessary-looking exception → PROPOSE_BREAKPOINT_EXCEPTION with evidence.

Responsive/input rules:
- Treat PC/SP as one logical Section implementation.
- Preserve ordering, visibility, wrapping, layout, and crop behavior.
- Intrinsic CSS is allowed between approved breakpoints when it matches the reference; it is not permission to invent a new breakpoint.
- Input capability behavior is separate from responsive breakpoint behavior.

Implementation quality:
- Preserve semantic HTML/accessibility conventions.
- Use exact source assets when available.
- Avoid brittle screenshot-only absolute positioning unless overlap/layering is intentional evidence-backed design behavior.
- Keep local code consistent with the pinned foundation and styling architecture.

FIRST_PASS preservation:
- Complete one coherent Section pass.
- Run only basic checks needed to make it runnable.
- Do not perform iterative visual tuning.
- Stop before repair.

At the end report:
- section ID
- Company Policy / Environment Contract lineage used
- canonical + relevant REQUIRED environment profiles
- environment-specific behavior implemented
- translation mode actually followed
- files changed
- confirmation all paths were allowed
- shared components/tokens reused
- local components created and why
- UNDETERMINED fallbacks used
- shared breakpoint behavior implemented
- hover/pointer/touch behavior implemented
- assumptions
- proposed shared/breakpoint/environment changes
- basic verification status
- exact FIRST_PASS commit/state

Do not begin visual repair.
```

## Pass condition

- runnable Section FIRST_PASS exists
- all writes are section-scoped
- Company Policy / Shared Contract / Environment Contract / Foundation / Structure Profile remain unchanged
- environment-specific behavior follows resolved rules rather than width/device-name guessing
- selected translation mode is traceable
- component/token resolutions are respected
- specified breakpoint contract is respected
- FIRST_PASS can be captured before repair
