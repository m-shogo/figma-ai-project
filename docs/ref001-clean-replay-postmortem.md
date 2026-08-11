# REF-001 Blind Clean Replay — Post-hoc Learning Review

Date: 2026-08-12

This document is **post-hoc analysis**. Historical repaired REF-001 evidence was intentionally not reopened until the Blind Clean Replay had already been frozen, finalized, merged, and recorded as `BLIND_CONTEXT_CLEAN`.

The purpose here is not to improve the completed run retroactively. It is to decide which observations have enough independent evidence to become reversible E2 Candidate Rules and which must remain lower-maturity observations.

## Clean Replay result

Canonical result:

- run: `RUN-REF001-BLIND-CLEAN-20260812-A`
- FIRST PASS code: `46eb326383ac7aff1cb023100a801b968df9f9bc`
- final implementation code: `4974d36eb4775ce01d9ebde3d9dc8ca24aa9193f`
- post-freeze visual repair rounds: `2`
- FIRST PASS fidelity: `57 / 80`
- final fidelity: `67 / 80`
- Human Editability: `10 / 10`
- owner-blocking questions: `0`
- interaction inventions: `0`
- CMS inventions: `0`

Exact acceptance endpoints after repair:

- PC `1380px`: body-height delta `0`, section-top MAE `0`, section-height MAE `0`
- SP `375px`: Figma Web-content height `10777px` = Web `10777px`, section-top MAE `0`, section-height MAE `0`
- Figma-only SP device chrome (`Status-Bar_W`, `40px`) is not implemented as Web content

Runtime-safety probes:

`320 / 360 / 375 / 390 / 430 / 767 / 768 / 769 / 1024 / 1200 / 1380`

All recorded:

- horizontal-overflow failures: `0`
- readable-text clipping failures: `0`
- missing-primary-font failures: `0`
- runtime-error failures: `0`
- `767 / 768 / 769` breakpoint boundary: `PASS`

Canonical evidence:

- `experiments/ref001-blind-clean-20260812/run.yaml`
- `experiments/ref001-blind-clean-20260812/run.first-pass.json`
- `experiments/ref001-blind-clean-20260812/evidence/first-pass-measurement.yaml`
- `experiments/ref001-blind-clean-20260812/evidence/final-measurement.yaml`
- `experiments/ref001-blind-clean-20260812/evidence/human-editability-drills.json`

## What reproduced strongly enough for E2

### 1. Static Figma frame fidelity and browser runtime safety are different acceptance layers

Historical REF-001 evidence already recorded a concrete failure where `white-space: nowrap` was temporarily used only to imitate one static screenshot more closely. It was removed because it overfit fallback-font metrics and could create runtime overflow.

The Blind Clean Replay independently preserved exact endpoint geometry while keeping all required runtime widths free from horizontal overflow and readable-text clipping.

Promoted candidate:

- `playbook/candidates/cr-ref001-001-static-frame-vs-runtime.yaml`

### 2. Visible affordance/state is not enough evidence for interaction behavior or hidden records

Historical REF-001 evidence kept Student Voice interaction `UNDETERMINED` when only open/collapsed visual states existed, and did not invent Messages records 2–4 from the visible `1 / 4` counter.

The Blind Clean Replay independently made the same conservative decision and recorded:

- `interaction_inventions: 0`
- `cms_inventions: 0`

Promoted candidate:

- `playbook/candidates/cr-ref001-002-evidence-gated-interaction.yaml`

### 3. Visual repetition is not sufficient evidence for a reorderable CMS collection

Historical REF-001 evidence distinguished visual repetition from editor cardinality/reordering requirements and kept Reason/Education fixed-cardinality where semantics supported it.

The Blind Clean Replay independently retained:

- fixed Reason cardinality
- semantic Education `01 -> 04` ordering
- seven code/domain-owned Courses identities/order/colors
- zero CMS inventions
- Human Editability `10 / 10`

Promoted candidate:

- `playbook/candidates/cr-ref001-003-visual-repetition-vs-cms-cardinality.yaml`

## Important observations that are **not** promoted yet

### Composite media transport

Historical evidence established that some final visible visuals are composites of multiple IMAGE fills and cannot be represented faithfully by one arbitrary raw `imageHash`.

The Blind Clean Replay also observed layered/composited media ownership, but durable source-byte transfer from Figma was unavailable in the execution environment. The final run therefore remained deliberately conservative at `67 / 80`, with the media blocker open.

This is useful evidence, but the clean replay did **not** reproduce a completed durable asset-transfer solution. Do not promote a transport rule yet.

Next proof needed:

- a clean, secret-safe, durable transfer of Figma raw/composite bytes into the implementation repository or an approved asset store
- repeatable hashes/manifest lineage
- no short-lived URL committed to Git history
- visual evidence showing the transferred composite reproduces the supplied final visible result

### Outer section gap vs internal padding

The Blind Clean Replay's first post-freeze repair found that several vertical geometry errors came from representing Figma section-external spacing as section-internal padding. Separating those concepts allowed endpoint geometry to reach `0px` delta.

This is currently **one-run repair evidence**. It stays an observation until reproduced in another controlled run/reference.

### Persistent asset transfer as a preflight gate

The media blocker dominated the remaining visual score gap, but one blocked run is not enough to make a universal start gate. Different projects may already have assets in the target repository, DAM, CMS, or local filesystem.

Current stance: detect and record asset-transfer capability early, but do not universally block all implementation work when media transfer is unresolved.

### Production WordPress integration

The replay intentionally used an isolated WordPress-compatible fixture because the actual production theme repository, route/template, versions, and ACF admin runtime were not supplied.

No production integration rule is promoted from this benchmark. Existing-project reconnaissance remains authoritative when a real target repository is connected.

## Historical comparison boundary

The historical repaired fixture did not preserve an immutable formal FIRST PASS before its repair sequence. Therefore this post-hoc review does **not** fabricate an old numeric first-pass score or repair-round delta.

Allowed comparison here is categorical:

- did a failure/decision recur?
- did the Blind Replay avoid the same unsupported invention?
- did the same boundary remain valid under fresh context?

The new run's own quantitative metrics remain canonical in `evidence/final-measurement.yaml`.

## Next evidence ladder

The three promoted rules are only `E2 / OPTIONAL`.

To move toward E3/E4:

1. repeat on a second agent/client without sharing repaired implementation output
2. repeat on a different Figma reference with different typography and content structure
3. record whether the candidate reduces failure count/rework without increasing human coordination cost
4. demote or rewrite any candidate that stops helping under newer Figma MCP/model/runtime behavior

The composite-media observation should get a dedicated asset-transfer experiment before promotion.
