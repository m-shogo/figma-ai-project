# Token / Variable Mapping

Figma Variablesを見つけたらraw値へflattenせず、逆にVariablesが無いからといって巨大token systemを発明もしない。**Figmaの実態 + 会社/design system + 既存codebase**からmappingを決める。

## Resolution order

1. company / existing product token contract
2. existing codebase token/theme API
3. Figma Variables / modes / aliases
4. repeated values with clear shared semantics
5. genuine one-off values

## Resolution states

### `REUSE_EXISTING_TOKEN`

Figma variable/valueが既存code tokenと意味的に一致。

### `MAP_VARIABLE_TO_EXISTING`

Figma variable名は異なるが、semantic roleを確認して既存tokenへmap。

名前やhex一致だけで決めない。

### `CREATE_SHARED_TOKEN`

複数section/共有componentで繰り返し必要かつ、既存tokenに対応が無い場合。

Shared Foundationで作る。

### `KEEP_SECTION_LOCAL`

one-off値でglobal token化が不自然。

### `PRESERVE_MODE_MAPPING`

Figma variable modesが案件で意味を持つ場合、code側theme/modeとの対応を明示する。

### `UNRESOLVED`

alias/mode/semantic roleが不明。追加調査してからfreeze。

## Values are not semantics

同じ`#FFFFFF`でも:

- surface/default
- text/inverse
- border/subtle

は別意味の可能性がある。

逆に値が少し違っても会社の既存tokenがsource of truthなら、design/referenceとのconflictとして扱い、AIが独断でtokenを増やさない。

## Alias preservation

Figma aliasがある場合:

```text
semantic variable
→ primitive variable
```

を可能な範囲で記録する。

Codebaseに同様のsemantic layerがあれば対応させる。

単に最終値だけ抽出すると、将来のmode/theme変更や意味の追跡が壊れる。

## Modes

確認する:

- Light / Dark
- brand/theme modes
- device/viewport系modeが実在するか
- local collection mode

PC/SPだからといってmodeがあると仮定しない。

## Spacing

Figmaでspacing VariablesがSYSTEMATICなら優先的にmapping。

無い場合:

- repeated shared values → candidate
- one-off visual values → local可

すべての数値を`--space-*`へ無理に変換しない。

## Typography

font family/weight/size/line-height/letter-spacingを別々に見る。

既存codebaseがtypography roleを持つ場合:

```text
Figma heading role
→ project heading token/style
```

を優先。

CJKではfont availability/fallbackでline-wrapが変わるため、mappingだけでなく実browser captureも必要。

## Breakpoints are separate

Breakpointは通常token mappingと混ぜない。

`docs/responsive-breakpoint-policy.md` のShared Contractがsource of truth。

CSS Custom Propertiesへ無理にmedia-query thresholdを入れない。

## Suggested record

```yaml
tokens:
  mappings:
    - id: color-text-primary
      figma_variable: "Text/Primary"
      figma_collection: "Semantic"
      resolution: MAP_VARIABLE_TO_EXISTING
      code_token: "--color-text-primary"
      modes:
        Default: default
      evidence:
        - "semantic role matches existing token"
```

## Consistency gate

Section workerは:

- resolved shared mappingをread-onlyで使う
- existing mappingがあるのにraw duplicateを追加しない
- shared token追加が必要なら`PROPOSE_SHARED_CHANGE`
- genuine one-off値はlocalとして記録可能

## Failure signals

- TOKEN_REUSE_MISS
- wrong semantic mapping
- alias flattening regression
- mode mismatch
- repeated local value proliferation
- shared token created for a one-off design value

## Research

比較候補:

- raw extracted values vs semantic mapping
- alias-preserving vs flattened context
- Variables SYSTEMATIC/PARTIAL/NONE別の最適context
- codebase token inventoryを先に読む/読まない差

結果が出るまでは1方式を永久標準にしない。
