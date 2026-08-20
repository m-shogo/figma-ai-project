# Frontend Implementation Standard

Status: ACTIVE / evolving canonical standard

この文書は、Figmaを高精度に再現しながら、**後から別の人間が初見でも探しやすく、理解しやすく、安全に修正できる実装**を作るための共通Frontend Standardです。

このStandardは永久固定ではありません。実案件、失敗、Human Review、ブラウザ/CSS仕様、既存会社ルールの変化から継続的に改善します。

一方、命名の基本思想（`l- / c- / p- / is-` + BEM系、ownerが検索で分かること）は安定した契約として扱います。

---

## 1. Rule lifecycle

Ruleは同じ強さで固定しません。

- `CORE` — 原則として変えない設計思想。
- `ACTIVE` — 現在のproduction default。実証により変更可能。
- `CANDIDATE` — 将来有力だが、Company Policy / browser support / clean replayを経て採用する候補。
- `PROJECT_ONLY` — 特定案件だけのrule。
- `DEPRECATED` — 新規では使わない。
- `RETIRED` — 現在のactive contractから除外済み。

正本はこの文書の最新版です。過去版をproduction ruleとして並立させず、履歴はGitで追跡します。

---

## 2. Core objective

### CORE-001 — Human-first AI implementation

成功条件は「Figmaと似ている」だけではありません。

```text
Visual Fidelity
+ Findability
+ Locality
+ Content Resilience
+ Responsive Resilience
+ Interaction / Accessibility
+ Simplicity
= Production Quality
```

AIが特定のCSS propertyを使わないこと自体を目的にしてはいけません。

`position:absolute`、`width`、`height`、`min-width`、`min-height`、negative margin、transform等は**禁止ではありません**。

通常コンテンツをFigmaの座標へ写経するための安易な固定値・座標配置を避け、必要性を説明できる場合は普通に使用します。

### CORE-002 — Figmaの結果値とWebのconstraintを混同しない

FigmaでSectionが559pxだからという理由だけで `height:559px` にしません。

原則:

```text
Figma visual result
→ design intent / relationshipを読む
→ Web layout constraintsへ翻訳
→ browserで結果を再現
```

Figmaのframe/Auto Layout/absolute位置はimplementation evidenceであり、DOM/CSSの写経元ではありません。

### CORE-003 — Good implementationをruleのために壊さない

既存実装がVisual、耐久性、可読性、変更容易性を満たしている場合、absolute件数や固定値件数を減らすことだけを目的に書き直しません。

---

## 3. Technical precedence

Frontend implementationはrepo全体のprecedenceに従います。

```text
COMPANY POLICY
→ EXISTING CODEBASE / DESIGN SYSTEM
→ FRONTEND IMPLEMENTATION STANDARD
→ FIGMA IMPLEMENTATION EVIDENCE
→ AGENT INFERENCE
```

ただしVisual/design authorityはFigmaです。

会社ルールとVisualが衝突する場合は勝手にredesignせず、既存contractのCONFLICT処理へ戻します。

---

## 4. Layout decision tree

### ACTIVE-001 — まず最も自然なlayout modelを選ぶ

禁止propertyから考えず、次の順で検討します。

1. **Normal Flow** — 通常の見出し、段落、縦積み。余計な `display` を増やさない。
2. **Flex** — 一次元の並び、button group、navigation、左右/上下align。
3. **Grid** — 行列、カード群、2column、複数要素の関係、layout mode。
4. **Grid overlap** — DOM/flowの関係を保ちながら意図的に重ねる場合。
5. **Relative + Absolute** — art direction、独立overlay、装飾、badge、人物写真等。
6. **Fixed / constrained sizing** — asset固有、UI固有、明確な不変条件がある場合。

上の番号は「後の方法は禁止」という意味ではありません。最初からart-directed Heroだと分かっているならabsoluteを選んで構いません。

### ACTIVE-002 — FlexとGrid

Flexを第一候補にする例:

- 横/縦の一列
- nav
- button group
- logo + text
- main-axis / cross-axis alignment

Gridを第一候補にする例:

- card collection
- 2D alignment
- 複数column/row
- 同じcolumn boundaryを共有するsection
- intentional overlap

Normal Flowで済むものにFlex/Gridを追加しません。

---

## 5. Sizing ownership

固定値そのものではなく、**誰がその寸法を所有しているか**で判断します。

### Content-owned

内容量で伸びるもの。固定block-sizeは原則避けます。

- section
- article
- card body
- accordion body
- CMS text area
- heading / paragraph container

### Asset-owned

素材やart direction自体に寸法の意味があるもの。固定/制約値を普通に使えます。

- logo
- icon
- avatar
- Hero person/photo
- badge
- video/canvas
- authored decorative asset

### UI-owned

UI契約として寸法が必要なもの。

- minimum touch target
- input/control
- modal/dialog bounds
- button minimum size
- sticky/fixed chrome where specified

### ACTIVE-003 — Prefer content/intrinsic sizing

必要に応じて以下を候補にします。

- `auto`
- intrinsic sizing
- `max-width` / `max-inline-size`
- `min()` / `max()` / `clamp()`
- `fit-content`
- `aspect-ratio`
- `gap`
- `padding`
- Grid/Flex stretch
- `minmax(0, 1fr)`
- `min-width: 0` / `min-inline-size: 0` when required by Flex/Grid sizing

`min-width` / `min-height` を禁止しません。Figmaの見た目をhard lockするだけのminimumと、layout algorithm / accessibility / UI contract上必要なminimumを区別します。

### ACTIVE-004 — Equal height

カードを同じ高さに見せる必要がある場合、まずGrid/Flexのstretchやshared row relationshipで成立させます。

文言が2行になっただけでclipする固定heightは避けます。

ただしasset/UI specificationとして高さが不変なら固定heightは合法です。

---

## 6. Positioning / overlap

### ACTIVE-005 — Absolute is intent-based

absoluteを件数で評価しません。

適切な例:

- Hero/MVの人物・art-directed photography
- decorative SVG / pseudo-element
- badge
- balloon tail
- page-top control
- intentional overlay
- independently positioned artwork

原則避ける例:

- 通常本文
- card collection全体
- heading/paragraphをFigmaのx/y座標で置く
- section全体をabsolute childrenだけで構成する

### ACTIVE-006 — Offset familyを同じ視点で見る

absoluteだけを禁止すると、AIが `transform:translate()` や巨大negative marginへ逃げます。

以下は全て「意図的offset」として同じ観点でレビューします。

- absolute offsets
- transforms used for placement
- negative margins
- large relative offsets

非自明なoffsetが主要layoutに必要なら、その不変条件/理由を説明できること。

---

## 7. HTML semantics and DOM

### CORE-004 — CSSを外しても意味が通るDOM

- `header` / `main` / `section` / `footer` / `nav` 等を適切に使う。
- heading hierarchyを意味に沿って保つ。
- listはlistとして表現する。
- actionの意味に応じてanchor/buttonを選ぶ。
- Figma frame数とDOM wrapper数を一致させようとしない。
- CSS都合でreading/source orderを壊さない。

### ACTIVE-007 — Wrapper budget

wrapperを増やす場合、少なくとも以下のどれかの責任を持つこと。

- content container
- layout context
- clipping/isolation
- semantic grouping
- interaction boundary

責任が説明できないwrapperは削減候補です。

---

## 8. Naming contract

### CORE-005 — Stable naming

基本:

- `l-` — Layout
- `c-` — reusable Component
- `p-` — Project/Page/Section owner
- `is-` — state where state class is needed

BEM系:

```text
p-reason
p-reason__inner
p-reason__list
p-reason__card
p-reason__card-title
p-reason__card-text
p-reason--compact
is-open
```

### CORE-006 — Class name is a repository navigation API

人間は `p-reason` で検索すれば、そのSectionのPHP/HTML/CSS/JS/QAへ辿れる状態を目指します。

単独のgeneric classは原則避けます。

```text
.inner
.list
.box
.item
.title
.text
.image
```

owner付きなら使用可能です。

```text
.p-reason__inner
.p-reason__list
.p-reason__title
```

### ACTIVE-008 — Meaning over DOM position

以下よりsemantic/owner classを優先します。

```css
.p-course:nth-child(7) {}
.p-card > h3 {}
```

意味があるなら:

```css
.p-course--featured {}
.p-card__title {}
```

順序そのものが仕様の場合の `nth-child()` は合法です。

---

## 9. CSS ownership and locality

### CORE-007 — One Block = one canonical location

同じBlock/Elementのbase declarationをファイル中へ散らしません。

Visual QA差分を直すためにファイル末尾へ同じselectorを追加しない。

```text
BAD
.p-reason__card { ... }
... 700 lines ...
.p-reason__card { ... }

GOOD
canonical .p-reason__card を直接修正
```

正当なstate/theme/layer/conditional overrideは例外です。ただし所有関係が分かる位置へco-locateします。

### CORE-008 — No permanent "final fixes" zone

以下のような領域をproduction CSSへ常設しません。

- final fixes
- visual tweaks
- hotfix overrides
- temporary overrides

修正はownerへ戻します。

### ACTIVE-009 — Section boundary comments

必要な場合、ownership boundaryだけを一貫した見出しで示します。WHATを説明する大量コメントは不要です。

コメントは原則WHYを書きます。

---

## 10. Native CSS nesting

### ACTIVE-010 — BEM selectors stay flat by default

BEM classをDOM descendant nestingで深くしません。

Preferred:

```css
.p-reason {}
.p-reason__inner {}
.p-reason__list {
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

Nestingは主に次へ使います。

```css
.c-button {
  &:hover {}
  &:focus-visible {}
  &::before {}
  &.is-active {}
}
```

`&` は親selector自身を参照する場合に使います。単純なdescendant nestingで不要な `&` を習慣化しません。

Deep nestingは、specificityとDOM依存を増やしやすいため原則避けます。

---

## 11. Specificity / cascade

### ACTIVE-011 — Low specificity by default

基本selectorは1 classを理想とします。

```css
.p-reason__card {}
```

長いdescendant selectorやID stylingを避けます。

`!important` は全面禁止ではありませんが、自分たちの通常CSS同士の競合解決には原則使いません。

合理的な例外:

- third-party CSS boundary
- unavoidable inline style
- explicit utility contract
- accessibility/environment override

### ACTIVE-012 — Cascade layers are a tool, not a goal

既存/Company CSS architectureがある場合はそれに従います。

必要ならvendor/reset/base/component等のconcernをcascade layerで分離できますが、小規模案件へ層数を強制しません。

---

## 12. Responsive design

### CORE-009 — Layout mode, not device stereotype

Breakpointはlayout boundaryです。hover/touch/device identityとは別です。

会社/既存breakpointがあれば最優先。

案件固有の壊れた場所ごとにbreakpointを増殖させません。

### ACTIVE-013 — Breakpoint count is not a score

「少ないほど良い」ではありません。

必要なlayout modesが3つなら3つ使えます。

ただし `873px`, `947px`, `1032px` のようなpatch breakpointが増えた場合はroot layoutを再確認します。

### CANDIDATE-001 — Container queries

Componentがviewportではなく配置されたcontainer幅で変化する方が自然な場合、Company/browser supportを確認した上でContainer Queryを候補にします。

---

## 13. Typography / content resilience

### CORE-010 — Text is dynamic content unless explicitly locked

CMS/ACF/運用で変更される文字は、原則として1行固定を前提にしません。

以下をVisual contractとして明示された短いlabel/logo等へ限定します。

- `white-space: nowrap`
- fixed text block height
- clippingによる行数固定

### ACTIVE-014 — Two-line safety

少なくとも通常heading/bodyについて:

- 1行→2行で隣接要素へ重ならない
- section/cardが必要に応じてblock axisへ伸びる
- absolute artworkがcopyを覆わない
- CTA/buttonが押し出されても自然なspacingを保つ
- equal-height designならrow/cardがcontentに合わせて伸びる

### ACTIVE-015 — Text mutation matrix

Relevant Sectionで可能な範囲を検証します。

- heading: 1 / 2 / 3 lines
- body: 0.5x / 1.0x / 1.5x / 2.0x length
- long Japanese string
- long Latin/unbroken token where relevant
- font fallback / different font metrics
- 200% browser zoom where required by policy
- user font enlargement where relevant

Visual authorityとして絶対に1行でなければならない要素はproject contractで例外化します。

---

## 14. Repeater / CMS cardinality resilience

### ACTIVE-016 — Count mutation

Repeater/card/slider等は仕様に応じて次を考えます。

- 0 items
- 1 item
- expected count
- +1 item
- -1 item
- optional field missing

「カードを1つ増やすためだけに新しいCSSが必要」な構造を避けることをdefaultとします。

デザイン上件数固定ならPROJECT_ONLY contractとして固定できます。

---

## 15. Images and media

### ACTIVE-017 — Distinguish intrinsic ratio from rendered coordinates

Figmaの `570 × 614` が素材比率なのか、そのviewportでのrendered sizeなのかを区別します。

通常画像:

- intrinsic `width` / `height` attributeでlayout shiftを抑える
- responsive CSS sizing
- `height:auto` where appropriate
- `aspect-ratio` when layout ratio is authored
- `object-fit: cover` for intentional crop
- `object-fit: contain` for must-not-crop media

PC/SPで本当に素材/cropが異なる場合だけ`picture`等を検討します。

---

## 16. Overflow / nowrap / clipping smell

### ACTIVE-018

次は合法ですが、レイアウト不具合を隠すpatchになっていないか確認します。

- `overflow:hidden`
- `white-space:nowrap`
- text clipping
- forced hidden overflow

Focus ring、dropdown、長文、装飾、browser zoomを切っていないかQAします。

---

## 17. Logical properties

### ACTIVE-019

既存codebaseとbrowser policyに合う場合、layout intentが明確になるlogical propertiesを優先候補にします。

例:

- `margin-inline`
- `padding-block`
- `inline-size`
- `min-inline-size`

ただし既存projectがphysical propertyで統一されている場合に無理に混在させません。

---

## 18. Component extraction

### CORE-011 — Similar appearance is not enough

2箇所が似ているだけで共通Component化しません。

共通化の有力条件:

- same semantic role
- same structure
- same interaction
- same reason to change

変更理由が異なるUIは、見た目が似ていてもSection-local implementationでよい場合があります。

Utility-first architectureが既存projectの正本ならそれに従います。手書きsemantic CSS案件へ別思想を勝手に持ち込みません。

---

## 19. Custom properties / tokens

### ACTIVE-020

`:root`へ全ての値を集約しません。

Global token候補:

- brand colors
- typography roles
- common container/gutter
- repeated spacing/radius

Section-local valuesはowner scopeへ置けます。

一度しか使わないmagic numberをtoken化して意味を隠さない。

Token名は可能ならsemantic roleを表します。Figma/Company Design Tokenがある場合はそれを優先します。

---

## 20. z-index / stacking

### ACTIVE-021

`z-index:99999` の競争を避けます。

- stacking responsibilityを局所化
- Section内artworkは必要に応じて`isolation`
- global overlay/modal/header等はproject layer contractへ従う

---

## 21. JavaScript

### ACTIVE-022 — Separate styling and behavior hooks

可能ならCSS classとJS hookを分離します。

```html
<button class="p-voice__trigger" data-js-accordion-trigger aria-expanded="false">
```

CSSは`.p-voice__trigger`、JSは`[data-js-accordion-trigger]`をownerとします。

### ACTIVE-023 — Small interaction ownership

巨大なDOMContentLoaded blockへ全機能を詰めず、interactionごとに小さなinit/ownerを持たせます。

```text
initAccordion()
initSlider()
initPageTop()
```

対象DOMが無いページでは安全にno-opできる設計を優先します。

過剰engineeringはしません。

---

## 22. PHP / WordPress / ACF

### ACTIVE-024

既存theme architectureを最優先します。

大きなtemplateでは必要に応じてSection implementation unitを明確にします。

- template part/include
- ACF block
- local render function
- standalone page section

「ファイルを分けること」自体は目的ではありません。人間がSection ownerを辿れることが目的です。

ACF/PHPでは可能な範囲で:

```text
read data
→ normalize / fallback
→ escape
→ render markup
```

の責任を分け、HTML中へデータ取得/条件を無秩序に散らしません。

EscapingはWordPress/Company contractへ従います。

---

## 23. Accessibility / interaction resilience

### CORE-012

Visual Fidelityのためにsemantic/keyboard/focus behaviorを壊しません。

Relevant componentでは:

- keyboard operation
- `focus-visible`
- hover capability rule
- disabled state
- reduced motion where animation exists
- touch target / pointer behavior

を既存policyに従って確認します。

---

## 24. Repair rule

### CORE-013 — Fix the owner, not the symptom

Visual QAで差分を発見したら:

1. 差分を所有するcanonical selector/component/tokenを特定する。
2. existing constraintが誤っているか確認する。
3. owner declarationを修正する。
4. ファイル末尾へoverrideを追加して終わらせない。
5. 同じ箇所へ2回以上patchが必要なら局所layoutの再設計を検討する。

### CORE-014 — No property-count optimization

absolute件数、media query件数、CSS行数を減らすことだけを品質目標にしません。

理由のない例外と重複ownerを減らします。

---

## 25. Maintainability QA

FINAL判定ではVisual以外も確認します。

### Findability

- Section owner名で検索できる。
- base CSS definitionが原則1 canonical location。
- generic search wordへ依存しない。

### Locality

- relevant responsive/state rulesがownerから遠くへ散らばっていない。

### Content mutation

- text line/length mutation
- card count mutation
- optional field mutation
- image/fallback mutation

### Responsive resilience

Canonical viewportだけでなくCompany Policy上必要なintermediate/min/max environmentsを確認する。

### Human repair scenario

例:

- card gapを変更
- headingを2行へ変更
- cardを1件追加
- Hero写真を差し替え

担当者が該当ownerへ短い検索で到達し、無関係なoverrideを追わずに修正できること。

---

## 26. Smell-based review

単一propertyだけではなく複合臭を見ます。

強いsmell例:

```text
fixed section height
+ overflow hidden
+ many absolute children
+ repeated top/left offsets
+ duplicate selector overrides
```

これはFigma coordinate recreationの可能性が高い。

一方、Hero artworkでabsoluteが複数あっても、copy flowと分離され、理由が明確なら正常です。

---

## 27. Exception policy

例外は「悪」ではありません。

非自明な例外は次を説明できる状態にします。

- selector / owner
- intent
- why normal flow/flex/grid alone is not better
- what content/layout change must remain safe

例:

```text
owner: p-mv
selector: .p-mv__person
exception: absolute positioning
reason: art-directed photography; image must not participate in copy flow
```

全てのpx値へコメントを付ける必要はありません。

---

## 28. Candidate modern CSS techniques

以下は永久defaultではなく、Company Policy / browser support / implementation evidenceに応じて採用する候補です。

- Container Queries — componentがcontainer sizeへ応答する場合。
- Subgrid — nested contentがparent grid tracksを共有する必要がある場合。
- CSS Anchor Positioning — tooltip/popover/badge等、別要素との関係でpositionする場合。仕様/対応状況を確認して採用。
- `:has()` — markupを増やさず親状態を表現でき、selector複雑化より明確な場合。
- `@scope` — large stylesheetでowner scopeを明示する価値があり、environmentが許可する場合。

「新しいから使う」ことは禁止。既存方法より単純・保守的で、target environmentに適合する場合だけ採用します。

---

## 29. Knowledge promotion

実案件のBefore/Afterを教材化します。

失敗:

```text
Figma coordinate recreation
→ fixed section dimensions
→ absolute content layout
→ override accumulation
→ CMS mutationで破綻
```

成功:

```text
content/intrinsic sizing
→ Flow/Flex/Grid ownership
→ art-only absolute
→ one canonical selector owner
→ Visual + mutation QA
```

Patternは`docs/frontend-pattern-library.md`へ蓄積します。

---

## 30. Definition of Done

Frontend実装は、対象scopeに関係する項目について少なくとも以下を満たしてFINALとします。

- Figma/reference visual fidelity
- no unintended horizontal overflow
- interaction/runtime integrity
- semantic/accessible behavior required by policy
- owner/searchability
- no unexplained override accumulation
- content/card mutation resilience where content is editable
- required viewport/environment resilience
- exceptions are intentional, not property-ban workarounds
- no temporary final-fix layer left behind

このStandardの目的は「CSSを綺麗に見せる」ことではありません。

**未来の人間が安心して変更できるWeb implementationを、AIが最初から作ること**です。
