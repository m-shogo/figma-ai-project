# CSS Strategy

SCSSを前提にしない。

このrepoのdefaultは「どの案件でも同じCSS技術を強制する」ことではなく、**既存codebaseへ最小摩擦でFigmaの構造と案件ルールを写す方法を選ぶ**こと。

## Decision order

1. Existing project styling architecture
2. Company / project coding rules
3. Existing design-system/token/breakpoint architecture
4. Framework conventions
5. Figma structure and responsive requirements
6. Only then choose/add a styling mechanism

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
- Auto LayoutをFlex/Gridへtranslateしやすい
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

workerはshared surfaceを勝手に変更しない。

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

absolute positioningをdefaultにしない。

ただし意図的overlapやart-directed layoutではabsolute positioningが正解の場合もある。

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

ただしFigma原本が固定レイアウトを意図している箇所を勝手にfluid化しない。

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
