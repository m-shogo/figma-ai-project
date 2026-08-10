# CSS Strategy

SCSSを前提にしない。

このrepoのdefaultは「どの案件でも必ず同じCSS技術を使う」ことではなく、**既存codebaseへ最小摩擦でFigmaの構造を写せる方法を選ぶ**こと。

## Decision order

1. Existing project styling architecture
2. Existing design-system/token architecture
3. Framework conventions
4. Figma structure and responsive requirements
5. Only then choose/add a styling mechanism

新規技術を導入するために既存projectを崩さない。

## Current default for a new React/Next/Vite-style web implementation

**CSS Modules + native CSS + CSS Custom Properties** を第一候補にする。

```text
styles/tokens.css          # global/shared variables
styles/base.css            # only truly global base rules
components/Button/
  Button.tsx
  Button.module.css
sections/Hero/
  Hero.tsx
  Hero.module.css
```

### Why this is a strong default

- section workerのCSS scopeを隔離しやすい
- shared tokenだけCSS custom propertiesで共有できる
- Figma VariablesをCSS variablesへ比較的素直にmapできる
- Auto LayoutをFlex/Gridへ直接translateしやすい
- arbitrary valueをsection間で増殖させにくい
- parallel section implementation時にmerge conflictを減らしやすい
- browser DevTools / computed styleで差分を追いやすい
- SCSS compile layerが不要

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
- media queries
- container queries for component-local responsiveness where appropriate

updated Auto Layout / Grid / fixed-hug-fill/min-max behaviorと対応関係を記録して、absolute positioningをdefaultにしない。

## Responsive rule split

### Page/global behavior

Use page-level media queries when:

- global navigation changes
- page shell/gutter changes
- cross-section layout changes
- explicit product breakpoint exists

### Component-local behavior

Consider container queries/intrinsic layout when:

- Cardなど同じcomponentが異なるcontainer幅で使われる
- breakpointがviewportではなくavailable spaceに依存する
- Figma componentのmin/max/fill/wrap intentと一致する

ただし既存projectがcontainer queriesを使っていない場合、導入コストも評価する。

## Tailwind

### Use when

- target codebase already uses Tailwind as a primary system
- design tokens/theme are already mapped
- existing components follow Tailwind conventions

### Do not introduce only because Figma MCP examples look Tailwind-like

Figma MCPの`get_design_context`はagentが読みやすいintermediate representationであり、production styling architectureを指定するものではない。

新規案件でTailwindを選ぶかは別experimentにする。

Risks for this project goal if unmanaged:

- arbitrary values proliferation
- section workerごとのutility expression drift
- Figma variable namingとcode token namingの対応が見えにくくなる場合

ただしexisting Tailwind projectでは逆にreuse/convention fidelityが高くなる可能性があるため禁止しない。

## CSS-in-JS / typed styling

vanilla-extract等は以下なら候補:

- existing project already uses it
- typed token integrationに明確な価値がある
- design system規模が大きい

Figma再現だけのために追加依存を増やさない。

## Token mapping

Figma variableをraw valueへflattenしない。

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

## Raw values

Raw px/rem/colorを完全禁止しない。

Allowed when:

- Figmaにone-off値が実在
- matching tokenがない
- introducing a global token would be dishonest

Record repeated raw values; 複数sectionで繰り返されたらtoken candidateとして検討する。

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

font mismatchはlayout/line-wrapを連鎖的に壊すため後回しにしない。

## CSS choice is re-evaluated

このdocumentはcurrent defaultであり永久ルールではない。

Re-test after:

- major Figma Auto Layout/MCP changes
- browser/CSS platform changes
- framework changes
- new codebase conventions
- repeated evidence that another style system improves fidelity/rework
