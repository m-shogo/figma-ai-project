# Phase 01 — Section Inspect

目的: **担当Sectionだけを、Company Policy → Existing → Figmaの優先順位とfrozen contractsに基づいて実装できる状態まで理解する。**

このphaseではコード変更禁止。

## Prompt

```text
Inspect only the assigned Figma section for this reproduction run.

Do not edit code in this phase.
Do not inspect unrelated sections unless needed to resolve a declared shared dependency.
Do not redesign, simplify, or improve the reference.
Do not invent shared values, components, tokens, breakpoints, browser support, or device behavior.
Do not treat UNDETERMINED as NONE.
Do not infer hover/touch/device class from viewport width alone.

Technical implementation precedence:
1. ACTIVE Company Policy
2. Existing codebase/design system at the pinned foundation commit
3. Figma implementation evidence
4. Agent inference for non-material unresolved details only

Visual/design source of truth remains the frozen Figma reference.

Inputs:
- run record: <RUN_RECORD>
- ACTIVE Company Policy: <COMPANY_POLICY>
- Company Policy SHA-256: <COMPANY_POLICY_HASH>
- frozen reference manifest: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- resolved Environment Contract: <ENVIRONMENT_CONTRACT>
- section manifest entry: <SECTION_ENTRY>
- Figma Structure Profile: <FIGMA_STRUCTURE_PROFILE>
- Figma Structure Profile SHA-256: <FIGMA_STRUCTURE_PROFILE_HASH>
- exact profile entry for this section: <SECTION_STRUCTURE_PROFILE>
- verified foundation commit: <FOUNDATION_COMMIT>
- exact Figma section node(s): <SECTION_NODE_IDS>
- target route: <TARGET_ROUTE>

Preflight consistency:
1. Confirm Company Policy path/id/hash equals the Run Record and Shared Contract lineage.
2. Confirm Environment Contract is RESOLVED and its required_profiles/canonical_profile match Company Policy.
3. Confirm Shared Contract hash equals the Section Manifest/Run Record lineage.
4. Confirm Figma Structure Profile hash equals the Section Manifest/Run Record lineage.
5. Confirm code starts from the verified foundation commit.
6. Confirm section ID and PC/SP node IDs match both Section Manifest and Structure Profile.
7. Confirm allowed write paths, shared read-only paths, parallel group, and isolation identity.
8. Confirm recommended_translation_mode is resolved for this active section.

Environment contract inspection:
- Identify the canonical environment profile.
- Identify every REQUIRED environment profile relevant to this section's behavior.
- Read effective per-profile overrides for reset/base/environment CSS, smooth scroll, hover/pointer, touch, viewport/safe-area, scroll lock, animation, and images.
- Prefer feature/capability detection over device-name/UA branching.
- UA/browser-specific branching is allowed only when Company Policy permits it and evidence identifies a real compatibility bug.
- Do not create a section-local full reset for one device unless the Environment Contract explicitly allows it.
- Distinguish layout breakpoints from input capability queries (`hover`, `pointer`, `any-hover`, `any-pointer`).
- Treat reduced-motion/contrast/forced-colors as user-preference states, not as device classes.

Mobile/environment-sensitive checks when relevant:
- dynamic viewport units (`svh/lvh/dvh`)
- safe-area insets / viewport-fit
- layout viewport vs visual viewport
- virtual/software keyboard
- touch gesture ownership / `touch-action`
- overlay vs classic scrollbar behavior
- scroll-lock/overscroll strategy
- form-control platform appearance/text sizing
- output color gamut for material gradients/images

Interpret the Structure Profile as an implementation strategy, not as design authority.
The frozen reference remains the visual/design source of truth.

Translation-mode behavior:

STRUCTURE_FIRST:
- Prefer trusted structured Figma layout/component/variable evidence.
- Reuse Shared Contract component/token resolutions.
- Use screenshots to verify, not to replace structured evidence silently.

HYBRID:
- Use only fields listed as trusted_structure as direct structural evidence.
- For untrusted/missing/UNDETERMINED structure, combine screenshot geometry + existing codebase conventions + exact assets.
- State which source resolves each important ambiguity.

VISUAL_FIRST:
- Treat weak/freeform/untrusted Figma structure as supporting evidence only.
- Reconstruct semantic native code from reference visuals, content hierarchy, exact values/assets, and codebase conventions.
- Do not use screenshot-as-UI.

CODEBASE_FIRST:
- Prefer the production components/tokens listed in codebase_reuse_priority and Shared Contract resolutions.
- Use Figma/screenshot evidence to configure those primitives faithfully.
- Do not distort production architecture to mirror weak Figma grouping.

Signal-state rule:
- OBSERVED: use according to confidence/evidence.
- NONE: do not search for a nonexistent Figma capability unless new evidence contradicts the profile.
- UNDETERMINED: use a conservative fallback and record the limitation; do not infer absence.
- UNKNOWN: active worker should not receive it; if found, stop as lineage/profile validation failure.

Figma section inspection:
1. Retrieve only the exact section context needed by the selected translation mode.
2. Use progressive child-node retrieval if the section is large.
3. Re-check a profile signal only when implementation needs deeper evidence or current tooling differs from the captured snapshot.
4. Inspect exact PC/SP section screenshots and states.
5. Describe behavior at the Shared Contract breakpoint(s) separately from input/device capability behavior.

Breakpoint rule:
- Use Shared Contract values/query semantics exactly.
- Do not infer a replacement threshold from visual breakage.
- Material exception → PROPOSE_BREAKPOINT_EXCEPTION with evidence; do not implement it.

Codebase inspection:
1. Read existing reset/base/environment CSS and compatibility utilities before proposing new ones.
2. Read only component/token/helpers required by Shared Contract resolutions and this section.
3. Confirm resolved shared components/tokens are actually reusable at the pinned foundation commit.
4. Do not create a duplicate mapping decision locally.
5. Confirm all planned writes stay within allowed paths.

Return exactly:
- Section reference summary
- Company/Environment rules applicable to this section
- Canonical + relevant REQUIRED environment profiles
- Environment-specific behavior/QA risks
- Translation mode + reasoning used
- Trusted structure used
- UNDETERMINED/untrusted structure and fallback chosen
- Shared component/token resolutions to reuse
- Section-local component/layout plan
- Responsive behavior at shared breakpoint(s)
- Input capability behavior (hover/pointer/touch) separately
- Exact assets/crop
- States/behaviors
- Material unresolved items
- Proposed shared changes, if any
- Proposed breakpoint/environment exception, if any
- Risks likely to cause mismatch
- Evidence/context actually inspected

Stop after the brief. Do not implement yet.
```

## Pass condition

- Company Policy and resolved Environment Contract lineage are confirmed
- exact section/reference/profile lineage is confirmed
- device/input behavior is not inferred from width alone
- translation mode guides retrieval/translation without overriding the reference
- UNDETERMINED is handled conservatively rather than as NONE
- component/token resolutions are reused instead of re-decided
- responsive behavior uses the shared breakpoint contract
- environment-sensitive behavior uses the resolved Environment Contract
- no shared value/breakpoint/browser/device behavior was silently invented
- no code was changed
