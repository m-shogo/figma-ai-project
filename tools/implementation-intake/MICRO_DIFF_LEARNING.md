# Pixel-Difference Learning — subpixel through major

Fast Visual QA must not choose between two bad extremes:

1. ignoring geometry differences because they look small, or
2. repairing pixel values blindly without understanding the cause.

This companion step records **every numeric pixel delta** and uses both absolute size and relative impact to decide where to inspect first.

## Absolute severity bands

- `< 1px`: `subpixel`
- `1px <= abs(delta) <= 4px`: `micro`
- `4px < abs(delta) <= 8px`: `small-material`
- `8px < abs(delta) <= 16px`: `material`
- `> 16px`: `major`
- **4px is explicitly included in `micro`.**

The old 1–4px learning behavior remains valid; larger differences now get finer severity instead of all collapsing into one `material` bucket.

## Relative impact

Absolute pixels are not enough.

A 5px difference on a 1000px section is not equivalent to a 5px difference on a 20px control. When a trustworthy reference size is available, the analyzer computes:

`relativePercent = abs(deltaPx) / referenceSizePx * 100`

Relative bands are:

- `>= 2%`: at least `micro`
- `>= 5%`: at least `small-material`
- `>= 10%`: at least `material`
- `>= 25%`: `major`

`impactKind` is the stronger of the absolute band and relative band. `absoluteKind` is always preserved, so learning can distinguish “2px absolute” from “18% of a tiny control”.

This does **not** mean a relatively large tiny-element delta should be auto-fixed. A micro/subpixel delta escalated by relative size routes to small-element scale/rasterization diagnosis first because icon/vector/DPR behavior may be the true cause.

## Current REF-001 grounding

The policy was checked against the current Figma file and committed REF-001 reference geometry without modifying V2/V3.

Live Figma read-back confirmed examples including:

- Reason `21378:7999`: `1160×559`
- Education `21378:7868`: `1380×684`
- Student Voice `21378:7766`: `1160×1393`
- Education check icon `21378:7875`: `11×10`

The committed manifest independently records the same authored section heights used by the existing read-only probe adapter.

The current authored V2 endpoints are aligned, so CI must not damage V2 just to manufacture larger mismatches. Instead, the dedicated smoke test performs **controlled fault injection** over real reference dimensions:

- Reason: `+5px`
- Education: `+8px`
- Student Voice: `+16px`
- Messages: `+24px`
- Education 11px check icon: `+2px`

The section faults exercise `small-material`, `material`, and `major`. The 2px icon fault proves that a `micro` absolute delta can become `material` impact because it is roughly 18% of the authored element width.

The experiment is explicitly marked `mutatesV2: false`.

## Repetition / structural learning

Repetition is evaluated across **unique sections**, not raw occurrence count.

The same viewport + category + property + direction appearing in at least two sections becomes a `structuralCandidate`.

- Opposite directions remain separate patterns.
- Multiple occurrences inside one section do not by themselves prove a shared cause.
- A repeated pattern routes to shared-root-cause inspection before local repair regardless of raw pixel size.

This catches patterns such as:

- repeated container offset;
- shared line-height or typography drift;
- repeated section spacing/token errors;
- reusable component sizing errors;
- page coordinate normalization mistakes;
- repeated image crop or scale behavior.

## Repair routing

### Subpixel

`record-subpixel-and-check-rendering`

Check DPR, anti-aliasing, font rasterization, transforms, fractional coordinates, borders/strokes and browser rendering before adding magic numbers.

### Micro — 1–4px

`record-before-local-repair`

Keep the evidence even when it is not repaired immediately. If it repeats, escalate to shared-root-cause inspection.

### Small material — >4–8px

`inspect-cause-then-repair`

The difference is normally worth fixing, but identify whether it belongs to spacing, size, typography, image behavior or parent layout before editing the raw value.

### Material — >8–16px

`inspect-cause-before-priority-repair`

Treat it as a priority visual mismatch. Verify the smallest correct repair scope and re-run the affected section/checkpoint.

### Major — >16px

`diagnose-structure-before-value-edit`

Do not start by subtracting the measured number from CSS. Inspect likely structural causes such as:

- wrong parent/container geometry;
- missing/extra content;
- wrong breakpoint/composition;
- incorrect font/line-height causing growth;
- absolute-positioning reference mismatch;
- asset/mask/object-fit interpretation;
- Figma device-chrome or coordinate normalization;
- one local boundary jump propagating downstream.

### Relative escalation on a small element

`inspect-small-element-scale-or-rasterization-before-repair`

Use this when an apparently tiny px delta is a large fraction of the authored element. Check SVG/vector geometry, stroke placement, intrinsic image size, scaling and DPR before local nudging.

### Repeated pattern across sections

`inspect-shared-root-cause-before-local-repair`

Shared evidence overrides the temptation to patch every section independently.

## Workflow

Feed one report, a list of reports, or an aggregate object with `reports` / `sections` into:

```bash
python3 tools/implementation-intake/micro_diff.py qa-reports.json \
  --output /tmp/pixel-diff-learning.json
```

The historical filename is retained to avoid a duplicate framework or migration churn. Its responsibility is now broader than micro differences.

Output contains:

- every numeric `deltaPx` observation;
- `absoluteKind` and `impactKind`;
- optional `referenceSizePx` and `relativePercent`;
- relative escalation state;
- viewport, category, property and direction;
- grouped repeated patterns;
- unique affected sections;
- structural-candidate classification;
- accepted/rejected/no-change repair outcomes;
- cause-oriented next action;
- severity-count summaries.

## Learning from repairs

A report may optionally carry:

```json
{"repairOutcome":"accepted"}
```

Supported learning buckets are `accepted`, `rejected`, `no-change`, and `unknown`.

This does **not** create an automatic global rule from one project. It preserves evidence so future projects can compare when a 2px, 8px or 24px correction helped, hurt, or merely moved the error elsewhere.

## Verified V2 repair outcomes

The routing rules are also grounded in measured V2 repair history, not only synthetic thresholds.

### Accepted: PR #134 — Education header geometry

A narrowly scoped CSS-only repair moved only the PC Education title/intro visual groups to authored positions while preserving the already-aligned cards and editable HTML/ACF flow.

Measured Figma diff improved from **6.96% to 5.44%**. A more literal authored line-break experiment measured **5.61%** and added flow-compensation complexity, so that variant was rejected before merge.

Learning:

- fix the smallest correct owner;
- preserve already-aligned descendants;
- preserve semantic/editable flow when a visual offset can solve the mismatch;
- a more literal Figma text structure is not automatically the better Web representation.

### Rejected: PR #136 — SP Main Visual speech unions

The authored two-Union geometry was implemented and passed CI, but runtime comparison regressed from **7.96% to 8.13%**, and the CTA/bubble-local diff also increased. The experiment was intentionally not merged.

Learning:

- “more structurally literal” is not the same as “more visually faithful”;
- measure after every meaningful repair;
- rejected repairs are valuable negative evidence;
- do not keep a candidate just because it matches Figma layer construction more literally;
- when a repair increases threshold-visible pixels, restore the previous representation and re-diagnose the cause.

These outcomes reinforce why severity determines **diagnostic urgency**, not an automatic CSS delta to apply.

## Guardrail

Pixel-difference learning supplements the existing Repair Stop rule.

We still inspect 1px, 4px and larger differences. The stop condition only prevents blind low-gain repair loops. A rejected fix remains valuable evidence and should improve the next diagnosis rather than disappear.

The goal is higher fidelity, better root-cause knowledge and fewer wasted repairs—not tolerance for visual mismatch and not governance for its own sake.
