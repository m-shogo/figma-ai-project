# Phase 01 — Inspect

目的: **コードを触る前に、referenceと既存codebaseの実装契約を作る。**

このphaseではコード変更禁止。

## Prompt

```text
Inspect the frozen Figma reference and the existing codebase for this reproduction run.

Do not edit code in this phase.
Do not redesign, simplify, or improve the reference.
Do not invent missing design values when they can be retrieved from Figma or the repository.

Inputs:
- experiment/run metadata: <RUN_RECORD>
- reference contract: <REFERENCE_MANIFEST>
- Figma target: <FIGMA_URL / NODE_IDS>
- context tier: <CONTEXT_TIER>
- starting code commit: <STARTING_COMMIT>
- target route: <TARGET_ROUTE>

Figma inspection:
1. Retrieve structured design context for the exact target node(s).
2. If the result is too large/truncated, map structure first and fetch only relevant child nodes.
3. Inspect relevant components, variants/properties, variables/tokens, typography, Auto Layout/sizing, assets, annotations, and states available under this context tier.
4. Capture/inspect the exact reference screenshots required by the manifest.
5. Identify PC/SP or other responsive invariants from the provided reference; mark anything genuinely unresolved as UNKNOWN instead of guessing.

Codebase inspection:
1. Identify the existing target route/page entrypoint.
2. Find existing components that correspond to the Figma design.
3. Find existing tokens/theme/utilities that should be reused.
4. Find existing layout/routing/state/data patterns that must be preserved.
5. Do not create a parallel design system.

Return an implementation brief with exactly these sections:
- Reference summary
- Existing code reuse map
- Responsive invariants
- Exact assets to reuse
- States/behaviors to preserve
- Material UNKNOWNs
- Risks likely to cause visual/structural drift
- Proposed implementation boundaries

Also report the evidence/context you actually inspected so the run is reproducible.

Stop after the brief. Do not implement yet.
```

## Pass condition

Inspect phase is usable when:

- target reference is correctly identified
- existing reuse candidates are listed
- important responsive rules are explicit or marked UNKNOWN
- no design values were silently invented
- no code was changed
