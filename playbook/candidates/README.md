# Candidate Rules

ここには、Observationより強いがまだ汎用playbookとして証明不足のruleを置く。

Canonical promotion timing / SLA: `../../docs/frontend-learning-promotion-policy.md`

## Entry gate

- target failureが明確
- isolated changeで改善した、または同じ保守的decision boundaryがclean replayで独立再現した
- before/afterまたは再現 evidenceあり
- clean replayを最低1回通した
- scope/known limitsを記録した
- `promotion_review` に次のreview日・status・必要evidenceを記録した

## Promotion

別reference/別案件または十分に異なるcontextで再現したら `../proven/` への昇格を**その時点でreview**する。

- 2つ目の独立evidenceが入ったら原則2日以内にreview
- evidence eventが無くても最大14日ごとにreview
- `READY_FOR_PROVEN` は最大7日以内に明示decision
- contradictionは同じrun/PRでreview
- project close時、そのprojectで触れたcandidateを全件review

時間だけではpromoteしない。期限は「判断を先送りしない」ためのもの。

## Required `promotion_review`

```yaml
promotion_review:
  last_reviewed_at: "2026-09-02"
  next_review_at: "2026-09-16"
  status: RETEST_REQUIRED
  reason: "Second-reference measured outcome is missing."
  trigger: "Review immediately when the next independent clean replay lands."
  evidence_needed:
    - "Measured second-reference outcome"
```

Allowed status:

- `KEEP_CANDIDATE`
- `RETEST_REQUIRED`
- `READY_FOR_PROVEN`
- `DEMOTE`
- `RETIRE`

`python scripts/audit_frontend_learning_promotion.py` がoverdueをFAILにする。自動昇格はしない。

## Current candidates

All current rules are **E2 / OPTIONAL**. They are not permanent best practices yet.

- `cr-ref001-001-static-frame-vs-runtime.yaml`
  - exact Figma endpoint fidelityとbrowser runtime safetyを分離する
  - ordinary copyをstatic screenshotへ合わせるためのnowrap/viewport wideningを避ける
- `cr-ref001-002-evidence-gated-interaction.yaml`
  - static affordance/counter/stateだけからinteractionやhidden recordsを発明しない
- `cr-ref001-003-visual-repetition-vs-cms-cardinality.yaml`
  - Figma上の反復だけを理由にRepeater/Flexible Content等の可変collectionを発明しない

Post-hoc comparison and non-promoted observations:

- `../../docs/ref001-clean-replay-postmortem.md`
