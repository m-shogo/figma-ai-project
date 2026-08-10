# Phase 00b — Shared Foundation

目的: **section worker開始前に、観測済みFigma Capability Profileと案件/codebase規約に合わせて全section共通実装を1回だけ作成/検証する。**

Coordinator専用phase。

## Prompt

```text
Build and verify the shared implementation foundation from the approved global reconnaissance and Shared Contract DRAFT.

Do not implement page-specific content sections yet.
Do not redesign the reference.
Do not invent a new breakpoint when an owner/company/design-system/existing-code breakpoint is specified.
Do not create Components/Tokens abstractions merely because Figma best practice suggests them; use the observed Figma Capability Profile and existing codebase architecture.

Inputs:
- frozen reference manifest: <REFERENCE_MANIFEST>
- Shared Contract DRAFT: <SHARED_CONTRACT>
- Figma Capability Profile: <FIGMA_PROFILE>
- target repository starting commit: <STARTING_COMMIT>
- approved section manifest draft: <SECTION_MANIFEST>

Before editing, confirm:
- every required profile dimension is resolved or explicitly still UNKNOWN
- UNKNOWN does not mean NONE
- strategy_decisions explain how actual Figma structure changes the implementation approach

Implementation adaptation:
1. Components SYSTEMATIC/PARTIAL/SPARSE:
   - map observed reusable components to existing code components first
   - use Code Connect mappings where actually available
   - preserve useful variant/property semantics
2. Components NONE:
   - still follow good code architecture, but do not invent a large Figma-derived component system without reuse evidence
3. Variables SYSTEMATIC/PARTIAL/SPARSE:
   - map actual variables/modes/aliases to existing project tokens where compatible
   - do not blindly flatten semantic aliases
4. Variables NONE:
   - prefer existing codebase tokens; preserve genuine one-off values instead of fabricating global tokens
5. Auto Layout HIGH/MEDIUM:
   - translate actual fixed/hug/fill/grid/wrap/min-max semantics to natural CSS layout
6. Auto Layout LEGACY/MIXED/LOW/NONE:
   - inspect relevant nodes individually; do not globally assume one Flex/Grid mapping
7. Code Connect NONE:
   - continue normally using structured Figma + codebase reuse mapping
8. semantic naming LOW:
   - do not use layer names as sole structural evidence

Implement/reuse only shared foundation concerns:
1. font loading / typography foundation
2. existing token bindings or CSS Custom Properties when needed by actual profile/codebase
3. exact approved global breakpoint binding
4. page container / gutter / layout primitives
5. shared components justified by Figma/codebase reuse evidence
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
- Figma Capability Profile has no material UNKNOWNs
- every NONE state has evidence showing it was inspected
- strategy_decisions are recorded
- build/type/lint as applicable
- fonts load with expected weights
- token references resolve
- shared components render
- container/gutter behavior is correct
- breakpoint definitions match the Shared Contract
- no section-specific UI was accidentally implemented

Return:
- Figma profile assumptions actually used
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

- Figma profile is resolved and evidence-backed
- foundation matches actual Figma maturity instead of an assumed ideal structure
- shared foundation is runnable
- approved breakpoint contract is represented exactly
- common fonts/tokens/components/container are reusable where justified
- foundation commit is recorded
- Shared Contract is ready to hash/freeze
