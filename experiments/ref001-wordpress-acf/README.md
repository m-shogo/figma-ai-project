# REF-001 WordPress + ACF Learning Experiment

Purpose: learn from a real Figma → WordPress fixed-page-template + ACF translation before freezing production rules.

This experiment is deliberately slower than a one-shot implementation. It separates visual evidence, CMS/editorial decisions, field configuration, page content, and target-theme reconnaissance so later Clean Replay can prove whether the workflow actually improved first-pass fidelity.

## Resolved by owner

- implementation family: WordPress
- implementation unit: fixed Page template
- content fields: ACF

## Still intentionally unresolved

- target theme repository / branch / starting commit
- Classic vs Hybrid theme classification
- exact Page template filename or slug-specialized template
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

## Current artifacts

- `implementation-profile.yaml` — DRAFT WordPress/ACF target profile
- `acf-content-model.yaml` — Figma → CMS ownership decisions/evidence
- `artifacts/acf-export.json` — importable learning prototype with stable keys
- `fixture-content.yaml` — First Pass content fixture, separate from field schema

## Validation

Repository ACF exports are auto-discovered:

```bash
python scripts/validate_acf_export.py
```

CI validates all canonical `acf-export.json` / `*.acf-export.json` artifacts.

This structural validator does not replace a real WordPress/ACF import smoke.

## Next implementation stage

Once the target theme repository is supplied/connected:

1. inspect theme type, template hierarchy, build/CSS conventions, existing Header/Footer and ACF architecture
2. resolve/freeze Implementation Profile
3. reconcile ACF JSON location rule and field naming/key conventions
4. import/sync ACF JSON in a disposable WordPress environment
5. seed `fixture-content.yaml` values separately
6. implement Header → MV → Reason as section-level First Pass
7. capture PC 1380 / SP 375 and interaction states
8. preserve immutable First Pass before repair
9. run Clean Replay with the same frozen inputs
