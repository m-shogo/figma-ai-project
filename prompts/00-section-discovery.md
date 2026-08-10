# Phase 00B — Section Discovery

目的: **Figma pageの論理Sectionをmetadata-firstで抽出し、PC/SP nodeを対応付け、並列実装へ渡せるSection Manifest候補を作る。**

Coordinator専用。Production UI code変更禁止。

## Prompt

```text
Discover logical implementation sections from the frozen Figma reference.

Do not implement UI.
Do not redesign the Figma reference.
Do not split every frame/component into a section.
Do not ask the owner to manually collect section URLs if the node IDs can be discovered from Figma metadata/context.

Inputs:
- reference manifest: <REFERENCE_MANIFEST>
- PC/SP root nodes: <REFERENCE_ROOTS>
- shared reconnaissance: <GLOBAL_RECONNAISSANCE>
- target codebase map: <CODEBASE_MAP>

Process:
1. Read sparse/top-level metadata for the PC and SP roots first.
2. Propose logical section candidates from native Figma Sections, top-level frames/Auto Layout children, semantic names, layout/background boundaries, and page roles.
3. Reject obvious over-splitting such as individual Buttons, Cards, decorative shapes, and tiny internal groups.
4. Map each PC candidate to its SP counterpart using multiple signals:
   - component identity
   - semantic name/role
   - text anchors
   - image/icon assets
   - page order
   - child structure
   - visual similarity
5. Deep-inspect only ambiguous candidates or mappings.
6. Assign boundary confidence and PC/SP mapping confidence.
7. Identify cross-section dependency and integration coupling.
8. Propose implementation ownership/write-scope boundaries based on the existing codebase structure; do not invent a parallel architecture when the repository already has conventions.

For each candidate return:
- section_id
- logical name/role
- page order
- PC node ID
- SP node ID or N/A
- boundary_source
- boundary_confidence HIGH/MEDIUM/LOW
- boundary_evidence
- pc_sp_mapping_confidence HIGH/MEDIUM/LOW/NOT_APPLICABLE
- mapping_evidence
- section dependencies
- integration_coupling LOW/MEDIUM/HIGH
- coupling evidence
- relevant shared components/tokens/fonts/assets
- proposed implementation paths
- unresolved ambiguity

Rules:
- LOW confidence is not a reason to guess. Retrieve more evidence first.
- If LOW remains, do not schedule that section into a concurrent production wave yet.
- HIGH coupling may mean the boundary should be merged or executed serially.
- Do not duplicate breakpoint values in each section. Use the frozen Shared Contract.
- PC/SP are two representations of one logical section, not separate implementations unless the reference explicitly requires that.

At the end return:
1. Proposed Section Manifest entries
2. Rejected split candidates and reasons
3. Remaining LOW-confidence boundaries/mappings
4. Figma nodes actually inspected
5. Additional evidence needed, if any

Stop before section implementation.
```

## Pass condition

- production-sized logical sections are identified
- PC/SP mapping is evidence-backed
- confidence is explicit
- high-coupling boundaries are visible
- no manual section URL extraction is required when MCP metadata can resolve node IDs
- no code was changed
