# Component Resolution

FigmaのComponentを見つけたら即新規componentを作るのではなく、**Figma側の意味と既存codebase側の実装を突き合わせ、section worker開始前にreuse方針を解決する**。

## Goal

Sectionごとに同じButton/Card/Inputを別々に実装することを防ぐ。

```text
Figma component/instance
  + Code Connect mapping
  + existing code component
  + variant/prop semantics
  ↓
Resolution
  ↓
Shared Contract
  ↓
all section workers use same decision
```

## Inspect order

1. Figma component / component set / instance identity
2. variants / component properties
3. library origin when observable
4. Code Connect mapping if available
5. existing target-repo component inventory
6. visual/semantic/API compatibility
7. actual reuse count across target sections

## Resolution states

### `REUSE_EXISTING`

既存code componentがFigmaの意図を十分表現できる。

Prefer this when:

- semantic role一致
- required states/variantsを表現可能
- design tokens/style system一致
- accessibility/API convention一致

### `REUSE_CODE_CONNECT`

Code Connect mappingがあり、実際のproduction componentへの対応が確認できた。

Code Connectがあるだけで盲目的に採用せず:

- mapping対象component
- prop/variant対応
- coverage
- current code path

を確認する。

### `EXTEND_EXISTING`

既存componentがほぼ対応するが、referenceに必要なvariant/propertyだけ不足。

Section workerが勝手に拡張せず、Shared Foundation側で調整する。

### `CREATE_SHARED`

複数sectionで再利用され、既存componentでは表現できないため新しいshared componentが妥当。

Evidence:

- multiple section consumers
- same semantic role
- stable shared API

が必要。

### `IMPLEMENT_SECTION_LOCAL`

reference上はcomponent的に見えても、今回の1section固有でshared abstractionにする価値が薄い。

Figma Componentだから必ずglobal code componentにする、とはしない。

### `UNRESOLVED`

情報不足または複数の合理的mappingがある。

Production parallel workerへ渡す前に追加調査する。

## Decision matrix

| Figma | Codebase | Code Connect | Typical resolution |
|---|---|---|---|
| systematic component | exact existing component | yes/no | REUSE_EXISTING / REUSE_CODE_CONNECT |
| systematic component | near match | optional | EXTEND_EXISTING |
| repeated across sections | no match | none | CREATE_SHARED candidate |
| one-off local pattern | no match | none | IMPLEMENT_SECTION_LOCAL |
| Figma components NONE | existing code system exists | n/a | existing code architecture優先 |

## Variant / prop mapping

Component reuseの失敗は「同じButtonを使ったか」だけではない。

記録:

- Figma variant/property
- production prop
- default behavior
- unavailable combination
- state mapping

Example:

```yaml
component_resolution:
  - id: button-primary
    figma_component: "Button"
    figma_node_id: "123:456"
    resolution: REUSE_EXISTING
    code_path: src/components/Button
    prop_mapping:
      style=Primary: variant=primary
      size=Large: size=lg
    evidence:
      - "same semantic role"
      - "existing component supports required states"
```

## Anti-patterns

- layer名だけで似たcomponentを選ぶ
- visual一致だけでsemantic/API mismatchを無視
- Code Connect mappingが古いのに無条件利用
- section workerがshared componentをforkする
- Figma Componentを全てglobal abstractionへ昇格
- FigmaにComponentが無いからcode reuseもしない

## Section worker contract

Workerはresolution tableをread-onlyで使用する。

新しい共通componentが必要に見えたら:

`PROPOSE_SHARED_CHANGE`

として返す。

Coordinatorが承認した場合:

1. Shared Foundation更新
2. verify
3. Shared Contract revision/hash更新
4. affected sectionsだけ再base/re-run

## Learning

Track failures:

- COMPONENT_REUSE_MISS
- WRONG_COMPONENT
- COMPONENT_PROP_MISS
- CODE_CONNECT_MISS
- DUPLICATE_SHARED_PRIMITIVE

同じresolution strategyが別section/referenceでも効いて初めてportable ruleへ昇格する。
