# Phase 00 — Global Reconnaissance

目的: **ページを実装せず、section並列実装に必要な全体契約・Figma capability profile・section boundaryの材料を集める。**

Coordinator専用phase。production UI codeは変更しない。

## Prompt

```text
Perform global reconnaissance for the frozen Figma reference and target codebase.

Do not implement the page or any section yet.
Do not redesign or improve the reference.
Do not invent breakpoint values, tokens, components, or design rules when an owner/company/design-system/code source exists.
Do not assume the Figma uses Components, Variables, Auto Layout, Code Connect, or annotations until you inspect it.

Inputs:
- frozen reference manifest: <REFERENCE_MANIFEST>
- target Figma page/frame: <FIGMA_TARGET>
- target repository/starting commit: <REPOSITORY / STARTING_COMMIT>
- owner/company/project guidance: <GUIDANCE_SOURCES>
- tooling preflight: <TOOLING_PREFLIGHT>

Use progressive disclosure:
1. Inspect repository styling/design-system architecture first.
2. Inspect company/designer breakpoint rules and existing product breakpoint definitions.
3. Inspect sparse/top-level Figma metadata/hierarchy.
4. Build an evidence-backed Figma Capability Profile for the exact target nodes:
   - Components: NONE / SPARSE / PARTIAL / SYSTEMATIC
   - Variables: NONE / SPARSE / PARTIAL / SYSTEMATIC
   - Auto Layout coverage: NONE / LOW / MEDIUM / HIGH / MIXED
   - Auto Layout generation: NONE / LEGACY / UPDATED_2026 / MIXED
   - semantic naming: LOW / MEDIUM / HIGH
   - Code Connect: NONE / PARTIAL / STRONG
   - annotations/dev intent: NONE / PARTIAL / STRONG
   - asset access: NONE / PARTIAL / STRONG
5. For every profile dimension, preserve evidence. NONE means inspected-and-absent; UNKNOWN means not resolved yet.
6. Identify logical section candidates such as Header, MainVisual, content sections, and Footer.
7. Deep-inspect only shared structures and ambiguous section candidates:
   - components / component sets / variants
   - Code Connect mappings when available
   - variables / modes / aliases
   - typography / font availability
   - Auto Layout / Grid / sizing semantics
   - shared assets
   - states / annotations / dev resources
8. Inspect PC/SP relationships at the specified project breakpoints.
9. Inspect existing code components/tokens/utilities that should be reused.
10. Convert the observed Figma Capability Profile into explicit strategy decisions.

Capability adaptation rules:
- SYSTEMATIC Components/Variables: preserve/reuse their semantics where compatible with the codebase.
- PARTIAL/SPARSE: use what actually exists; do not pretend coverage is complete.
- NONE: do not manufacture a large Figma-derived design system solely because best practice says one should exist.
- Code Connect NONE: continue with structured Figma + codebase inspection; it is not a blocker.
- Auto Layout MIXED/LEGACY: inspect node semantics individually; do not apply one global translation assumption.
- semantic naming LOW: use hierarchy + screenshots + text/assets/components as additional section evidence.

Breakpoint rule:
- Treat owner/company/design-system/existing-code breakpoint definitions as source of truth.
- Do not infer a replacement threshold from screenshots.
- If sources conflict, record the conflict instead of choosing silently.

Return exactly:
1. Reference summary
2. Codebase styling/design-system map
3. Figma Capability Profile + evidence
4. Strategy decisions derived from that profile
5. Breakpoint evidence and source
6. Shared component reuse map
7. Variable/token map
8. Typography/font map
9. Shared layout/container/gutter findings
10. Asset policy candidates
11. Proposed section boundaries with exact Figma node IDs
12. Shared-contract fields that are ready
13. Material UNKNOWNs/conflicts
14. Figma nodes/context actually inspected
15. Recommended next shared-foundation work

Stop after reconnaissance. Do not implement sections.
```

## Pass condition

- section candidates have exact node IDs or explicit unresolved discovery evidence
- breakpoint source is identified or conflict/UNKNOWN is explicit
- Figma Capability Profile distinguishes inspected NONE from unresolved UNKNOWN
- profile has evidence and implementation strategy decisions
- shared components/tokens/fonts are mapped according to actual coverage
- existing code reuse candidates are identified
- no page/section implementation was performed
