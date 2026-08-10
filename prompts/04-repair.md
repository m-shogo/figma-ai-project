# Phase 04 — Section Repair

目的: Verifyで確定したfailureを**root cause単位で最小修正**する。

## Prompt

```text
Repair only the selected verified SECTION failure(s).

Inputs:
- frozen reference: <REFERENCE_MANIFEST>
- frozen shared contract: <SHARED_CONTRACT>
- shared contract SHA-256: <SHARED_CONTRACT_HASH>
- section manifest entry: <SECTION_ENTRY>
- first-pass/previous repair state: <IMPLEMENTATION_REF>
- verified failure record(s): <FAILURE_IDS>
- remaining repair budget: <REPAIR_ROUNDS_LEFT>

Repair rules:
1. Fix the primary root cause, not only the visible symptom.
2. Keep the repair inside the assigned section allowed paths.
3. Preserve areas already matching the reference.
4. Preserve shared component/token/font/container/breakpoint contracts.
5. Do not redesign or make unrelated cleanup changes.
6. Do not solve responsive failures by adding an unapproved breakpoint.
7. Do not hardcode only one acceptance viewport.
8. Do not introduce visual-only hacks unless the reference intentionally requires that structure.
9. If repair needs a shared-file change, stop that part and return PROPOSE_SHARED_CHANGE.
10. If repair appears to need a new breakpoint, stop that part and return PROPOSE_BREAKPOINT_EXCEPTION with evidence.

After editing:
- run relevant basic checks
- render affected acceptance viewport(s)
- verify the selected failure improved
- check the shared breakpoint boundary when responsive
- check regressions in neighboring matched areas
- confirm no shared file or unapproved path changed

Report:
- section ID
- failure IDs addressed
- root cause addressed
- files changed
- exact repair made
- before/after evidence
- breakpoint/contract compliance check
- regression check
- remaining mismatches
- proposed shared changes/exceptions
- whether this repair should be tested in a clean replay

Stop after this repair round. Do not silently start another repair class.
```

## Repair grouping

複数failureを同時に直してよいのは、同じroot causeを共有するとき。

例:

- 複数spacing mismatchが同じwrong token由来
- PC/SPの複数崩れが同じsection layout rule由来

Shared Contract自体を変えるrepairはsection workerの責務ではない。

## Replay candidate

以下ならclean replay候補:

- prompt/context/section manifest改善だけで防げそう
- 同じfailureが複数runで出た
- repairにproject固有hackが少ない
- First-passを改善できる可能性が高い

1回の成功/失敗だけで永久rule化しない。
