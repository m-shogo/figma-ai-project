# Evidence Policy — Adaptive, Not Absolute

Last reviewed: **2026-08-10 JST**

このプロジェクトでは、1回の成功や失敗を永久ルールにしない。

AI coding agents、Figma MCP、Code Connect、Skills、IDE統合は短期間で大きく変わる。したがって、知識は**重要度・再現回数・鮮度・適用条件**を持つ可変の証拠として扱う。

## Core principle

### One failure is not a ban

1回失敗した方法は:

- `BAD`
- `NEVER_USE`
- `絶対禁止`

にはしない。

代わりに:

- `weak_negative_signal`
- `caution_candidate`
- `retest_after_update`

として残す。

同様に、1回成功した方法も `best practice` にはしない。

## Evidence maturity

### E0 — External signal

外部記事、SNS投稿、動画、forum、release noteなどで見つけた情報。

まだ自分の環境では未検証。

### E1 — Local observation

自分たちの1 runで観測した。

方向性は見えるが一般化禁止。

### E2 — Clean replay reproduced

同じ条件をclean baseline/fresh contextから再実行して再現。

Candidate Ruleへ進める。

### E3 — Cross-run / cross-agent replicated

複数runまたは複数agentで同方向に再現。

重要度を上げる。

### E4 — Cross-reference replicated

異なる画面/referenceでも再現。

Pattern/Cross-project rule候補。

### E5 — Portable proven

異なる案件でも有効性を確認し、明確なmetric改善とknown limitsを持つ。

Proven Playbook候補。

## Recommendation strength

証拠成熟度とは別に、現在の推奨度を持つ。

- `EXPERIMENTAL` — 面白い。試す価値あり
- `OPTIONAL` — 条件が合えば使う
- `PREFERRED` — 現時点では第一候補
- `DEFAULT` — 多くの該当ケースで標準採用
- `CAUTION` — 現状失敗が多い/制約あり。禁止ではない
- `DEFERRED` — 今は優先度低い。更新後再評価
- `SUPERSEDED` — より良い方法が見つかった
- `RETIRED` — 現在のtoolingでは不要。ただし履歴は残す

`FORBIDDEN` は通常の品質研究では使わない。

安全性、セキュリティ、データ損失、ユーザー明示禁止など、実験で上書きできない境界だけ別扱いにする。

## Negative evidence rule

失敗が増えてもすぐ永久禁止にしない。

推奨度を段階的に下げる例:

```text
E0 external complaint
  ↓
E1 local failure
  ↓ clean replay failure
E2 repeated failure
  ↓ multiple environments
E3 strong caution
```

この状態でも、major update / model update / MCP tool change / documented fix が入れば再試験する。

## Positive evidence rule

成功も段階的に上げる。

```text
E0 community tip
  ↓ local experiment improves metric
E1 observation
  ↓ clean replay
E2 candidate
  ↓ cross-agent/reference
E3/E4 preferred
  ↓ cross-project
E5 proven/default candidate
```

## Freshness / temporal decay

高速に変化する領域では古い知識の重みを自然に下げる。

### Fast-moving topics

例:

- Figma MCP tool availability
- Code Connect behavior
- `use_figma` / `generate_figma_design`
- Codex / Claude Code / Cursor client behavior
- MCP connection/config
- model-specific prompting
- agent Skills/Rules

目安:

- 0–30 days: `FRESH`
- 31–90 days: `CURRENT`
- 91–180 days: `AGING`
- 181+ days: `STALE_UNTIL_REVERIFIED`

これは自動失効ではない。**重要なruleほど新環境で再確認する**ための優先順位。

### Slow-moving topics

例:

- first-passを保存する
- referenceをfreezeする
-比較条件を揃える
- failure evidenceを残す

これらは製品機能より変化が遅い。ただし永続真理扱いはせず、反証可能にする。

## Update triggers

以下が起きたら、関連するnegative/positive ruleを再評価する。

- major Figma MCP release
- new MCP tool or skill
- Code Connect change
- agent/client major release
- model alias/model generation change
- new official benchmark
- multiple new community success reports
- previously known issue marked fixed
- workaround becomes first-party capability

## Source weighting

sourceの種類と「何を証明できるか」を分ける。

### Official docs / release notes

強い用途:

- feature existence
- supported clients
- documented limitations
- API/tool semantics

弱い用途:

- real-world quality across diverse projects

### First-party benchmark / case study

強い用途:

- measured effect under disclosed conditions

注意:

- test design/coverage/modelに依存
-自分のprojectへそのまま外挿しない

### Experienced practitioner article

強い用途:

- real workflow
- failure modes
- prompt/harness ideas
- operational pain

注意:

- environment/model/versionを確認
- anecdotal resultを一般化しない

### X / Twitter / forum / Reddit

強い用途:

- newest pain points
- emerging workarounds
- update discovery
- opposing experiences

弱い用途:

-単独投稿だけで因果を断定

複数独立報告が揃うほどpriorityを上げる。

### Own controlled experiment

最重要。

外部signalを、自分たちのreference/codebase/agent条件で検証する。

## Community discovery ≠ Playbook

communityで見つけたtipsは直接 `playbook/proven` に入れない。

```text
Community Signal
  ↓
Research Backlog
  ↓
Controlled Experiment
  ↓
Observation
  ↓ clean replay
Candidate
  ↓ portability
Proven
```

## Contradictory evidence

成功報告と失敗報告が同時にある場合、それはノイズではなく重要な研究対象。

記録する:

- tool/client version
- plan/seat
- Figma file complexity
- component/token coverage
- Code Connect coverage
- font/language
- platform/OS
- project size
- prompt/context tier

「誰が正しいか」ではなく、**どの条件で結果が分岐するか**を探す。

## Never freeze current best forever

`DEFAULT` や `Proven` も再評価可能。

playbook ruleには必ず:

- `first_observed_at`
- `last_verified_at`
- `verified_tooling`
- `known_limits`
- `retest_triggers`

を持たせる。

このrepoが目指すのは固定された教科書ではなく、**時代に合わせて自己修正できる実験知識ベース**。
