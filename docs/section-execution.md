# Section-first Execution

Figma → code のproduction defaultは、ページ全体を1回で生成することではなく、**全体の共通契約を先に確定し、論理section単位で実装し、最後に統合する**方式とする。

Figma公式MCP docsも large/heavy frame を一括処理せず、Header / Sidebar / Card のような smaller logical chunks に分けることを推奨している。

Whole-page one-shotは能力進化を測るresearch benchmarkとして残すが、現時点のproduction defaultではない。

## Core architecture

```text
Frozen Figma reference
  ↓
0. Global reconnaissance
  ↓
1. Shared contract DRAFT
  ↓
2. Section manifest DRAFT
  ↓
3. Shared foundation implementation
  ↓
4. Foundation verification
  ↓
5. Shared contract FROZEN + hash
  ↓
6. Section manifest binds contract hash + foundation commit
  ↓
7. Parallel section implementation
  ↓
8. Integration
  ↓
9. Global visual / responsive verification
  ↓
10. Targeted section repair
  ↓
11. Final global verification
```

重要なのは、**parallel workerを開始する前にshared contractとfoundation commitをfreezeすること**。

---

## 0. Global reconnaissance — coordinator only

最初に1 coordinatorがページ全体を**実装せずに**調査する。

### Read first

1. target codebase/framework/style architecture
2. company / project / designer implementation rules
3. existing global breakpoint definitions
4. Figma page/frame metadata
5. top-level hierarchy and likely section boundaries
6. subscribed libraries/design-system context
7. reusable components/component sets/variants
8. variables/tokens/modes
9. typography/font availability
10. Auto Layout/grid/sizing behavior
11. PC/SP responsive relationships
12. assets/images/icons/crop behavior
13. states/interactions/annotations/dev resources
14. existing code components/tokens/routes

大frameへ最初からfull contextを投げず、可能なら sparse hierarchy / metadata でsection候補を絞ってから relevant node を深掘りする。

### Breakpoint rule

デザイナー / 会社 / design system / existing productでbreakpoint指定がある場合、それをsource of truthとして先に取得する。

AIはreference画像から別thresholdを発明しない。

詳しくは `docs/responsive-breakpoint-policy.md`。

---

## 1. Shared contract DRAFT

`templates/shared-contract.yaml` を作る。

section workerを起動する前に、全workerが共有すべきものを1箇所へ集約する。

最低限:

- framework/runtime
- styling strategy
- global CSS/token entry points
- font loading policy
- color/spacing/radius/effect tokens
- typography roles
- container widths/gutters
- layout primitives
- **global breakpoint source + exact values/query semantics**
- responsive invariants
- shared component inventory
- Code Connect mappings if available
- asset policy
- accessibility baseline
- file/folder conventions
- coordinator-only files

### Important

workerごとに以下を再発明させない。

- colors
- spacing scale
- font setup
- container
- breakpoint
- Buttonなどshared component
- z-index scale

---

## 2. Section manifest DRAFT

Figmaから自動/半自動でsection boundariesを抽出し、`templates/section-manifest.yaml`へ保存する。

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
- PC/SP node/state
- screenshot evidence
- relevant structured context
- section-specific components
- section-specific assets
- shared component dependencies
- token/font dependencies
- responsive changes at the **shared breakpoint**
- output code path
- allowed write paths

を持つ。

Figma layer名がsemanticならそのまま利用する。`Frame 123`等しかない場合はmetadata + screenshotからAIが候補名/境界を提案してmanifestへ保存する。原本layer名を勝手に変更する必要はない。

section manifestにbreakpoint数値を複製しない。shared contractを参照する。

---

## 3. Shared foundation — serial

並列sectionより先に共通基盤だけ作る。

Recommended order:

1. font loading
2. existing reset/base integration if needed
3. project tokens / CSS custom properties binding
4. global breakpoint implementation/source binding
5. page container/gutter primitives
6. spacing/layout primitives
7. shared components
8. shared asset helpers
9. shared accessibility primitives if applicable

### Existing project first

既存projectに既に正本がある場合は新しく複製しない。

- existing breakpoint utility
- existing typography
- existing tokens
- existing Button/Input/etc.

を再利用し、shared contractには参照先を記録する。

---

## 4. Foundation verification

parallel開始前にfoundationだけ検証する。

最低限:

- build/type/lint
- fonts load correctly
- token references resolve
- shared components render
- global container/gutter behavior
- company/designer-specified breakpoints are represented exactly
- no duplicate design-system primitive created unnecessarily

既存基盤をそのまま使う場合でも `VERIFIED` として確認する。

---

## 5. Freeze shared contract

Foundation verification後:

```text
foundation.status = VERIFIED
foundation.commit = <verified commit>
status = FROZEN
freeze.ready = true
```

にする。

そのファイルのSHA-256をsection manifestへ保存する。

これによりparallel worker全員が:

- 同じshared rules
- 同じfoundation commit
- 同じbreakpoints
- 同じcomponents/tokens

から開始したことを証明できる。

shared contractを更新したらhashが変わるため、古いsection worker outputを無条件で統合しない。

---

## 6. Parallel section implementation

shared contract + foundationが固定されたらsectionを並列化してよい。

### Worker input

各workerへ渡す:

- frozen shared contract
- shared contract hash
- verified foundation commit
- section manifest entry
- exact Figma section node(s)
- section screenshot(s)
- relevant structured context only
- allowed output paths
- forbidden shared-file edits

### Isolation rule

原則section workerは:

- shared token fileを変更しない
- font setupを変更しない
- root page compositionを変更しない
- 他sectionのCSSを変更しない
- global breakpoint値を変更/追加しない
- duplicate shared componentを作らない
- global z-index/container ruleを勝手に追加しない

新しい共通ruleが必要なら:

```text
PROPOSE_SHARED_CHANGE
```

新しいbreakpointが必要に見えるなら:

```text
PROPOSE_BREAKPOINT_EXCEPTION
```

として証拠とscopeをcoordinatorへ返す。

worker自身では適用しない。

### Why

並列化の最大リスクは処理速度ではなく:

- design drift
- duplicate rules
- merge conflict
- breakpoint drift
- foundation version drift

shared surfaceをread-onlyにして抑える。

---

## 7. Responsive implementation

### Production default

```text
GLOBAL_SPECIFIED
```

会社/デザイナー/design systemの共通breakpointを全sectionへ適用する。

sectionごとに異なるのはbreakpoint値ではなく、その境界で起こるbehavior:

- reorder
- hide/show
- stack
- column count
- alignment
- image crop
- typography/layout changes

など。

### AI role

AIは指定breakpointを探すのではなく:

1. sourceを確認
2. exact query/valueを共有契約へ記録
3. section behaviorをFigmaから読む
4. boundary前後で破綻を検証
5. 必要なら例外を提案

する。

### Intrinsic CSS

共通breakpointを増やさず、design intentに沿って:

- flex/grid
- wrap
- min/max
- minmax
- clamp
- fluid sizing

を使うことは可能。

---

## 8. Information order: inspect vs implement

「何を見る順」と「何を書く順」は違う。

### Inspect order

1. codebase/style/design-system rules
2. company/designer breakpoint specification
3. page metadata / section boundaries
4. components + variants + Code Connect
5. variables/tokens/modes
6. fonts/typography
7. Auto Layout/grid/sizing
8. PC/SP behavior at specified breakpoints
9. assets/crops
10. states/interactions/annotations
11. section-specific exceptions

### Implementation order

1. fonts/tokens
2. breakpoint/shared responsive foundation
3. layout/container primitives
4. shared components
5. section components
6. section layout
7. section responsive behavior
8. page integration
9. visual repair

componentsを先に**調査**するが、component codeが消費するtoken/font/breakpoint foundationを先に**実装**する。

---

## 9. Integration — coordinator

section workerのoutputをpage orderへ接続する。

ここで確認する:

- section order
- cross-section vertical rhythm
- background continuation
- container alignment
- shared heading/button consistency
- z-index/layer overlap
- **same breakpoint contract across all sections**
- responsive transition continuity
- page-level navigation/anchor behavior
- global overflow
- asset continuity

section単体が高品質でもページ全体で崩れるため、integration evidenceを必ず残す。

---

## 10. Section consistency gates

各section integration前:

- shared contract hash一致
- foundation commit一致
- no undeclared raw color if mapped token exists
- no duplicate font declaration
- no unapproved breakpoint
- no duplicate shared component
- allowed pathだけ変更
- container alignment matches shared contract
- screenshots captured at required viewport
- section-level mismatch recorded

page integration後:

- shared visual rhythm
- cross-section spacing
- breakpoint boundary behavior
- global responsive behavior
- typography hierarchy
- asset quality/crop
- accessibility basics
- overflow/z-index/background continuity

---

## 11. Parallelism policy

### Safe to parallelize

- independent content sections after foundation freeze
- local visual repair in separate files
- asset extraction for separate nodes
- evidence capture
- section-level verification

### Serial/coordinated

- breakpoint policy
- token definitions
- font setup
- shared components
- global container/grid
- root page composition
- shared z-index strategy
- global navigation
- shared contract changes

---

## 12. Contract change during parallel work

shared contract変更が承認された場合:

1. section workerを新規開始しない
2. coordinatorがshared changeを実装
3. foundation再検証
4. new foundation commit
5. contract revision + new hash
6. 既存sectionへの影響を判定
7. affected sectionだけrebase/re-run

全sectionを無条件で作り直す必要はないが、**異なるcontract hashの成果物をそのまま混ぜない。**

---

## 13. Research exception

Whole-page one-shotやAI-inferred breakpointは永久禁止ではない。

major model/MCP/Figma update後にresearch cohortとして再テストできる。

ただしproductionでは、案件側に明示breakpointがある限りその指定が優先される。
