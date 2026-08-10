# Figma Structure Profiling

同じ見た目でも、Figma内部が:

- Auto Layout中心
- Variablesでbinding済み
- Components/Variants中心
- semantic naming済み

なのか、

- absolute/freeform中心
- raw color/spacing
- detached/one-off layers
- `Frame 123`中心

なのかで、AIへ渡すべき情報と実装戦略は変わる。

**Figma機能を使っていると仮定しない。実際のtarget nodeを調査してから戦略を選ぶ。**

---

## Principle

Figma structureは重要なdesign intent evidenceだが、**source code DOM/CSSを機械的にコピーすべき構造そのものではない。**

例:

- Figma Auto Layoutあり → Flex/Grid intentの強いsignal
- Auto Layoutなし → `position:absolute`が正解、とは限らない
- Variables bindingあり → project token mapping候補
- raw HEX → 必ずglobal token化、とは限らない
- Figma Componentあり → code component reuse候補
- Componentなし → native divを毎回作る、とは限らない

Target codebase/design systemも同時に見る。

---

# Structure signals to inspect

## 1. Components / Variants

確認:

- component instances
- component sets
- variants/properties
- detached instances
- repeated visually identical groups
- Code Connect mappings
- corresponding existing code components

### Strong signal

Figma component + code component/Code Connectが対応。

→ component reuseを最優先。

### Weak/no component signal

Figmaでone-offでもcodebaseに既存componentがある可能性を確認する。

Figmaの構造不足を理由にduplicate code componentを作らない。

---

## 2. Variables / Modes

確認:

- color variables
- spacing/number variables
- typography-related variables where used
- modes
- aliases
- raw values
- variable binding coverage

### Bound value

→ existing project token/design-system mappingを調査。

### Unbound value

→ one-offなのか、Figma側の未整理なのか、codebase tokenに既に存在するのか確認。

Raw valueを自動的に新global tokenへ昇格しない。

---

## 3. Auto Layout / Grid / Sizing

確認:

- Auto Layout usage
- updated vs legacy generation
- Grid flow
- horizontal/vertical/wrap
- gap/padding
- fixed / hug / fill
- min/max
- alignment
- nested layout
- intentional absolute/freeform children

### Auto Layout rich

→ Flex/Grid translationの信頼度を上げる。

### Auto Layout poor

→ screenshot + sibling alignment + codebase layout patternsからdesign intentを再構築する。

**Auto Layoutが無いことをabsolute positioning命令として解釈しない。**

---

## 4. Semantic naming

確認:

- section/frame names
- component/layer names
- generic names (`Frame 123`, `Group 8`)
- repeated naming patterns
- annotations/dev resources

Semantic namesは:

- section discovery
- component mapping
- asset identification
- interaction intent

のconfidenceを上げる。

Source Figma layerをAIが勝手にrenameする必要はない。

---

## 5. Assets

確認:

- image fills
- SVG/vector/icon
- masks
- crop/focal point
- duplicated image layers
- exportable/source assets

Structured assetが取れる場合はsourceを使う。

Screenshot cropから再生成しない。

---

## 6. Responsive evidence

Figma structure profileとbreakpoint contractを混ぜない。

Profileが見るもの:

- PC/SP node correspondence
- layout behavior difference
- fixed/hug/fill evidence
- visibility/order difference

Breakpoint値は:

- owner/company
- design system
- existing code
- Figma annotation

等のShared Contract sourceから取る。

---

# Translation modes

Sectionごとにmodeを選べる。

## STRUCTURE_FIRST

Use when:

- Auto Layout/Gridが十分
- Components/Variantsが明確
- Variables bindingが比較的強い
- semantic structureが読みやすい

Priority:

```text
structured Figma
→ Code Connect / codebase mapping
→ screenshot verification
```

Figma structureをdesign intentとして積極利用する。

---

## HYBRID

最も一般的な候補。

例:

- layoutはAuto Layout
- 色はraw値多め
- componentは一部だけ
- namingはmixed

Priority:

```text
信頼できるFigma structure
+ codebase conventions
+ screenshot ground truth
```

情報源ごとにconfidenceを分ける。

---

## VISUAL_FIRST

Use when:

- flat/imported/legacy design
- Auto Layoutがほぼない
- generic layer names
- repeated visual elementsがcomponent化されていない
- structureをそのままcodeへ写すと明らかに脆い

Priority:

```text
reference screenshot/geometry
+ content hierarchy
+ existing codebase/design system
+ selected Figma values/assets
```

ただしimage-as-UIへ逃げない。

Visual-first = screenshotを1枚貼る、ではない。

Native semantic codeを作り、browser renderで比較する。

---

## CODEBASE_FIRST

Use when:

- mature production design systemが存在
- Figma側component mappingが弱い/古い
- codebase componentが正しい実装制約を持つ
- reference visualを既存component props/themeで再現可能

Priority:

```text
reference visual/intent
→ existing production components/tokens
→ Figma structure as supporting evidence
```

Figma構造へ合わせるためにproduction architectureを壊さない。

---

# Profile is per section

1ページ内でも:

```text
Header        → CODEBASE_FIRST
MainVisual    → HYBRID
Content01     → STRUCTURE_FIRST
Editorial art section → VISUAL_FIRST
Footer        → CODEBASE_FIRST
```

のように異なってよい。

「このFigma fileは全部STRUCTURE_FIRST」と一括決定しない。

---

# Evidence levels

Profileでは各signalにconfidenceを持つ。

```text
NONE
LOW
MEDIUM
HIGH
```

例:

```yaml
signals:
  components: HIGH
  variables: MEDIUM
  auto_layout: HIGH
  semantic_naming: LOW
  code_connect: NONE
```

Modeはheuristic recommendationであり永久正解ではない。

---

# Suggested measurements

将来MCP metadataから自動化できる候補:

- component instance count / repeated pattern count
- Code Connect mapped instance coverage
- variable-bound property coverage
- Auto Layout container coverage
- absolute-position child ratio
- generic layer-name ratio
- semantic top-level section name ratio
- asset source availability
- PC/SP mapping confidence

Coverage値の取得可能性はFigma/MCP更新に合わせて再評価する。

取得できないmetricを推測で埋めない。

---

# Implementation strategy matrix

| Figma signal | Preferred action |
|---|---|
| Component + Code Connect | production component reuse first |
| Component only | map to existing code component before creating new |
| Variables bound | map to project token/theme |
| Raw repeated values | token candidate; do not auto-promote |
| Strong Auto Layout | translate intent to Flex/Grid |
| Weak Auto Layout | reconstruct layout from visual + codebase evidence |
| Semantic names | use for discovery/mapping confidence |
| Generic names | do not trust names; use hierarchy + screenshot |
| Exact asset available | use source asset |
| Weak structure overall | VISUAL_FIRST/HYBRID, not screenshot-as-UI |

---

# Failure attribution

Profileを残すとfailure原因を分けやすい。

例:

```text
Spacing mismatch
```

でも:

- Auto Layout gapをagentが無視 → CONTEXT_IGNORED
- Auto Layout自体が無い → STRUCTURE_WEAK / inference issue
- project token mappingが違う → TOKEN_REUSE_MISS

と原因が違う。

Figmaの整理不足をagent failureへ全部押し付けない。

逆にstructured dataがあるのに使わなかった場合も明確になる。

---

# Update-aware rule

今日VISUAL_FIRSTだったFigma/import workflowが、将来Figma updateやvision/MCP improvementでSTRUCTURE_FIRST相当に変わる可能性がある。

したがって:

- tool/model/dateをprofileへ残す
- old profileを永久固定しない
- major Figma/MCP update後に再profile可能
- screenshot-only能力も定期的に再benchmark

する。

---

# Relation to section-first execution

Recommended flow:

```text
Global Figma metadata
→ Section discovery
→ Section structure profile
→ Translation mode selection
→ Shared Contract/Foundation
→ Section Inspect
→ Section implementation
→ Browser verification
```

つまり**sectionを切った後、各sectionのFigma構造を見て実装方法まで変える。**

これが「全sectionへ同じprompt/translation法を機械的に適用する」よりcurrent defaultとして妥当。
