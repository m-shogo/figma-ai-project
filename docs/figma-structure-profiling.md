# Figma Structure Profiling

同じ見た目でもFigma内部構造はSectionごとに違うことがある。

- Headerはproduction componentに強く対応
- MainVisualはAuto Layoutとfreeformが混在
- ContentはVariables/Componentsが整理済み
- Editorial sectionはvisual intent中心

そのため、**ページ全体のCapability Profileと、SectionごとのStructure Profileを分ける。**

---

## Two profile layers

### 1. Global Figma Capability Profile

Canonical: `docs/figma-capability-profile.md`

責務:

- target page/reference全体で何が利用/取得可能か
- Components / Variables / Auto Layout / Code Connect等の全体成熟度
- Shared Foundationへ効くstrategy
- component/token resolutionの前提
- tooling limitation / UNDETERMINED

保存先: Shared Contract `figma_profile`

Global Profileは「全Sectionを同じ方法で実装する命令」ではない。

### 2. Per-section Figma Structure Profile

責務:

- そのSectionでどのFigma structureを信頼できるか
- PC/SP nodeごとの局所signal
- codebase reuse優先度
- Section固有translation mode

保存先: `templates/figma-structure-profile.yaml`

Section Manifestはprofile path + SHA-256を固定する。

**Globalは共有戦略、Section Profileは局所差分/translation戦略。**

同じ情報を二重source-of-truthにしない。

---

## Epistemic state and confidence are separate

各signalは2軸で記録する。

### `state`

- `UNKNOWN` — まだ十分に調査していない
- `NONE` — 調査した結果、そのSectionには存在しない
- `OBSERVED` — signalを観測した
- `UNDETERMINED` — 調査したがcurrent MCP/API/client/権限では確定不能

### `confidence`

- `NONE`
- `LOW`
- `MEDIUM`
- `HIGH`

Example:

```yaml
components:
  state: OBSERVED
  confidence: HIGH
  evidence:
    - "Component instance inventory"

auto_layout:
  state: UNDETERMINED
  confidence: HIGH
  evidence:
    - "layout properties取得済みだがgeneration metadataはcurrent MCPでは確定不能"
  generation: UNDETERMINED
```

`UNDETERMINED`は失敗ではない。Conservative strategyで進み、tool update時に`RETEST_NOW`へ戻す。

---

## Principle

Figma structureはdesign intent evidenceだが、source code DOM/CSSそのものではない。

- Auto Layoutあり → Flex/Grid intentの強いsignal
- Auto Layoutなし → absolute positioning命令ではない
- Variables bindingあり → project token mapping候補
- raw HEX → 必ずglobal token化ではない
- Figma Componentあり → code component reuse候補
- Componentなし → code component不要ではない

Target codebase/design systemも同時に見る。

---

## Signals to inspect per Section

### Components / Variants

- component instances
- component sets
- variants/properties
- detached/repeated patterns
- corresponding existing code components

Strong mappingは`docs/component-resolution.md`へ渡す。

### Variables / Modes

- bound properties
- color/spacing/number/typography variables
- modes/aliases
- raw values

Global resolutionは`docs/token-mapping.md`へ渡す。

Section Profileは**このSectionで実際にどの程度使われているか**を記録する。

### Auto Layout / Grid / Sizing

- horizontal / vertical / Grid / wrap
- gap/padding
- fixed/hug/fill
- min/max
- nested layout
- intentional absolute/freeform
- generation when observable

Generationがcurrent toolで確定できなければ`UNDETERMINED`。

### Semantic naming

- semantic Section/frame/component/layer names
- generic names比率

Nameが弱ければhierarchy + screenshot + text/assets/component identityを併用する。

### Code Connect

- mapped components
- mapped coverage

No mappingなら`NONE` + evidence。存在しないことと未調査を混同しない。

### Assets

- exact image/vector/icon source
- crop/focal behavior

Exact sourceがあるのにscreenshot crop/再生成へ置換しない。

### Responsive mapping

- PC/SP logical correspondence
- order/visibility/layout change
- fixed/hug/fill evidence

Breakpoint値そのものはShared Contractのsource of truthを使う。

---

## Translation modes

### STRUCTURE_FIRST

Use when Section内でAuto Layout/Grid等のstructured layoutをMEDIUM/HIGH confidenceで観測し、信頼できる構造が十分ある。

```text
structured Figma
→ component/token/codebase mapping
→ screenshot verification
```

### HYBRID

最も一般的な候補。

```text
trusted Figma structure
+ codebase conventions
+ screenshot ground truth
```

信頼できる部分だけstructureを使い、弱い部分はvisual/codebase evidenceへ切り替える。

### VISUAL_FIRST

Use when:

- flat/imported/legacy/freeform
- structure signalが弱い/UNDETERMINED
- generic layersが多い
- structureをそのままcode化すると脆い

```text
reference visual/geometry
+ content hierarchy
+ existing codebase/design system
+ exact Figma values/assets
```

Visual-firstはimage-as-UIではない。Native semantic codeを作りbrowser renderで比較する。

### CODEBASE_FIRST

Use when:

- mature production design systemがある
- Figma mappingが弱い/古い
- existing code componentが正しいimplementation constraintを持つ

```text
reference intent
→ existing production component/token
→ Figma structure as supporting evidence
```

---

## Per-section variation is expected

1ページ内でも:

```text
Header        → CODEBASE_FIRST
MainVisual    → HYBRID
Content01     → STRUCTURE_FIRST
Editorial art → VISUAL_FIRST
Footer        → CODEBASE_FIRST
```

でよい。

Global Capability ProfileがSYSTEMATICでも、特定Sectionだけflat/freeformならそのSectionはHYBRID/VISUAL_FIRSTになり得る。

逆もある。

---

## Profiling lifecycle

```text
Reference Freeze
→ Global Capability Profile
→ Section Discovery / PC-SP mapping
→ Per-section Structure Profile DRAFT
→ targeted Figma inspection
→ translation mode recommendation
→ Structure Profile fingerprint
→ Section Manifest path/hash binding
→ active Section worker
```

探索中:

- `UNKNOWN`可
- translation mode `UNKNOWN`可

Active worker開始時:

- relevant signalsの`UNKNOWN`不可
- `NONE/OBSERVED/UNDETERMINED`はevidence必須
- translation mode確定必須
- mode reasoning evidence必須
- profile SHA-256がSection Manifest/Run Recordと一致必須

この二段階で、探索を硬直化せずproduction lineageだけ厳密にする。

---

## Suggested measurements

Toolingから取れる時だけ記録する。

- component instance count
- Code Connect mapped coverage
- variable-bound property coverage
- Auto Layout container coverage
- absolute-position child ratio
- generic layer-name ratio
- exact asset source availability
- PC/SP mapping confidence

取得できないmetricを推測で埋めない。Current toolで確定不能なら`UNDETERMINED`として記録する。

---

## Failure attribution

Profileにより、同じvisual mismatchでも原因を分けられる。

Example: spacing mismatch

- observed Auto Layout gapをagentが無視 → `CONTEXT_IGNORED`
- Auto Layout NONE → inference/layout translation issue
- Auto Layout UNDETERMINED → tooling limitation + conservative strategy failureの可能性
- project token mapping違い → `TOKEN_REUSE_MISS`

Figma整理不足を全部agent failureへ押し付けず、structured evidenceを無視したagentも見逃さない。

---

## Update-aware rule

今日VISUAL_FIRSTだったSectionが、将来Figma/MCP/vision updateでSTRUCTURE_FIRST相当に変わる可能性がある。

保存する:

- profile captured_at
- Figma/tooling snapshot
- profile SHA-256
- evidence
- UNDETERMINED理由

Major update後:

- old profileを履歴として保持
- relevant Sectionだけre-profile
- new profile revision/hashを作る
- old/newを別cohortとして比較

一度のprofile結果を永久固定しない。
