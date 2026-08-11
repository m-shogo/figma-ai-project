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

Promote to Repeater only when editor cardinality/reorder requirements exist, the target architecture supports it, and ACF PRO availability is verified.

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

The seed script reads each scalar value back after the write. Missing media attachment IDs stay unresolved instead of being replaced with fake values.

### H8 — Ordered progression is different from a reorderable collection

Education visually repeats four cards, but the content explicitly encodes `01 / スタート → 02 / 学ぶ → 03 / 出会う → 04 / ゴール`.

Baseline decision: model Education as four fixed ordered stages. Stage numbers/semantic labels remain code-owned; editable titles, bullets, intro, and canonical stage media can become fixed ACF fields.

### H9 — A visual state is not automatically an interaction contract

Student Voice supplies one `1_open` state and two collapsed summary states, but no prototype reaction was found in the inspected nodes.

Baseline decision: preserve the visual/state evidence while leaving expand/collapse behavior `UNDETERMINED`. Do not add accordion JS merely because the design looks accordion-like.

### H10 — A displayed total is not complete CMS source data

Messages displays `1 / 4` with previous/next affordances, but the inspected Figma section contains content for only one message and no prototype reactions.

Baseline decision: do not invent messages 2–4, do not create four placeholder CMS records, and do not choose a slider library yet.

## Wave-2 section decisions

### Education — ready for the next implementation experiment

Measured evidence:

- PC `21378:7868`, SP `21376:4720`
- four semantic stages exist in both viewports
- 22 Auto Layout containers in both variants, mainly stage bullet lists/rows
- top-level stage + connector composition is manually grouped
- PC is horizontal; SP becomes a tall vertical composition
- some stages retain alternate image layers

Translation mode: `HYBRID`.

CMS baseline: fixed four-stage fields, not Repeater.

This is the next safe section to add to the ACF export + learning theme fixture.

### Student Voice — partially modelled, implementation still evidence-gated

Measured evidence:

- three supplied summaries in PC/SP
- item 1 has an expanded state and detailed content
- items 2/3 are collapsed summaries only
- no prototype reactions found in the inspected section

Translation mode: `HYBRID`.

Do not invent expanded content for items 2/3. Do not yet freeze an accordion/disclosure architecture.

### Messages — data/interaction incomplete

Measured evidence:

- current item is the same PC/SP
- current image PC/SP shares the same Figma image hash
- visible indicator is `1 / 4`
- only one record's content is present in the inspected section
- no prototype reactions found

Translation mode: `HYBRID`.

Do not create four ACF records or add a carousel dependency yet. The target theme may already contain an accessible slider primitive, but that must be learned from the real repository later.

## Current artifacts

- `implementation-profile.yaml` — DRAFT WordPress/ACF target profile
- `acf-content-model.yaml` — Figma → CMS ownership decisions/evidence through Education / Student Voice / Messages
- `artifacts/acf-export.json` — current importable learning prototype with stable keys for MV + Reason
- `fixture-content.yaml` — First Pass content fixture, separate from field schema
- `fixture-theme/` — learning-only WordPress theme implementing MV + Reason
- `seed/seed-ref001.php` — WP-CLI seed runner using stable ACF field keys
- `seed/README.md` — capability-gated import/seed procedure
- `scripts/build_ref001_wordpress_seed.py` — deterministic schema+content → seed payload builder

## Learning First Pass fixture

`fixture-theme/` is intentionally not a production theme.

Current implementation:

- fixed Page template: `page-templates/template-ref001.php`
- MV: HYBRID translation using ACF foreground attachments + code-owned art-directed slogan
- Reason: STRUCTURE_FIRST translation using fixed three ACF card field sets
- neutral WordPress header/footer shell rather than inventing the unresolved global Figma Header
- temporary responsive switch labeled as fixture-only; 1380/375 reference widths do not define the production breakpoint

Known First Pass visual blockers are preserved rather than hidden:

- exact Figma image binaries are not yet persisted into a WordPress Media environment
- MV vector/background artwork is approximated in CSS
- production font pipeline is unresolved
- Header/Footer visual integration is unresolved

See `fixture-theme/README.md` for the detailed scope and limitations.

## Seed pipeline

Build a deterministic payload from the field schema and content fixture:

```bash
python scripts/build_ref001_wordpress_seed.py --output /tmp/ref001-seed.json
```

Then follow `seed/README.md`.

Important behavior:

- ACF CLI import is capability-detected; it is not assumed
- Page creation is opt-in
- fixture Page defaults to draft
- stable `field_*` keys are used for new values
- media remains unresolved until real WordPress attachment IDs exist
- seed runner avoids PHP 8-only string helpers because target PHP support is not yet frozen

## Validation

Repository ACF exports are auto-discovered:

```bash
python scripts/validate_acf_export.py
```

The learning fixture has focused regression checks:

```bash
python scripts/validate_wordpress_learning_fixture.py
```

The unit suite also validates deterministic seed generation and the seed script's field-key/update behavior.

Structural validation does not replace a real WordPress/ACF import smoke.

## Next learning stage

1. merge the measured Wave-2 Structure Profile/CMS ownership evidence
2. extend ACF JSON + fixture-content with **Education only**
3. implement Education PHP/CSS in the learning fixture
4. validate that its fixed 01→04 order cannot silently become a Repeater/reorderable contract
5. keep Student Voice and Messages blocked until their missing interaction/content evidence is resolved
6. when a disposable WordPress runtime is available, import, seed, and capture immutable 1380px / 375px First Pass evidence
7. repair only after First Pass is frozen
8. run Clean Replay
9. when the real target theme repository is supplied, replace fixture assumptions with existing-theme conventions
