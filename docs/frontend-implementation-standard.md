# Frontend Implementation Standard

Status: ACTIVE / evolving canonical standard

Figmaを高精度に再現しながら、別の人間が初見でも探しやすく、理解しやすく、安全に変更できるFrontend implementationを作るための共通default。

最初に `docs/frontend-quick-contract.md` を読む。

専門topicの正本:

- Authority: `docs/frontend-authority-model.md`
- CSS architecture: `docs/css-strategy.md`
- Repeatable content: `docs/frontend-repeatable-content.md`
- Maintainability QA: `docs/frontend-maintainability-qa.md`
- Deep stress QA: `docs/frontend-resilience-stress-qa.md`
- Failure/Good patterns: `docs/frontend-pattern-library.md`

この文書は**判断原則**を持ち、専門docの全文を重複しない。

---

## 1. Rule lifecycle

Ruleは同じ強さで扱わない。

- `CORE` — 長期的に安定させる思想
- `ACTIVE` — 現在のproduction default。証拠により変更可能
- `CANDIDATE` — 有力だが追加検証が必要
- `PROJECT_ONLY` — 案件固有
- `DEPRECATED` — 新規では非推奨
- `RETIRED` — active contractから除外

数値threshold、特定tool、特定browser workaroundを原則COREへしない。

一度の成功/失敗から永久property banを作らない。

---

## 2. Authority

### CORE-001 — Effective Project Contractを先に解決する

Canonical: `docs/frontend-authority-model.md`

```text
Company hard constraints
↓
Existing Codebase / Design System = baseline
↔ Explicit authorized Project/Owner override
↓
Effective Project Contract

Visual authority = Figma
Implementation evidence = actual Figma structure/annotation/interaction
Decision framework = Frontend Standard
Agent inference = last
```

Existingを無視してgeneric best practiceへ飛ばない。

一方、Company/security/protected scopeに反しないHuman-approved migration/exceptionは、対象scopeのstale Existing baselineを更新できる。

Frontend StandardはEffective Project ContractやFigma visual truthを上書きしない。

Figma内部構造もWeb mechanismへ直写ししない。

---

## 3. Production Quality

### CORE-002 — Visual FidelityだけではFINALではない

Relevant scopeで:

```text
Visual Fidelity
+ Findability
+ Locality / Ownership
+ Content Resilience
+ Repeatable-content Resilience
+ Responsive Resilience
+ Interaction / Accessibility
+ Performance / Loading / Responsiveness
+ Regression Scope Safety
+ Simplicity
= Production Quality
```

CSS行数、absolute件数、media query件数、固定値件数を品質KPIにしない。

---

## 4. Layout / sizing / positioning

### CORE-003 — Property-banではなくintent

次は禁止ではない。

- `position:absolute/fixed/sticky`
- `width` / `height`
- `min-width` / `min-height`
- negative margin
- transform
- `overflow:hidden`
- `white-space:nowrap`
- `nth-child()`
- `!important`

問題は通常contentをFigma座標へ合わせるだけのpatchとして使うこと。

Layout candidate:

1. Normal Flow
2. Flex
3. Grid
4. Relational overlap
5. intentional absolute/fixed/sticky
6. fixed/constrained sizing

番号順の使用を強制しない。Hero artworkなら最初からabsoluteが自然な場合がある。

### CORE-004 — Figma resultをWeb constraintへ直写ししない

```text
Figma visual result
→ relationship / design intent
→ Web constraints
→ browser render
```

Figma Sectionが559pxだからという理由だけで `height:559px` にしない。

### CORE-005 — Dimension ownershipを見る

#### Content-owned

- section/article
- card body
- accordion body
- CMS text
- heading/body container

内容量で伸縮する。固定block-sizeは原則避ける。

#### Asset-owned

- logo/icon/avatar
- Hero person/photo
- badge
- authored decoration
- video/canvas

素材側に寸法/比率の意味がある。固定/制約寸法を普通に使える。

#### UI-owned

- touch target
- input/control
- button minimum
- modal bounds
- sticky/fixed chrome

UI contractとして固定/min寸法を使える。

### ACTIVE-001 — Equal-heightはrelationshipを候補にする

Card高さを揃える必要がある場合、Grid/Flex stretch、内部`1fr`、auto margin等を候補にする。

Editable copyが2行になっただけでclipする固定heightは避ける。

### ACTIVE-002 — Offset familyをまとめて見る

absoluteだけを減らして巨大`translate()`やnegative marginへ逃げない。

- absolute offset
- transform placement
- negative margin
- large relative offset

を同じintentional offsetとしてreviewする。

---

## 5. HTML / DOM

### CORE-006 — CSSを外しても意味が通る

- semantic `header/main/section/footer/nav`
- heading hierarchy
- list semantics
- anchor/button semantics
- Figma Frame数をDOM wrapper数へ写経しない
- CSS都合でreading/source orderを壊さない

### ACTIVE-003 — Visual orderとsource orderを分けて考える

Grid/Flex `order`やarbitrary placementでVisual順を変える場合、reading/keyboard/focus orderとの意味整合を確認する。

### ACTIVE-004 — Responsive DOM duplicationをdefaultにしない

同じsemantic contentをPC/SPで2セット持つことをdefaultにしない。

まず同じsource/markupをCSS/layout/art directionで適応できるか見る。

Separate markupが正当な例:

- 情報構造が本当に異なる
- interaction自体が異なる
- source asset/contentが明示的に別contract

分ける場合はfocus/ID/JS/analytics/CMS ownershipを確認する。

### ACTIVE-005 — Wrapperには責任を持たせる

候補:

- content container
- layout context
- clipping/isolation
- semantic grouping
- interaction boundary

責任を説明できないwrapperは削減候補。

---

## 6. Naming / searchability

### CORE-007 — Owner/searchabilityが安定contract

Existing/Company namingがある場合はそれを使う。

Global CSS / Static / PHP / WordPress等でclassがowner boundaryを担う場合、このrepoのdefault:

- `l-` Layout
- `c-` reusable Component
- `p-` Page/Project/Section
- `is-` state when useful
- BEM-style element/modifier

例:

```text
p-reason
p-reason__inner
p-reason__card
p-reason__card-title
is-open
```

### ACTIVE-006 — Scoped CSSではscope自体をownerにできる

CSS Modules、Vue scoped CSS、SFC等でcomponent/file boundaryが明確なら:

```css
.title {}
.body {}
```

のようなlocal classも正当。

prefix数を増やすこと自体を目的にしない。

判定:

- repo検索からownerへ辿れる
- collisionしない
- responsibilityがscope内に閉じる
- Existing conventionと整合する

---

## 7. CSS ownership / nesting

### CORE-008 — One authoritative base owner

1 Block/Elementのbase responsibilityは原則1つのauthoritative ownerへ集約する。

「同じselector文字列は1回だけ」という意味ではない。

media/container/`@supports`/theme/state/print等のcontextual ruleは正当。

### CORE-009 — No permanent final-fix zone

production stylesheet末尾へ恒久的な:

- final fixes
- visual tweaks
- hotfix overrides
- temporary overrides

を積まない。

Visual repairはcanonical ownerへ戻す。

### ACTIVE-007 — Low specificityをdefault候補にする

Global semantic CSSでは1 owner classを有力候補にする。

ID stylingや長いDOM descendant chainを避ける。

`!important`は禁止ではない。third-party boundary、explicit utility contract、unavoidable inline style、accessibility/environment override等では理由を持って使える。

### ACTIVE-008 — Native nestingを目的化しない

Global BEMではflat selectorをdefault候補にする。

```css
.p-reason {}
.p-reason__inner {}
```

`&`はparent pseudo/state/condition等に使える。

```css
.c-button {
  &:hover {}
  &:focus-visible {}
}
```

Deep nestingやparent selector list由来のspecificity増加を理解して使う。

Scoped CSSではExisting conventionを優先する。

Static lintはDOM truthではないため、合法contextを単純regexだけでFAILにしない。

CSS architecture詳細は `docs/css-strategy.md`。

---

## 8. Responsive

### CORE-010 — Breakpointはlayout boundary

Breakpointとdevice/input capabilityを同一視しない。

Company/browser matrix/design system/existing breakpointを優先する。

Breakpoint数を少なくすること自体を目的にしない。

崩れた位置ごとにpatch breakpointが増殖したらroot layoutを確認する。

### ACTIVE-009 — Intrinsic responsivenessとbreakpoint追加は別

Flex shrink/grow、wrap、Grid、`minmax()`、fluid width等で指定breakpoint間を自然に補間できる。

ただしFigma/Projectがfixed layoutを明示する箇所を勝手にfluid化しない。

### ACTIVE-010 — Boundary continuity

Breakpoint behaviorを変更する場合、必要に応じて:

```text
boundary - 1
boundary
boundary + 1
```

相当でjump/overflow/visibility/focus stateを確認する。

Modern CSS採用はtarget environmentとExisting architectureに従う。

---

## 9. Content risk factors

### CORE-011 — Content riskは複数持てる

- `STATIC_AUTHORED`
- `EDITOR_OWNED`
- `LOCALIZED`
- `EXTERNAL_DATA`
- `USER_GENERATED`

例:

```yaml
risk_factors: [EDITOR_OWNED, LOCALIZED]
```

Taxonomy自体を実装複雑化の理由にしない。

### ACTIVE-011 — Editable textはwrap可能をdefault

明示single-line/truncation contractが無い通常heading/bodyはwrap可能と考える。

Relevant mutation候補:

- heading 1/2/3 lines
- body 0.5x/1.5x/2x
- uneven repeated text
- long Japanese
- realistic long token
- font fallback

nowrap/fixed text height/line clampは明示contractがある場合に使える。

---

## 10. Line break strategy

### CORE-012 — Screenshotの改行位置は自動contractではない

4種類を候補にする。

### `NATURAL_WRAP`

通常editable copy。Browserの自然wrap。

### `PHRASE_WRAP`

意味単位のphraseを保ち、phrase間ではwrap可能にする。

```html
<h3>
  <span class="phrase">世の中の仕組み</span><span class="phrase">を知る</span>
</h3>
```

固定`<br>`より柔軟なart-directed copyに有力。

ただしCMS/localized copyへhard-coded phrase分割を機械適用しない。

### `AUTHORED_BREAK`

改行自体がsemantic/editorial/art-direction contract。

住所、詩、Human-approved typography等では`<br>`を普通に使える。

### `TRUNCATION`

UI contractとして情報量を制限する。

- single-line label
- line clamp
- ellipsis

情報消失が仕様であることを明示する。

`&nbsp;`や不可視文字でFigma screenshotを固定しない。

---

## 11. Repeatable content

Canonical: `docs/frontend-repeatable-content.md`

### CORE-013 — Same-format sequence triggers review

Card、course、voice、FAQ、news、staff、logo、gallery、slider等で同じformatが続く場合、将来loop/repeater/data-drivenになる可能性を確認する。

CMS化そのものは強制しない。

### ACTIVE-012 — Parent owns collection / item owns internals

- parent: columns/rows/gap/wrap/order relationship
- item: media/body/action internal layout

通常layout成立のためにitemがcurrent indexを知る構造を避ける。

### ACTIVE-013 — Cardinalityはsupported rangeで考える

必要なら:

- expected count
- normal min/max
- zero behavior
- incomplete last-row behavior

をcontract化する。

無限件対応は要求しない。

---

## 12. Media / loading / performance

### CORE-014 — HTML intrinsic dimensionsとCSS rendered sizeは別

```html
<img src="..." width="640" height="360" alt="">
```

の`width/height`属性はCSSで640×360へ固定する意味ではない。

Browserへintrinsic ratioを知らせ、loading前のspace reservationに使える。

### ACTIVE-014 — Responsive image / art direction

必要に応じて:

- `srcset` / `sizes`
- `picture` for real art direction
- responsive CSS sizing
- `aspect-ratio`
- `object-fit`

を選ぶ。

PC/SPがあるから必ずsource/fieldを2つ作る、とはしない。

### ACTIVE-015 — Loading priority is measured

- Hero/LCP candidateを機械的にlazy-loadしない
- below-fold imageはlazy candidate
- `fetchpriority="high"`はcritical candidateへ限定
- preloadもdiscovery problemがある場合に検討

### CORE-015 — PerformanceもProduction Quality

Relevant scopeで:

- LCP
- CLS
- INP

を確認する。

全案件へ新しい数値threshold gateを機械的に増やさない。Company Policy、page role、production measurementに従う。

---

## 13. JavaScript / state

### CORE-016 — Styling hookとbehavior hookを分離

CSS class renameがJSを無関係に壊さない構造を優先する。

Hook形式はExisting Project優先。

`data-js-*`そのものを永久standardにしない。

### CORE-017 — Primary state sourceを決める

`aria-expanded`、`data-state`、`is-open`、framework state等を複数独立truthとして更新しない。

Primary stateを決め、必要なpresentation/ARIAを同期/派生させる。

Small interaction ownerとsafe no-opをdefault候補にするが、Existing framework patternを優先する。

---

## 14. PHP / WordPress / ACF

Canonical: `docs/wordpress-acf-policy.md`

### ACTIVE-016 — Existing architecture first

Classic/Block/Hybrid、company theme、template naming、enqueue、ACF conventionsを先に読む。

File splitting自体をKPIにしない。Section ownerへ辿れることが目的。

### ACTIVE-017 — Data flow

可能な範囲で:

```text
read data
→ normalize / fallback
→ escape
→ render markup
```

を意識する。

`get_field()`等を無秩序に散らさない。ただし既存themeのsimple patternを過剰architectureへ書き換えない。

Repeater移行で不要なMarkup/CSS全面改修が発生しないitem shapeを目指す。

---

## 15. Accessibility resilience

### CORE-018 — AccessibilityをVisual後付けにしない

Company Policy/WCAG targetに従う。

Relevant scopeで:

- semantic controls
- keyboard/focus-visible
- Focus Not Obscured
- source/visual/focus order
- reduced motion
- Resize Text
- Reflow
- Text Spacing

を確認する。

### ACTIVE-018 — Resize Text / Reflow / Text Spacingを分ける

- Resize Text: target要件に応じtext 200%までcontent/functionalityを失わない
- Reflow: vertical contentでは320 CSS px相当で原則2方向scrollを要求しない
- Text Spacing: applicable language/scriptでuser spacing overrideによりcontent/functionalityを失わない

単に「200% zoom PASS」で全部を代表させない。

---

## 16. Repair rules

### CORE-019 — Fix owner, not symptom

Visual差分:

1. canonical owner/component/tokenを特定
2. root constraint確認
3. ownerを修正
4.末尾patchだけで終わらせない
5. 同一ownerへpatchが繰り返される場合、layout/design review triggerにする

固定「2回で必ず再設計」のような数字をCOREにしない。

### CORE-020 — Good implementationをruleのために壊さない

既にVisual/耐久性/可読性を満たすabsolute、fixed size等をproperty count削減のためだけに書き直さない。

---

## 17. QA tiers

Canonical:

- `docs/frontend-maintainability-qa.md`
- `docs/frontend-resilience-stress-qa.md`

```text
FAST PR GATE
→ TARGETED MUTATION
→ DEEP / PERIODIC
```

TARGETEDはSection riskから必要なものだけ選ぶ。

例:

- `[EDITOR_OWNED, LOCALIZED]` → text/wrap
- repeatable → count/order/optional/incomplete row
- Hero overlay → long-copy collision
- interactive → keyboard/state/INP
- image-heavy → loading/CLS/LCP
- breakpoint change → boundary continuity

全mutation dimensionのCartesian productを毎PR実行しない。

---

## 18. Change Impact / Regression Scope

### CORE-021 — QA scopeはdependency blast radiusで決める

変更行数の多寡だけでQA範囲を決めない。

```text
Section-local owner
→ section + relevant boundary

Shared component
→ known dependents + integration

Shared token/foundation
→ known dependents + representative global/full-page regression
```

既存Section dependency、component/token resolution、Shared Contract等を再利用する。

新しいChange Impact manifest familyを増やさない。

Unknown shared dependencyをsection-localとして狭く推測しない。

---

## 19. Optional Section metadata

既存Section Manifestへ必要最小限のmetadataだけ持たせる。

```yaml
content:
  risk_factors: [EDITOR_OWNED, LOCALIZED]
  line_strategy: NATURAL_WRAP
  repeatable: true

layout_intent:
  primary: GRID
  intentional_overlays: []

maintainability_qa:
  text_mutation: REQUIRED
  breakpoint_continuity: AUTO

change_impact:
  ownership: SECTION_LOCAL
  regression_scope: AUTO
```

未使用fieldを全Sectionで埋める必要はない。

---

## 20. Smell-based review

単独propertyを即FAILにしない。

Strong smell combination例:

```text
fixed content block-size
+ overflow hidden
+ many absolute content children
+ repeated x/y offsets
+ override accumulation
```

Figma coordinate recreationの可能性を示す。

Hero artworkでabsoluteが複数でも、copy flowと分離され理由が明確なら正常。

Smell Scoreを作る場合もdiagnostic専用で0点をKPIにしない。

---

## 21. Human repairability

FINAL時にRelevant scopeで:

- owner名/owner fileから検索できる
- authoritative base ownerが明確
- responsive/state/exceptionを追える
- content/repeater changeで不要な座標patchを要求しない
- temporary/final-fix/debug残骸がない
- shared changeの影響範囲を説明できる

Simple data changeでCSS diff=0ならGood signalだがhard KPIにはしない。

---

## 22. Knowledge promotion

```text
failure/success
→ reproducible evidence
→ root cause
→ minimal owner repair
→ clean replay
→ pattern classification
→ CANDIDATE
→ repeated evidence
→ ACTIVE
```

Before/Afterは `docs/frontend-pattern-library.md` へ蓄積する。

一度のfailureから永久property banを作らない。

---

## 23. Definition of Done

Relevant scopeで:

- Figma/reference Visual Fidelity
- no unintended horizontal overflow
- owner/searchability
- no unexplained override accumulation
- appropriate content/repeater resilience
- required responsive/environment resilience
- semantic/accessibility behavior
- interaction runtime integrity
- relevant performance/loading/responsiveness
- dependency-appropriate regression scope
- intentional exceptions are explainable
- no temporary final-fix layer

を満たしてFINALとする。

このStandardの目的はCSSを綺麗に見せることではない。

**Figmaを忠実に再現しながら、未来の人間が安心して変更できるWeb implementationをAIが最初から作ること**。

---

## External evidence

- W3C CSS Nesting Module Level 1
- MDN CSS Nesting / Specificity
- W3C WCAG 2.2
- WordPress Coding Standards
- GOV.UK Design System production guidance
- Stylelint guidance
- web.dev Core Web Vitals / responsive images
- CUBE CSS / Every Layout as practitioner evidence

External guidance is evidenceであり、Company Policy、Effective Project Contract、Figma visual truthの上位authorityではない。
