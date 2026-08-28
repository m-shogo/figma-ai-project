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
- tile: `155.5 × 194.375`

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

安全な実装案:

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

## 今回見つかった実装上の注意

Figma MCPが返す画像URLは短命なのでThemeからhotlinkしない。さらに、同一repositoryの既存Git objectに正本assetがある場合は、ネットワーク経由で再downloadするよりblob identityを再利用した方がbyte fidelityとprovenanceを保ちやすい。

また、既存TOP PartnerのRuntimeで `.global_contents > section` の追加padding競合が実証されているため、本sectionでは `.global_contents > .top_instagram-01` がSP/PCのsection paddingを明示的に所有する。global側へmagic compensationは入れない。

## Gate

section完了条件:

1. Figmaの5枚を一時URLではなくThemeへ永続保存
2. SP Figma → SP implementation → real WordPress runtime QA
3. PC extension → PC runtime QA
4. authored 375 / 1380でoverflow・broken image・section geometry確認
5. visual diff / fix
6. PR / CI / squash merge

`parts.php` と form/Formidableは対象外のまま。
