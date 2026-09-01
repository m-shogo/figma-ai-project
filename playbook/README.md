# Portable Playbook

ここは実験ログ置き場ではなく、**次案件へ持っていく価値があるruleだけを置く場所**。

Canonical promotion timing / SLA: `docs/frontend-learning-promotion-policy.md`

## Directories

- `candidates/` — clean replayまで進み、追加検証中
- `proven/` — 別reference/contextでも再現した持ち出し候補

## Rule format

各ruleは最低限:

- statement
- target failure
- evidence runs
- scope
- metric effect
- known limits
- last verified date/tooling
- `promotion_review`（last/next review date、status、次に必要なevidence）

を持つ。

## Consumption — 保存して終わらせない

Production `SECTION` / `INTEGRATION` run開始前に、今回scopeへ適用可能なruleを選択してContext Packageへ入れる。

Selection order:

1. `proven/` からscope / target failure / implementation familyが一致するrule
2. `candidates/` から同条件に一致し、freshness / known limits / retest triggerが許容されるrule
3. domain Pattern Libraryから今回のfailure/intentに直接関係するentry

全ruleを毎回読むことが目的ではない。**該当ruleだけを選ぶ。**

Candidateはhard ruleとして扱わず、`evidence_maturity` と `recommendation` を維持する。

Run Recordの `knowledge_context.selected_rules` に、実際に使ったruleのpath/SHA/成熟度/選択理由を記録する。

Run後は:

```text
selected prior rule
→ current evidence
→ confirmed / contradicted / retest needed / irrelevant
→ clean replay when material
→ promotion / demotion / keep
→ next run selection
```

へ戻す。

## Promotion timing — 溜めない

Candidateを「いつか見る」状態にしない。

- clean replayでCandidate gateを満たしたら、そのrun/PR終了時にpromotion review
- 別sectionで再現したら、そのrunでPROJECT_ONLY/拡張候補をreview
- 別reference/project evidenceが入ったら、原則2日以内にACTIVE/proven review
- contradictionは同じrun/PRでreview
- project close時、そのprojectが触れたcandidateを全件review
- evidence eventがなくても最大14日ごとに定期review
- `READY_FOR_PROVEN` は最大7日以内に明示decision

`python scripts/audit_frontend_learning_promotion.py` とscheduled CIが期限切れCandidateをFAILにする。自動昇格はしない。

矛盾したruleを黙って削除しない。Toolingやreference条件の違いを残し、再試験可能にする。

Controlled benchmarkでportable knowledgeを意図的に外す場合は、production defaultではなくexperiment variableとしてRun Recordへ明示する。

## Important

このディレクトリへ「良さそうなprompt」を直接追加しない。

Observation → Candidate → Proven のpromotion ruleを通す。

`proven` 件数が増えること自体をKPIにしない。PROJECT_ONLY / DEMOTE / RETIREへ流れることも正常な学習である。
