# Image-only / Screenshot-to-Structure Research Track

Goal: **将来的に、Figma structured dataが無い・使えない場合でも、画像だけから高品質で編集可能なUIへ近づける方法を研究する。**

これは現在のFigma structured-context routeを置き換えるものではない。

画像しか無い案件、競合reference、legacy screenshot、PDF/画像資料などで役立つfallback/adjacent capabilityとして育てる。

## Important principle

現在画像だけで難しいことがあっても、永久に「無理」と判定しない。

Vision model、segmentation、OCR、browser reconstruction、Figma canvas write、image-to-layout toolは進化する。

各major updateで再評価する。

## Research question

画像入力からどこまで自動で復元できるかを分解する。

### V1 — Visual approximation

- overall geometry
- colors
- typography appearance
- assets

### V2 — Editable native structure

- text as text
- image as image
- buttons/cards as native layers
- grouping
- Auto Layout candidate

### V3 — Responsive inference

PC/SP画像が複数ある場合:

- invariants
- ordering
- visibility
- container behavior
- likely breakpoints

を推定できるか。

### V4 — Component inference

複数画面/画像から:

- repeated patterns
- component candidates
- variants
- shared tokens

を抽出できるか。

### V5 — Existing design-system mapping

画像上の要素を、既存Figma/code componentへ当てられるか。

これが最も価値が高いが誤mappingリスクも高い。

## Input classes

- single PC screenshot
- PC + SP pair
- multiple responsive widths
- multiple screens from one product
- screenshot + existing codebase
- screenshot + design system library
- image + small human annotation
- screenshot + OCR/text fixture

## Benchmark ladder

### I0
Screenshot only → code

### I1
Screenshot + viewport metadata

### I2
PC + SP screenshots

### I3
Screenshots + explicit text/content

### I4
Screenshots + existing design system

### I5
Screenshots + AI-produced structure manifest

### I6
AI structure manifest → editable Figma → code

### I7
Iterative image comparison / repair

一度に全部試さず、どの追加contextが一番効くか測る。

## Proposed intermediate representation

画像→直接codeだけでなく、一度machine-readable layout hypothesisを挟む候補。

```yaml
screen:
  viewport:
    width: 0
    height: 0
  regions:
    - id: header
      bbox: []
      layout_hypothesis: horizontal
      confidence: 0.0
      children: []
  typography_hypotheses: []
  color_hypotheses: []
  repeated_patterns: []
  responsive_hypotheses: []
  uncertainties: []
```

AIが何を推測したかを可視化し、間違った推測だけ修正可能にする。

## Image quality problems to track

- anti-aliasing
- scale/DPR mismatch
- browser chrome included
- compression artifacts
- crop
- hidden overflow
- text rasterization
- inaccessible original font
- image vs CSS decoration ambiguity
- hover/state absent
- off-screen content absent

## Human annotation as a small lever

完全自動に固執しない。

画像に少量のannotationを与えて大きく精度が上がるなら有効。

例:

- `これはButton component`
- `この2枚は同じsectionのPC/SP`
- `この画像はcover crop`
- `このnavはSPで非表示`

目的はhuman workゼロではなく、**最小の人間入力で最大のFirst-pass改善**。

## Future tool candidates

固定しない。update preflightでその時点の最善を調べる。

候補カテゴリ:

- multimodal coding agents
- screenshot-to-code models
- visual grounding / segmentation
- browser DOM reconstruction
- Figma native write tools
- editable code→canvas capture
- OCR/text extraction
- image comparison models
- design-system retrieval/matching

## Relationship to dashboard

Dashboardの`Image Lab`で:

```text
Reference Image
+ Prompt/Tool Version
+ Generated Figma/Code
+ Rendered Result
+ Diff
+ AI Review
+ Human Corrections
```

をまとめて比較する。

画像研究の知識も通常のE0→E5 evidence policyへ統合する。

## Success metric

最終目標:

- screenshotしか無くても高いFirst-pass
- native/editable structure
- PC/SP pairからrobust responsive behavior
- human annotation量の低下
- existing component reuse
- clean replay stability

現時点の能力不足を理由に研究対象から外さない。
