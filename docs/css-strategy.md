# CSS Strategy

SCSSを前提にしない。

このrepoのdefaultは「どの案件でも同じCSS技術を強制する」ことではなく、**上位constraintと既存codebaseへ最小摩擦でFigmaのvisual/structure evidenceをWeb実装へ翻訳する方法を選ぶ**こと。

Frontendのauthority解釈は `docs/frontend-authority-model.md`、人間保守性は `docs/frontend-quick-contract.md`、詳細は `docs/frontend-implementation-standard.md` を参照する。

## Decision order

CSS技術選定でもFrontend Authority Modelを崩さない。

1. Company / project hard coding rules
2. Existing project styling architecture
3. Existing design-system/token/breakpoint architecture
4. Explicit project / owner implementation contract
5. Framework conventions already used by the project
6. Actual Figma structure / responsive / interaction evidence
7. Frontend Standard defaults for unresolved choices
8. Only then choose/add a styling mechanism

Figma evidenceは重要だが、Figma内部構造をCSS mechanismへ機械変換しない。

新規技術を導入するために既存projectを崩さない。

---

## Current default for a new React / Next / Vite-style web implementation

**CSS Modules + native CSS + CSS Custom Properties** を第一候補にする。

```text
styles/
  base.css
  tokens.css
components/
  Button/
    Button.tsx
    Button.module.css
sections/
  Header/
    Header.tsx
    Header.module.css
  MainVisual/
    MainVisual.tsx
    MainVisual.module.css
```

### Why

- section workerのCSS scopeを隔離しやすい
- shared tokenだけCustom Propertiesで共有できる
- Figma Variablesをtokenへmapしやすい
- Auto Layout等のrelationshipをFlex/Gridへtranslateしやすい
- parallel section implementation時のmerge conflictを減らせる
- browser DevTools/computed styleで差分を追いやすい
- SCSS compile layerが不要
- sectionごとのvisual repairを局所化しやすい

ただし既存projectが別方式なら既存方式を優先する。

---

## Shared values vs section-local CSS

### Shared / coordinator-owned

- fonts
- design tokens
- global breakpoint contract
- page container/gutter
- z-index scale when shared
- reset/base rules
- shared components

### Section-local

- section composition
- local grid/flex rules
- section-only spacing when truly one-off
- section-specific responsive behavior **at shared breakpoints**
- local image crop/position
- local stacking context when global ordering is unnecessary

workerはshared surfaceを勝手に変更しない。

Shared component/token/foundationを変更する場合は、変更行数ではなくdependency blast radiusでregression scopeを広げる。

```text
Section local
→ section + relevant boundary

Shared component
→ known dependents + integration

Shared token/foundation
→ known dependents + representative global/full-page regression
```

---

## Breakpoints

Production defaultは `docs/responsive-breakpoint-policy.md` に従う。

### Rule

デザイナー / 会社 / design system / existing productの指定値をページ全体で共有する。

section workerが:

```css
@media (...独自の値...) { }
```

を勝手に追加しない。

新しいthresholdが必要に見える場合は `PROPOSE_BREAKPOINT_EXCEPTION`。

Breakpoint付近の変更では必要に応じてboundary直前/直上も確認し、media query境界で不連続なjump/overflowがないかを見る。

### Authoring default: Mobile First + owner-colocated media queries

新規実装、またはHuman-approvedでresponsive CSSを再設計するscopeは**Mobile First**をdefaultにする。

```text
smallest supported mobile layout = base declarations
→ tablet / PC / wide layout = min-width overrides
```

同じowner selectorのresponsive ruleは、authoring stackが対応する限りそのselectorの近くへ置く。

Preferred:

```css
.p-sample {
  display: block;
  gap: 16px;
  padding: 32px 16px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    padding: 80px 40px;
  }
}
```

`768px`は説明用。実装ではapproved breakpoint contractを使う。

Defaultでは避ける:

```css
.p-sample {
  display: grid;
  gap: 40px;
}

/* file末尾のPC/SP bucketへownerのresponsive behaviorを分離しない */
@media (max-width: 767px) {
  .p-sample {
    display: block;
    gap: 16px;
  }
}
```

理由:

- 初見の人が1 selectorを見ればSP baseとPC差分を同時に追える
- FigmaのSP/PC比較時にownerを往復しなくてよい
- final-fix / breakpoint bucketへのoverride蓄積を減らせる
- Mobile Firstなのでbase CSSがsmall viewportの実挙動を表し、larger layoutだけを追加できる

Multiple breakpointsが必要なら、同じowner内でapproved thresholdをsmall→largeの順に置く。

```css
.p-sample {
  /* mobile base */

  @media (min-width: 768px) {
    /* tablet / small desktop */
  }

  @media (min-width: 1200px) {
    /* wide desktop */
  }
}
```

これはBEM elementをDOM階層どおり深くnestすることを推奨する意味ではない。

```css
.p-sample {}
.p-sample__title {}
```

というowner selectorはflatに保ち、それぞれの`@media` / `@container` / `@supports` / pseudo/state contextだけをowner内へco-locationする。

Required browser/environmentがNative CSS Nesting非対応で、既存buildにもtranspileが無い場合は、勝手にdesktop-firstや末尾media bucketへ戻さず、Existing preprocessor/PostCSS等を利用するかProject exceptionとして記録する。

### Important CSS detail

CSS Custom Propertiesはcolor/spacing等の共有には向いているが、通常のmedia query条件そのものを単純に:

```css
@media (max-width: var(--breakpoint-mobile))
```

のようなruntime variableとして一元化する用途には使えない。

そのためbreakpoint値の一元化はproject architectureに合わせる。

Current preference order:

1. existing project breakpoint utility/token pipeline
2. existing PostCSS/custom-media等の仕組み
3. existing shared stylesheet convention
4. project-specific generation/lint step
5. 最小構成では同一値の使用をCIで検証

**SCSSを使わないためにbreakpoint整合性を捨てない。**

### Validation idea

実装repoが決まったら、必要に応じて:

- CSS/TSをscan
- shared contractにないmedia query thresholdを検出
- CIで`UNAPPROVED_BREAKPOINT`としてfail/warn

するadapterを作る。

現時点ではtarget repoが未確定なので、特定bundlerへ依存するlinterはまだ実装しない。

---

## Native CSS primitives to prefer

Figmaのlayout intentに応じて:

- Flexbox
- CSS Grid
- `gap`
- `min-width` / `max-width`
- `minmax()`
- `clamp()`
- `aspect-ratio`
- logical properties where project convention allows
- CSS Custom Properties
- media queries using the shared contract
- container queries when project/design rules explicitly support them

を候補にする。

absolute positioningをdefaultにしない。

ただし意図的overlapやart-directed layoutではabsolute positioningが正解の場合もある。

`clamp()`、`auto-fit`、container query等を「使えるから使う」こともしない。Fixed typographyやexplicit columnsの方がdesign intentへ合うならそれを使う。

---

## Intrinsic responsiveness

指定breakpointの間でも自然に伸縮させるため:

- flex shrink/grow
- wrap
- grid `minmax()`
- fluid width
- max-width
- clamp

は使える。

これは「新しいbreakpointを追加する」こととは別。

ただしFigma原本/Project contractが固定レイアウトを意図している箇所を勝手にfluid化しない。

---

## Component extraction / reuse

見た目が似ているだけで共通Componentへ統合しない。

共通化の強いsignal:

- same semantic role
- same structure
- same interaction
- same reason to change

例えばREASON cardとCOURSE cardが似ていても、変更理由やdata contractが別ならSection-local blockの方が安全な場合がある。

逆に同じconceptを複数箇所で使うなら既存componentを再利用し、local copyを増やさない。

「DRYにすること」自体ではなく、**同じ責任を1つにすること**が目的。

---

## Cascade / `@layer`

Cascade Layersはvendor/reset/base/component/section等のpriority boundaryを明確にする有力tool。

Use when:

- third-party/vendor CSSとのpriorityを整理したい
- existing projectがlayer architectureを持つ
- specificity escalationを避ける明確な価値がある

Do not:

- 小規模LPへ層数を目的として強制する
- layerを増やしてbase ownershipを逆に見えにくくする

Existing projectのcascade architectureを優先する。

---

## Selector ownership / naming / nesting

Owner/searchabilityが目的。

### Global CSS / Static HTML / PHP / WordPress

Company/Existing命名が無い案件では、Frontend Standardの `l- / c- / p- / is-` + BEM owner/searchabilityをdefaultとする。

BEM owner selectorはflatを基本にする。一方、**そのowner自身の`@media` / `@container` / `@supports` / pseudo/stateは同じblock内へco-locationするのをdefault**とする。

### Scoped CSS / component-local styling

CSS Modules、Vue scoped CSS、SFC等でfile/component boundary自体がownerを明確にする場合、local `.title` `.body` 等を「prefixがない」という理由だけでBEMへ変換しない。

判定基準:

- repo検索からcomponent/file ownerへ辿れる
- global collisionしない
- style responsibilityがcomponent boundaryに閉じる
- existing framework conventionと整合する

Deep DOM descendant nestingや高specificity parent selector listの下へのnestingは、location dependencyとoverride costを増やしやすい。

同じselectorの合法なmedia/container/supports contextまで単純duplicateとして扱わず、**authoritative base ownerが分かること**を重視する。

---

## Comments / section boundaries

Commentはコードを読めば分かるWHATではなく、非自明なWHYを優先する。

Bad:

```css
/* marginを40pxにする */
margin-top: 40px;
```

Useful:

```css
/* Hero人物の視線がcopyへ重ならないart-directed offset */
```

大きいstylesheetではSection/Block boundary headerを検索補助に使えるが、コメント量自体をKPIにしない。

---

## z-index / stacking

`z-index: 99999`の競争を避ける。

- global header/modal/overlay等、本当に共有orderingが必要ならproject z-index contractへ従う
- Section内artworkは必要に応じてlocal stacking context / `isolation`を使う
- local decorationの都合をglobal z-index scaleへ漏らさない

z-index値を小さくすること自体ではなく、**stacking ownershipを局所化すること**が目的。

sticky / fixed ヘッダーは stacking context を作る。オーバーレイパネルがその子孫のとき、兄弟の全画面 overlay をヘッダーより上へ上げるとパネルまで暗幕の下に入る。パネル外形に合わせて overlay を `clip-path` する逃げはしない。同じ stacking context 内で全面暗幕を描き、パネルをその上にする。判断の正本は `docs/frontend-quick-contract.md` 節4。

---

## Utilities

Existing projectがTailwind/utility-firstならそのsystemを使う。

Semantic hand-written CSS案件で、場当たり的に:

```text
.mt-20 .gap-13 .left-37 .w-364
```

のようなone-off utilityを大量生成してFigma座標を写経しない。

Reusable composition/utilityに本当の共通意味があるなら利用できる。

---

## Container queries

使う候補:

- component reuse先によってavailable widthが変わる
- design system側でcontainer-query方針がある
- viewport breakpointよりcomponent boundaryがsource of truth

ただし会社/デザイナーがviewport breakpointを一括指定している案件で、AI判断だけでcontainer queryへ置換しない。

研究対象として比較することはできる。

---

## Tailwind

### Use when

- target codebase already uses Tailwind as primary system
- design tokens/theme are already mapped
- existing components follow Tailwind conventions

### Do not introduce only because MCP output resembles Tailwind

`get_design_context`の表現はproduction styling architectureを指定するものではない。

新規案件でTailwindを選ぶかは別experimentにする。

Potential risks when unmanaged:

- arbitrary values proliferation
- section workerごとのutility expression drift
- breakpoint prefix drift
- Figma variable名とcode token名の対応が見えにくくなる

一方existing Tailwind projectでは既存theme/breakpoint/component conventionsを再利用できるため有力。

---

## CSS-in-JS / typed styling

vanilla-extract等は以下なら候補:

- existing project already uses it
- typed token integrationに明確な価値がある
- design system規模が大きい

Figma再現だけのために依存を増やさない。

---

## Token mapping

Figma variableを無条件にraw valueへflattenしない。

Preferred mapping example:

```css
:root {
  --color-bg-primary: ...;
  --color-text-primary: ...;
  --space-2: ...;
  --space-3: ...;
  --radius-md: ...;
}
```

section CSS:

```css
.root {
  color: var(--color-text-primary);
  gap: var(--space-3);
}
```

ただしtarget projectに既存token APIがあるならそれをsource of truthにする。

`:root`をone-off値のdumping groundにしない。Section限定の意味ならowner scopeのCustom Propertyでよい。

Token名は可能ならsemantic roleを表し、一度しか使わないmagic numberを無理にtoken化して意味を隠さない。

---

## Raw values

Raw px/rem/colorを完全禁止しない。

Allowed when:

- Figmaにone-off値が実在
- matching tokenがない
- global token化するとdesign intentを偽る

Repeated raw valueは記録し、複数sectionで繰り返されたらtoken candidateにする。

**breakpoint raw valuesだけは別扱い。**

案件指定がある場合はshared contractに一致する値だけを使う。

---

## Fonts

Font setupはsection並列化より前に固定する。

Record:

- exact family
- weight availability
- variable font axes if relevant
- webfont/local/system source
- fallback stack
- line-height/letter-spacing
- CJK-specific behavior

font mismatchはline-wrap、section height、responsive layoutを連鎖的に壊すため後回しにしない。

---

## Current new-project recommendation

SCSSを使わない新規Web案件なら、現時点の第一候補:

```text
CSS Modules
+ native CSS
+ CSS Custom Properties for tokens
+ Mobile First authoring
+ owner-colocated nested contextual at-rules
+ project-wide specified breakpoint contract
+ section-scoped files
+ CI check for shared-rule drift when needed
```

ただしこれはcurrent defaultであり永久ルールではない。

Re-test after:

- major Figma Auto Layout/MCP changes
- CSS/browser platform changes
- framework changes
- company coding-standard changes
- repeated evidence that another style system improves fidelity/rework
