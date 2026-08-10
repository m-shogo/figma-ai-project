# Prompt Pattern — Figma → Code

このファイルは完成promptではなく、実験で更新するベースライン。

## Baseline

```text
Implement the specified Figma node in the existing application.

Primary goal:
- Match the reference visually at the required Desktop and Mobile viewports.
- Preserve the design structure rather than approximating the screenshot.
- Minimize human rework after your first pass.

Before editing code:
1. Inspect the target Figma node using structured design context.
2. Identify components, variants, variables/tokens, typography, assets, Auto Layout/sizing, and responsive behavior.
3. Inspect the existing codebase and reuse existing components/tokens when they correspond to the design.
4. State only material ambiguities that cannot be resolved from Figma or the codebase. Otherwise proceed.

Implementation rules:
- Do not treat Desktop and Mobile as unrelated hardcoded pages.
- Infer and implement the responsive rules that connect them.
- Reuse existing project components before creating duplicates.
- Reuse design tokens instead of introducing near-duplicate raw values when possible.
- Preserve semantic HTML and accessibility.
- Do not use screenshot/image replacement for UI that should be native code.
- Do not make unrelated design improvements; the reference is the target.

Verification:
1. Render the exact required Desktop viewport.
2. Render the exact required Mobile viewport.
3. Check at least one intermediate width.
4. Compare geometry, spacing, typography, colors/effects, assets/crop, wrapping, and responsive order.
5. Fix visible or structural mismatches before declaring completion.

At the end report:
- files changed
- reused components/tokens
- responsive rules implemented
- remaining mismatches or uncertainties
- any deliberate deviation from Figma and why
```

## Variables to supply per experiment

```text
FIGMA_URL=
FIGMA_NODE=
DESKTOP_VIEWPORT=
MOBILE_VIEWPORT=
INTERMEDIATE_VIEWPORT=
TARGET_ROUTE=
FRAMEWORK=
MAX_REPAIR_ROUNDS=
```

## Research notes

評価時は、以下の変更を一度に混ぜず A/B する。

- screenshot only vs structured context
- structured context vs context + Code Connect
- generic prompt vs explicit responsive contract
- one huge prompt vs inspect → implement → verify stages
- agent self-review only vs screenshot comparison
