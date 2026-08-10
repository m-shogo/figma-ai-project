# Phase 03 — Verify

目的: **first-passを変更せずに、referenceとの差分を証拠付きで確定する。**

このphaseでは原則コード修正禁止。

## Prompt

```text
Verify the recorded FIRST_PASS against the frozen Figma reference.

Do not repair code in this phase.
Do not redesign the reference.
Your job is diagnosis and evidence collection only.

Reference:
- <REFERENCE_MANIFEST>
- exact Figma target(s): <FIGMA_TARGETS>

Implementation:
- first-pass commit/state: <FIRST_PASS_REF>
- target route: <TARGET_ROUTE>

Visual verification:
1. Render the exact acceptance viewport(s) from the reference manifest in a real browser.
2. Capture implementation screenshots using stable deterministic content.
3. Compare each capture against its exact reference screenshot.
4. If responsive behavior matters between endpoints, inspect the manifest-required intermediate widths.

Inspect at minimum:
- geometry / proportions / alignment
- spacing / rhythm
- typography / wrapping
- colors / opacity
- border / radius / effects
- exact assets and crop
- layer/stacking order
- visibility/order changes
- overflow/clipping
- interaction/state behavior required by the manifest

Structural verification:
- existing component reuse
- token/theme reuse
- responsive rule quality
- duplicate primitives
- semantic/accessibility structure
- repository architecture constraints

For every material mismatch, create a failure candidate containing:
- observation
- viewport/state
- severity S0-S4
- primary failure taxonomy category
- secondary categories if useful
- reference evidence
- implementation evidence
- likely root cause
- root-cause confidence HIGH/MEDIUM/LOW
- smallest repair scope

Then produce:
1. First-pass score using docs/evaluation-rubric.md
2. Ordered failure list (highest severity first)
3. Failures safe to repair independently
4. Failures that share one root cause
5. Any reference ambiguity discovered

Stop after diagnosis. Do not change code.
```

## Why no repair here

VerifyとRepairを同時に行うと:

- original mismatchが消える
- repair前後の比較ができない
- どのroot causeが効いたか分からない

診断を固定してから次phaseへ進む。
