# Visual Verification Protocol

目的: 「見た感じ近い」を、run間で比較可能な証拠へ変える。

Screenshot comparisonは重要だが、**撮影条件・run scope・Shared Contractが違えばdiff自体がノイズになる。**

---

## 1. Evidence identity

各captureには最低限:

- experiment/run ID
- run scope: SECTION / INTEGRATION / PAGE_BENCHMARK
- section ID when applicable
- reference revision
- Shared Contract SHA-256 when applicable
- foundation commit
- implementation commit/state
- frame/reference ID
- viewport width/height
- state
- capture timestamp

を紐付ける。

異なるcontract hashのcaptureを「同条件before/after」として扱わない。

---

## 2. Capture environment

各captureで記録:

- viewport width/height
- browser + version if known
- device pixel ratio
- zoom = 100%
- locale
- timezone when relevant
- theme/color mode
- fixture/data state
- auth state
- scroll position
- reduced motion / animation policy
- font loading state

### Stable content

- random値固定
- current-time依存固定/記録
- network dataをfixture化できる場合は固定
- carousel/auto-rotation停止または既知state
- loading完了
- webfontロード完了

### Stable motion

静止画comparisonでは原則animation/transitions停止。

Motion自体がrequirementなら別behavior evidenceとして扱う。

---

## 3. Viewport source of truth

### Reference viewports

Reference Manifestのexact acceptance viewportを使う。

「だいたいPC」「iPhoneっぽい幅」は使わない。

### Breakpoint boundaries

デザイナー/会社/design system/既存product指定breakpointはShared Contractから取得する。

AIがimplementationを見てから都合のよいbreakpointを選ばない。

最低限、responsive behaviorがある場合:

1. PC reference viewport
2. SP reference viewport
3. 指定breakpoint境界
4. 必要なら境界直前/直後

を確認する。

例えばquery semanticsが`max-width`なら、実ブラウザで意味のある境界をproject単位に定義してcaptureする。

1px前後比較がbrowser/device semantics上意味を持つかは環境に依存するため、**Shared Contractのexact media queryを正本にし、capture値はverification metadataとして固定**する。

### Intermediate widths

追加幅は:

- company/designer指定test width
- explicit reference state
- shared contractで決めたvalidation viewport
- long text/wrap検証
- known layout risk

のために使う。

実装結果を見てから都合の良い幅だけ選ばない。

探索目的なら`EXPLORATORY`と明示しacceptance captureと混ぜない。

---

## 4. SECTION capture

担当sectionのfirst-passを評価する。

必要に応じてpage内のsection cropとfull viewportの両方を保存する。

### Section crop

細部比較に向く:

- local geometry
- typography
- spacing
- asset/crop
- component state

### Full viewport including section

sectionがpage/containerへどう乗るかを見る:

- shared gutter
- viewport-relative alignment
- sticky/fixed behavior
- background bleed

SECTION scoreではcross-section spacingを過剰に評価しない。そこはINTEGRATIONで見る。

---

## 5. INTEGRATION capture

全section統合後に必須。

見るもの:

- section order
- cross-section spacing/rhythm
- container alignment
- background continuity
- page-wide typography hierarchy
- z-index/overlap
- navigation relationships
- full-page overflow
- shared breakpoint continuity

### Recommended set

```text
integration/
  pc-viewport.png
  sp-viewport.png
  pc-full-page.png
  sp-full-page.png
  breakpoint-<name>.png
```

Full-page captureは長いページで細部確認が難しいため、viewport captureの代替ではなく補助。

---

## 6. Comparison layers

### Layer A — Side by side

Reference / implementationを同条件で並べる。

見る:

- hierarchy
- geometry
- typography
- spacing
- asset/crop

### Layer B — Overlay / pixel diff

同寸法に揃えoverlay/diff。

用途:

- offset
- width/height drift
- line-wrap drift
- repeated spacing drift

font anti-aliasing、OS/browser/subpixel差があるためpixel diffだけで合否を決めない。

### Layer C — Structural / contract evidence

Visual一致とは別に:

- correct shared components
- tokens
- Shared Contract hash
- foundation commit
- approved breakpoint query
- semantic HTML/accessibility
- allowed-path isolation

を確認する。

---

## 7. Breakpoint verification

Responsive確認は「AIがbreakpointを発見する試験」ではない。

**指定breakpointで期待behaviorが発火することを証明する。**

チェック例:

- Header nav visibility
- MainVisual stacking/order
- Content columns
- image crop/position
- typography/wrap
- section spacing

Failure例:

- 1sectionだけ別threshold
- `min-width`/`max-width`方向違い
- boundaryで両stateが同時表示
- boundaryでどちらも非表示
- section間で切替timingがズレる

`BREAKPOINT_CONTRACT_VIOLATION` / `BREAKPOINT_BOUNDARY`として記録する。

---

## 8. First-pass preservation

Repair前captureを上書きしない。

```text
artifacts/
  EXP-XXXX/
    RUN-XXXX/
      first-pass/
      verify/
      repair-01/
      final/
```

SECTIONならsection IDをpath/file名へ含める。

INTEGRATIONは別run/evidence bundleとして残す。

---

## 9. Evidence bundle for AI review

将来Dashboard/AI visual reviewへ渡しやすいよう、1runのevidenceをまとめる。

候補:

- reference screenshot
- first-pass screenshot
- overlay/diff
- detail crops
- reference manifest
- Shared Contract summary/hash
- section manifest entry
- failure records
- run metadata

AIには画像だけでなく、**どのsection・どのbreakpoint・どのcontractの比較か**も渡す。

---

## 10. Diagnostic ordering

大きいdifferenceから見る。

1. wrong contract/reference/section lineage
2. wrong structure/layout model
3. container geometry
4. breakpoint contract/behavior
5. typography/wrapping
6. repeated spacing/token errors
7. assets/crop
8. local decoration

親layout/contractが間違っている状態で1px装飾修正を始めない。

---

## 11. Verification output

SECTION Verifyは最低限:

- capture inventory
- scope/section ID
- contract hash/foundation
- first-pass score
- Contract Compliance
- ordered failure records
- highest-impact root cause
- areas already matching
- proposed shared/breakpoint changes if any

INTEGRATION Verifyは追加で:

- included section outputs
- cross-section failures
- breakpoint continuity
- integration-only repair candidates

を返す。

---

## 12. Current tooling direction

Browser-based projectではPlaywright等のreal-browser captureを第一候補にする。

特定toolは永久固定しない。

重要条件:

- exact source-of-truth viewport/breakpoint
- deterministic state
- evidence preservation
- scope/lineage metadata
- reference comparison

Tooling更新時はより効率的なcapture/diff手段を再評価する。
