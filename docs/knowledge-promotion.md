# Knowledge Promotion

このrepoの価値は、成功例を集めることではなく、**再現した学びだけを次案件へ持ち出せる形にすること**。

## Levels

### L0 — Observation

1 runで観測した事実。

例:

- Claude Code runでCardのgapを誤った
- screenshot-only runでSP orderを誤った

まだ一般化しない。

### L1 — Candidate Rule

同じfailureに対する改善が、少なくとも複数runで同方向に効いた仮説。

最低条件:

- primary failureが明確
- change variableが明確
- before/after evidenceあり
- clean rerunを最低1回通過

### L2 — Proven Playbook

別画面または別案件でも有効性が再現したrule。

目安:

- 2つ以上の異なるreference context
- 2つ以上のclean replay
- First-pass / Rework Cost / failure rate のどれかが明確に改善
- 重大regressionがない
- agent-specificかcross-agentか分類済み

## Scope labels

### PROJECT_ONLY
その案件のdesign/codebase固有。

### PATTERN_LEVEL
同じUI patternに使えそう。

例: table / card grid / nav / modal。

### AGENT_SPECIFIC
特定agent/clientにだけ有効。

### CROSS_AGENT
複数agentで効く。

### CROSS_PROJECT
別案件でも再現。

## Promotion record

```yaml
rule_id: R-001
status: candidate
statement: "Implement前にPC/SP ordering invariantを明文化する"
target_failure:
  - RESPONSIVE_INVARIANT
scope:
  - CROSS_AGENT
evidence_runs:
  - EXP-0001-CODEX-C2
  - EXP-0001-CLAUDE-C2
metric_effect:
  first_pass_delta: "+6"
  repair_round_delta: "-1"
clean_replay: true
known_limits:
  - "single-column layoutsでは効果未検証"
```

## Demotion / retirement

Playbookも永続正解ではない。

以下なら見直す。

- agent/model更新後に効果が消えた
- Figma MCP仕様変更で不要になった
- 別案件でregressionを増やした
- より小さいcontextで同等結果が出る
- codebase/design-system側の進化で不要になった

Status:

- active
- candidate
- superseded
- retired

## Negative knowledge

「やらない方がよい」も重要な知識。

例:

- giant promptで全部指定すると重要条件が埋もれた
- exact screenshotだけに寄せたrepairで中間幅が壊れた
- component mappingを無視してraw divを作るとreworkが増えた

失敗を削除せず、再発条件と一緒に残す。

## Promotion rule

**良さそうだから昇格、は禁止。**

必要なのは:

1. observable failure
2. isolated change
3. measurable effect
4. clean replay
5. portability evidence

この5つが揃わないものはObservation/Candidateのままにする。
