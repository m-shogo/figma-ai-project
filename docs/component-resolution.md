# Component Resolution

FigmaのComponentを見つけたら即新規componentを作るのではなく、**Figma側の意味と既存codebase側の実装を突き合わせ、section worker開始前にreuse方針を解決する**。

この文書はCode Connectの代替platformではない。Code Connect / Figma design-system search / Storybook / repo component registry等のupstream capabilityが利用可能なら先に使い、ここでは最終decisionとfallback evidenceだけを保持する。

## Goal

Sectionごとに同じButton/Card/Inputを別々に実装することを防ぐ。

```text
Figma component/instance
  + existing Code Connect mapping when available
  + Figma design-system search
  + existing code component / Storybook / registry
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
4. existing Code Connect map when available
5. Code Connect suggestions/context when mapping work is needed and plan supports it
6. Figma design-system/library search when available
7. existing target-repo component / Storybook / registry inventory
8. visual/semantic/API compatibility
9. actual reuse count across target sections

Do not skip Existing production search merely because Figma has no Component metadata.

## Code Connect availability boundary

Code Connect is conditional on Figma plan/seat/library support. When available, use upstream mapping rather than maintaining a parallel proprietary mapping engine.

When unavailable:

```text
Figma component identity
+ design-system/library search if available
+ repo / Storybook / registry search
→ this resolution table
```

Do not respond to Code Connect unavailability by building:

- framework-specific parser clones
- custom component browsing UI
- custom template language
- custom Figma-side mapping database

The fallback should remain small enough to retire if upstream becomes available.

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

- upstream / existing component searchを実施済み
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
| Code Connect unavailable | existing code candidate exists | unavailable | REUSE_EXISTING after manual evidence |

## Variant / prop mapping

Component reuseの失敗は「同じButtonを使ったか」だけではない。

記録:

- Figma variant/property
- production prop
- default behavior
- unavailable combination
- state mapping
- mapping source: Code Connect / registry / Storybook / manual repo evidence

Example:

```yaml
component_resolution:
  - id: button-primary
    figma_component: "Button"
    figma_node_id: "123:456"
    resolution: REUSE_EXISTING
    mapping_source: CODE_CONNECT
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
- Code Connectが使えないので同等platformを自作する
- section workerがshared componentをforkする
- Figma Componentを全てglobal abstractionへ昇格
- FigmaにComponentが無いからcode reuseもしない
- Storybook/component registryがあるのに別preview/component catalogを作る

## Section worker contract

Workerはresolution tableをread-onlyで使用する。

新しい共通componentが必要に見えたら:

`PROPOSE_SHARED_CHANGE`

として返す。

Coordinatorが承認した場合:

1. upstream/existing solution再確認
2. Shared Foundation更新
3. verify
4. Shared Contract revision/hash更新
5. affected sectionsだけ再base/re-run

## Learning

Track failures:

- COMPONENT_REUSE_MISS
- WRONG_COMPONENT
- COMPONENT_PROP_MISS
- CODE_CONNECT_MISS
- DUPLICATE_SHARED_PRIMITIVE
- UPSTREAM_COMPONENT_SEARCH_SKIPPED

同じresolution strategyが別section/referenceでも効いて初めてportable ruleへ昇格する。

External integration statusは `docs/frontend-external-integration-matrix.md` を参照する。