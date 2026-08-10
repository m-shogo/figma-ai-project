# Reference Contract

Reference Figma を「人間には分かるがAIには曖昧なURL」から、**再現実験で固定できる source-of-truth package** に変換するための契約。

## Principle

Design を補完・改善するための文書ではない。

目的は、同じ原本を別agent・別runへ同じ条件で渡せるようにすること。

## Freeze gate

Implementation run を始める前に最低限以下を確定する。

### Identity

- reference id
- Figma file URL / file key
- target node id(s)
- capture timestamp
- Figma branch/version information if available
- owner-provided notes/version label if available

### Viewports

各 reference frame について:

- role: PC / SP / tablet / other
- exact frame width
- exact frame height if meaningful
- expected browser viewport width
- expected browser viewport height if acceptanceに使う
- device pixel ratio if capture条件として固定する場合

**1440 / 390 などをrepo側から勝手に決めない。Figma原本の値を使う。**

### States

存在するものだけ記録する。

- default
- hover
- focus
- active
- selected
- disabled
- loading
- empty
- error
- open/closed
- authenticated/anonymous
- other project-specific states

### Design structure

可能な限り structured context から取得する。

- page / frame hierarchy
- reusable components
- component sets / variants / properties
- instances
- variables / modes
- typography
- effects
- Auto Layout
- fixed / hug / fill 相当の sizing
- min/max constraints
- clipping / overflow intent
- grids
- layer semantics
- annotations
- dev resources

### Assets

- exact images
- SVG/icons
- logo assets
- image crop / fit behavior
- asset source or Figma image identity
- whether placeholder substitution is forbidden/allowed

### Responsive contract

PC/SP screenshotsだけで breakpoint を推測して終わらせない。

Referenceから読み取れる範囲で以下を記録する。

- invariant: 画面幅が変わっても維持するもの
- transition: どこで構造が変わるか
- ordering: 並び順の変化
- visibility: show/hide
- wrapping
- columns
- alignment
- container max/min behavior
- image resize/crop behavior
- navigation behavior

不明なものは `UNKNOWN` とする。勝手に確定値を埋めない。

### Code baseline

Design reproduction は codebase の状態にも依存するため固定する。

- repository
- base branch
- starting commit SHA
- target route/page
- framework/runtime
- package manager
- existing design system location
- existing components expected to be reused
- existing token/theme source

## Evidence bundle

Reference contract と一緒に保存したい証拠:

1. exact Figma URL(s)
2. reference screenshots
3. structured context capture or summary
4. relevant metadata
5. component / variable inventory
6. asset inventory
7. codebase starting SHA

## Unknown handling

### Resolvable unknown

Figma / codebase / existing docs を読めば解決できるもの。

→ agent が調査してから進む。

### Material unresolved unknown

見た目またはbehaviorが複数の正解を持ち、原本から解決不能なもの。

→ `UNKNOWN` としてrun recordへ残す。比較時にagentのassumptionとして扱う。

### Non-material unknown

再現精度にほぼ影響しないもの。

→ 最も単純な実装を選択してassumptionへ記録してよい。

## Freeze rule

Freeze後にreference自体が更新された場合:

- 既存experimentのreferenceを書き換えない
- new reference revision を作る
- old/newを別cohortとして扱う

これにより、design変更とagent改善を混同しない。

## Ready condition

以下が満たされたら `REFERENCE_READY`:

- target node(s) が一意
- PC/SPなど必要なreference frameが特定済み
- exact reference sizesが記録済み
- source assetsの扱いが決まっている
- code baseline SHAが固定済み
- material unknown が列挙済み

Referenceが完全にannotationされている必要はない。**何が既知で何が未知かが固定されていること**が重要。
