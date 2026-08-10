# Phase 04 — Repair

目的: Verifyで確定したfailureを**root cause単位で最小修正**する。

## Prompt

```text
Repair the selected verified failure(s) only.

Inputs:
- frozen reference: <REFERENCE_MANIFEST>
- first-pass/previous repair state: <IMPLEMENTATION_REF>
- verified failure record(s): <FAILURE_IDS>
- remaining repair budget: <REPAIR_ROUNDS_LEFT>

Repair rules:
1. Fix the primary root cause, not only the visible symptom.
2. Keep the repair scoped to the selected failure class/root cause.
3. Preserve areas already matching the reference.
4. Preserve existing component/token reuse and repository architecture.
5. Do not redesign or make unrelated cleanup changes.
6. Do not solve responsive failures by hardcoding only one acceptance viewport.
7. Do not introduce visual-only hacks unless the reference itself requires that structure.
8. If the proposed repair would affect another failure class materially, state that before broadening scope.

After editing:
- run relevant basic checks
- render the affected acceptance viewport(s)
- verify the selected failure is improved
- check for regressions in neighboring matched areas

Report:
- failure IDs addressed
- root cause addressed
- files changed
- exact repair made
- before/after evidence
- regression check
- remaining mismatches
- whether this repair should be tested in a clean replay

Stop after this repair round. Do not silently start another repair class.
```

## Repair grouping

複数failureを同時に直してよいのは、同じroot causeを共有するとき。

例:

- 5箇所のspacing mismatchが同じwrong token由来
- PC/SPの複数崩れが同じcontainer rule由来

見た目が同時に気になるだけならまとめない。

## Replay candidate

以下ならclean replay候補:

- prompt/context変更だけで防げそう
-同じfailureが複数runで出た
- repairにproject固有hackが少ない
- First-passを改善できる可能性が高い
