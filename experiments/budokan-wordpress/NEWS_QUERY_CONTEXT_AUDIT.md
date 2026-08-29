# Budokan News Query Context Audit

更新: 2026-08-30

## 対象

研修センター固定ページ内の「お知らせ」表示を、Figma / Theme / WordPress のmaster/derivative関係から再確認した。

## Authority

- Figma SP `1468:6595` の「お知らせ」記事は、ページ専用カードではなく共有 `post_sp` instance。
- Theme側には既存共有ownerとして `module_newsList-01.css` と `template-parts/_list-news.php` がある。
- WordPress側には既存ACF block `acf/blocks/customPostList.php` があり、投稿タイプ・taxonomy・件数を `WP_Query` で取得して共有News rendererへ渡す契約になっている。
- したがって研修センター専用News component / CSS / queryを新設しない。既存masterを再利用する。

## 発見した不具合

`customPostList.php` は独自 `WP_Query` を作成していたが、固定ページ上で `_list-news.php` を呼ぶと、renderer側はglobal `$posts` を `foreach` していた。

固定ページのglobal `$posts` はページ自身を表すため、ACF blockのquery結果ではなくページ側のquery stateを誤って描画する可能性があった。`$wp_query` の差し替えだけでは、global `$posts` の所有権は変わらない。

## 修正

- `customPostList.php` から `_list-news.php` へ `$query->posts` をtemplate argsで明示的に渡す。
- `_list-news.php` は明示postsがある場合だけそれを使用し、既存のfront/page fallbackとしてglobal `$posts` は残す。
- archive/home側のLoop、pagination、event block、ACF field contract、markup/CSSは変更しない。

## QA

一時GitHub Actions上で以下を実行した。

1. 対象2 PHPファイルの `php -l`。
2. page-level global `$posts` に「Training Center Page」を置く。
3. custom `WP_Query` resultに「News Alpha / News Beta」を置く。
4. 実 `customPostList.php` を実行し、共有News rendererへ `[101, 102]` が明示postsとして渡ることを確認。
5. 実 `_list-news.php` をpage contextで実行し、News Alpha / News Betaが描画され、Training Center Pageが混入しないことを確認。

初回QA harnessはtest stubを `final class` にしたまま継承して失敗した。製品コードの失敗ではなくtest harness errorと分類し、stubを修正した再実行はGREEN。

CSS / DOM構造 / responsive ruleは変更していないため、SP/PCのvisual geometryは既存News masterのまま。今回の差分はdata ownershipだけに限定した。

## 再利用可能な学び

**Shared rendererを別query contextから呼ぶ場合、query resultの所有権をglobal stateへ暗黙依存させない。**

- ACF blockやsecondary `WP_Query` から共有rendererへ渡すdataは、可能ならtemplate args等で明示する。
- `$wp_query` を差し替えただけで `$posts` / `$post` まで期待通りになると仮定しない。
- fixed Page / front page / archiveで同じrendererを再利用する場合、それぞれのWordPress query globalsを個別に確認する。
- test harness failureと製品failureは分離する。

この学びは現時点ではBudokan project-localに保持する。複数componentで同じglobal-state leakが再現した場合のみ `THEME_RULES.md` への昇格を検討する。
