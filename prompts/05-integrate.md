# Phase 05 — Coordinator Integration

目的: **同じCompany/Shared/Environment Contract + Foundationから作られたSection outputsをページとして統合し、Section単体では見えない端末/境界破綻を検出する。**

Coordinator専用phase。

## Prompt

```text
Integrate the completed section outputs into the target page.

Inputs:
- ACTIVE Company Policy: <COMPANY_POLICY>
- Company Policy SHA-256: <COMPANY_POLICY_HASH>
- frozen reference manifest: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- resolved Environment Contract: <ENVIRONMENT_CONTRACT>
- section manifest: <SECTION_MANIFEST>
- verified foundation commit: <FOUNDATION_COMMIT>
- completed section output commits/states: <SECTION_OUTPUTS>

Pre-integration gate:
1. Confirm every included Section uses the same Reference revision.
2. Confirm every included Section uses the same Company Policy id/hash.
3. Confirm every included Section uses the same Shared Contract SHA-256.
4. Confirm the Environment Contract is RESOLVED and still matches Company Policy Required profiles.
5. Confirm every included Section started from the expected Foundation commit.
6. Confirm each Section output changed only allowed paths, unless an approved Coordinator change exists.
7. Reject/quarantine stale Company/Shared/Environment outputs instead of merging silently.

Integration rules:
- Compose Sections in the Reference order.
- Preserve Section-local implementations unless integration evidence requires change.
- Do not rewrite all Sections for stylistic consistency; use frozen contracts as the consistency source.
- Keep shared breakpoint values unchanged.
- Keep runtime capability/device policy unchanged.
- Apply only approved shared/environment changes.
- Preserve routing/state/accessibility architecture.

Evidence ladder:
1. Section evidence already captured.
2. Capture adjacent Boundary evidence for S01↔S02, S02↔S03, etc. where applicable.
3. Capture high-coupling Cluster evidence when background/overlap/sticky/navigation behavior spans Sections.
4. Capture Full Page evidence.
5. Use cumulative-prefix captures only when sticky/scroll-progress/vertical-rhythm dependencies justify them.

Environment QA strategy:
- Canonical profile: detailed Section/Boundary/Cluster/Full Page visual comparison.
- Required profiles with material environment differences: repeat affected Section/Boundary/Cluster evidence.
- ALL REQUIRED profiles: Full Page capture/smoke verification.
- ALL relevant REQUIRED profiles: interaction verification for hamburger, slider, hover/touch fallback, forms, scroll lock, sticky/fixed UI, and animation.
- Record environment profile id with every capture.
- Do not rank raw cross-browser pixel diffs as if browser/OS/DPR rendering were identical.

Check page-level consistency:
- Section order
- cross-Section vertical rhythm
- container/gutter alignment
- background/decoration continuity
- typography hierarchy
- shared component consistency
- z-index/overlap continuity
- global overflow
- navigation/anchor relationships
- asset quality/crop continuity
- behavior at every specified shared breakpoint
- hover/pointer/touch behavior
- safe-area / dynamic viewport / virtual keyboard when relevant
- scroll lock / scrollbar layout shift
- reduced-motion / required accessibility preference states
- output gamut/gradient behavior when material

Breakpoint verification:
- Use exact project/company/designer breakpoint values.
- Check the boundary and, when useful, immediately adjacent widths.
- Do not invent a new integration breakpoint to hide Section mismatch.
- Do not use breakpoint width as a substitute for input capability detection.

Device/environment verification:
- Use Company Policy Environment Profiles as QA identities.
- Runtime implementation should prefer capability/feature detection.
- Browser/UA-specific exceptions require approved Company Policy + evidence.
- A Required environment failure is not dismissed because canonical environment passes.

Classify integration-only failures with docs/failure-taxonomy.md, including:
- CROSS_SECTION_SPACING
- CONTAINER_ALIGNMENT_DRIFT
- BACKGROUND_CONTINUITY
- PARALLEL_RULE_DRIFT
- INTEGRATION_REGRESSION
- BREAKPOINT_CONTRACT_VIOLATION
- BREAKPOINT_BOUNDARY
- INPUT_CAPABILITY
- DEVICE_ENVIRONMENT
- SAFE_AREA_VIEWPORT
- TOUCH_GESTURE
- SCROLL_LOCK
- COMPANY_POLICY

Return:
- integrated page commit/state
- Section outputs included
- Company Policy / Shared Contract / Environment Contract / Foundation lineage confirmed
- integration files changed
- Boundary/Cluster/Full Page captures with environment profile ids
- Integration First-pass Fidelity score for canonical environment
- environment-specific diagnostics separately
- ordered integration failures
- Section-specific repairs vs Coordinator/shared/environment repairs
- any stale or incompatible Section output excluded

Do not hide integration failures by broad page rewrite.
```

## Pass condition

- all included Sections share the same Company/Shared/Environment/Foundation lineage
- page matches Reference ordering and global layout
- breakpoint contract remains unchanged
- input/device behavior follows Environment Contract
- Full Page evidence exists for ALL REQUIRED environments
- relevant interactions are verified on all relevant REQUIRED environments
- integration-specific failures are visible and classified
- page capture exists before integration repair
