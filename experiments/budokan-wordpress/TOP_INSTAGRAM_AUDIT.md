# TOP 月刊「武道」編集部 — dependency / reuse audit

更新: 2026-08-29

## 結論

Figma上の「月刊『武道』編集部」TOPセクションは、刊行物/backnumberカードではなく **Instagram editorial feed** である。

- SP: `1360:9389` (`instagram`)
- PC: `1603:7173` (`instagram`)
- 表示内容: 見出し「月刊『武道』編集部」+ Instagramラベル + リード + 投稿サムネイル
- SPは4枚を2×2、PCは5枚を横1列で表示

したがって、刊行物/backnumberの一覧UIをmasterとしてTOPへ派生させるのは誤った依存関係になる。既存Footer SNSには同じ編集部表現があるが、FooterはリンクUIでありfeed layoutのmasterではない。

## Reuse-before-build 確認

Theme内には本feedと同じ情報構造/レイアウトを持つ既存template-partは確認できなかった。

再利用するもの:

- Themeの `top_*` / 短縮prefix命名
- `var(--clip-octagon)` と既存title/subtitle表現
- `var(--font-sansSerif-ja)` / `var(--font-serif-ja)` / `var(--font-sansSerif-en)`
- mobile-first + `@media screen and (min-width: 768px)`
- TOP Partnerで確立した「未確定CMS/APIを発明せず fallback data + filterで差し替える」方針

再利用しないもの:

- 刊行物/backnumberのcard DOM
- Footer SNS DOM
- Instagram API/pluginを仮定した取得処理

## Figma geometry

### SP `1360:9389`

- root: `375 × 683.75`
- padding: `64px 32px`
- section gap: `32px`
- heading: 22px / medium / tracking 0.05em
- Instagram: 14px + 10px octagon
- lead: 15px / line-height 1.8 / width 311px
- thumbnail: 2列×2行 / 1px gap
- Figma child metadata上のtile: `155.5 × 194.375`

### PC `1603:7173`

- root: `1380 × 571`
- padding: top 100px / right-left 110px / bottom 80px
- section gap: 40px
- header row: 1160px / bottom align
- heading: 24px serif
- thumbnail: 5枚横並び / 1px gap
- tile: `231 × 289`

SPとPCは同一content familyなので、同一DOMをSP 2×2 → PC 5列へCSS拡張するのが最小差分。

## WordPress authority / data contract

現時点でInstagram API、plugin、ACF feed contract、本番Instagram URLのauthorityはない。ここを推測して実装しない。

安全な実装:

- dedicated TOP template-part（`_top-instagram.php`）
- Figmaの5枚をTheme assetとして永続保存したfallback
- 将来の差し替え用に `nipponbudokan_top_instagram_items` filter
- 本番URLが与えられるまでは偽の `#` linkを必須化しない
- fifth itemはSP非表示、PCで表示

## Asset materialization follow-up

現行FigmaのSP/PC nodeを再取得し、5枚の内容と並びを再確認した。短命MCP URLをThemeへ保存する代わりに、同じrepository内の旧検証branch `agent/ref002-budokan-final-assets` に既に永続化されていた **現行Figma由来の231×289 exact crop** を再利用する。

- 01 blob: `a2fad85def5120c1911a59f7d10f76e482d4c397`
- 02 blob: `a65afa025059878f96dd1b820719c661e7283553`
- 03 blob: `23f604f55bdc112489db93caee22d2be4f5f2dc8`
- 04 blob: `27e42b845627e8634a68b67fab9bb9ea84736bd3`
- 05 blob: `a78b8f520ad38f2f54651c6aca88e55daac7e5f9`

PR #142自体や旧runtimeコードはmergeしない。画像blobだけを新しいTheme pathへ同一Git objectのままmaterializeするため、再encodeや一時URL依存を避けられる。

## Runtime QA / visual diff

Real WordPress + ACF PRO 6.8.9 + actual Theme + Playwright Chromiumで、PR #227をSP/PCともに実行した。最終runtime evidenceはActions run `33194650576` / artifact `9695254338`。

### SP

- HTTP 200 / page error 0 / horizontal overflowなし
- section: `375 × 682.5`
- inner: `x=32 / width=311`
- visible tiles: 4 / broken visible images: 0
- thumbnails: `311 × 388.5`
- first tile: `155 × 193.75`
- Figma screenshot `1360:9389` とruntime captureを目視比較し、見出し・lead・2×2画像・余白/配列に有意な差は確認できなかった

Figma rootは約684px、runtimeは682.5pxで約1.25px差。Figma child metadataの `155.5px` と、root `375 - 64 = 311px` / 1px gapから数学的に成立する `(311 - 1) / 2 = 155px` が一致しないため、root paddingと実captureを優先し、1px未満のmagic compensationは入れない。

### PC

- HTTP 200 / page error 0 / horizontal overflowなし
- section: `1380 × 571`（Figma exact）
- inner: `x=110 / width=1160`（Figma exact）
- head: `1160 × 62`
- thumbnails: `1160 × 289`（Figma exact）
- tile: `231 × 289`（Figma exact）
- visible tiles: 5 / broken visible images: 0
- Figma screenshot `1603:7173` とruntime captureを目視比較し、5枚の順序/crop、見出し、Instagramラベル、lead、主要geometryに有意な差は確認できなかった

runtime section captureの最上端に見える赤1px線は、本section由来ではなく直前のTOP Partner PC `border-bottom`。ページ連結時の既存正本境界なのでInstagram側では消さない。

## 今回見つかった失敗と学び

### 1. SP用 `nth-child` 非表示がPCへ残った

最初のPC CSSでは `.ti_thumbnail { display:block; }` を足したが、SPの `.ti_thumbnail:nth-child(n + 5) { display:none; }` の方がspecificityが高く、5枚目がPCでも非表示のままだった。

修正はPCで同じselectorを明示的に解除した。これは既存learnigの「mobile-firstではSP ruleがPCへ残る前提で `display / nth-child` も監査する」を再度裏付けた。新しい上位標準にはまだ追加しない。

### 2. QAが非表示lazy imageをbroken扱いした

最初のruntime testはDOM上の全imgを `naturalWidth` で検査したため、SPで仕様通り非表示の5枚目がlazy-loadされていないだけなのにbroken imageと誤判定した。

原因は「DOMに存在する画像」と「現在viewportで表示契約を持つ画像」をQAで分けていなかったこと。修正後はvisible tile配下だけload/brokenをassertし、総画像数5件は別assertにした。製品bugとtest harness bugを分離する既存ルールの具体例として保持する。

### 3. 同一repoにexact Figma blobがある場合は再encodeしない

Figma MCP asset URLは短命。一方、同一repoの隔離branchに現行Figma由来のexact raster blobが既に存在したため、Git objectをそのままTheme pathへ再利用できた。byte fidelity/provenanceを維持しつつ旧PRのruntime実装は持ち込まずに済んだ。

これは今回有効だったが、別sectionでも繰り返し確認できるまではTheme全体の絶対標準へ昇格しない。

## Gate

section完了条件:

1. Figmaの5枚を一時URLではなくThemeへ永続保存 — PASS
2. SP Figma → SP implementation → real WordPress runtime QA — PASS
3. PC extension → PC runtime QA — PASS
4. authored 375 / 1380でoverflow・broken image・section geometry確認 — PASS
5. visual diff / fix — PASS
6. PR / CI / squash merge — merge前最終gate

`parts.php` と form/Formidableは対象外のまま。
