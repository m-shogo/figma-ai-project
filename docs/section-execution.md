# Section-first Execution

Figma → code の実務標準は、ページ全体を1回で生成することではなく、**全体の共通契約を先に固定し、論理section単位で実装し、最後に統合する**方式とする。

Figma公式MCP docsも large/heavy frame を一括処理せず、Header / Sidebar / Card のような smaller logical chunks に分けることを推奨している。

## Core architecture

```text
Figma page/frame
  ↓
0. Global reconnaissance
  ↓
1. Shared design/code contract
  ↓
2. Section manifest
  ↓
3. Shared foundation implementation
  ↓
4. Parallel section implementation
  ↓
5. Integration
  ↓
6. Global visual/responsive verification
  ↓
7. Targeted section repair
  ↓
8. Final global verification
```

## 0. Global reconnaissance — coordinator only

最初に1 coordinatorがページ全体を**実装せずに**調査する。

### Read first

1. target codebase/framework/style architecture
2. Figma page/frame metadata
3. top-level hierarchy and likely section boundaries
4. subscribed libraries/design-system context
5. reusable components/component sets/variants
6. variables/tokens/modes
7. typography/font availability
8. Auto Layout/grid/sizing behavior
9. responsive PC/SP relationships
10. assets/images/icons/crop behavior
11. states/interactions/annotations/dev resources
12. existing code components/tokens/routes

`get_metadata` 等の sparse hierarchy を先に使い、大frameへ最初から full `get_design_context` を投げない。

## 1. Shared design/code contract

section workerを起動する前に、全workerが読む immutable contract を作る。

最低限:

- framework/runtime
- styling strategy
- global CSS/token entry points
- font loading policy
- color tokens
- spacing tokens
- radius/effect tokens
- typography roles
- container widths/gutters
- layout primitives
- responsive invariants
- breakpoint evidence / UNKNOWNs
- shared component inventory
- Code Connect mappings if available
- asset policy
- accessibility baseline
- file/folder conventions

### Important

workerごとに色・font-size・breakpoint・Buttonを再発明させない。

## 2. Section manifest

Figmaから自動/半自動で section boundaries を抽出してmanifest化する。

例:

```text
S01 Header
S02 MainVisual
S03 Content01
S04 Content02
S05 Footer
```

各sectionは:

- Figma node ID
- PC node/state
- SP node/state if separate
- screenshot evidence
- section-specific components
- section-specific assets
- relevant variables
- responsive behavior
- dependencies on shared components
- output code path

を持つ。

Figma layer名がsemanticならそのまま利用する。`Frame 123` 等しかない場合は、metadata + screenshotからAIが**候補名/境界を提案**してmanifestへ保存する。原本のlayer名を勝手に書き換える必要はない。

## 3. Shared foundation — serial first

並列sectionより先に、共通基盤だけは1回作る。

Recommended implementation order:

1. font loading
2. CSS reset/base assumptions if project requires
3. CSS custom properties / project token bindings
4. page container/gutter primitives
5. spacing/layout primitives
6. shared components already present in Figma/codebase
7. shared asset helpers

このphase完了commitを section workers の共通baseにする。

## 4. Parallel section implementation

shared foundationが固定されたら sectionを並列化してよい。

### Worker contract

各workerへ渡すもの:

- shared contract
- foundation commit
- section manifest entry
- exact Figma section node(s)
- section screenshot(s)
- relevant structured context only
- allowed output paths
- forbidden shared-file edits

### Isolation rule

原則としてsection workerは:

- shared token fileを変更しない
- root page compositionを変更しない
- 他sectionのCSSを変更しない
- global breakpointを勝手に追加しない
- duplicate shared componentを作らない

新しい共通ruleが必要なら `PROPOSE_SHARED_CHANGE` としてcoordinatorへ返す。

### Why

並列化の最大リスクは速度ではなく**design drift / merge conflict / duplicate rules**。

shared surfaceをread-onlyにすることで並列実装しても整合性を保つ。

## 5. Integration — coordinator

section workersの出力をpage orderへ接続する。

ここで初めて確認する:

- section間vertical rhythm
- background continuation
- container alignment
- shared heading/button consistency
- z-index/layer overlap
- responsive transitions between sections
- page-level navigation/anchor behavior
- global overflow

section単体が100点でもページ全体で崩れるため、integration scoreを別に持つ。

## 6. Responsive strategy

PC/SPを完全に別実装しない。

まずFigmaから:

- invariants
- reorder
- hide/show
- wrap
- container width
- min/max
- image crop
- fixed/hug/fill
- grid/flex behavior

を抽出する。

### Breakpoints

`768pxだから`のような慣習値を先に決めない。

優先順位:

1. existing product breakpoints
2. explicit Figma/design-system breakpoint definitions
3. observed transition requirements between provided frames
4. intrinsic CSS (`flex`, `grid`, `minmax`, `clamp`, container behavior)
5. only then evidence-backed new media/container query threshold

UNKNOWNなら記録して最小仮定で実装する。

## 7. Information order: inspect vs implement

「何を見る順」と「何を書く順」は違う。

### Inspect order

1. codebase/style system
2. page metadata / section boundaries
3. components + variants
4. variables/tokens
5. fonts/typography
6. Auto Layout/grid/sizing
7. PC/SP responsive relationships
8. assets/crops
9. states/interactions/annotations
10. section-specific exceptions

### Implementation order

1. tokens/fonts
2. layout/container primitives
3. shared components
4. section components
5. section layout
6. responsive rules
7. page integration
8. visual repair

componentsを先に**調査**するが、component codeが消費するtoken/fontを先に**実装**する。

## 8. Section consistency gates

各section merge前:

- no undeclared raw color if token exists
- no duplicate font declaration
- no new arbitrary breakpoint without evidence
- no duplicate shared component
- container alignment matches shared contract
- screenshots captured at required viewport
- section-level mismatch recorded

page integration後:

- shared visual rhythm
- cross-section spacing
- global responsive behavior
- typography hierarchy
- asset quality/crop
- accessibility basics

## 9. Parallelism policy

### Safe to parallelize

- independent content sections
- local visual repair in separate files
- asset extraction for separate nodes
- evidence capture

### Usually serial/coordinated

- token definitions
- font setup
- shared components
- global container/grid
- root page composition
- breakpoint policy
- global navigation

## 10. Research exception

Whole-page one-shot may still be run as an experiment to measure how capabilities change over time.

It is **not** a permanent ban; it is simply not the current production default. If future models/MCP materially improve large-frame handling, re-test it against section-first execution.
