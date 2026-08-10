# AGENTS.md

このリポジトリを扱う AI agent 共通の作業規約です。

## Mission

Figma と AI coding agent の往復精度を改善し、**既に決まっている PC / SP デザイン**の実装に必要な人間の手直しを減らす。

「今回だけ綺麗にできた」ではなく、再現可能な手順・prompt・context設計・評価方法を残すことを優先する。

## Source of truth boundary

Reference design はこのrepoが決めない。

- ユーザー/案件側で決まった Figma が source of truth
- reference未提示なら design を発明しない
- reference未提示時は tooling / workflow / evaluation / prompt architecture / research のみ進める
- referenceを受け取ったら freeze contract を作るまで実装を開始しない
- experiment途中で reference design を勝手に修正しない

## Mandatory Loop

すべてのデザイン再現実験は次を守る。

1. Reference を freeze する
2. 実行条件を記録する
3. Inspect run を残す
4. First-pass implementation を保存する
5. Reference と exact viewport で比較する
6. 差分を failure taxonomy で分類する
7. 一度に1つの原因クラスを修正する
8. 再評価する
9. clean baseline から再実行する
10. 汎用化できる知識だけ昇格する

## Do Not

- reference がないのに架空画面を作る
- screenshotだけを見て構造を推測し、Figma metadata を読めるのに読まない
- PC/SP を無関係な2画面として別々にハードコードする
- 失敗した prompt / run / repair理由を消す
- 1回成功したテクニックを即「ベストプラクティス」と呼ぶ
- agent/model 固有挙動を汎用ルールとして混ぜる
- 見た目の一致だけで合格にする
- giant prompt にすべてを詰め込む
- unrelated redesign / UX improvement を行う
- visual hack で structural mismatch を隠す

## Prefer

- Figma MCP structured context
- components / variants
- variables / tokens
- Auto Layout / sizing semantics
- semantic layer names and annotations
- Code Connect when available
- exact original assets
- screenshots as visual ground truth
- browser rendering at exact viewport sizes
- deterministic fixture content
- Inspect → Implement → Verify → Repair の小さいphase
- machine-readable experiment metadata
- clean re-run

## Required Experiment Record

各 run に最低限残すもの:

- experiment id
- run id
- date/time
- agent
- exact model/alias if known
- client/tool version if known
- Figma file/node
- reference capture timestamp
- target repo/commit
- framework
- viewport(s)
- prompt version/hash
- context package version/hash
- files/context supplied
- generated output commit
- first-pass score
- final score
- repair rounds
- failure categories
- assumptions
- repairs performed
- reusable lessons
- agent-specific lessons
- unresolved questions

## Knowledge Promotion

知識は3段階で扱う。

### Observation

1回の実験で見えた事実。まだ一般化しない。

### Candidate Rule

複数runまたは複数agentで有効だった仮説。

### Proven Playbook

異なる画面/案件でも再現し、First-pass または Rework Cost の改善が測定できたもの。

`docs/knowledge-promotion.md` に従う。

## When Comparing Agents

Codex / Claude Code / Cursor などを比較するときは、可能な限り以下を揃える。

- same frozen Figma reference
- same codebase commit
- same assets
- same target viewports
- same acceptance criteria
- same maximum repair rounds
- same context tier

比較は2種類に分ける。

1. **COMMON** — 共通prompt/共通contextでagent差を見る
2. **OPTIMIZED** — agent固有のbest practiceを使い、実務上の最高到達点を見る

両者を混ぜてランキングしない。

## Definition of Done for an Experiment

- before / after を比較できる
- first-pass を保存している
- なぜ改善したか説明できる
- clean rerun で改善が再現した
- reusable lesson と project-specific lesson が分離されている
- unresolved issue が明示されている
- reference design を変更していない
