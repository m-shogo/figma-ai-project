# Candidate Rules

ここには、Observationより強いがまだ汎用playbookとして証明不足のruleを置く。

## Entry gate

- target failureが明確
- isolated changeで改善した、または同じ保守的decision boundaryがclean replayで独立再現した
- before/afterまたは再現 evidenceあり
- clean replayを最低1回通した
- scope/known limitsを記録した

## Promotion

別reference/別案件または十分に異なるcontextで再現したら `../proven/` へ昇格を検討する。

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
