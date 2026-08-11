# REF-001 Courses — WordPress/ACF Learning First Pass

This is a learning-only implementation of the Figma Courses section. It is not a production WordPress architecture decision.

## Figma evidence

- PC node: `21378:7505`
- SP node: `21376:4403`
- seven fixed course identities
- PC cards: 560×271, two columns, 40px gaps
- seventh IT card centered on the last row
- SP cards: 343px wide vertical stack
- recommendation list spacing: 12px
- zero bitmap image fills
- zero component instances
- zero prototype reactions
- course colors are Figma Variables

Measured structure: `references/chiba-keizai-sample.courses-structure-evidence.yaml`.

## CMS experiment

Courses tests a section-scoped ACF Field Group instead of growing one monolithic Page field group forever.

Field configuration:

- base Page fields: `artifacts/acf-export.json`
- Courses copy: `artifacts/courses.acf-export.json`

Both groups target the same fixed Page template.

The Courses group contains exactly 21 basic copy fields:

```text
7 courses ×
  description
  recommendation_1
  recommendation_2
= 21 fields
```

It intentionally does **not** contain:

- course count
- course order
- course title/identity
- color
- icon
- link

Those are code/domain-owned in the learning baseline so a real target theme can later replace the fixture array with an existing Course CPT/taxonomy/options/config source without migrating Page ACF identity data.

## Modular content/seed experiment

Courses content is also separate:

- base content: `fixture-content.yaml`
- Courses content: `courses-fixture-content.yaml`

`build_ref001_wordpress_seed.py` now combines multiple content fixtures and ACF exports into one deterministic seed payload.

Safety rules:

- duplicate field names across ACF exports are errors
- duplicate content names across fixtures are errors
- mismatched `reference_id` is an error
- all source SHA-256 values are retained
- generated fields are sorted by name

Expected combined payload after Courses:

- 47 READY text fields
- 9 UNRESOLVED image attachment fields
- 2 content sources
- 2 ACF export sources

## WordPress First Pass

Template part:

`fixture-theme/template-parts/ref001/courses.php`

Styles:

`fixture-theme/assets/css/ref001-courses.css`

The template keeps a seven-item code/domain identity array and reads only descriptive copy from ACF.

No card links are added because the inspected Figma nodes provide no interaction evidence.

## SVG asset persistence learning

The course pictograms are vector artwork. Do not create ACF image fields for them.

A new exact-asset path was successfully proven with the Figma Plugin API:

```js
const svg = await node.exportAsync({ format: 'SVG_STRING' });
```

This returns the exact Figma vector as SVG text and avoids the short-lived MCP asset URL problem.

The network-based attempt to download a temporary `figma.com/api/mcp/asset/...` URL from the execution container failed due environment DNS restrictions. The direct Plugin API `SVG_STRING` export succeeded.

Current First Pass deliberately keeps empty colored icon slots with `data-figma-icon-node` references until all seven exact SVG strings are persisted. **Do not hand-redraw substitute icons.**

Exact icon nodes:

- public service: `21378:7722`
- accounting: `21378:7683`
- business management: `21378:7655`
- finance: `21378:7623`
- teaching: `21378:7594`
- curator: `21378:7565`
- IT: `21378:7533`

This remains a known visual First Pass blocker, while the extraction technique itself is now proven.

## Partial Page warning

The learning Page currently skips unresolved Student Voice / Messages / intervening CTA sections before Courses.

Therefore `template-ref001.php` is explicitly marked:

```text
data-fixture-completeness="partial"
```

Do not use the current fixture as FULL_PAGE fidelity evidence. Section captures remain valid learning evidence once a disposable WordPress runtime exists.

## Next repair/learning targets

1. persist all seven exact SVG pictograms through the proven Plugin API string-export path
2. run the combined ACF import + seed in a disposable WordPress environment
3. capture Courses at 1380 and 375
4. preserve immutable First Pass before visual repair
5. compare section-scoped ACF groups against the earlier monolithic group on reviewability/replay cost
6. defer links or Course CPT integration until the real target theme is inspected
