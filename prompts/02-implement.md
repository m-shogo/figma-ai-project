# Phase 02 — Implement

目的: Inspect phaseの契約から、**人間の途中介入なしで first-pass を作る**。

## Prompt

```text
Implement the frozen Figma reference using the approved Inspect brief.

Source of truth order:
1. frozen reference manifest
2. owner notes tied to that reference
3. Figma structured context
4. existing repository contracts that must be preserved
5. reference screenshots
6. your inference

Rules:
- Do not redesign or "improve" the UI.
- Reuse existing components/tokens/utilities when the Inspect brief identified valid matches.
- Do not create duplicate design-system primitives unless the reference truly requires something missing.
- Preserve routing, state, data, and accessibility conventions in the repository.
- Treat PC/SP/reference frames as expressions of one responsive system, not separate hardcoded pages.
- Implement explicit responsive invariants from the brief.
- If a material UNKNOWN remains, choose the least-invasive implementation and record the assumption.
- Do not replace native UI with screenshots/images.
- Do not overfit only the exact screenshot viewport with brittle absolute positioning.
- Keep the change scoped to the target design reproduction.

First-pass preservation:
- Complete one coherent implementation pass.
- Run only basic build/type/lint checks needed to make the pass runnable.
- Do not perform visual repair yet.
- Stop before iterative visual tuning.

At the end report:
- files changed
- existing components/tokens reused
- new components/tokens created and why
- responsive rules implemented
- assumptions made
- basic verification status
- exact point that should be recorded as FIRST_PASS

Do not begin visual repair in this phase.
```

## Pass condition

- runnable first-pass exists
- scope is limited
- known project components/tokens are reused where appropriate
- first-pass can be captured before repair
