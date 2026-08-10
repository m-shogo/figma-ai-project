# Phase 00b — Shared Foundation

目的: **section worker開始前に、全sectionが依存する共通実装を1回だけ作成/検証する。**

Coordinator専用phase。

## Prompt

```text
Build and verify the shared implementation foundation from the approved global reconnaissance and Shared Contract DRAFT.

Do not implement page-specific content sections yet.
Do not redesign the reference.
Do not invent a new breakpoint when an owner/company/design-system/existing-code breakpoint is specified.

Inputs:
- frozen reference manifest: <REFERENCE_MANIFEST>
- Shared Contract DRAFT: <SHARED_CONTRACT>
- target repository starting commit: <STARTING_COMMIT>
- approved section manifest draft: <SECTION_MANIFEST>

Implement/reuse only shared foundation concerns:
1. font loading / typography foundation
2. existing token bindings or CSS Custom Properties when needed
3. exact approved global breakpoint binding
4. page container / gutter / layout primitives
5. shared components identified during reconnaissance
6. shared asset helpers
7. shared accessibility primitives when applicable

Existing-project rule:
- Prefer existing project/design-system implementations.
- Do not duplicate Button/Input/container/token/breakpoint utilities already present.
- If existing code conflicts with the approved contract, report the conflict instead of silently replacing it.

Breakpoint rule:
- Use the exact Shared Contract query/value semantics.
- Do not add local or fallback thresholds.
- Record where the breakpoint source is implemented in code.

Verification before freeze:
- build/type/lint as applicable
- fonts load with expected weights
- token references resolve
- shared components render
- container/gutter behavior is correct
- breakpoint definitions match the Shared Contract
- no section-specific UI was accidentally implemented

Return:
- shared files changed/reused
- foundation base commit
- verified foundation commit
- checks performed
- exact breakpoint implementation location
- shared components available to workers
- unresolved conflicts
- whether Shared Contract can be marked FROZEN

If verification passes, update the contract record conceptually to:
foundation.status = VERIFIED
foundation.commit = <verified commit>
status = FROZEN
freeze.ready = true

Do not start section implementation in this phase.
```

## Pass condition

- shared foundation is runnable
- approved breakpoint contract is represented exactly
- common fonts/tokens/components/container are reusable
- foundation commit is recorded
- Shared Contract is ready to hash/freeze
