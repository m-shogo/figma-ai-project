# Phase 03 — Section Verify

目的: **Section FIRST_PASSを変更せず、Referenceとの差分・Company/Environment Contract違反を証拠付きで確定する。**

このphaseでは原則コード修正禁止。

## Prompt

```text
Verify the recorded SECTION FIRST_PASS against the frozen Figma reference, ACTIVE Company Policy, and frozen Shared/Environment Contracts.

Do not repair code in this phase.
Do not redesign the reference.
Your job is diagnosis and evidence collection only.

Inputs:
- run record: <RUN_RECORD>
- ACTIVE Company Policy: <COMPANY_POLICY>
- Company Policy SHA-256: <COMPANY_POLICY_HASH>
- frozen reference: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- resolved Environment Contract: <ENVIRONMENT_CONTRACT>
- section manifest entry: <SECTION_ENTRY>
- first-pass commit/state: <FIRST_PASS_REF>
- target route: <TARGET_ROUTE>

Consistency verification first:
1. Confirm Company Policy id/path/hash match Run Record + Shared Contract.
2. Confirm Environment Contract is RESOLVED and required/canonical profile ids match Company Policy.
3. Confirm Shared Contract hash matches the run/section manifest.
4. Confirm the run started from the verified foundation commit.
5. Confirm changed files are within allowed paths.
6. Confirm shared foundation/environment files were not mutated by the Section worker.
7. Confirm no unapproved breakpoint/device/UA rule was added.

Environment-aware capture plan:
- Canonical environment: detailed Section visual comparison is required.
- Other REQUIRED environments: capture this Section when the Environment Contract, code path, interaction, viewport, input capability, or reference behavior differs materially from canonical.
- Do not duplicate identical Section screenshots across every device profile without a reason.
- Record the exact environment profile id for every capture.
- Required interaction states must be checked in every relevant REQUIRED environment.
- Full Page ALL_REQUIRED coverage belongs to Integration verification, not this Section-only phase.

Visual verification:
1. Render exact acceptance viewport/state in the canonical browser/OS/DPR environment.
2. Capture deterministic implementation screenshots.
3. Compare against exact section reference screenshots.
4. Verify shared breakpoint boundaries separately from input capability behavior.
5. Capture additional REQUIRED environments when environment-sensitive behavior exists.
6. Inspect intermediate widths only when required by Reference/Contract.

Environment-sensitive verification when relevant:
- `hover`/`pointer` vs `any-hover`/`any-pointer`
- touch fallback / gesture ownership
- `prefers-reduced-motion`
- safe-area insets
- `svh/lvh/dvh` / fullscreen behavior
- software keyboard / visual viewport
- fixed/sticky UI
- scroll lock / overscroll
- form-control appearance/text sizing
- scrollbar-induced layout shift
- color gamut/material gradient or image differences
- forced-colors/contrast states where Company Policy requires them

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
- Company Policy compliance
- Environment Contract compliance
- existing/shared component reuse
- token/theme reuse
- breakpoint contract compliance
- input capability detection correctness
- duplicate shared primitives
- semantic/accessibility structure
- allowed-path isolation

For every material mismatch, create a failure candidate containing:
- observation
- section ID
- environment profile id
- viewport/state
- severity S0-S4
- primary failure taxonomy category
- secondary categories if useful
- reference evidence
- implementation evidence
- likely root cause
- root-cause confidence HIGH/MEDIUM/LOW
- smallest repair scope

Distinguish root cause classes such as:
- SECTION_VISUAL
- BREAKPOINT
- INPUT_CAPABILITY
- DEVICE_ENVIRONMENT
- SAFE_AREA_VIEWPORT
- TOUCH_GESTURE
- SCROLL_LOCK
- COMPANY_POLICY
- EXISTING_COMPATIBILITY
- FIGMA_AMBIGUITY

Then produce:
1. Section First-pass Fidelity using docs/evaluation-rubric.md
2. Company/Environment Contract Compliance diagnostics
3. Canonical environment result
4. Additional REQUIRED environment results and why they were tested
5. Ordered failure list
6. Failures safe to repair independently
7. Failures that require coordinator/shared/environment change
8. Any breakpoint/environment exception proposal with evidence
9. Any reference ambiguity discovered

Stop after diagnosis. Do not change code.
```

## Why no repair here

VerifyとRepairを同時に行うと:

- original mismatchが消える
- contract violationの発生源が追えない
- repair前後の比較ができない
- environment-specific root cause attributionが弱くなる

診断を固定してから次phaseへ進む。
