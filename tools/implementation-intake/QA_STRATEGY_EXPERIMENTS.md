# QA Strategy Experiments

This file records **provisional QA strategies to test in real Figma implementation work**.

Nothing in this file is a permanent global standard. A strategy may be promoted, changed, scoped to certain project types, or removed after real implementation evidence.

## Candidate A — Section-first QA with final full-page verification

Status: `provisional`

### Hypothesis

For Figma-to-Web implementation, iterating on one section at a time may improve fidelity and speed because the implementation and visual comparison stay locally scoped, while a final full-page pass catches cross-section drift that section-only checks cannot see.

### Candidate flow

```text
Light whole-page reconnaissance
  ↓
Section observation
  ↓
Section implementation
  ↓
Section capture / compare
  ↓
Local correction
  ↓
Next section
  ↓
Occasional checkpoint across several completed sections
  ↓
Final PC/SP full-page comparison
  ↓
Diff diagnosis
  ↓
Return only to affected section/shared rule
  ↓
Final full-page QA
```

### Important non-rules

- Do **not** force every section through the same number of QA iterations.
- Do **not** require every section to reach an arbitrary score before moving on.
- Do **not** assume section-first is always faster than whole-page iteration.
- Do **not** run full-page pixel diff after every small edit.
- Do **not** treat checkpoint frequency as fixed.

### Adaptive depth candidate

A simple section may need only quick geometry/overflow review.

A structurally risky section may justify deeper QA when evidence shows complexity such as:

- heavy absolute positioning
- masks/composites
- large PC/SP structural differences
- slider/interaction behavior
- unusual typography
- overlapping layers
- raster/vector composition

This is a prioritization hint, not a mandatory score system.

### Diff diagnosis candidate

When full-page QA finds a problem, prefer diagnosing the pattern before editing:

- local difference → inspect that section
- same difference across many sections → inspect shared container/token/rule
- drift increasing down the page → inspect cumulative spacing/height
- desktop-only difference → inspect desktop rule
- mobile-only difference → inspect mobile rule

### What to measure in real projects

For each implementation, record only lightweight evidence:

- approximate implementation/review time
- number of major rework loops
- number of full-page captures
- whether section QA found issues earlier
- whether final full-page QA found cross-section issues
- whether the strategy felt too heavy or too light
- final visual fidelity outcome

The goal is **higher fidelity with less wasted checking**, not maximizing the number of QA steps.

### Promotion criteria

Promote this toward a default only if repeated real projects show that it improves the combination of:

1. Figma fidelity
2. implementation speed
3. rework reduction
4. human maintainability

If evidence is mixed, keep it project-conditional rather than universal.

## Governing principle

`figma-ai-project` should optimize for **best practical Figma reproduction**, not maximum process.

Use the minimum confirmation that materially reduces expected rework. Quality remains the goal; process is only valuable when it helps reach that goal faster or more reliably.
