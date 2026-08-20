# REF-001 V2 → V3 Frontend Learning — 2026-08-20

Status: observation evidence / no V2 or V3 production modification

This record compares existing REF-001 V2 completion evidence with the isolated V3 draft implementation to identify what improved first-pass implementation quality and human repairability.

It does not promote new rules by itself. Promotion still requires the repository evidence lifecycle.

## Scope protection

Compared only:

- merged V2 evidence / implementation history
- existing V3 draft docs and structure
- current Figma structured context

Not changed:

- REF-001 production
- V2 implementation/assets
- V3 branch/PR
- REF-002 production

## 1. High-level result

V2 and V3 optimize different axes.

V2 eventually achieved the stronger visual close-out.

V3 is structurally easier for a human to understand and repair, while remaining visually less closed than the completed V2 path.

Therefore the learning is not "V3 replaces V2".

The useful target is:

```text
V2 visual close-out discipline
+ V3 ownership / sectioning / source mapping / repairability
```

## 2. Evidence comparison

| Area | V2 evidence | V3 evidence | Learning signal |
| --- | --- | --- | --- |
| Final endpoint fidelity | PC/SP endpoint geometry closed tightly; V2 final evidence records exact body-height handling | V3 docs explicitly list remaining visual gaps | Keep V2 close-out discipline |
| Runtime widths | 320/360/375/390/430/767/768/769/1024/1200/1380 checked with zero overflow/readable clipping/image/runtime failures | 11-width local probes, zero overflow/image/runtime errors | Wide runtime probe discipline is useful on both |
| CSS ownership | giant base stylesheet + responsive/visual/human-review repair layers accumulated | section/style ownership split, one readable cascade | Avoid repair-layer archaeology |
| Section structure | section work existed, but final repair CSS crossed ownership boundaries | one PHP file per section and matching style ownership | Section owner should stay navigable after repair |
| Repeated UI | repeated CTA/heading markup partly inline | only actually repeated UI extracted | Reuse repeated UI without inventing fake generic components |
| Asset source | final V2 used exact Figma raster/vector evidence where needed | V3 reuses canonical WebP assets and maps slots to Figma nodes | Exact source reuse is stronger than redraw |
| Figma mapping | weaker source-node visibility in ordinary implementation | section/asset slots expose Figma node mapping | Source provenance reduces rediscovery cost |
| Content editability | V2 remained live content but repair history made visual ownership harder to trace | nested data files and section ownership make editor changes easier | Content source and visual owner should be obvious |
| Breakpoint | project-resolved 767/768 behavior | same resolved boundary; probe widths are not extra breakpoints | Probe widths must not become patch breakpoints |
| Human repairability | final result required repair-layer archaeology to understand some fixes | explicit goal and structure support local edits | Repairability is independent of visual score |

## 3. V2 strengths to preserve

### Section-by-section visual close-out

V2 final work did not stop at a generic full-page screenshot. It polished Header / MV / Reason / Education / Student Voice / Messages / CTA / Courses / Links / Footer individually and then verified integration.

Keep:

- section screenshot first
- exact endpoint comparison
- full-page integration after local causes are controlled
- multiple runtime widths

### Exact asset sourcing

V2 final evidence records exact Figma image-fill bytes for the shared CTA background and specific correction of vector/icon geometry.

Keep:

```text
source exists
→ reuse exact source
→ verify crop/mask/overlay behavior
→ do not approximate it merely because CSS can draw something similar
```

### Runtime acceptance separate from static frame

V2 final QA kept intermediate/runtime widths safe rather than adding a breakpoint for every probe width.

This aligns with existing candidate `CR-REF001-001`.

## 4. V2 weakness to avoid

The clearest structural debt is repair-layer accumulation.

Observed V2 family:

```text
style.css
+ responsive-continuity.css
+ visual-repair.css
+ human-review-repair.css
```

A repair can be visually correct while making the next human correction more expensive.

Learning signal:

- repair the canonical section/component owner
- temporary diagnostics may exist during investigation
- FINAL should not preserve symptom-based patch archaeology without a real ownership reason

This is not a ban on multiple CSS files. Multiple files are healthy when they represent stable ownership boundaries rather than repair chronology.

## 5. V3 strengths to preserve

### Section ownership

V3 separates:

- `data/`
- genuinely repeated `components/`
- one file per `sections/`
- styles with recognizable responsibility

This improves repository navigation and human adjustment.

### Reuse only where repetition is real

V3 extracts repeated section heading / CTA behavior rather than forcing every one-off section into a generic component abstraction.

This supports the Reuse-Before-Build principle without turning "reuse rate" into a component-count KPI.

### Asset slot → Figma node provenance

Explicit source-node mapping reduces future rediscovery cost and helps distinguish:

- exact asset mismatch
- crop/layout mismatch
- wrong implementation mechanism

## 6. V3 limits to keep visible

V3 docs themselves list unresolved visual gaps such as font substitution and geometry differences.

Therefore V3's architecture must not be promoted as proof that maintainable structure automatically creates sufficient visual fidelity.

A clean structure still needs:

- real typography evidence
- exact asset evidence
- section diff
- root-cause repair
- final integration QA

## 7. Decorative mechanism observation

Figma Student Voice node `21378:7766` was re-read through structured design context on 2026-08-20.

Important evidence:

- irregular comment/speech outline is an exact SVG asset
- text remains live text
- portrait/course artwork combines vector masks with raster imagery

This directly supports checking CSS + exact SVG before attempting CSS-only reconstruction.

Lifecycle status: **Observation / E1**.

Reason it is not CANDIDATE yet:

- one reference family
- no dedicated isolated clean replay measuring before/after Human Correction Cost

See `docs/frontend-decorative-pattern-cookbook.md`.

## 8. Implementation-order learning

Recommended replay hypothesis:

```text
Whole Figma overview
→ section boundary
→ PC/SP evidence for one section
→ component/asset/pattern search
→ choose implementation mechanism
→ implement canonical owner
→ section visual/runtime QA
→ repair canonical owner
→ relevant boundary/intermediate width/content mutation
→ full-page integration
```

This should be tested against a future reference rather than immediately declared CORE.

## 9. Metrics missing from historical comparison

Historical V2/V3 evidence has strong visual/runtime data but weak direct Human Correction Cost measurement.

Future runs should record, when practical:

- same feedback repeated count
- major rework count
- wrong strategy reversal count
- human final correction count
- human correction minutes
- existing component/asset/pattern reuse rate or comparable opportunity-based evidence
- flaky rerun/debug minutes

Do not reconstruct fake historical numbers for V2/V3.

## 10. Current lifecycle decisions

### Already supported by existing evidence/rules

- endpoint fidelity and runtime safety are separate acceptance layers
- screenshot repetition does not automatically define CMS cardinality
- interaction must be evidence-gated

These already have existing candidate records.

### New observations, not promoted

1. `OBS-REF001-DECORATIVE-EXACT-SOURCE`
   - exact Figma decorative vector + live content can be a better mechanism than CSS-only reconstruction
   - needs clean replay

2. `OBS-REF001-VISUAL-REPAIR-OWNERSHIP`
   - strongest target appears to be V2-level visual close-out without V2-style repair-layer archaeology
   - needs another independent implementation/replay

3. `OBS-REF001-FIGMA-PROVENANCE`
   - section/asset → Figma node mapping appears to lower rediscovery cost
   - Human Correction Cost effect still needs measurement

## 11. Next replay criteria

For a future suitable reference:

- choose one decorative section with a real exact asset/vector decision
- record implementation mechanism before coding
- capture first-pass delta
- use canonical-owner repair only
- measure repair rounds and human correction time/count
- compare against a case where source reuse was missed or repair patches accumulated, if safe evidence exists
- promote only if the direction reproduces

No rule should be promoted solely because V3 "felt better".