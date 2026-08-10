# Reference Contract

Reference Figmaを「人間には分かるがAIには曖昧なURL」から、**再現実験で固定できる source-of-truth package**へ変換する契約。

## Principle

Designを補完・改善する文書ではない。

目的は、同じ原本を別agent・別runへ同じ条件で渡し、後からdesign変更とAI改善を混同しないこと。

Reference manifestは**原本と外部指定の証拠**を保存する。

実装として最終採用するfonts/tokens/breakpoints/components等は `templates/shared-contract.yaml` で正規化する。

---

## Freeze gate

Implementation preparation前に最低限以下を固定する。

### Identity

- reference id
- Figma file URL / file key
- target node id(s)
- capture timestamp
- Figma branch/version information if available
- owner-provided notes/version label if available

### Viewports

各reference frameについて:

- role: PC / SP / tablet / other
- exact frame width
- exact frame height if meaningful
- expected browser viewport width
- expected browser viewport height if acceptanceに使う
- device pixel ratio if capture条件として固定する場合

**1440 / 390などをrepo側から勝手に決めない。原本/案件指定を使う。**

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

可能な限りstructured contextから取得する。

- page / frame hierarchy
- likely section boundaries
- reusable components
- component sets / variants / properties
- instances
- variables / modes
- typography
- effects
- Auto Layout generation/semantics
- fixed / hug / fill相当のsizing
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
- placeholder substitution可否

---

## Responsive evidence

PC/SP screenshotsだけからbreakpoint値をAIが推測して正本化しない。

まず「何が指定されているか」を証拠として保存する。

### Breakpoint evidence sources

- `OWNER` — デザイナー/責任者
- `COMPANY` — 会社/案件coding guideline
- `DESIGN_SYSTEM`
- `EXISTING_CODE`
- `FIGMA` — annotation/variable/documented intent
- `MULTIPLE`
- `UNKNOWN`

Reference manifestでは:

```yaml
responsive:
  breakpoint_evidence:
    source: COMPANY
    source_refs: []
    values: []
    notes: []
```

のように保存する。

### Responsive behavior evidence

- invariant
- reorder
- visibility show/hide
- wrapping
- columns
- alignment
- container max/min
- image resize/crop
- navigation behavior
- section-specific state changes

を記録する。

**breakpoint値と、そのbreakpointで何が変わるかは別情報。**

### Conflict

例えば:

- company specは`X`
- existing codeは`Y`
- Figma annotationは`Z`

なら、Reference manifestで事実を残し、Shared Contract作成時にconflictとして扱う。

AIが勝手に平均値や慣習値を選ばない。

---

## Section evidence

Production実装はsection-firstのため、Reference freeze後にtop-level hierarchyからsection候補を作る。

例:

```text
Header
MainVisual
Content01
Content02
Footer
```

ただしsection名/境界はreference designそのものを書き換えるものではない。

- semantic Figma layer名があれば優先
- layer名が曖昧ならAI candidateを作る
- node IDを必ず保持
- PC/SP対応nodeを紐付ける

最終的な実装work unitは `templates/section-manifest.yaml` へ保存する。

---

## Code baseline

Design reproductionはcodebase状態にも依存するため固定する。

- repository
- base branch
- starting commit SHA
- target route/page
- framework/runtime
- package manager
- existing styling architecture
- existing breakpoint source
- existing design system location
- existing components expected to be reused
- existing token/theme source

このstarting commitはShared Foundationのbaseとなる。

---

## Evidence bundle

Reference contractと一緒に保存したい証拠:

1. exact Figma URL(s)
2. reference screenshots
3. structured context capture/summary
4. relevant metadata
5. component / variable inventory
6. font inventory
7. asset inventory
8. breakpoint source documents/references
9. codebase starting SHA
10. relevant existing CSS/design-system paths

---

## Unknown handling

### Resolvable unknown

Figma / codebase / company docs / existing guidelinesを読めば解決できるもの。

→ 調査してからShared Contractをfreezeする。

### Material unresolved unknown

見た目/behavior/implementation ruleが複数の正解を持ち、sourceから解決不能。

→ `UNKNOWN` / conflictとして残す。

Parallel section workerへ曖昧なshared ruleを各自判断させない。

### Non-material unknown

再現精度/architectureへほぼ影響しないもの。

→ 最小仮定を選びassumptionへ記録してよい。

---

## Reference freeze vs Shared Contract freeze

2種類を混同しない。

### Reference freeze

原本/指定/証拠を固定する。

### Shared Contract freeze

Reference + codebaseを調査し、Shared Foundationを検証した後、実装正本を固定する。

```text
Reference READY
  ↓
Shared Contract DRAFT
  ↓
Foundation build/verify
  ↓
Shared Contract FROZEN
  ↓
Section workers
```

---

## Freeze rule

Reference自体が更新された場合:

- 既存experimentのreferenceを書き換えない
- new reference revisionを作る
- old/newを別cohortとして扱う

Shared Contractだけ更新された場合もcontract revision/hashを分ける。

これにより:

- design変更
- codebase変更
- shared rule変更
- agent改善

を混同しない。

---

## Ready condition

以下が満たされたら `REFERENCE_READY`:

- target node(s)が一意
- PC/SP等必要frameが特定済み
- exact reference sizesが記録済み
- source assetsの扱いが決まっている
- breakpoint evidence/sourceが確認済み、または`UNKNOWN`として明示済み
- code baseline SHAが固定済み
- material unknown/conflictが列挙済み

Referenceが完全annotation済みである必要はない。

**何が既知・未知・競合中かが固定されていること**が重要。
