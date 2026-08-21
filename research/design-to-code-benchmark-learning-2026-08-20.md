# Design-to-Code Benchmark Learning — 2026-08-20

Status: external research evidence / benchmark implications

Purpose: use current academic and public benchmark work to improve how `figma-ai-project` evaluates Figma-to-Web implementations. The objective is not to optimize for a leaderboard. It is to avoid known evaluation traps and learn which failure modes repeatedly appear across independent research.

## 1. Figma2Code: rich metadata helps, but does not solve production quality

Source:

- https://arxiv.org/abs/2604.13648
- ICLR 2026 / OpenReview: https://openreview.net/forum?id=CaXZB6bI31

Figma2Code evaluates multimodal design-to-code using screenshots plus Figma metadata/assets rather than screenshot-only input.

Key result relevant to this project:

- proprietary models can achieve strong visual fidelity
- layout responsiveness remains weak
- code maintainability remains weak
- one reason is a tendency to map primitive visual attributes from Figma metadata directly into generated code

### Implication

Structured Figma context is necessary evidence, but **more metadata is not automatically better implementation reasoning**.

Keep the separation:

```text
Figma visual truth
+ Figma structured evidence
≠ Web implementation mechanism
```

The implementation agent must infer intent and adapt to Existing Project constraints rather than transcribing metadata.

## 2. FigmaBench: fidelity-responsiveness paradox / metadata trap

Source:

- https://openreview.net/pdf?id=VCyvem1v0R

FigmaBench evaluates design-to-code with multiple axes including visual consistency, structural layout alignment, textual/stylistic fidelity, and responsive quality.

The paper reports a **fidelity-responsiveness paradox**: systems with stronger visual fidelity can generate more rigid, less responsive code.

It attributes part of this to a **metadata trap** where models shortcut layout reasoning by transcribing absolute coordinates.

### Implication

This directly supports existing project rules:

- Figma rendered coordinates are not automatically Web constraints
- absolute positioning is not banned, but must follow art-direction/layout intent
- endpoint screenshot fidelity and intermediate-width resilience are separate axes
- one large visual similarity score cannot represent production quality

### Evaluation consequence

A result cannot be called FINAL from PC/SP screenshot parity alone.

Relevant scope needs both:

```text
endpoint visual fidelity
AND
responsive/runtime resilience
```

## 3. VISTA: visual fidelity and functional correctness are partially decoupled

Source:

- https://arxiv.org/abs/2605.26144

VISTA evaluates end-to-end web-app agents under several prompt/input conditions, including screenshot + pruned Figma structure.

Its evaluation combines:

- DOM-grounded reference matching
- behavior-specific browser tests
- visual similarity

A useful reported finding is that visual fidelity and functional correctness are partially decoupled.

### Implication

Do not use screenshot parity as proof that interaction/runtime behavior is correct.

Our QA lanes should remain separate:

```text
Visual
Structure/Semantics
Interaction/Behavior
Runtime/Resilience
Human Repairability
```

Only relevant lanes run for a given section/project, but one lane cannot silently stand in for another.

## 4. DesignCoder: hierarchical decomposition + self-correction is promising

Source:

- https://www.sciencedirect.com/science/article/abs/pii/S095058492600203X

DesignCoder reports gains from:

- hierarchy-aware functional grouping
- recovering component/region structure
- vision-guided iterative self-correction
- local repair of visual and structural defects

### Implication

This supports two existing directions:

1. semantic section/component decomposition before implementation
2. verify → diagnose → local repair rather than full-page regeneration

Do not copy the paper's specific algorithm blindly. The reusable idea is the **decomposition + local verification loop**.

## 5. ReDesign: local graceful verification avoids error accumulation

Source:

- https://arxiv.org/abs/2607.25565

ReDesign addresses image → editable design reconstruction, not Web implementation, but its workflow is relevant.

It grows an editable hierarchy incrementally and verifies each expansion with local accept/prune/retry decisions so errors do not accumulate into a large rerun.

### Transferable pattern

```text
small meaningful expansion
→ verify locally
→ accept / repair / retry
→ continue
```

This independently supports section-first/local-verify architecture.

It also evaluates **editability**, not only screenshot fidelity. That is conceptually close to this project's Human Repairability objective.

## 6. Public fidelity benchmarks expose an important metric limitation

Some public commercial/practitioner benchmarks explicitly acknowledge that pixel/placement fidelity does not tell you whether code is maintainable.

Example:

- https://oneredesign.com/benchmark/

This distinction matters even when the source is not an academic authority.

### Implication

Never collapse:

```text
pixel accuracy
responsive quality
semantic quality
maintainability
```

into one universal score.

A composite dashboard may summarize them, but raw axes and evidence remain available.

## 7. What this changes in our evaluation philosophy

The external research points toward a multi-axis model.

### A. Visual Fidelity

Examples:

- layout geometry
- typography
- assets
- color/effects
- decoration

### B. Responsive / Structural Quality

Examples:

- intermediate widths
- content growth
- flow/flex/grid behavior
- avoid accidental coordinate transcription
- DOM/source-order integrity

### C. Functional Correctness

Examples:

- click/tap behavior
- state transitions
- keyboard/focus
- forms
- loading/error states

### D. Maintainability / Repairability

Examples:

- canonical ownership
- Existing component reuse
- no final-fix archaeology
- understandable class/component structure
- simple future edits
- Human Correction Count/Minutes

No single axis is allowed to hide failure in another relevant axis.

## 8. New diagnostic pattern: detect coordinate transcription, do not ban absolute

External research warns about primitive coordinate copying, but a simple `position:absolute` percentage would create false conclusions because intentional art direction legitimately uses absolute positioning.

Candidate diagnostic:

```text
coordinate-transcription smell
= many reference-derived fixed x/y offsets
+ weak relational/container ownership
+ poor intermediate-width behavior
+ repeated breakpoint patches
```

This is a **diagnostic smell**, not a hard lint rule.

Evidence required before promotion:

- real project failure
- intermediate-width reproduction
- root cause confirms coordinate transcription
- alternative relational implementation reduces rework

## 9. Benchmark lesson: preserve raw evidence

External benchmarks are most useful when inputs, outputs, diffs, and scoring criteria are visible.

Our run evidence should preserve enough information to audit conclusions:

- Figma node/file identity
- Figma structured-context capability tier
- reference/export assets used
- implementation commit
- viewport/browser/font environment
- screenshots/diffs
- runtime checks
- root-cause category
- human correction evidence when measured

Do not publish a score without the evidence needed to challenge it.

## 10. Experiments suggested by the literature

### EXP-BENCH-01 — metadata richness vs coordinate transcription

Compare the same design/task with controlled context tiers where practical:

- screenshot only
- screenshot + structured Figma context
- structured context + Existing project rules/component mapping

Measure:

- visual fidelity
- responsive failure count
- coordinate-transcription smell
- component reuse
- Human Correction Count

### EXP-BENCH-02 — endpoint-only vs intermediate QA

Run endpoint PC/SP parity first, then add intermediate widths.

Measure how many failures would have been missed by endpoint-only QA.

### EXP-BENCH-03 — full-page repair vs section-local repair

After introducing matched defects, compare:

- full page regeneration/rewrite
- root-cause section-local repair

Measure:

- unrelated regression count
- changed files/owners
- correction time
- final fidelity

### EXP-BENCH-04 — repairability as independent axis

Take two implementations with similar screenshot fidelity but different ownership/architecture.

Perform controlled changes:

- copy length change
- repeated item count change
- image replacement
- one spacing/token change

Measure:

- files touched
- CSS/component diff size
- accidental regressions
- human correction minutes

## 11. Current conclusion

Independent 2026 research repeatedly points to the same core risk:

**high visual fidelity can be achieved by brittle mechanisms.**

Therefore the target for this project remains:

```text
Figma-high fidelity
+ responsive/runtime correctness
+ Existing-project fit
+ human repairability
+ evidence-backed learning
```

The project should learn from benchmark metrics, but not optimize for a benchmark at the expense of production code.
