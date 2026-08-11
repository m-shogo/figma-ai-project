# REF-001 WordPress + ACF Learning Experiment

Purpose: learn from a real Figma → WordPress fixed-page-template + ACF translation before freezing production rules.

> **Post-hoc status note (2026-08-12):** a separate Blind Clean Replay has now been completed and merged under `experiments/ref001-blind-clean-20260812/`. Historical `NOT READY / NOT RUN` wording later in this document is intentionally preserved as the state of this repaired fixture before that separate replay; do not reinterpret this historical fixture as the frozen FIRST PASS.

This experiment intentionally separates four things that are easy to mix together:

1. Figma visual evidence
2. Web/runtime translation
3. CMS/editorial ownership
4. reproducibility evidence from a clean replay

A visually complete learning fixture does **not** mean the production WordPress contract is frozen, and a repaired final fixture does **not** count as a preserved FIRST PASS.

## Current verified state

As of the PR #57 / #58 validation sequence:

- the learning fixture renders the full supplied page sequence:
  - Header
  - Main Visual
  - Reason
  - Education
  - CTA
  - Student Voice
  - Messages
  - CTA
  - Courses
  - Links
  - CTA Value
  - Footer
- exact Figma visual acceptance endpoints remain:
  - PC: `1380px`
  - SP: `375px`
- production breakpoint is owner-confirmed at `768px`:
  - mobile: `<= 767px`
  - desktop: `>= 768px`
- the latest validated PC/SP Visual QA artifact had:
  - page body geometry delta: `0`
  - section geometry deltas: `0`
  - no page-level horizontal overflow failure
  - no readable-text clipping / unsafe nowrap failure reported by the text-runtime gate
- intermediate widths are runtime-safety probes rather than additional pixel-perfect Figma targets
- the repaired full-page fixture is a **learning fixture**, not the target production theme
- no Figma design mutation was required for these Web-side repairs

This is a strong final visual/runtime result, but it is **not yet Clean Replay evidence** because no formal source run with immutable FIRST PASS evidence was preserved before the iterative repair sequence.

## Resolved by owner

- implementation family: WordPress
- implementation unit: fixed Page template
- content fields: ACF
- production breakpoint: `768px` (`mobile <= 767px`, `desktop >= 768px`)

The canonical Reference Manifest records the breakpoint source as `OWNER`. Figma's `375px / 1380px` frames remain visual acceptance evidence, not breakpoint-threshold evidence.

## Still intentionally unresolved

- target theme repository / branch / starting commit
- Classic vs Hybrid theme classification
- exact production Page template filename or slug-specialized template
- WordPress/PHP/ACF versions
- ACF PRO availability
- existing ACF Local JSON architecture
- existing header/global CTA ownership
- Student Voice interaction contract
- Messages records 2–4 and slider/carousel behavior

Do not freeze or invent these from the research repository.

## Responsive / Web runtime contract

Figma is the visual specification; the Web implementation is a responsive runtime specification.

- production breakpoint is owner-confirmed at `768px`: mobile `<= 767px`, desktop `>= 768px`
- Figma exact visual acceptance remains `375px` SP and `1380px` PC
- widths such as `320 / 360 / 390 / 430 / 767 / 768 / 769 / 1024 / 1200` are runtime-safety probes, not additional pixel-perfect Figma targets
- ordinary copy uses natural wrapping by default; do not add `white-space: nowrap` merely because a supplied Figma frame renders one line
- typography QA prioritizes line-height, font metrics, visible ink/baseline rhythm, and spacing to adjacent content over forcing identical fallback-font line breaks
- preflight is cost-based: resolve cross-cutting, expensive-to-reverse decisions up front; use safe modern defaults for cheap/reversible details
- ordinary media defaults to `<img>`; use `object-fit: cover` for evidenced cropped media boxes
- `<picture>` is opt-in only when SP/PC art direction, source-format delivery, or another concrete runtime requirement proves it is needed
- no page-level horizontal scrolling, readable-text clipping, viewport-widening hacks, or overflow hiding used merely to conceal a layout defect

The old 600px fixture seam is not a production contract and must not be reintroduced.

## Section evidence status

| Section | Visual fixture | Structure / evidence note | Product/CMS unknowns |
|---|---|---|---|
| Header | Implemented | PC/SP component identity observed | production global ownership unresolved |
| Main Visual | Implemented | masks/crops/vectors/manual grouping require hybrid translation | production media ownership still follows target theme |
| Reason | Implemented | strong repeated structure / Auto Layout evidence | fixed-cardinality baseline remains intentional |
| Education | Implemented | fixed semantic 01→04 progression; mixed outer/manual + inner Auto Layout | editable media/title/bullets only in current ACF baseline |
| CTA | Implemented | supplied repeated boundary/component evidence | production global destination/ownership unresolved |
| Student Voice | Implemented visual states | supplied item 1 open + items 2/3 collapsed | interaction contract and complete expanded content unresolved |
| Messages | Implemented supplied current state | current item and `1 / 4` evidence preserved | records 2–4 and carousel behavior unresolved |
| Courses | Implemented | seven supplied course structures represented | CMS model remains separate/experimental |
| Links | Implemented | supplied end-page visual structure represented | destinations remain production-owned |
| CTA Value | Implemented | final visible composites used for Visual QA where needed | production media ownership remains separate |
| Footer | Implemented | PC/SP footer/component evidence represented | production global ownership unresolved |

## Hypotheses under test

### H1 — Figma repetition does not imply ACF Repeater

Reason contains three visually homogeneous cards. That proves a repeated visual structure, but does not prove editors should add/remove/reorder cards.

Baseline decision: fixed three field sets.

### H2 — Same responsive source should not create duplicate media fields

PC/SP Hero image layers were compared using Figma Plugin API image hashes. Corresponding PC/SP layers use the same underlying hashes.

Baseline decision: one WordPress attachment field per logical image source; responsive differences belong to crop/layout CSS unless real art direction requires a different source.

### H3 — Text is not automatically CMS content

The Hero slogan is split across independently positioned/sized/colored Figma text nodes. Arbitrary editor copy can destroy the composition.

Baseline decision: keep the art-directed slogan code-owned. Supporting lead text can be editable with wrap QA.

### H4 — Shared Figma component is not automatically page ACF

Header is a shared component/instance. Its logo and CTAs should first be mapped to the existing WordPress theme/header/menu/options architecture.

Baseline decision: no page-local Header ACF fields.

### H5 — Field schema and page content are separate deliverables

`artifacts/acf-export.json` contains portable field-group definitions. `fixture-content.yaml` contains disposable learning values.

Do not misuse ACF field defaults as a page-content migration mechanism.

### H6 — Retained Figma layers do not all become CMS inputs

MV and later sections contain older/alternate/underlay image layers. A Figma layer surviving in the file is not enough evidence that an editor needs a separate field.

Baseline decision: select canonical content media from visual/content evidence and keep layout/mask residue out of the CMS contract.

### H7 — New ACF values should be seeded through stable field keys

A fixture Page may have no existing ACF reference meta yet. The seed pipeline therefore joins `fixture-content.yaml` to the stable keys in `acf-export.json` and calls `update_field( $field_key, ... )` rather than directly writing visible meta names.

### H8 — Ordered progression is different from a reorderable collection

Education visually repeats four cards, but the content explicitly encodes `01 / スタート → 02 / 学ぶ → 03 / 出会う → 04 / ゴール`.

Baseline decision: four fixed ordered stages. Stage numbers/semantic labels are code-owned; stage image/title/bullets are editable ACF fields.

### H9 — A visual state is not automatically an interaction contract

Student Voice supplies one `1_open` state and two collapsed summary states, but no prototype reaction was found in the inspected nodes.

Baseline decision: preserve the visual/state evidence while leaving expand/collapse behavior `UNDETERMINED`.

### H10 — A displayed total is not complete CMS source data

Messages displays `1 / 4` with previous/next affordances, but the inspected Figma section contains content for only one message and no prototype reactions.

Baseline decision: do not invent messages 2–4, do not create four placeholder CMS records, and do not choose a slider library yet.

### H11 — A composited bitmap is not a single imageHash

Student Voice and CTA Value independently proved the same boundary: one final visible bitmap can be built from a Mask/Group containing multiple IMAGE fills, including color plus mono/offset layers. Exporting or persisting only one raw `imageHash` loses part of the supplied Figma visual.

Baseline decision: when multiple IMAGE fills participate in one final visible masked/grouped visual, use the final visible group export as Visual QA evidence. Keep the underlying CMS/media ownership decision separate; a QA group export does not automatically become a production WordPress field or attachment. If inspection proves the visual is only one canonical IMAGE fill, the raw image source can remain sufficient.

Observed examples:

- Student Voice item 2 / item 3 / classroom final Mask groups
- CTA Value PC/SP left/right person groups, where color plus mono/offset layers form the final people composites

### H12 — Figma fidelity does not mean forcing static-frame behavior onto the Web

Figma gives exact evidence for a supplied static frame. A browser is a runtime: fonts can fall back, glyph metrics can differ, copy can change, viewport widths can vary, and content must remain readable without creating page-level overflow.

Baseline decision: preserve the design intent and supplied endpoint geometry, but do not force screenshot parity with brittle CSS that makes the implementation worse as a website.

Practical boundary:

- exact section position/height, major composition, media crop, explicit art direction, and supplied PC/SP endpoint structure remain hard visual evidence
- ordinary body/supporting copy remains reflowable; a small line-wrap difference caused by unavailable font metrics is acceptable when meaning and composition remain intact
- `white-space: nowrap` must not be introduced merely to stop a line from wrapping like the Figma screenshot; use it only when one-line behavior is itself a real UI/content requirement and overflow has been proven safe
- do not shrink text, distort tracking, widen a container beyond the viewport, clip readable content, or add arbitrary hard breaks solely to hide font-rendering differences
- page-level horizontal scrolling is a failure at every runtime-safety viewport, not only the supplied PC/SP endpoints
- Figma frame width is endpoint evidence, not proof of the production breakpoint or every in-between responsive state
- visual QA must distinguish hard mismatches from runtime-tolerant differences instead of blindly optimizing every pixel delta

Observed failure that promoted this rule: Main Visual supporting copy was temporarily given `white-space: nowrap` only to prevent a fallback-font line break. That matched one static screenshot more closely but was the wrong Web translation because it could create overflow and overfit unavailable font metrics. The constraint was removed and a horizontal-overflow browser gate was added instead.

## Education learning evidence

Education was the third staged section implemented during the earlier learning pass. These measurements remain useful evidence, but this section is **historical stage context**, not the current overall implementation status.

Measured evidence applied:

- PC `21378:7868`, SP `21376:4720`
- four semantic stages in both viewports
- 22 Auto Layout containers in both variants, mainly stage bullet lists/rows
- outer stage/connector composition remains manually grouped
- PC card base: 281×380 with 40px gap and 8px shadow offset
- PC media: 233×131
- SP card base: 335px wide with 8px shadow offset
- SP media: 140×79
- internal list gap: 12px
- PC is horizontal; SP is vertical

Implementation choices retained from that stage:

- `artifacts/acf-export.json` contains flat basic fields for Education rather than Repeater/Group/Flexible Content
- `fixture-content.yaml` contains Education text values and four canonical media placeholders
- stage number/label/order are code-owned in `template-parts/ref001/education.php`
- the fixture validator rejects ACF fields such as `education_1_number`, `education_1_label`, or `education_1_order`

Canonical stage media selected from the visible foreground layers:

- 01: `経営学科 1` — `cc1525625b72a6cf17e6b0b462eb48ef5391709e`
- 02: `授業風景 1` — `fb075b4159fa8fefba6861ddca85f226e5c9bf71`
- 03: `先生と一緒に考える（差し替え） 1` — `befe413ae4704994a80e0d7456914cd7c884073d`
- 04: `勉強風景 2` — `a8cc1ee3c99ba387556b087061c20090dc1209cb`

Retained underlays/alternates are not CMS fields.

## Student Voice — visual state implemented, interaction still evidence-gated

Measured evidence:

- three supplied summaries in PC/SP
- item 1 has an expanded state and detailed content
- items 2/3 are collapsed summaries only
- no prototype reactions found in the inspected section

Translation mode: `HYBRID`.

The supplied visual state is represented in the learning fixture. Do not invent expanded content for items 2/3, and do not freeze an accordion/disclosure architecture until interaction evidence exists.

## Messages — supplied state implemented, records/behavior still evidence-gated

Measured evidence:

- current item is the same PC/SP
- current image PC/SP shares the same Figma image hash
- visible indicator is `1 / 4`
- only one record's content is present in the inspected section
- no prototype reactions found

Translation mode: `HYBRID`.

The supplied `1 / 4` visual state is represented in the learning fixture. Do not create records 2–4 or add a carousel dependency until that product/content contract is supplied.

## Current artifacts

- `implementation-profile.yaml` — DRAFT WordPress/ACF target profile; target-theme-dependent values remain unresolved
- `acf-content-model.yaml` — Figma → CMS ownership decisions/evidence for the current baseline
- `artifacts/acf-export.json` — importable basic-field learning prototype for the main MV + Reason + Education ACF baseline
- `artifacts/courses.acf-export.json` — separate Courses learning export; do not treat its existence as proof of the final production CMS architecture
- `fixture-content.yaml` — disposable learning values for the main ACF baseline
- `fixture-theme/` — full-page visual/runtime learning fixture; **not** a production WordPress theme
- `visual-preview/` — browser capture, geometry, asset, and text-runtime QA harness
- `seed/seed-ref001.php` — WP-CLI seed runner using stable ACF field keys for the scoped seed baseline
- `seed/README.md` — capability-gated import/seed procedure
- `scripts/build_ref001_wordpress_seed.py` — deterministic schema+content → seed payload builder

## ACF / seed scope

The visual fixture is now much broader than the current main ACF export. Do not equate full-page visual coverage with finalized CMS coverage.

Build the current scoped seed payload with:

```bash
python scripts/build_ref001_wordpress_seed.py --output /tmp/ref001-seed.json
```

For the main MV + Reason + Education baseline, the previously validated payload expectation remains:

- 26 READY text fields
- 9 UNRESOLVED image attachments

Media remains unresolved until real WordPress attachment IDs exist. Courses has separate learning artifacts and must not be silently merged into the production ACF contract without target-theme/editor requirements.

## Validation

Core structural validation:

```bash
python scripts/validate_acf_export.py
python scripts/validate_wordpress_learning_fixture.py
python -m unittest discover -s tests -p 'test_*.py'
```

Visual/runtime QA is enforced by `.github/workflows/ref001-visual-qa.yml`, including browser capture, geometry measurement, asset decode checks, and text/runtime safety checks.

The fixture checks protect, among other things:

- owner-resolved `768px` production breakpoint and rejection of the obsolete `600/601px` seam
- Figma exact acceptance at `375px / 1380px`
- runtime-safety behavior around and away from the breakpoint
- full supplied section order
- measured section geometry
- natural text wrapping unless one-line behavior is actually evidenced
- page-level horizontal overflow / readable-text clipping safety
- exact or final-visible-composite asset evidence where needed
- continued prohibition on inventing missing interaction/content contracts

## Clean Replay readiness

**Status: NOT READY / NOT RUN.**

Reason:

- there is currently no formal non-REPLAY run record with `status: COMPLETE`
- there is no immutable `*.first-pass.json` snapshot for the repaired REF-001 fixture
- the existing fixture went through many targeted repair iterations before formal FIRST PASS preservation was established
- therefore the current repaired fixture must **not** be retroactively labeled as FIRST PASS
- production-oriented SECTION replay also remains blocked by the unresolved target theme/code baseline and other freeze dependencies

CI validation of replay pair comparability is only meaningful when a REPLAY pair exists. Empty validation now reports an explicit `SKIP` instead of silently looking like reproduced evidence.

### What the next valid replay needs

1. start from a fresh isolation/base that does not expose the current final/repair diff
2. create a formal run record before implementation
3. pin the same reference revision, implementation profile, environment contract, and relevant scope
4. build a true FIRST PASS without consulting the repaired output
5. capture and score FIRST PASS
6. freeze immutable FIRST PASS evidence immediately
7. only then repair/finalize
8. prepare a separate REPLAY run from another fresh isolation
9. compare first-pass fidelity, repair rounds/failure profile, and reproducibility

The goal is not to prove that the current fixture can eventually reach visual parity again. The goal is to prove that the learned workflow produces a **better first pass with less rework** under controlled conditions.
