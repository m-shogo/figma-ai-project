# Figma Capability Profile

目的は、一般的なFigma best practiceを一律に押し付けず、**今回のreferenceが実際にComponents / Variables / Auto Layout / semantic naming / Code Connect等をどこまで使っているかを先に観測し、その状態に合わせて実装戦略を変える**こと。

## Core rule

```text
Inspect actual Figma
  ↓
Capability Profile
  ↓
Choose implementation strategy
  ↓
Component / Token Resolution
  ↓
Shared Contract / Foundation
  ↓
Section workers
```

「Variablesを使うべきだから存在しないVariablesをAIが発明する」のような流れにしない。

## Epistemic states

Capability値には、機能の有無だけでなく**何が分かっているか**を含める。

### `UNKNOWN`

まだ十分に調査していない / 未解決。

Production freeze前に解消する。

### `NONE`

調査した結果、そのtarget/referenceには存在しない。

FROZEN contractでは「何を確認してNONEと判断したか」のevidenceを残す。

### `UNDETERMINED`

調査はしたが、**現在のMCP/API/client/権限/metadataでは確定できない**。

これはNONEではない。

FROZEN contractでも、以下を残せば許容する:

- inspection evidence
- current limitation
- conservative implementation strategy
- future retest trigger

Figma/MCP/model更新時には`RETEST_NOW`候補へ戻す。

この区別により「今取れない情報」を永久制約にしない。

---

## Profile dimensions

### Components

`NONE | SPARSE | PARTIAL | SYSTEMATIC | UNDETERMINED | UNKNOWN`

見るもの:

- Component / Component Set
- instances
- variants/properties
- repeated local patterns
- library components

#### SYSTEMATIC

Figma側component systemを強く尊重する。

- variant/property取得
- Code Connectがあれば確認
- codebase既存componentとmapping
- duplicate raw componentを避ける

#### PARTIAL / SPARSE

存在するcomponentは利用するが、page全体がsystem化されていると仮定しない。

#### NONE

Figmaにcomponentが無くても、code側の自然なarchitecture/reuseは維持する。ただしFigmaに無いことを理由に巨大design systemを新設しない。

#### UNDETERMINED

Component/library情報を現在のtoolでは完全に取得できない等。

見えている範囲だけ利用し、見えない範囲を存在しないと扱わない。

---

### Variables

`NONE | SPARSE | PARTIAL | SYSTEMATIC | UNDETERMINED | UNKNOWN`

見るもの:

- color variables
- spacing/number variables
- typography-related variables
- modes
- aliases
- scopes

SYSTEMATIC/PARTIAL/SPARSEでは `docs/token-mapping.md` に従う。

NONEなら既存code token systemを優先し、Figma variable mappingを捏造しない。

UNDETERMINEDなら取得できたvalue/semanticだけを使い、alias/modeを勝手に確定しない。

---

### Auto Layout / Grid

Coverage:

`NONE | LOW | MEDIUM | HIGH | MIXED | UNDETERMINED | UNKNOWN`

Generation:

`NONE | LEGACY | UPDATED_2026 | MIXED | UNDETERMINED | UNKNOWN`

見るもの:

- horizontal/vertical flow
- Grid
- gap/padding
- fixed/hug/fill
- min/max
- wrap
- nested Auto Layout
- legacy/new generation混在

#### HIGH + UPDATED_2026

Flex/Grid等へlayout semanticsを比較的直接translateする候補。

#### MIXED / LEGACY

nodeごとに挙動を読む。古いworkaroundを全frameへ適用しない。

#### LOW / NONE

Auto Layoutが無いことを「absolute positioningをそのままcode化する理由」にしない。Visual intentとcode maintainabilityを見て自然なCSSへ翻訳する。

#### UNDETERMINED generation

現在のtoolから新旧世代を確実に判別できない場合。

見えているlayout semanticsそのものを優先し、generation固有workaroundは安易に適用しない。Figma更新時に再調査する。

---

### Semantic naming

`LOW | MEDIUM | HIGH | UNDETERMINED | UNKNOWN`

HIGHならSection discoveryのstrong signal。

LOWなら名前だけに依存せず:

- hierarchy
- screenshot
- text anchors
- component identity
- assets

を併用する。

---

### Code Connect

`NONE | PARTIAL | STRONG | UNDETERMINED | UNKNOWN`

STRONG/PARTIALは `docs/component-resolution.md` に従い、実mappingのcoverageとprop/variant対応を確認する。

NONEはblockerではない。Structured Figma context + codebase inspectionへfallbackする。

UNDETERMINEDは「無い」と扱わず、現在確認できた範囲だけ利用する。

---

### Annotations / dev intent

`NONE | PARTIAL | STRONG | UNDETERMINED | UNKNOWN`

存在する場合はinteraction/responsive/accessibility/state/implementation intentのevidenceとして使用する。

---

### Asset access

`NONE | PARTIAL | STRONG | UNDETERMINED | UNKNOWN`

見るもの:

- exact image source
- SVG/icon source
- download/export availability
- image crop/focal behavior

Exact assetを取得できるのにplaceholder/再生成へ置換しない。

---

## Strategy decisions

Profile取得後、Shared Contractの`figma_profile.strategy_decisions`へ、**観測結果が実装へどう効くか**を記録する。

Example:

```yaml
figma_profile:
  strategy_decisions:
    - "Variables systematic → existing token layerへsemantic mapping"
    - "Code Connect partial → mapped Button/Inputのみproduction component reuse"
    - "Auto Layout generation undetermined → node semanticsを優先しgeneration固有hackを避ける"
    - "Semantic naming low → section boundaryはmetadata + screenshot multi-signal"
```

Section workerはこの判断をやり直さない。

## What profile is NOT

### Quality scoreではない

Components/Variablesを使っていないFigmaを低品質と判定しない。目的は**実装方法を合わせること**。

### Permanent recommendationではない

Figma/MCP/model更新で読み取り能力も最適戦略も変わる。Significant run前にUpdate Preflightを行う。

### Code architectureの唯一のsourceではない

Target repositoryのexisting component/token/style systemも同時にsourceとして扱う。

## Freeze gate

Shared ContractをFROZENにする前に:

- `UNKNOWN`は解消する
- absentなら`NONE` + evidence
- current toolで確定不能なら`UNDETERMINED` + evidence + conservative strategy + retest trigger
- Components/Variablesが観測された場合はresolution tableを作る
- strategy decisionsを残す

**「未調査」「存在しない」「今は判別できない」を混同しない。**

## Research opportunities

- profile別の最適prompt/context
- Variables SYSTEMATIC/PARTIAL/NONE別のmapping効果
- Semantic naming LOW/HIGHでSection Discovery精度比較
- Auto Layout LEGACY/UPDATED/UNDETERMINEDでfailure差比較
- Code Connect coverage別rework
- UNDETERMINEDだった項目がtool update後にどれだけ解決したか

を継続的に検証する。
