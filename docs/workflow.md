# Workflow — Figma ↔ AI Reproduction Lab

## 0. Freeze the reference

実験前に reference を固定する。

- Figma file URL
- node ID
- version / branch if applicable
- Desktop viewport
- Mobile viewport
- fixture content
- assets

途中で原本を変えた場合は同一実験として扱わない。

## 1. Inspect before generating

優先順位:

1. Figma structured design context
2. component / variant information
3. variables / tokens
4. Auto Layout and sizing behavior
5. Code Connect mappings
6. exact assets
7. screenshot

Screenshot は視覚的 ground truth として重要だが、構造情報の代替ではない。

### Capture the design contract

最低限、以下を明文化する。

- page/frame hierarchy
- typography family / weight / size / line-height
- spacing scale
- colors
- radii
- shadows/effects
- grids
- image crop behavior
- reusable components
- states
- PC → SP で何が変化するか
- fixed / hug / fill に相当する挙動
- min/max width
- wrapping order

## 2. Create an implementation brief

agent に渡す前に、Figma情報を「実装契約」に変換する。

悪い例:

> このFigma通りに作って。

良い例:

- visual target
- structural target
- reuse requirements
- responsive invariants
- allowed libraries
- forbidden shortcuts
- exact viewport acceptance tests
- verification steps

## 3. First-pass generation

最初の生成は、なるべく人間が途中で介入しない。

記録する:

- agent / model
- prompt
- context
- elapsed interaction rounds
- files changed
- assumptions made by agent

目的は「最高品質を出す」だけでなく、**どこまで自走できたかを測ること**。

## 4. Render exact viewports

最低2系統:

- Desktop reference viewport
- Mobile reference viewport

必要なら追加:

- intermediate width
- text expansion fixture
- long label fixture
- empty state
- loading / error state

Responsive の正しさは PC/SP 2枚だけでなく、その間で壊れないかも確認する。

## 5. Compare

比較は2系統に分ける。

### Visual comparison

- geometry
- spacing
- typography
- colors
- assets
- borders
- shadows
- crop
- visual hierarchy

### Structural comparison

- semantic components
- design token reuse
- responsive rules
- duplication
- DOM/component hierarchy
- content robustness
- accessibility

## 6. Classify failures

失敗を「なんとなく違う」で終わらせない。

主な分類:

- CONTEXT_MISSING
- CONTEXT_IGNORED
- TYPOGRAPHY
- SPACING
- COLOR_TOKEN
- COMPONENT_REUSE
- RESPONSIVE
- ASSET
- IMAGE_CROP
- STATE
- AUTO_LAYOUT_TRANSLATION
- CODE_CONNECT_MISS
- AGENT_ASSUMPTION
- PROMPT_AMBIGUITY
- FRAMEWORK_CONSTRAINT
- VISUAL_ONLY_HACK
- OVERFITTING

複数指定可。

## 7. Repair one class at a time

repair prompt は差分を絞る。

悪い例:

> もっとFigmaに近づけて。

良い例:

> Desktop card grid の horizontal gap が reference 24px 相当なのに 32px になっている。Mobile は 16px。grid column rule は維持し、spacing token 経由で修正。その他の typography / colors は変更しない。

この方式で「何が効いたか」を追跡可能にする。

## 8. Re-run from clean baseline

重要な改善は、修正済みコードだけで評価しない。

改善した prompt / context / rule を使い、**clean baseline からもう一度生成**する。

これで「修理が上手くなった」のか「初回精度が上がった」のかを分離できる。

## 9. Promote knowledge

再現した知識だけを共通playbookへ昇格する。

例:

- Observation: screenshotだけだとSPのwrap順を誤った
- Candidate: Auto Layout + parent sizingを明示すると改善した
- Proven: 3題材×2agentで再現し、RESPONSIVE score が平均改善

## Recommended comparison matrix

| Run | Agent | Prompt | Context | Goal |
|---|---|---|---|---|
| A | Codex | common | minimal | baseline |
| B | Claude Code | common | minimal | baseline |
| C | Cursor | common | minimal | baseline |
| D | Codex | optimized | structured | best achievable |
| E | Claude Code | optimized | structured | best achievable |
| F | Cursor | optimized | structured | best achievable |

「モデル勝負」ではなく、**どの情報と区切りが精度を上げたか**を見る。
