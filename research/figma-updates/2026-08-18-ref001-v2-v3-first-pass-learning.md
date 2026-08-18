# REF-001 V2 → V3 → V2 learning: make the better structure available on FIRST PASS

Date: 2026-08-18
Execution context: ChatGPT connector runtime (do not assume identical capabilities in Codex, Claude Code, or Cursor)

## Outcome

REF-001 V2 remains the visual authority. V3 is not a visual replacement.

The useful V3 ideas are being replayed into V2 only when they can be proven `no-visual-diff`:

- machine-readable section → Figma node lineage
- machine-readable asset slot → Figma node lineage
- explicit interaction authority and missing-data boundaries
- section/data ownership that can be inspected without repair-CSS archaeology
- minimal reuse of genuinely repeated patterns, not generic-component inflation

## Why V2 did not start this cleanly

### 1. Visual Truth was observed before implementation authority was normalized

V2 correctly prioritized matching the rendered Figma, but its first pass did not persist a single machine-readable authority map for frames, sections, assets, typography, and interaction evidence.

Result: node identity leaked into filenames/comments and later QA records instead of being a first-class implementation input.

**Next-FIRST-PASS rule:** build an authority manifest before section implementation. It must include PC/SP frame IDs, section IDs, raster/vector lineage, variable/text evidence, and interaction evidence.

### 2. Asset transport uncertainty consumed the early design budget

The project spent substantial effort proving Figma → bytes → Git/Drive delivery. During that period, geometry and repair work progressed with partial asset certainty.

Result: V2 accumulated repair layers while asset authority was still stabilizing.

**Next-FIRST-PASS rule:** classify every visual slot as `READY / DERIVABLE / DELIVERY_BLOCKED / UNRESOLVED` before polishing. A blocked asset must not silently become a CSS approximation.

### 3. Typography was visually compensated before it was numerically gated

V2 originally had cases such as Footer address/Tel where the browser values differed from Figma. Later work added the 1380/375 computed-style gate and exposed mixed text runs such as the MV comma.

Result: some geometry repair compensated for typography that should have been fixed at the text authority layer first.

**Next-FIRST-PASS rule:** before section pixel polish, gate `font-size / line-height / letter-spacing / weight` at authored PC/SP endpoints. Mixed text segments must be preserved rather than flattened.

### 4. Interaction evidence was not separated from interaction inference

V3 added a useful Student Voice controller, but the final REF-001 PC and SP frames contain **zero direct Prototype reactions**. The visible design shows item 1 open and items 2/3 collapsed, but Figma does not contain expanded detail copy for items 2/3. Messages displays `1 / 4`, while only one slide is authored in the final PC/SP frames.

Result: a reasonable web behavior could be mistaken for Figma-authored behavior.

**Next-FIRST-PASS rule:** every interaction must be classified as one of:

1. `AUTHORED` — explicit, validated Figma reaction/variant/content evidence
2. `STRONGLY_INFERRED` — visible affordance/state implies behavior but Figma does not author the transition
3. `PRODUCT_DECISION` — behavior requires requirements outside Figma
4. `CONTENT_PENDING` — behavior is obvious but required content is absent
5. `STALE_REJECTED` — a reaction exists but its destination fails project/component semantic validation

Never invent missing slides, accordion copy, destinations, or states to make a demo look complete.

### 4.1 A Prototype reaction can be real Figma data and still be the wrong authority

A deeper audit followed the final REF-001 instances to their main components. The PC Header and PC Footer main components did contain `ON_HOVER → CHANGE_TO → DISSOLVE 0.3s` reactions.

At first glance that looked like missed authored behavior. The destinations were then inspected:

- PC Header main component `280:267` → destination `14654:3046` (`Header/hover`)
  - destination text includes `研究者の方`, `遺伝研データ`, `国立遺伝学研究所`
- PC Footer main component `280:368` → destination `14654:3787` (`Footer/hover`)
  - destination includes `Copyright © National Institute of Genetics` and unrelated NIG footer links

These are stale copied-source prototype destinations, not 千葉経済大学 REF-001 states. They are therefore `STALE_REJECTED`, not `AUTHORED`.

This is a critical upgrade to Figma observation:

> `reaction exists` is not sufficient evidence.

**Next-FIRST-PASS rule:** trace interaction authority through:

`final instance → mainComponent → reaction → destination → component lineage + project semantic validation → accept/reject`.

A reaction should only become implementation authority when its destination is structurally and semantically compatible with the current project. This protects adaptive implementation from copied design-system residue and stale prototypes.

### 5. Repair CSS accumulated faster than ownership was simplified

V2's fidelity loop succeeded visually, but repeated repair layers made it harder to answer which file owned a final value. V3 demonstrated that section-oriented ownership is easier to edit.

Result: later human tuning required more cascade archaeology than necessary.

**Next-FIRST-PASS rule:** keep one semantic owner per section/property whenever possible. A repair layer is temporary evidence, not the preferred permanent architecture. Before adding another override, identify why the current owner cannot express the Figma truth.

### 6. Reuse was decided after implementation instead of during observation

V3 usefully extracted only genuinely repeated pieces and kept one-off sections explicit.

**Next-FIRST-PASS rule:** during section inventory classify visible patterns `REUSE / ADAPT / NEW`. Do not over-componentize one-off compositions, but do not duplicate stable CTA/heading behavior when the same authored pattern repeats.

### 7. Validation contracts encoded early assumptions too narrowly

When V3-style `figma.pc / figma.sp` lineage was replayed into V2, the old asset validator rejected it because it assumed every image entry contained only `pc` and `sp`.

Deleting the metadata would have made CI green but lost the improvement. Instead the validator was upgraded to require the lineage and compare all 32 PC/SP node IDs against the rendered-asset registry while retaining path, WebP, dimensions, SHA-256 and alpha checks.

**Next-FIRST-PASS rule:** when a stronger evidence model breaks an older validator, distinguish `invalid new design` from `validator encoded an obsolete assumption`. Evolve the validator only when the new invariant is stricter and testable.

## What V3 taught us — and what it did not

### Promote

- explicit section ↔ Figma mapping
- explicit asset ↔ Figma mapping
- nested/owned content domains where they improve editing
- minimal repeated components
- section-aligned CSS ownership
- interaction authority classification
- validator evolution when stronger machine-readable lineage is introduced

### Do not promote

- V3 visual geometry where V2 is closer to Figma
- V3 course icon mapping mistakes
- dummy Student Voice expanded content
- a fake 4-slide Messages carousel
- stale copied Prototype destinations
- client-specific implementation paths as universal rules

## New FIRST PASS order

1. Label execution context: ChatGPT / Codex / Claude Code / Cursor + available capabilities.
2. Read Figma final PC/SP frames and section boundaries.
3. Persist frame/section node authority before coding and expose it in runtime evidence.
4. Inventory Variables, components, rich text segments, image/vector assets, and direct reactions.
5. For final-frame instances, inspect mainComponent / ComponentSet evidence as well.
6. Validate every reaction destination against the current component lineage and project semantics; mark contamination `STALE_REJECTED`.
7. Observe the target repo/company conventions before choosing structure.
8. Classify each section/pattern `REUSE / ADAPT / NEW`.
9. Create asset slots with durable Figma lineage before visual repair.
10. Implement section-first with clear property ownership.
11. Gate endpoint typography numerically before pixel polishing.
12. Classify interactions `AUTHORED / STRONGLY_INFERRED / PRODUCT_DECISION / CONTENT_PENDING / STALE_REJECTED`.
13. Implement only behavior for which required content, destination, and validated authority exist.
14. Run responsive/runtime QA, exact no-visual-diff checks for structural refactors, and interaction QA.
15. Record human repair separately; promote a rule only after it repeats across multiple real projects.

## Promotion status

This is REF-001 evidence (E1), not yet a universal company rule. Repeat on REF-002 and later real projects. Promote only the parts that measurably reduce implementation time, repair count, final diff, or human editing cost without reducing fidelity.
