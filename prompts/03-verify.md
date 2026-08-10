# Phase 03 — Section Verify

目的: **section first-passを変更せず、referenceとの差分とcontract違反を証拠付きで確定する。**

このphaseでは原則コード修正禁止。

## Prompt

```text
Verify the recorded SECTION FIRST_PASS against the frozen Figma reference and frozen Shared Contract.

Do not repair code in this phase.
Do not redesign the reference.
Your job is diagnosis and evidence collection only.

Inputs:
- run record: <RUN_RECORD>
- frozen reference: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- section manifest entry: <SECTION_ENTRY>
- first-pass commit/state: <FIRST_PASS_REF>
- target route: <TARGET_ROUTE>

Consistency verification first:
1. Confirm shared contract hash matches the run/section manifest.
2. Confirm the run started from the verified foundation commit.
3. Confirm changed files are within allowed paths.
4. Confirm shared files were not mutated.
5. Confirm no unapproved breakpoint was added.

Visual verification:
1. Render exact section/page acceptance viewport(s) in a real browser.
2. Capture implementation screenshots with deterministic content.
3. Compare against exact section reference screenshots.
4. Verify behavior at the specified shared breakpoint boundary when applicable.
5. Inspect additional intermediate widths only when required by the reference/contract.

Inspect at minimum:
- geometry / proportions / alignment
- spacing / rhythm
- typography / wrapping
- colors / opacity
- border / radius / effects
- exact assets / crop
- layer/stacking order
- visibility/order changes at shared breakpoint(s)
- overflow/clipping
- required state/interaction behavior

Structural verification:
- existing/shared component reuse
- token/theme reuse
- breakpoint contract compliance
- duplicate shared primitives
- semantic/accessibility structure
- allowed-path isolation

For every material mismatch, create a failure candidate containing:
- observation
- section ID
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
1. Section First-pass Fidelity using docs/evaluation-rubric.md
2. Contract Compliance diagnostics
3. Ordered failure list
4. Failures safe to repair independently
5. Failures that require coordinator/shared change
6. Any breakpoint exception proposal with evidence
7. Any reference ambiguity discovered

Stop after diagnosis. Do not change code.
```

## Why no repair here

VerifyとRepairを同時に行うと:

- original mismatchが消える
- contract violationの発生源が追えない
- repair前後の比較ができない
- root cause attributionが弱くなる

診断を固定してから次phaseへ進む。
