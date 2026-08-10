# figma-ai-project

AI coding agents (Codex / Claude Code / Cursor など) と Figma を往復しながら、**PC / SP のデザインをできるだけ高い再現性で実装し、手直し量を継続的に減らすための研究・実践リポジトリ**です。

## Goal

このプロジェクトのゴールは「一発生成」ではありません。

1. Figma の設計を構造ごと理解する
2. AI に実装させる
3. 原本と比較する
4. どこがズレたかを定量・定性で記録する
5. 原因を分類する
6. プロンプト / コンテキスト / Design System / Code Connect / 実装手順を修正する
7. 同じ入力で再実行し、再現性が上がったか確認する
8. 成功した知識を他案件でも使える形に昇格する

最終的には、案件固有のデザインを覚えるのではなく、**Figma → AI → Code / Code → Figma の精度を上げる汎用ノウハウ**を蓄積します。

## North Star Metrics

- Visual Fidelity: 見た目の一致度
- Structural Fidelity: Auto Layout / component / token / responsive structure の一致度
- Rework Cost: 人間が手直しした量
- First-pass Quality: 1回目の出力品質
- Reproducibility: 同じ条件で再実行したときの安定度
- Portability: 別案件へ流用できる知識の割合

## Research Loop

```text
Reference Figma
   ↓
Context extraction
   ↓
Agent prompt + implementation
   ↓
PC / SP render
   ↓
Visual + structural comparison
   ↓
Failure classification
   ↓
Prompt / context / token / component / workflow improvement
   ↓
Re-run
   ↓
Promote proven knowledge to playbook
```

## Repository Structure

```text
.
├── README.md
├── AGENTS.md
├── docs/
│   ├── principles.md
│   ├── workflow.md
│   ├── evaluation-rubric.md
│   ├── knowledge-promotion.md
│   └── research-log.md
├── prompts/
│   ├── figma-to-code.md
│   ├── code-to-figma.md
│   └── visual-repair.md
├── experiments/
│   └── 0001-baseline/README.md
└── templates/
    ├── experiment.md
    └── failure-record.md
```

## Core Policy

- Figma screenshot だけを真似しない。可能な限り構造、variables、components、responsive rules まで読む。
- 「見た目が近い」と「保守可能で同じ設計思想」は分けて評価する。
- PC と SP を別々にハードコードせず、どのルールが breakpoint で変化するかを明示する。
- 失敗を消さない。失敗理由と修正前後を残す。
- 1回の成功を一般則にしない。複数実験で再現したものだけを playbook に昇格する。
- モデル固有テクニックと、どの agent でも効く一般原則を分離する。
- prompt を巨大化して解決しない。必要な context を必要なタイミングで渡す。
- Figma component / variable / Code Connect が使える場合は、画像認識だけより優先する。

## Initial Experiment

最初は 1 つの小さな題材で進めます。

- Desktop: 1440px 前後
- Mobile: 390px 前後
- Header
- Hero
- CTA
- Card list
- Form / input
- Footer

この程度の構成なら、typography、spacing、component、image、responsive、状態差分を一通り評価できます。

詳しい進め方は `docs/workflow.md` と `experiments/0001-baseline/README.md` を参照してください。

## Current Direction

2026-08 時点では、Figma の公式 MCP は structured design context の取得だけでなく、native Figma content の作成・更新も扱える方向へ拡張されています。したがって本プロジェクトでは、単なる screenshot-to-code ではなく、**Figma MCP + design system + Code Connect + visual verification** を中心に研究します。

> このリポジトリは結論集ではなく、再現可能な実験によって結論を更新し続けるための場所です。
