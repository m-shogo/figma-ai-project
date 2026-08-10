# Phase 01 — Section Inspect

目的: **担当Sectionだけを、frozen contracts + exact Section Structure Profileに基づいて実装できる状態まで理解する。**

このphaseではコード変更禁止。

## Prompt

```text
Inspect only the assigned Figma section for this reproduction run.

Do not edit code in this phase.
Do not inspect unrelated sections unless needed to resolve a declared shared dependency.
Do not redesign, simplify, or improve the reference.
Do not invent shared values, components, tokens, or breakpoints.
Do not treat UNDETERMINED as NONE.

Inputs:
- run record: <RUN_RECORD>
- frozen reference manifest: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- section manifest entry: <SECTION_ENTRY>
- Figma Structure Profile: <FIGMA_STRUCTURE_PROFILE>
- Figma Structure Profile SHA-256: <FIGMA_STRUCTURE_PROFILE_HASH>
- exact profile entry for this section: <SECTION_STRUCTURE_PROFILE>
- verified foundation commit: <FOUNDATION_COMMIT>
- exact Figma section node(s): <SECTION_NODE_IDS>
- target route: <TARGET_ROUTE>

Preflight consistency:
1. Confirm Shared Contract hash equals the Section Manifest/Run Record lineage.
2. Confirm Figma Structure Profile hash equals the Section Manifest/Run Record lineage.
3. Confirm code starts from the verified foundation commit.
4. Confirm section ID and PC/SP node IDs match both Section Manifest and Structure Profile.
5. Confirm allowed write paths, shared read-only paths, parallel group, and isolation identity.
6. Confirm recommended_translation_mode is resolved for this active section.

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
5. Describe behavior at the Shared Contract breakpoint(s).

Breakpoint rule:
- Use Shared Contract values/query semantics exactly.
- Do not infer a replacement threshold from visual breakage.
- Material exception → PROPOSE_BREAKPOINT_EXCEPTION with evidence; do not implement it.

Codebase inspection:
1. Read only component/token/helpers required by Shared Contract resolutions and this section.
2. Confirm resolved shared components/tokens are actually reusable at the pinned foundation commit.
3. Do not create a duplicate mapping decision locally.
4. Confirm all planned writes stay within allowed paths.

Return exactly:
- Section reference summary
- Translation mode + reasoning used
- Trusted structure used
- UNDETERMINED/untrusted structure and fallback chosen
- Shared component/token resolutions to reuse
- Section-local component/layout plan
- Responsive behavior at shared breakpoint(s)
- Exact assets/crop
- States/behaviors
- Material unresolved items
- Proposed shared changes, if any
- Proposed breakpoint exception, if any
- Risks likely to cause mismatch
- Evidence/context actually inspected

Stop after the brief. Do not implement yet.
```

## Pass condition

- exact section/reference/profile lineage is confirmed
- translation mode guides retrieval/translation without overriding the reference
- UNDETERMINED is handled conservatively rather than as NONE
- component/token resolutions are reused instead of re-decided
- responsive behavior uses the shared breakpoint contract
- no shared value/breakpoint was silently invented
- no code was changed
