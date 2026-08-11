# REF-001 WordPress + ACF Learning Experiment

Purpose: learn from a real Figma → WordPress fixed-page-template + ACF translation before freezing production rules.

This experiment is deliberately slower than a one-shot implementation. It separates visual evidence, CMS/editorial decisions, field configuration, page content, target-theme reconnaissance, and an intentionally imperfect implementation fixture so later Clean Replay can prove whether the workflow actually improved first-pass fidelity.

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

Promote to Repeater only when:

- editor cardinality/reorder requirements exist, and
- target project architecture supports it, and
- ACF PRO availability is verified.

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

`artifacts/acf-export.json` contains portable field-group definitions.

`fixture-content.yaml` contains disposable First Pass page values.

Do not misuse ACF field defaults as a page-content migration mechanism.

### H6 — Retained Figma layers do not all become CMS inputs

MV mask groups contain older underlay image layers plus foreground replacement images. The masks themselves are plain rectangles.

Baseline decision: expose the foreground person images to ACF and implement the crop as web layout. Do not create fields for every retained design layer until real content ownership proves they are needed.

## Current artifacts

- `implementation-profile.yaml` — DRAFT WordPress/ACF target profile
- `acf-content-model.yaml` — Figma → CMS ownership decisions/evidence
- `artifacts/acf-export.json` — importable learning prototype with stable keys
- `fixture-content.yaml` — First Pass content fixture, separate from field schema
- `fixture-theme/` — learning-only WordPress theme implementing MV + Reason

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

## Validation

Repository ACF exports are auto-discovered:

```bash
python scripts/validate_acf_export.py
```

The learning fixture has focused regression checks:

```bash
python scripts/validate_wordpress_learning_fixture.py
```

These checks reject:

- expiring Figma MCP asset URLs in committed fixture code
- accidental ACF Repeater API use in the fixed-cardinality baseline
- ACF Page Template location drift
- image fields that stop returning attachment IDs

CI runs both validators and the unit test suite.

Structural validation does not replace a real WordPress/ACF import smoke.

## Next learning stage

Before production freeze:

1. install the learning fixture in a disposable WordPress environment
2. import `acf-export.json`
3. seed `fixture-content.yaml` separately
4. populate exact media attachments when they can be persisted safely
5. capture immutable 1380px / 375px MV + Reason First Pass
6. classify visual, structural, CMS, and environment failures
7. repair only after First Pass evidence is frozen
8. run a clean replay of the fixture flow
9. when the real target theme repository is supplied, perform repository reconnaissance and replace fixture assumptions with existing-theme conventions
