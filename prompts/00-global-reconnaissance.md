# Phase 00 — Global Reconnaissance

目的: **ページを実装せず、section並列実装に必要な全体契約とsection boundaryの材料を集める。**

Coordinator専用phase。

このphaseではproduction UI codeを変更しない。

## Prompt

```text
Perform global reconnaissance for the frozen Figma reference and target codebase.

Do not implement the page or any section yet.
Do not redesign or improve the reference.
Do not invent breakpoint values, tokens, components, or design rules when an owner/company/design-system/code source exists.

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
4. Identify logical section candidates such as Header, MainVisual, content sections, and Footer.
5. Deep-inspect only the shared structures needed to build the contract:
   - components / component sets / variants
   - Code Connect mappings when available
   - variables / modes / tokens
   - typography / font availability
   - Auto Layout / Grid / sizing semantics
   - shared assets
   - states / annotations / dev resources
6. Inspect PC/SP relationships at the specified project breakpoints.
7. Inspect existing code components/tokens/utilities that should be reused.

Breakpoint rule:
- Treat owner/company/design-system/existing-code breakpoint definitions as source of truth.
- Do not infer a replacement threshold from screenshots.
- If sources conflict, record the conflict instead of choosing silently.

Return exactly:
1. Reference summary
2. Codebase styling/design-system map
3. Breakpoint evidence and source
4. Shared component reuse map
5. Variable/token map
6. Typography/font map
7. Shared layout/container/gutter findings
8. Asset policy candidates
9. Proposed section boundaries with exact Figma node IDs
10. Shared-contract fields that are ready
11. Material UNKNOWNs/conflicts
12. Figma nodes/context actually inspected
13. Recommended next shared-foundation work

Stop after reconnaissance. Do not implement sections.
```

## Pass condition

- section candidates have exact node IDs
- breakpoint source is identified or conflict/UNKNOWN is explicit
- shared components/tokens/fonts are mapped
- existing code reuse candidates are identified
- no page/section implementation was performed
