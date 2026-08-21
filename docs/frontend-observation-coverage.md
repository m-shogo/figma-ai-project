# Frontend Observation Coverage

Status: ACTIVE for new Section Manifest schema v9+

目的は、Figma実装で「ルールを知らない」のではなく、**最初に観測した要素を実装途中で見落とす**失敗を減らすこと。

これは細かいCSSルール集でも、要素単位の巨大checklistでも、新しいVisual Diff engineでもない。既存のFigma evidence、Section Manifest、browser render、Playwright、Section → Boundary → Page QAを再利用し、作業記憶だけに頼らず観測内容を最後まで保持する。

## 1. Sectionごとに7分類だけ保持する

実装前に、そのSectionでFigmaに存在するものを次の大分類で記録する。

- `TEXT`
- `RASTER_MEDIA`
- `VECTOR_LOGO`
- `BACKGROUND`
- `DECORATION`
- `INTERACTION_STATE`
- `RESPONSIVE_VARIANT`

各分類のsource stateは既存のepistemic modelと同じ考え方で扱う。

- `PRESENT` — 観測できた
- `NONE` — 調査して存在しない
- `UNDETERMINED` — 調査したが現在のevidence/toolでは確定不能

分類は「どう実装するか」を決めない。`RASTER_MEDIA=PRESENT`だから必ず`img`、`DECORATION=PRESENT`だから必ずSVG、という意味ではない。実装mechanismはEffective Project Contract、Existing、Figma evidence、Reuse-Before-Buildに従う。

## 2. 実装前の観測をruntimeまで持ち越す

Section workerはsource observationを記録してから実装し、完成時に実browser renderをFigmaへ戻して確認する。

Mobile First案件のdefault acceptance orderは既存契約どおり:

```text
SP Section review
→ PC Section review
```

PC側のrepairがshared CSS/component/DOM/JS/asset/token/container等へ触れ、SPへ影響し得る場合は既存のSP PASSを保持しない。SPから再確認してからPCへ戻る。

## 3. PASSは「もう一度Section全体を見た」証拠

`runtime_review.sp/pc.status=PASS` はsource codeが存在するだけでは付けない。

少なくとも該当viewportの実browser renderをSection全体として再確認し、`evidence`へcapture/report等を残す。

特にsourceで `PRESENT` とした分類について、明らかな欠落が無いことを見る。例えば:

- 写真があるのにfallbackだけのまま
- logo/vectorが消えている
- 背景/大きな装飾が抜けている
- SPだけ存在する構成差をPC縮小で済ませている
- supplied stateがあるのに無視している

といった**大きな見落としを先に0にする**。

その後にSection geometry、typography、pixel/subpixel差分を詰める。

## 4. Known GapをPASSへ偽装しない

現在解消できない差分は `known_gaps` へ残す。

新しいschema v9では、`known_gaps` が残ったSectionをworker `COMPLETE` にできない。SP/PC reference nodeが存在するSectionは、そのviewportのruntime reviewが`PASS`になるまで`COMPLETE`にできない。

これは「何でも100% pixel perfectになるまで作業禁止」という意味ではない。Figma/Company/Project conflict、tool limitation、意図的exceptionがある場合は、Current Authority側で解決・承認してからcoverage stateを更新する。未解決を黙ってPASSにしないことが目的。

## 5. FinalはSectionだけで終わらない

Integrationでも同じ考えを使う。

```text
all Section coverage resolved
→ SP full-page review
→ PC full-page review
→ integration COMPLETE
```

schema v9の`integration.status=COMPLETE`では、full-page coverageが解決済みで、未解決gapが残っていないことを要求する。

Section単体で存在していても、integrationでbackground continuity、z-index、累積spacing、asset visibility等が壊れるため、Section PASSだけではFINALにしない。

## 6. これは詳細ルールを増やす仕組みではない

Observation Coverageで禁止するのは「見ていたのに最後まで確認せず忘れること」であって、次を一律禁止しない。

- absolute positioning
- fixed dimensions
- min/max dimensions
- SVG/raster/CSS decoration
- PC/SP separate asset
- shared/split markup

判断は既存Frontend Standardのintent/authorityに従う。

新しい失敗を見つけるたびに分類を増やさない。7分類で明らかな欠落を防ぎ、それでも捕まらない再発性の高い失敗だけをevidence付きで再検討する。

## 7. Backward compatibility

- historical Section Manifest schema v8以下: 既存evidenceとしてそのまま有効
- new schema v9+: Observation Coverage required

古いbenchmarkやfrozen runを後から書き換えて見かけ上PASSにしない。

## 8. 成功条件

この仕組みのKPIはfield数やcheck数ではない。

次のClean Replayで確認するのは:

- obvious missing media/decoration/state countが減るか
- First PassでSection全体の大きな欠落が減るか
- Humanが「ここ見てない」と指摘する回数が減るか
- 追加rule/repair CSSを増やさず改善できるか

改善が証明されなければ、項目を増殖させず簡素化・retireを検討する。
