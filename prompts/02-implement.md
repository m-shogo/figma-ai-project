# Phase 02 — Section Implement

目的: Section Inspect briefから、**人間の途中介入なしで担当sectionのfirst-passを作る**。

## Prompt

```text
Implement only the assigned Figma section using the approved Section Inspect brief.

Inputs:
- frozen reference manifest: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- verified foundation commit: <FOUNDATION_COMMIT>
- section manifest entry: <SECTION_ENTRY>
- approved inspect brief: <INSPECT_BRIEF>

Source of truth order:
1. frozen reference + owner/company/design guidance
2. frozen shared contract
3. section manifest
4. Figma structured context for the assigned section
5. existing repository contracts/components
6. reference screenshots
7. your inference only for non-material unresolved details

Scope rules:
- Modify only section manifest allowed paths.
- Treat shared files as read-only.
- Do not edit root composition.
- Do not edit other sections.
- Do not redesign or "improve" the UI.
- Reuse existing/shared components, tokens, fonts, and utilities.
- Do not create duplicate design-system primitives.

Breakpoint rules:
- Use the Shared Contract breakpoint values/query semantics exactly.
- Implement section-specific behavior at those shared boundaries.
- Do not add a new local breakpoint.
- If a new threshold appears necessary, stop that change and report PROPOSE_BREAKPOINT_EXCEPTION with evidence.

Shared-change rules:
- If a missing shared token/component/layout primitive is required, do not mutate shared files.
- Report PROPOSE_SHARED_CHANGE with the minimal requested change and affected sections.

Responsive rules:
- Treat PC/SP as one responsive section implementation.
- Preserve Figma ordering, visibility, wrapping, layout, and crop behavior.
- Use intrinsic CSS where it matches the reference without inventing a new breakpoint.

Implementation quality:
- Preserve semantic HTML/accessibility conventions.
- Do not replace native UI with screenshots/images.
- Avoid brittle screenshot-only absolute-position hacks unless the design intentionally overlaps/layers elements.
- Keep image assets/crops faithful to the reference.

First-pass preservation:
- Complete one coherent section implementation pass.
- Run only basic checks required to make the section runnable.
- Do not perform iterative visual tuning.
- Stop before repair.

At the end report:
- section ID
- files changed
- confirmation all paths were allowed
- shared components/tokens reused
- local components created and why
- shared breakpoint behavior implemented
- assumptions
- proposed shared changes/exceptions
- basic verification status
- exact FIRST_PASS commit/state

Do not begin visual repair.
```

## Pass condition

- runnable section first-pass exists
- all writes are section-scoped
- shared contract/foundation remain unchanged
- specified breakpoint contract is respected
- first-pass can be captured before repair
