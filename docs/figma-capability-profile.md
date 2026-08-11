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

同様に、**過去のFigmaの制約を現在の制約として固定しない**。Communityの不満やworkaroundはfailure-mode探索には有効だが、current capabilityの判定は現在のofficial docs / release evidence / actual node inspectionを優先する。

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

## Generation-aware evidence

Figmaの機能は世代ごとに大きく変わる。特にAuto Layout / Grid / Variables / Dev Mode / MCPは、数年前の「できない」「CSSと違う」が現在は解消・縮小されている場合がある。

### Evidence precedence

Current capability判定は原則として次の順序で扱う。

1. actual target node / actual visible referenceの観測
2. current official Figma documentation / current Plugin API
3. official release/update evidence
4. current community report
5. historical community complaint/workaround

Historical complaintがcurrent official behaviorと衝突する場合、historical complaintは**legacy migration evidence**として残してもよいが、default implementation ruleにはしない。

### Do not infer generation from file age

古いfileに新しいnodeが追加されることも、新しいfileにlegacy Auto Layout frameが複製されることもある。

そのため:

- file created dateだけで`LEGACY`/`UPDATED_2026`を決めない
- page単位だけでなく必要ならnode/section単位でgenerationを見る
- mixed evidenceなら`MIXED`
- toolで世代判別できなければ`UNDETERMINED`
- generation固有hackはevidenceなしで適用しない

### Known capability evolution used by this project

これは永久なfeature tableではなく、Update Radarで再検証するための現在の基準。

- 2021-2022に多かったAuto Layoutのwrap/min-max不足workaroundはcurrent defaultとして持ち込まない
- 2023のAuto Layout v5以降はmin/max・wrap・HUG/FILL・text truncation等の観測可能性が増えている
- 2024以降はtypography-related variable bindingsも観測対象にする
- 2025導入直後のGrid betaの不満は、現在のGrid capabilityを再確認せず適用しない
- 2026のupdated Auto LayoutはCSS Flexboxとの対応が改善している一方、legacy layoutと共存期間があるためgenerationを明示する
- MCP / Agentは急速に変化しているので、現在のtool limitationをFigmaそのものの永久制約にしない

Detailed dated evidence: `research/figma-web-friction/2026-08-11.yaml`

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

Responsive modeを使うreferenceでは、**base valueではなく実際にvisible rootへ適用されたeffective mode**を確認する。UI上のstyle名/valueだけを見てDesktop/Mobile値を決めない。

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
- stroke inclusion / box model behavior
- legacy/new generation混在

#### HIGH + UPDATED_2026

Flex/Grid等へlayout semanticsを比較的直接translateする候補。

ただしFigma値をCSSへ機械コピーするのではなく、Web側のintrinsic sizing / min-content / max-content / percentage / container behaviorを使った方が同じintentを安全に保てる場合はそちらを使う。

#### MIXED / LEGACY

nodeごとに挙動を読む。古いworkaroundを全frameへ適用しない。

特にpadding・stroke・fill sizing・auto gapはgeneration差の影響を受けるため、見た目が同じでも同一semanticsと決めつけない。

#### LOW / NONE

Auto Layoutが無いことを「absolute positioningをそのままcode化する理由」にしない。Visual intentとcode maintainabilityを見て自然なCSSへ翻訳する。

Canvas上のabsolute positionは**composition evidence**であり、DOMをabsoluteで固定する命令ではない。

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

Code Connectが存在しても、全variant/state/propが正しくmappingされているとは仮定しない。Actual component behaviorとcodebaseを確認する。

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
- Mask/Group/composite participation
- browser-rendered export fidelity

Exact assetを取得できるのにplaceholder/再生成へ置換しない。

SVGは「Figmaからexportできた」だけでbrowser authorityにしない。Mask、angular gradient、complex stroke/effect等はexport/runtimeで差が出る可能性があるため、必要ならbrowser decode/renderとfinal visible-group evidenceで検証する。

---

## Figma → Web translation friction

Figmaはstatic design frame、Webはfont/content/viewport/input capabilityが変化するruntime。**一致させる対象と、Webとして自然に翻訳する対象を分ける。**

### Typography

Hard evidence:

- font family/weight/sizeのdesign intent
- line-height / paragraph spacingのrhythm
- alignment / emphasis / hierarchy
- explicit art-directed line break

Runtime-tolerant:

- unavailable fallback fontによる数文字のwrap差
- platform anti-aliasing差
- font metrics / variable font axis由来の微小なglyph幅差

Rules:

- Figma text bounding boxそのものをWebのvisible glyph boxとみなさない
- line-heightが作る上下のleadingを周辺gapと二重計上しない
- `Auto` line-heightはfont-dependentなのでproduction CSS値が存在する場合はそのcontractを優先する
- fallback font差を隠すためだけに`nowrap`、negative margin、tracking distortion、font-size縮小、clipを入れない
- intentional truncation/one-line UIは別。仕様として確認できた場合のみそのsemanticsを実装する

### Responsive layout

- PC/SP frameはsupplied endpoint evidenceであり、production breakpointの証明ではない
- endpoint間は自然なWeb layoutとして連続する必要がある
- Figmaの固定pxが「常にfixed」の意味か、「そのframeでの結果値」かを区別する
- Figmaがpercentage constraintを表現できなくても、Web側でpercentage/clamp()/intrinsic sizingがintentに合うなら使用できる
- page-level horizontal overflowやreadable content clippingはpixel fidelityより優先して失敗扱い

### Spacing / box model

- gap/paddingとtext line box由来のleadingを混同しない
- outside/center strokeのlayout participationはAuto Layout generationを確認する
- shadow/effectのvisual boundsとCSS layout boundsを混同しない
- empty spacer frameをそのままDOM spacerとして再現しない。gap/padding/margin等のlayout primitiveへ翻訳する

### Assets

- exact supplied image/iconがあるのにsimilar assetへ置換しない
- image crop/focal pointはsource identityと別のevidenceとして扱う
- multiple IMAGE fills + mask/groupが一つのvisible bitmapを作る場合はH11と同様にfinal visible resultをVisual QA authorityにできる
- production CMS/media ownershipはVisual QA exportとは分離する

### Components / semantics / interaction

- Figma Component = 必ずReact/Vue/PHP component、ではない
- Figma Group/Frame = 必ず`div`、ではない
- visual button = interaction semanticsの証明、ではない
- static state = hover/click/slider/accordion behaviorの証明、ではない
- DOM semantics / accessibility / keyboard / touch / reduced-motionはWeb runtime contractとして別途解決する

### AI / MCP

- MCPはstructured design contextでありproduction-ready code generatorそのものではない
- agentが元画像を別画像へ差し替える、iconを類似glyphへ変える、gap代わりにempty frameを足す等はfidelity failure
- AI生成結果は「似ている」ではなくactual asset/component/token/layout intentを再利用できているか確認する

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
    - "Legacy Grid complaint conflicts with current capability → current node/docsを再観測しold workaroundを不採用"
    - "Semantic naming low → section boundaryはmetadata + screenshot multi-signal"
```

Section workerはこの判断をやり直さない。

## What profile is NOT

### Quality scoreではない

Components/Variablesを使っていないFigmaを低品質と判定しない。目的は**実装方法を合わせること**。

### Permanent recommendationではない

Figma/MCP/model更新で読み取り能力も最適戦略も変わる。Significant run前にUpdate Preflightを行う。

Historical forum complaintを永久制約として保存しない。解消済みなら`RESOLVED_BY_PLATFORM`としてresearch evidenceへ残し、default workaroundから外す。

### Code architectureの唯一のsourceではない

Target repositoryのexisting component/token/style systemも同時にsourceとして扱う。

## Freeze gate

Shared ContractをFROZENにする前に:

- `UNKNOWN`は解消する
- absentなら`NONE` + evidence
- current toolで確定不能なら`UNDETERMINED` + evidence + conservative strategy + retest trigger
- Components/Variablesが観測された場合はresolution tableを作る
- generation-sensitive featureはcurrent evidenceを確認する
- old workaroundを使う場合は「current capabilityでも必要」なevidenceを残す
- strategy decisionsを残す

**「未調査」「存在しない」「今は判別できない」「昔は存在しなかった」を混同しない。**

## Research opportunities

- profile別の最適prompt/context
- Variables SYSTEMATIC/PARTIAL/NONE別のmapping効果
- Semantic naming LOW/HIGHでSection Discovery精度比較
- Auto Layout LEGACY/UPDATED/UNDETERMINEDでfailure差比較
- historical complaintのRESOLVED/TRANSITIONAL/CURRENT分類精度
- line-height / visible glyph spacing / surrounding gapのVisual QA手法
- Grid release世代別のtranslation failure比較
- exact asset preservation率とAI substitution failure
- Code Connect coverage別rework
- UNDETERMINEDだった項目がtool update後にどれだけ解決したか

を継続的に検証する。
