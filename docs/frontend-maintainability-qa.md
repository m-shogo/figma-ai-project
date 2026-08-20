# Frontend Maintainability QA

このQAは「Figmaと一致した」だけでは検出できない、**人間が後から変更したときの壊れやすさ**を検証します。

Visual QAを置き換えるものではありません。Visual FidelityとMaintainabilityの両方をFINAL条件にします。

---

## 1. QA dimensions

### A. Findability

人間が画面上のSection名からrepo内ownerへ短い検索で辿れるか。

期待例:

```text
search: p-reason
→ PHP/HTML owner
→ CSS canonical owner
→ relevant JS/QA only
```

FAIL smell:

- `.title`, `.card`, `.inner`等のgeneric classへ依存
- base selectorがCSSの複数箇所に分散
- final overrideを追わないとcomputed resultが分からない

---

### B. Locality

1つのComponent/Sectionを理解するためにファイル全体を往復しなくてよいか。

- base rule
- responsive variation
- state
- documented exception

がownerから追えること。

---

### C. Content Resilience

文字変更でlayoutが壊れないか。

標準mutation候補:

| Mutation | Example |
| --- | --- |
| heading 1→2 lines | 通常見出しを約1.5倍へ |
| heading 1→3 lines | 長いCMSタイトル |
| body 0.5x | 短文化 |
| body 1.5x | 説明追加 |
| body 2.0x | 長文化stress |
| long Japanese | 句読点の少ない長文 |
| long Latin token | URL/英数字/商品コード等、対象で現実的な場合 |
| font fallback | 別metricsのfallback font |
| browser zoom | Company Policyで要求される場合200% |
| user font enlargement | relevant environmentで確認 |

### PASS criteria

- textがclipしない
- unintended overlapなし
- horizontal overflowなし
- adjacent CTA/controlが自然に押し出される
- section/cardが必要に応じてblock axisへ伸びる
- absolute artworkが本文を覆わない
- focusable controlが不可視にならない

### Exception

Logo、短いUI label、Visual Authority上絶対に1行であることがcontract化されているものはPROJECT_ONLY exceptionとして扱えます。

---

## 2. Two-line safety contract

Editable heading/bodyについて、特別な固定仕様が無ければ**2行化はnormal case**として扱います。

実装者は少なくとも次を確認します。

1. headingが2行になったときSection高さが自然に増える。
2. 次の要素がfixed `top` 値のまま残らず、flowとして押し下がる。
3. equal-height cardが必要ならGrid/Flex relationshipで全体が伸びる。
4. Hero等のabsolute artworkはcopy-safe areaを維持する。
5. decorative border/backgroundが内容の増加へ追従する。

このため、`height`を使っているかどうかだけではなく**結果をmutationで検証**します。

---

## 3. Repeater / cardinality mutation

対象がCMS/repeater/listの場合、仕様に応じて確認します。

```text
0
1
expected
expected - 1
expected + 1
```

PASS criteria:

- 1件追加だけでCSS追加不要がdefault
- last itemだけの座標hackへ依存しない
- optional field missingで空の固定領域が残らない
- slider counter / controlsが件数へ追従
- 0件時behaviorがcontractどおり

件数固定デザインなら固定contractを明記します。

---

## 4. Media mutation

Relevant image/mediaについて:

- different aspect ratio source
- missing optional image
- PC/SP crop difference
- slow image load / intrinsic size reservation

を必要に応じて確認します。

PASS criteria:

- unintended layout shiftを避ける
- must-not-crop assetが切れない
- intentional cover cropはcritical subjectを失わない
- missing imageがSection構造を破壊しない

---

## 5. Responsive mutation

Figma canonical viewportだけでなく、Company Policy / project contractで必要な幅を確認します。

最低候補:

- narrow supported width
- Figma SP canonical
- breakpoint before/after
- intermediate width
- Figma PC canonical
- wide supported width

目的はviewport数を増やすことではなく、**layout transitionの断崖とhorizontal overflowを検出すること**です。

---

## 6. Browser/environment resilience

Company Policyに応じて:

- hover/pointer difference
- touch
- safe-area
- dynamic viewport
- reduced motion
- keyboard focus
- forced colors/contrast

を既存Environment Contractから選びます。

PC/SP幅だけでenvironment behaviorを決めません。

---

## 7. Human repair scenarios

FINAL前に、少なくとも対象scopeで代表的な修正を想像または実施します。

### Scenario 1 — Heading edit

```text
「選ばれる理由」
→ 長いキャンペーン文言へ変更
```

期待:

- HTML/PHP ownerを発見
- CSS変更不要またはowner内だけ
- 2/3行でも崩れない

### Scenario 2 — Card gap

期待:

```text
search owner
→ one canonical gap declaration
→ edit
```

複数media query/override/importantを追い回す必要があればFAIL smell。

### Scenario 3 — Add one card

期待:

data/markup追加だけでlayoutが自然に再計算される。

### Scenario 4 — Hero image replacement

期待:

art direction ownerが明確で、copy layoutを壊さずcrop/positionだけ調整できる。

---

## 8. CSS smell audit

単独propertyは即FAILにしません。

### STRONG WARNING combination

同一Sectionで複数が揃った場合root causeを確認:

```text
fixed block-size
+ overflow hidden
+ multiple absolute content children
+ repeated x/y offsets
+ duplicate selector overrides
```

### WARN candidates

- absolute positioning
- fixed width/height
- min-width/min-height
- negative margin
- transform used for layout placement
- `!important`
- `white-space:nowrap`
- `overflow:hidden`
- deep nesting
- ID styling
- arbitrary new breakpoint
- high z-index

WARNは「削除せよ」ではありません。

**必要性を確認せよ**という意味です。

---

## 9. Duplicate ownership audit

最優先smellの1つ。

同じbase selectorが離れた複数箇所へ現れた場合:

1. state/theme/conditional overrideか確認
2. 正当ならowner近くへco-locate可能か確認
3. Visual patchならcanonical ownerへ統合

恒久的な末尾overrideは禁止。

---

## 10. Exception review

非自明な例外について:

```text
owner
selector
technique
intent
reason
resilience requirement
```

を説明できること。

例:

```text
owner: p-mv
selector: .p-mv__person
technique: absolute
intent: art-directed Hero photo
reason: image must be independently positioned from copy flow
resilience: heading may grow to 3 lines without overlap
```

Exception数を0にすることは目標ではありません。

---

## 11. Accessibility interaction QA

Relevant interactionで:

- semantic control
- keyboard
- focus-visible
- expanded/selected state
- reduced-motion behavior if animated
- touch/pointer fallback

を確認します。

Visual repairのためにfocus ringをclipしたり、DOM source orderを破壊していないこと。

---

## 12. Cleanup QA

Merge/FINAL前にactive scopeで確認:

- temporary
- final-fix
- visual-fix
- debug
- old selector
- stale class
- unexplained `!important`
- duplicate owner
- TODO that changes production behavior

Temporary repairをcanonical implementationへ残しません。

---

## 13. Suggested scorecard

数値を目的化しませんがHuman Reviewの視認性のために使えます。

```text
Visual Fidelity:          PASS / WARN / FAIL
Findability:              PASS / WARN / FAIL
Locality:                 PASS / WARN / FAIL
Content Mutation:         PASS / WARN / FAIL / N/A
Cardinality Mutation:     PASS / WARN / FAIL / N/A
Responsive Resilience:    PASS / WARN / FAIL
Interaction/A11y:         PASS / WARN / FAIL / N/A
Exception Clarity:        PASS / WARN / FAIL / N/A
Override Accumulation:    PASS / FAIL
```

Visual FidelityがPASSでもMaintainabilityがFAILならProduction FINALではありません。

---

## 14. Knowledge feedback loop

Mutation/repairで壊れた場合:

```text
failure
→ root cause
→ local repair
→ pattern classification
→ clean replay
→ CANDIDATE rule
→ repeated evidence
→ ACTIVE promotion
```

一度の案件だけで過剰なCORE ruleを増やしません。
