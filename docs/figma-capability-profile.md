# Figma Capability Profile

目的は、Figmaの一般的なbest practiceを一律に押し付けず、**今回のreferenceが実際にComponents / Variables / Auto Layout / semantic naming / Code Connect等をどこまで使っているかを先に観測し、その成熟度に合わせて実装戦略を変える**こと。

## Core rule

```text
Inspect actual Figma
  ↓
Capability Profile
  ↓
Choose implementation strategy
  ↓
Shared Contract / Foundation
  ↓
Section workers
```

「FigmaではVariablesを使うべき」だから存在しないVariablesをAIが発明する、という流れにしない。

---

## Profile dimensions

### Components

`NONE | SPARSE | PARTIAL | SYSTEMATIC | UNKNOWN`

見るもの:

- Component / Component Set
- instances
- variants/properties
- repeated local patterns
- library components

#### SYSTEMATIC

Figma側のcomponent systemを強く尊重する。

- variant/propertyを取得
- Code Connectがあれば優先
- codebase既存componentとmapping
- raw duplicate componentを作らない

#### PARTIAL / SPARSE

存在するcomponentは再利用候補だが、page全体がcomponent system化されていると仮定しない。

#### NONE

Figmaにcomponentが無いことを理由に、codeも巨大1componentへしない。

Code側のarchitecture/reuse requirementに従う。ただし「Figmaに無いから」という理由だけで大規模design systemを新設しない。

---

### Variables

`NONE | SPARSE | PARTIAL | SYSTEMATIC | UNKNOWN`

見るもの:

- color variables
- spacing/number variables
- typography-related variables
- modes
- aliases
- scopes

#### SYSTEMATIC

- aliases/modesを可能な限り保持
- existing code tokensへsemantic mapping
- raw valueへ無条件flattenしない

#### PARTIAL / SPARSE

使われている箇所のみ意味を保持する。

足りない値をすべて新global tokenにしない。

#### NONE

Target codebaseに既存token systemがあればそちらを優先。

既存tokenにも一致しないone-off値はsection-local valueとして記録できる。

---

### Auto Layout / Grid

Coverage:

`NONE | LOW | MEDIUM | HIGH | MIXED | UNKNOWN`

Generation:

`NONE | LEGACY | UPDATED_2026 | MIXED | UNKNOWN`

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

nodeごとに挙動を読む。

古いworkaroundを全frameへ適用しない。

#### LOW / NONE

Auto Layoutが無いことを「absolute positioningをそのままcode化する理由」にしない。

Visual/reference intentとcode maintainabilityを両方見て最小の自然なCSS layoutへ翻訳する。

---

### Semantic naming

`LOW | MEDIUM | HIGH | UNKNOWN`

見るもの:

- Header/Hero/Footer等のrole names
- meaningful component/layer names
- `Frame 123`等のgeneric names比率

#### HIGH

Section discovery/context retrievalのstrong signalにできる。

#### LOW

名前だけに依存せず:

- hierarchy
- screenshot
- text anchors
- component identity
- assets

を併用する。

---

### Code Connect

`NONE | PARTIAL | STRONG | UNKNOWN`

#### STRONG

mappingされたproduction componentを第一候補にする。

Prop/variant mappingまで取得して再利用する。

#### PARTIAL

mapped componentだけ利用し、coverage外まで無理に同じ扱いにしない。

#### NONE

blockerではない。

Structured Figma context + existing codebase inspectionで実装する。

Code Connectを作ること自体が目的にならない。

---

### Annotations / dev intent

`NONE | PARTIAL | STRONG | UNKNOWN`

存在する場合:

- interaction
- responsive intent
- accessibility
- state
- implementation note

のevidenceとして使用する。

存在しない場合、勝手な仕様を補完しない。

---

### Asset access

`NONE | PARTIAL | STRONG | UNKNOWN`

見るもの:

- exact image source
- SVG/icon source
- download/export availability
- image crop/focal behavior

Exact assetが取得できるのにplaceholder/再生成へ置換しない。

---

## Strategy matrix

Profileを見たあと、Shared Contractへ`strategy_decisions`を残す。

Example:

```yaml
figma_profile:
  strategy_decisions:
    - "Figma Variables systematic → existing CSS token layerへsemantic mapping"
    - "Code Connect partial → mapped Button/Inputのみproduction component reuse"
    - "Auto Layout mixed → section nodeごとにgeneration/semantics確認"
    - "Semantic naming low → section boundaryはmetadata + screenshot multi-signal"
```

これによりSection workerが同じ判断をやり直さない。

---

## What profile is NOT

### Quality scoreではない

Components/Variablesを使っていないFigmaが「悪い」とは判定しない。

目的は**実装方法を合わせること**。

### Permanent recommendationではない

Figma/MCP/modelが更新されたら読み取り能力や最適戦略は変わる。

Significant run前にUpdate Preflightを行う。

### Code architectureの唯一のsourceではない

Target repositoryに既存component/token/style systemがある場合、Figma profileとcodebase architectureを両方見てShared Contractを決める。

---

## Freeze gate

Shared ContractをFROZENにする前に、少なくとも:

- Components level
- Variables level
- Auto Layout coverage/generation
- Semantic naming quality
- Code Connect level
- Annotations level
- Asset access level

を`UNKNOWN`から解消する。

存在しなければ`NONE`と記録する。

**「調べていない」と「使われていない」を区別する。**

---

## Research opportunities

実験データが貯まったら:

- profile別に最適prompt/contextを比較
- Variables SYSTEMATIC案件でtoken mapping効果を測定
- Semantic naming LOW/HIGHでSection Discovery精度比較
- Auto Layout LEGACY/UPDATEDでCSS translation failure差比較
- Code Connect coverage別のrework差比較

を行う。
