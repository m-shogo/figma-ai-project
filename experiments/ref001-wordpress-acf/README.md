# REF-001 WordPress + ACF Learning Experiment

Purpose: learn from a real Figma → WordPress fixed-page-template + ACF translation before freezing production rules.

This experiment is deliberately slower than a one-shot implementation. It separates visual evidence, CMS/editorial decisions, field configuration, page content, target-theme reconnaissance, an intentionally imperfect implementation fixture, and database seeding so later Clean Replay can prove whether the workflow actually improved first-pass fidelity.

## Resolved by owner

- implementation family: WordPress
- implementation unit: fixed Page template
- content fields: ACF

## Still intentionally unresolved

- target theme repository / branch / starting commit
- Classic vs Hybrid theme classification
- exact production Page template filename or slug-specialized template
- WordPress/PHP/ACF versions
- ACF PRO availability
- existing ACF Local JSON architecture
- existing header/global CTA ownership
- production breakpoints

Do not freeze or invent these from the research repository.

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

`artifacts/acf-export.json` contains portable field-group definitions. `fixture-content.yaml` contains disposable First Pass page values.

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

## Education First Pass — implemented

Education is now the third implemented learning section after MV and Reason.

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

Implementation choices:

- `artifacts/acf-export.json` now contains flat basic fields for Education rather than Repeater/Group/Flexible Content
- `fixture-content.yaml` contains Education text values and four canonical media placeholders
- stage number/label/order are code-owned in `template-parts/ref001/education.php`
- Education gets its own `assets/css/ref001-education.css`
- SP card heights are content-driven rather than hard-coded separately for each stage
- the fixture validator rejects ACF fields such as `education_1_number`, `education_1_label`, or `education_1_order`

Canonical stage media was selected from the currently visible foreground layers:

- 01: `経営学科 1` — `cc1525625b72a6cf17e6b0b462eb48ef5391709e`
- 02: `授業風景 1` — `fb075b4159fa8fefba6861ddca85f226e5c9bf71`
- 03: `先生と一緒に考える（差し替え） 1` — `befe413ae4704994a80e0d7456914cd7c884073d`
- 04: `勉強風景 2` — `a8cc1ee3c99ba387556b087061c20090dc1209cb`

Retained underlays/alternates are not CMS fields.

## Student Voice — still evidence-gated

Measured evidence:

- three supplied summaries in PC/SP
- item 1 has an expanded state and detailed content
- items 2/3 are collapsed summaries only
- no prototype reactions found in the inspected section

Translation mode: `HYBRID`.

Do not invent expanded content for items 2/3. Do not yet freeze an accordion/disclosure architecture.

## Messages — still evidence-gated

Measured evidence:

- current item is the same PC/SP
- current image PC/SP shares the same Figma image hash
- visible indicator is `1 / 4`
- only one record's content is present in the inspected section
- no prototype reactions found

Translation mode: `HYBRID`.

Do not create four ACF records or add a carousel dependency yet.

## Current artifacts

- `implementation-profile.yaml` — DRAFT WordPress/ACF target profile
- `acf-content-model.yaml` — Figma → CMS ownership decisions/evidence through Education / Student Voice / Messages
- `artifacts/acf-export.json` — importable learning prototype with stable keys for MV + Reason + Education
- `fixture-content.yaml` — First Pass values for MV + Reason + Education, separate from field schema
- `fixture-theme/` — learning-only WordPress theme implementing MV + Reason + Education
- `seed/seed-ref001.php` — WP-CLI seed runner using stable ACF field keys
- `seed/README.md` — capability-gated import/seed procedure
- `scripts/build_ref001_wordpress_seed.py` — deterministic schema+content → seed payload builder

## Seed pipeline

Build a deterministic payload:

```bash
python scripts/build_ref001_wordpress_seed.py --output /tmp/ref001-seed.json
```

Current expected payload state after Education:

- 26 READY text fields
- 9 UNRESOLVED image attachments

Media remains unresolved until real WordPress attachment IDs exist.

## Validation

```bash
python scripts/validate_acf_export.py
python scripts/validate_wordpress_learning_fixture.py
python -m unittest discover -s tests -p 'test_*.py'
```

The fixture checks now also protect:

- Education template/style inclusion
- all fixed Education fields
- code-owned 01→04 stage identity/order
- measured PC 281px/40px geometry evidence
- measured SP 335px card / 140×79 media evidence
- continued prohibition on Repeater API in the fixed-cardinality baseline

Structural validation does not replace a real WordPress/ACF import smoke.

## Next learning stage

1. merge the Education First Pass implementation after CI
2. inspect Courses next only if it has sufficiently complete content/structure evidence
3. keep Student Voice and Messages blocked until their missing interaction/content evidence is resolved
4. when a disposable WordPress runtime is available, import ACF JSON, seed 26 READY values, attach exact media, and capture immutable 1380px / 375px First Pass evidence
5. repair only after First Pass is frozen
6. run Clean Replay
7. when the real target theme repository is supplied, replace fixture assumptions with existing-theme conventions
