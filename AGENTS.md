# AGENTS.md

このリポジトリを扱う AI agent 共通の作業規約です。

## Mission

Figma と AI coding agent の往復精度を改善し、PC / SP デザインの実装に必要な人間の手直しを減らす。

「今回だけ綺麗にできた」ではなく、**再現可能な手順・プロンプト・コンテキスト設計・評価方法を残す**ことを優先する。

## Mandatory Loop

すべてのデザイン実験は次を守る。

1. Reference を固定する
2. 実行条件を記録する
3. 初回生成を保存する
4. Reference と比較する
5. 差分を分類する
6. 修正する
7. 再評価する
8. 学びを記録する
9. 汎用化できるか判定する

## Do Not

- スクリーンショットだけを見て構造を推測し、Figma metadata を読めるのに読まない
- PC/SP を無関係な2画面として別々にハードコードする
- 失敗した prompt や失敗理由を消す
- 1回成功したテクニックを即「ベストプラクティス」と呼ぶ
- agent/model 固有挙動を汎用ルールとして混ぜる
- 見た目の一致だけで合格にする
- giant prompt にすべてを詰め込む
- 実験途中で reference のデザイン自体を無断変更する

## Prefer

- Figma MCP structured context
- variables / tokens
- components / variants
- Auto Layout
- Code Connect
- screenshots for visual verification
- browser rendering at exact viewport sizes
- deterministic fixtures / sample content
- small repair loops
- machine-readable experiment metadata

## Required Experiment Record

各 experiment に最低限残すもの:

- date
- agent
- model
- tool versions if known
- Figma file/node
- target framework
- viewport(s)
- starting prompt
- extra context supplied
- generated output reference
- visual score
- structural score
- rework estimate
- failure categories
- repairs performed
- final score
- reusable lessons
- agent-specific lessons
- unresolved questions

## Knowledge Promotion

知識は3段階で扱う。

### Observation

1回の実験で見えた事実。まだ一般化しない。

### Candidate Rule

複数回または複数agentで有効だった仮説。

### Proven Playbook

異なる題材でも再現し、明確な改善が測定できたもの。

`docs/knowledge-promotion.md` の基準に従う。

## When Comparing Agents

Codex / Claude Code / Cursor などを比較するときは、可能な限り以下を揃える。

- same Figma node
- same codebase baseline
- same target viewport
- same assets
- same acceptance criteria
- same maximum repair rounds

prompt は「全く同じ prompt」と「agent に最適化した prompt」の2種類を分けて比較してよい。

## Definition of Done for an Experiment

- before / after を比較できる
- なぜ改善したか説明できる
- 次回同じ失敗を検出する方法がある
- reusable lesson と project-specific lesson が分離されている
- unresolved issue が明示されている
