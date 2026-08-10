# Phase 01 — Section Inspect

目的: **担当sectionだけを、frozen shared contractとverified foundation上で実装できる状態まで理解する。**

このphaseではコード変更禁止。

## Prompt

```text
Inspect only the assigned Figma section for this reproduction run.

Do not edit code in this phase.
Do not inspect unrelated sections unless needed to resolve a shared dependency.
Do not redesign, simplify, or improve the reference.
Do not invent shared values or breakpoints.

Inputs:
- run record: <RUN_RECORD>
- frozen reference manifest: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- section manifest entry: <SECTION_ENTRY>
- verified foundation commit: <FOUNDATION_COMMIT>
- exact Figma section node(s): <SECTION_NODE_IDS>
- target route: <TARGET_ROUTE>

Preflight consistency:
1. Confirm the run uses the expected shared contract hash.
2. Confirm code starts from the verified foundation commit.
3. Confirm the section ID/node IDs match the section manifest.
4. Confirm allowed write paths and shared read-only paths.

Figma section inspection:
1. Retrieve structured design context for the exact section node(s).
2. If the section is still large, inspect child nodes progressively instead of requesting the entire page.
3. Inspect section-local:
   - component instances / variants / properties
   - relevant variables/tokens
   - typography
   - Auto Layout / Grid / fixed-hug-fill / min-max behavior
   - exact assets / crop
   - states / interactions / annotations
4. Inspect exact PC/SP section screenshots.
5. Describe what changes at the shared breakpoint(s).

Breakpoint rule:
- Use the Shared Contract values exactly.
- Do not infer or propose a different threshold just because the section might look better elsewhere.
- If the specified breakpoint appears to create a material issue, record evidence for PROPOSE_BREAKPOINT_EXCEPTION; do not implement it.

Codebase inspection:
1. Inspect only relevant existing shared components/tokens/helpers and target section files.
2. Identify exact shared components to reuse.
3. Confirm no duplicate component/token is needed.
4. Confirm the section can be implemented inside allowed paths.

Return exactly:
- Section reference summary
- Shared dependencies to reuse
- Section-local component/layout plan
- Responsive behavior at shared breakpoint(s)
- Exact assets/crop
- States/behaviors
- Material UNKNOWNs
- Proposed shared changes, if any
- Proposed breakpoint exception, if any
- Risks likely to cause mismatch
- Evidence/context actually inspected

Stop after the brief. Do not implement yet.
```

## Pass condition

- exact section/reference is identified
- contract hash/foundation are confirmed
- shared dependencies are mapped
- responsive behavior uses the shared breakpoint contract
- no shared value/breakpoint was silently invented
- no code was changed
