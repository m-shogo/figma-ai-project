# Translation Mode Playbook

`docs/figma-structure-profiling.md` でsectionごとに選んだmodeを、実装時にどう使うか定義する。

Modeは**情報源の優先順位**であり、別frameworkを選ぶ指定ではない。

全mode共通で:

- frozen Referenceがvisual source of truth
- Shared Contractがfonts/tokens/breakpoints/shared componentsのimplementation source of truth
- existing production architectureを壊さない
- section workerはallowed pathsだけ変更
- exact browser captureでVerify

を守る。

---

# STRUCTURE_FIRST

## Use when

- Components/Variantsが明確
- Auto Layout/Grid/sizingが十分
- Variables等のstructured evidenceが使える
- Figma内部構造がdesign intentを強く表す

## Information priority

```text
Shared Contract
→ structured Figma section context
→ Code Connect / production component mapping
→ exact assets
→ reference screenshot verification
```

## Implementation behavior

- Auto Layout intentをFlex/Gridへtranslate
- fixed/hug/fill/min/maxをCSS sizingへtranslate
- Component/Variantを既存code componentへmap
- Variable bindingをproject token/themeへmap
- semantic hierarchyを維持

## Do not

- Figma node treeを機械的にDOMへ1:1コピー
- layer countを一致させることを目的化
- structured evidenceがあるのに画像だけから推測
- Auto Layout内の意図的absolute childまで無理にFlex化

## Verify重点

- component/variant mapping
- token reuse
- nested layout
- sizing/wrap
- screenshot visual fidelity

---

# HYBRID

## Use when

Figmaの一部はstructuredだが、別の部分はweak/raw/legacy。

最も一般的なcurrent candidate。

## Information priority

```text
Shared Contract
→ trusted Figma structure only
→ existing codebase/design system
→ reference screenshot
→ selected raw Figma values/assets
```

## Implementation behavior

Signalごとに扱いを分ける。

例:

```text
Auto Layout      HIGH   → use
Components       MEDIUM → map carefully
Variables        LOW    → verify against code tokens
Semantic naming LOW    → do not rely on names
Assets           HIGH   → use exact assets
```

## Do not

- section全体をSTRUCTURE_FIRST扱い
- weak signalをstrong signalと同じ重みで使う
- raw Figma値を全部global tokenへ昇格

## Verify重点

- trusted structure translation
- weak signal由来のassumption
- project token/component mapping
- visual gaps between structured and reconstructed areas

---

# VISUAL_FIRST

## Use when

- imported/flat/legacy Figma
- Auto Layout/Components/Variablesが弱い
- generic layer hierarchy
- structured treeをそのままcodeへ写すと脆い

## Information priority

```text
Shared Contract
→ exact visual reference / geometry
→ content hierarchy
→ existing production components/layout conventions
→ exact Figma assets / selected values
→ weak Figma structure only as secondary evidence
```

## Implementation behavior

- semantic/native HTML/componentsを作る
- visual geometryをFlex/Grid/normal flowで再構築
- exact source assetsを使う
- browser screenshotで細かく比較
- PC/SP behaviorはShared Contract + reference evidenceから作る

## VISUAL_FIRST is NOT

```text
screenshotを1枚貼る
canvasへ全部描画
座標を全部absolute hardcode
```

ではない。

## Absolute positioning

意図的なart direction/overlapなら使える。

「Figmaがfreeformだったから」という理由だけでは使わない。

## Verify重点

- geometry
- typography/wrapping
- image crop
- layering
- intermediate/breakpoint robustness
- maintainable semantic structure

---

# CODEBASE_FIRST

## Use when

- mature production design systemがある
- Figma component structureが古い/弱い
- production componentがbehavior/accessibility/stateを既に持つ
- designをexisting props/themeで再現できる

## Information priority

```text
Reference visual/intent
→ Shared Contract
→ existing production design system/components
→ Code Connect if current/reliable
→ Figma structured evidence as supporting context
```

## Implementation behavior

- existing production componentを最優先
- Figma appearanceをprops/variants/themeで再現
- accessibility/behaviorをproduction implementationから継承
- Figma component名とcode component名が違ってもsemantic mappingを優先

## Do not

- visual差を無視して「既存componentだから正しい」とする
- weak Figma structureへ合わせるためproduction design systemをfork
- project componentをsection-local cloneする

## Verify重点

- visual fidelity against reference
- correct variant/prop mapping
- no duplicate production primitive
- behavior/accessibility preservation

---

# Mode conflicts

Advisory suggestionと人間/AI-confirmed modeが違う場合:

```text
confirmed STRUCTURE_FIRST
advisory HYBRID
```

をエラーにはしない。

ただし理由を残す。

例:

- MCPがVariables coverageを取得できなかっただけ
- production design system mappingをAI heuristicが知らない
- Figma updateで新しいstructured signalが使える

Mode selectorは現在のheuristicでありsource of truthではない。

---

# Mode change after first pass

Verifyで:

- STRUCTURE_FIRSTなのにFigma構造が実際は脆い
- VISUAL_FIRSTなのにstructured evidenceを無視していた
- CODEBASE_FIRSTなのに既存componentではvisual再現不能

と分かった場合、Mode自体を実験変数として変更できる。

ただし:

1. first-passを保存
2. Structure Profile revision
3. mode変更理由
4. clean baseline rerun

を残す。

同じrunの途中で理由なくmodeを切り替えない。

---

# Section example

同じpageでも:

```text
Header       CODEBASE_FIRST
MainVisual   HYBRID
Content01    STRUCTURE_FIRST
Content02    VISUAL_FIRST
Footer       CODEBASE_FIRST
```

になり得る。

それでも整合性はShared Contractが担保する。

共通:

- fonts
- tokens
- breakpoints
- container/gutter
- shared components

をsection modeごとに再定義しない。

---

# Research questions

今後実runで測る:

- profile-informed modeはFirst-passを改善するか
- mode選択を省いた共通translationよりReworkが減るか
- advisory heuristicと実績best modeの一致率
- Figma update/model updateでmode distributionが変わるか
- VISUAL_FIRSTでも画像→native code精度がどこまで上がるか

結果に応じてmode定義自体も変更できる。
