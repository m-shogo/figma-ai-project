# Knowledge Promotion — Gradual and Reversible

このrepoの価値は成功例/失敗例を固定化することではなく、**証拠が増えるほど重要度を上げ、環境が変われば再検証できる知識**を作ること。

詳細な証拠成熟度・鮮度・source weightingは `docs/evidence-policy.md` を正本とする。

## Fundamental rule

### 1回の失敗で永久禁止しない

1回失敗した方法は `Observation / weak negative signal`。

通常の品質研究で:

- NEVER
- 絶対ダメ
- 今後使用禁止

のような永久判定はしない。

Tool/model/clientの更新で改善する可能性があるため、条件とversionを残して再試験可能にする。

### 1回の成功でbest practiceにしない

成功も同じ。

1回だけなら「今回の条件でうまくいった」に留める。

## Evidence maturity mapping

### E0 — External Signal

公式benchmark、Zenn、Qiita、X、forum、GitHub issue、research等から見つけた仮説。

自分たちでは未検証。

### E1 — Observation

自分たちの1 runで観測。

### E2 — Clean Replay Reproduced

clean baseline + fresh contextで同じ改善/失敗が再現。

Candidate Ruleへ進める。

### E3 — Cross-run / Cross-agent

複数runまたはagentで再現。

### E4 — Cross-reference

別画面/referenceでも再現。

### E5 — Portable Proven

別案件でも再現し、metric改善・known limits・current tooling verificationを持つ。

## Repository stages

### Observation

E1中心。

- 何が起きたか
- 条件
- evidence
- tool/model/client version

だけを残す。

### Candidate Rule

原則E2以上。

最低条件:

- target failureまたはtarget metricが明確
- change variableが明確
- before/after evidenceあり
- clean replay通過
- known limitsあり

### Proven Playbook

原則E4〜E5。

目安:

- 2つ以上の異なるreference context
- clean replay複数
- First-pass / Rework / failure rateの改善
-重大regressionなし
- scope分類済み
- last verified tooling/dateあり

## Recommendation strength

Evidence maturityとは別に、現在の使い方を表す。

- EXPERIMENTAL
- OPTIONAL
- PREFERRED
- DEFAULT
- CAUTION
- DEFERRED
- SUPERSEDED
- RETIRED

Negative evidenceが強くなっても、通常は `CAUTION` / `DEFERRED` を使う。

major updateやfix signalが出たらretestする。

## Scope labels

### PROJECT_ONLY
案件固有。

### PATTERN_LEVEL
同じUI patternに使える可能性。

### AGENT_SPECIFIC
特定agent/clientに依存。

### CROSS_AGENT
複数agentで再現。

### CROSS_PROJECT
別案件でも再現。

## Promotion record

```yaml
rule_id: R-001
statement: "Implement前にPC/SP ordering invariantを明文化する"
evidence_maturity: E2
recommendation: OPTIONAL
scope:
  - CROSS_AGENT
first_observed_at: ""
last_verified_at: ""
verified_tooling:
  figma_mcp: ""
  agents: []
target_failure:
  - RESPONSIVE_INVARIANT
evidence_runs: []
external_signals: []
metric_effect:
  first_pass_delta: null
  repair_round_delta: null
known_limits: []
retest_triggers:
  - "major Figma MCP update"
  - "agent/model generation change"
```

## Negative knowledge

「この条件では失敗しやすかった」も重要。

悪い保存:

> giant promptは禁止。

良い保存:

> 2026-xxのAgent X / Model Y / Reference Zでは、whole-page one-shotがsection progressive disclosureよりtypography/spacing failureを増やした。E2。現在CAUTION。context handlingが変わるmajor model update時にretest。

**条件・鮮度・retest triggerまで残す。**

## Demotion / upgrade / retest

Playbookは常に可逆。

### Importance down

- newer runsで効果が消えた
- smaller contextで同等結果
- new tool makes workaround unnecessary
- regressionが増えた

### Importance up

- independent community reportsが増えた
- first-party benchmarkが出た
- own clean replayで再現
- cross-agent/referenceで再現

### Retest

- model/client major update
- Figma MCP tool change
- known issue fix
- new Code Connect/Skill capability
- previously unavailable feature becomes available

## Community-to-playbook path

```text
SNS / Zenn / Qiita / Forum / Official benchmark
  ↓ E0
Community Signal Registry
  ↓ priority selection
Controlled Experiment
  ↓ E1
Observation
  ↓ clean replay
Candidate E2
  ↓ cross-agent/reference
E3/E4
  ↓ cross-project
Proven E5
```

## Promotion rule

必要なのは:

1. observable effect
2. isolated change
3. measurable result
4. clean replay
5. applicability/limits
6. current-environment verification

証拠が足りなければ、**低い重要度のまま保持することが正しい**。
