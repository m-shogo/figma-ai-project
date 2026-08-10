# Phase 05 — Coordinator Integration

目的: **同じShared Contract/Foundationから作られたsection outputsをページとして統合し、section単体では見えない破綻を検出する。**

Coordinator専用phase。

## Prompt

```text
Integrate the completed section outputs into the target page.

Inputs:
- frozen reference manifest: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- section manifest: <SECTION_MANIFEST>
- verified foundation commit: <FOUNDATION_COMMIT>
- completed section output commits/states: <SECTION_OUTPUTS>

Pre-integration gate:
1. Confirm every included section uses the same reference revision.
2. Confirm every included section uses the same Shared Contract SHA-256.
3. Confirm every included section started from the expected foundation commit.
4. Confirm each section output changed only allowed paths, unless an approved coordinator change exists.
5. Reject or quarantine stale-contract outputs instead of merging them silently.

Integration rules:
- Compose sections in the reference order.
- Preserve section-local implementations unless integration evidence requires change.
- Do not rewrite all sections for stylistic consistency; use the Shared Contract as the consistency source.
- Keep shared breakpoint values unchanged.
- Apply only approved shared changes.
- Preserve routing/state/accessibility architecture.

Check page-level consistency:
- section order
- cross-section vertical rhythm
- container/gutter alignment
- background/decoration continuity
- typography hierarchy
- shared component consistency
- z-index/overlap continuity
- global overflow
- navigation/anchor relationships
- asset quality/crop continuity
- behavior at every specified shared breakpoint

Breakpoint verification:
- Use exact project/company/designer breakpoint values.
- Check the boundary and, when useful, immediately adjacent widths.
- Do not invent a new integration breakpoint to hide section mismatch.

Capture:
- exact PC reference viewport
- exact SP reference viewport
- specified breakpoint boundary evidence
- additional required states/widths from the manifest

Classify integration-only failures with docs/failure-taxonomy.md, including:
- CROSS_SECTION_SPACING
- CONTAINER_ALIGNMENT_DRIFT
- BACKGROUND_CONTINUITY
- PARALLEL_RULE_DRIFT
- INTEGRATION_REGRESSION
- BREAKPOINT_CONTRACT_VIOLATION
- BREAKPOINT_BOUNDARY

Return:
- integrated page commit/state
- section outputs included
- contract hash/foundation confirmed
- integration files changed
- page-level captures
- Integration First-pass Fidelity score
- ordered integration failures
- section-specific repairs vs coordinator/shared repairs
- any stale or incompatible section output excluded

Do not hide integration failures by broad page rewrite.
```

## Pass condition

- all included sections share the same contract/foundation lineage
- page matches reference ordering and global layout
- breakpoint contract remains unchanged
- integration-specific failures are visible and classified
- page capture exists before integration repair
