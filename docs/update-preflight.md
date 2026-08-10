# Update Preflight — Run Before Using Figma/Agents

Last designed: **2026-08-10 JST**

AI/Figma toolingは高速に変化するため、**重要なbenchmark / 実案件runの開始前に最低1回、最新updateを確認する。**

目的は最新機能を追いかけること自体ではなく、古い失敗・workaround・CAUTIONを現在の環境へ持ち込まないこと。

## Required preflight

### 1. Figma release notes

最初に確認:

- https://www.figma.com/release-notes/
- https://developers.figma.com/docs/figma-mcp-server/
- https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/

見るもの:

- MCP tool追加/変更
- design context変更
- write-to-canvas変更
- Code Connect変更
- Auto Layout変更
- variables/tokens変更
- code → canvas / capture変更
- Skills変更
- rate/access/plan変更
- font/image handling変更

### 2. Agent/client current docs

今回使うものだけ確認:

- Codex
- Claude Code
- Cursor

見るもの:

- model/client更新
- MCP support
- rules/instructions
- browser/visual tools
- context handling
- new skills/plugins

### 3. Community fresh scan

最近30–60日を優先し:

- Zenn
- Qiita
- X / Twitter
- Figma Forum
- GitHub Issues/Discussions
- Reddit

から:

- 新しい成功例
- 新しい失敗例
- workaround
- previously-fixed issues
- practical workflow

を探す。

`docs/research-radar.md` のquery bankを使う。

## Preflight output

run recordに最低限保存:

```yaml
tooling_preflight:
  checked_at: ""
  figma_release_notes_checked: true
  figma_mcp_docs_checked: true
  agent_docs_checked: true
  community_scan_checked: true
  changes_relevant_to_run: []
  rules_to_retest: []
  new_hypotheses: []
  blockers_or_limits: []
```

## Retest trigger

過去に以下だったrule:

- CAUTION
- DEFERRED
- RETIRED
- known limitation
- workaround required

に関係するupdateを見つけた場合、**その古い判断をそのまま適用しない。**

`RETEST_NOW` candidateへ戻す。

## Example — Auto Layout

2026-07-24のFigma releaseではAuto LayoutとCSSの差を縮める更新が公開された。

このような変更があれば、過去の:

- Auto Layout translation mismatch
- layout workaround
- code handoff mismatch

に関するnegative findingsを再確認する。

古いexperiment evidenceは削除しないが、current recommendationの重みは再計算する。

## Example — Code → Canvas

2026-07-16のupdateでは、code-backed screenをcanvasへ戻す際に既存variablesへのbindingが増え、より多くのframeがAuto Layout付きで取り込まれるようになった。

したがって、過去の:

- hardcoded valuesが大量に入る
- imported frameのmanual cleanupが多い

というfindingが現在も同じとは仮定しない。

## Skip policy

軽微な文書編集など、Figma/agent capabilityと無関係な作業では毎回web scanする必要はない。

しかし以下では必須:

- 新しいbenchmark開始
- 新しいreferenceで初run
- agent/clientを久しぶりに使用
- old limitation/workaroundを前提にする
- significant Figma→Code / Code→Figma作業
- 30日以上前のtool knowledgeに依存する

## Core rule

**Use current capabilities first; preserve old evidence as history, not as permanent truth.**
