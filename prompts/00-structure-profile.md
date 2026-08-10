# Phase 00a — Figma Structure Profile

目的: **実装前に、各sectionがFigmaのどの構造情報をどれだけ信頼できるかを証拠付きで記録する。**

このphaseではFigma designもproduction codeも変更しない。

## Prompt

```text
Profile the actual structure of the frozen Figma reference section-by-section.

Do not edit the Figma design.
Do not implement code.
Do not assume Auto Layout, Variables, Components, semantic naming, or Code Connect are present.
Do not infer a production breakpoint value from visual breakage; use the external/company/design-system breakpoint evidence separately.

Inputs:
- frozen Reference Manifest: <REFERENCE_MANIFEST>
- proposed Section Manifest / section candidates: <SECTION_MANIFEST>
- target codebase/design-system map from Global Reconnaissance: <CODEBASE_MAP>
- current Figma tooling snapshot: <TOOLING_SNAPSHOT>

Use progressive disclosure:
1. Inspect top-level metadata only to confirm section nodes.
2. For each section, inspect only the relevant node(s).
3. Deep-inspect child/component nodes only when needed to resolve evidence confidence.
4. Use exact screenshots as visual ground truth, not as a replacement for structured evidence.

For each section inspect and record:

A. Components / Variants
- component instances
- component sets
- variants/properties
- detached/repeated patterns
- corresponding existing code components

B. Variables / Modes
- bound colors/numbers/modes
- raw/unbound repeated values
- aliases where visible
- mapping candidates to production tokens

C. Auto Layout / Grid / sizing
- whether Auto Layout/Grid is actually used
- updated/legacy/mixed generation when observable
- fixed/hug/fill
- min/max
- wrapping
- nested layout
- intentional absolute/freeform children

D. Semantic naming / annotations
- meaningful section/component/layer names
- generic names
- annotations/dev resources

E. Code Connect
- whether mappings exist
- which components are mapped
- mapping coverage if genuinely observable

F. Assets
- exact source image/icon/vector availability
- masks/crop/focal point

G. PC/SP structural mapping
- same-content evidence
- section correspondence
- layout changes
- visibility/order changes

H. Codebase reuse
- production components that should override/reconcile weak Figma structure
- existing tokens/layout primitives

Confidence rules:
- NONE: no usable evidence
- LOW: weak/partial evidence
- MEDIUM: enough evidence to guide implementation
- HIGH: explicit/direct structured evidence

Never fabricate coverage percentages. Use null if the tool does not expose enough information.

Recommend one translation mode per section:

STRUCTURE_FIRST
- use when structured Figma layout/components/variables are sufficiently trustworthy

HYBRID
- use when some structured signals are strong and others are weak/missing

VISUAL_FIRST
- use when Figma structure is too weak/flat/legacy to translate mechanically; still implement semantic native code and use screenshots for geometry verification

CODEBASE_FIRST
- use when mature existing production components/design system are stronger implementation constraints than weak/outdated Figma structure

For every non-UNKNOWN recommendation include:
- mode_reasoning_evidence
- trusted_structure
- untrusted_or_missing_structure
- codebase_reuse_priority where relevant

Return a structure profile compatible with:
`templates/figma-structure-profile.yaml`

Also return:
- sections still UNKNOWN
- additional Figma nodes/context needed to resolve them
- conflicts between Figma structure and production codebase
- any current tooling limitation that reduced confidence

Stop after profiling. Do not implement.
```

## Pass condition

Before a production section becomes READY:

- matching structure profile entry exists
- actual section Figma node is referenced
- translation mode is resolved
- mode has evidence
- MEDIUM/HIGH signal claims have evidence

`UNKNOWN` is acceptable while research continues, not at production worker start.
