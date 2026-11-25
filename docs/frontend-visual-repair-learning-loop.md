# Frontend Visual Repair / Learning Loop

Status: ACTIVE workflow contract / tool choices remain project-dependent

目的はFigma-to-Webの差分を「何となく見て直す」から、既存toolingを再利用した再現可能なroot-cause repairへ変えること。

専用の巨大visual engineを作ることは目的ではない。Existing Project / Figma / Playwright / Storybook等が持つ機能を使い、不足するFigma parity情報だけ小さいadapter/reportとして足す。

Authorityは `docs/frontend-authority-model.md`、QA全体は `docs/frontend-maintainability-qa.md`、reuse判断は `docs/frontend-reuse-before-build.md` を正本とする。

## 1. Two acceptance axes

次を混同しない。

```text
A. Figma endpoint fidelity
B. Production runtime resilience / human repairability
```

Endpointを近づけるためにruntimeを壊してはいけない。一方、runtimeが安全だからFigma差分を放置してよいわけでもない。

## 2. Reuse-first tool stack

利用可能な既存手段から始める。

```text
Figma structured context / exact asset / screenshot
+ Browser render
+ Playwright screenshot / DOM / computed evidence / Trace / ARIA when relevant
+ Existing Storybook/Chromatic when shared component scope
↓
small Figma parity adapter only where the above lacks evidence
```

独自にbrowser automation、screenshot engine、trace viewer、ARIA tree engineを再実装しない。

外部OSSが既にFigma↔browserのstructured comparisonを提供していても、projectへ即依存追加しない。maintenance status、fit、security、license、Human Correction Costを実案件で評価する。

## 3. Section-first repair loop

```text
1. Resolve Effective Project Contract
2. Read target PC/SP Figma evidence
3. Search Existing component / asset / pattern
4. Select implementation mechanism
5. Render deterministic section state
6. Compare visual + DOM/runtime evidence
7. Classify root cause
8. Fix canonical owner
9. Re-render target + relevant boundary
10. Probe responsive/runtime/content risks
11. Human repairability drill when material
12. Record lesson/outcome metrics
```

Full-page screenshotだけで原因探索を始めない。Section / boundaryで原因を絞ってから全体へ戻る。

## 4. Visual diagnostic priority

差分の優先順位:

```text
Layout
↓
Typography
↓
Asset
↓
Color
↓
Decoration
↓
1px / subpixel polish
```

理由:

- container widthやsection heightが違う状態で1px decorationを直しても再修正になりやすい
- font/source asset誤りは多数の局所差分を同時に生む
- subpixel/rasterization/font rendering由来の差はimplementation errorと分離する必要がある

特に厳しく見るalignment:

- container edges
- heading baseline/anchor
- primary image/artwork anchor
- repeated grid/card alignment
- section boundaries

**Human 2026-11-25 — optical alignment / design intent:** 大きなlayout差が無くても、円内矢印、ロゴ、文字のbaseline、形の重心、groupの余白、視覚階層の違和感は個別に検出する。現行Figma画像と実装の原寸を見てから必要な拡大で診断する。box boundsとglyph ink bounds/視覚重心、SVG viewBox/透明余白、font load/metrics/letter-spacing、strokeを区別する。修正は原因ownerに局所化し、クリック領域・ラベル・背景・意図された非対称を壊さない。正確な補正値は実描画から決める。原則一覧は `docs/frontend-implementation-standard.md` §3.1。

## 5. Root-cause taxonomy

修正前に主原因を最低1つ選ぶ。必要ならsecondaryを複数持つ。

- `AI_JUDGEMENT_ERROR`
- `CODING_RULE_ERROR`
- `FIGMA_INPUT_AMBIGUITY`
- `ASSET_MISSING_OR_WRONG_SOURCE`
- `EXISTING_CODE_MISUNDERSTANDING`
- `REUSE_MISSED`
- `WRONG_IMPLEMENTATION_STRATEGY`
- `QA_MISSING`
- `VISUAL_REPAIR_ERROR`
- `RESPONSIVE_ASSUMPTION`
- `CMS_REPEATER_ASSUMPTION`
- `TOOL_LIMITATION`
- `ENVIRONMENT_OR_RENDERING_VARIANCE`

分類は責任追及ではなく、次回の検出点を変えるために使う。

例:

```text
吹き出しが合わない
→ Figma exact SVGを見落としてCSS近似していた
→ WRONG_IMPLEMENTATION_STRATEGY + REUSE_MISSED
→ 次回はDecorative preflightでasset sourceを先に確認
```

## 6. Canonical-owner repair

Repairは原則として現在のauthoritative ownerを直す。

避ける:

```text
style.css
visual-repair.css
final-fixes.css
really-final.css
!important patch
```

のような症状別layer accumulation。

例外的なtemporary diagnostic overrideは、原因確認後FINAL成果物から除去するか、正しいownerへ統合する。

## 7. Trace before blind rerun

Runtime / interaction failureでは、同じCIを何度もrerunして通過待ちしない。

利用可能ならPlaywright Trace等から:

- action / locator
- before/after DOM snapshot
- screenshot
- console
- network
- source
- browser / viewport

を見て、最低でも次を分離する。

```text
implementation failure
environment/transient failure
test assumption failure
external dependency failure
```

Rerunは原因仮説を検証するために使い、原因不明の成功を修正完了の根拠にしない。

## 8. Visual comparison stability

Screenshot comparisonは環境差を受ける。Baseline生成とcomparison environmentを可能な限り揃える。

必要に応じて:

- deterministic data/state
- animation disable
- volatile region mask/style
- fixed browser/project configuration
- expected/actual/diff artifact保存

を使う。

Figma parity thresholdを全案件共通の1px/scoreで固定しない。Project riskと差分原因で判断する。

**比較の完了判定:** pixel diffの集計値やcomputed styleの一致を単独の受入根拠にしない。部品の原寸と周囲の文脈を目視比較し、意図した優先順位・整列・余白・状態を確認。変更したglyph/shapeの見た目の差、ブラウザのrasterization差、正当なresponsive差を分ける。実際のrenderが取れない間はvisual未検証。既知のHuman視覚指摘は再描画確認までOPEN（安全な独立source作業は既存ゲートに従う）。

### Self-review: AI自身が違和感を検出する順番（2026-11-25）

Humanの指摘を受けてから比較するのではなく、実装者が受入前に以下を実行する。既存のFigma/Playwright/Storybook/撮影artifactを使い、別のvisual engineは作らない。

1. 現行Figmaと実装を同じ対象・幅・状態・dataで並べ、まずページ/周辺の主役・視線・情報階層・グループ間隔・全体の軸を見る。
2. 原寸の部品を比較して、数値が合っていても「違和感がないか」を判定。繰り返し要素と兄弟variantを横に比べ、icon ink/重心、baseline、上下左右の余白、見た目の大きさ、枠/影/色/状態の連続性を見る。
3. 疑わしい箇所だけ拡大/overlay/diff/computed geometryで原因を切り分ける。小さな重要UIの欠陥が全画面pixel scoreに埋もれないようにする。見ていない箇所はPASSにしない。
4. 原因をownerへ戻して修正。再撮影で元の不一致が消え、隣接部品・関連state/width/browserで別の欠陥を増やしていないことを確認。意図的な差と環境差は根拠を示す。
5. 既存PR/QAへ対象Figma node、actual SHA、環境、状態、expected/actual artifact、具体的な差分、PASS/FAIL/UNVERIFIEDを記録。実機なしでもsource確認は進めてよいが、視覚不良の修正完了とは言わない。

デザイナー視点のself-reviewはコードreviewとは別の受入作業。別Agent reviewerは既存運用に沿って利用可能だが、全案件に追加Agentを必須化しない。次の実案件で既知の矢印ずれ・baseline・長文・hover・browser差を見つけられるか、Human FB再発数を既存学習記録で追う。効果は実測前に証明済みとしない。

## 9. Semantic evidence is separate

Shared navigation/form/dialog/component等では、Visual screenshotとは別にARIA snapshot / semantic assertionを使える。

対象:

- role
- accessible name
- state
- heading/list structure

装飾Sectionへ無条件で追加しない。Automated a11yはfirst-line detectorであり、keyboard/manual QAを置き換えない。

## 10. Human Repairability QA

FINAL成果物はScreenshotではなくProduction code。

Materialな変更では、可能ならdisposable snapshot/worktreeで次を試す。

- heading/copyを変更
- imageを差し替え
- repeater件数を増減/reorder
- optional fieldを空にする
- 1つのsection spacingを微調整

観測:

- ownerを見つけるまでの時間
-変更ファイル数
- unexpected regression数
- temporary overrideが必要だったか
- Human correction minutes / count

数値はdiagnostic。現時点で「5分以内」等を全案件hard gateにはしない。

## 11. Outcome metrics

Run recordで可能な範囲を記録する。

- same feedback repeated count
- major rework count
- wrong implementation-strategy reversal count
- first-pass visual gap
- human final correction count
- human correction minutes/cost
- existing component reuse rate
- existing asset reuse rate
- existing pattern reuse rate
- flaky rerun/debugging cost

重要なのはscoreを増やすことではなく、案件を重ねた時に**同じ失敗と人間修正コストが減るか**を見ること。

## 12. Feedback escalation

ユーザーから次のsignalが出た場合:

- 「前にも言った」
- 「また同じ」
- 「なんでまたCSSで無理に作った」
- 「そこ前に直した」

単一bug修正で閉じない。

```text
feedback
→ failure category
→ root cause
→ next detection point
→ existing pattern/toolで防げるか
→ Observation
→ clean replay
→ CANDIDATE
→ cross-project evidence
→ ACTIVE / RETIRE
```

一度の指摘で永久banへ昇格させない。

## 13. External structured-diff tools

2026-08-20調査では、`uiMatch` 等にFigma render + Playwright + pixel/layout/style/text report + experimental AI repair loopという有用な先行例がある。

ただし調査時点の`uiMatch`自身がexperimental / 0.x / production-readyではないと明記しているため、現時点ではproject dependencyへ採用しない。

取り入れるのはまず次の思想:

```text
browser/Figma evidence
→ machine-readable delta
→ root-cause repair
→ rerender
```

成熟した外部toolがProject要件を満たすようになった場合は、独自adapterを拡張する前に置換を再検討する。

## 14. Learning lifecycle

```text
Observation
→ reproduce
→ clean replay
→ CANDIDATE
→ different reference/project evidence
→ ACTIVE
```

Contradictionが出たらhistoryを消さず、scope変更・demotion・retireを記録する。

V2/V3からの今回のObservationは `research/ref001-v2-v3-frontend-learning-2026-08-20.md` を参照する。

繰り返す Human FB の種類は `docs/agent-human-fb-weak-spots.md`。次の実装では指摘を待たず、その detection を自分で回す。