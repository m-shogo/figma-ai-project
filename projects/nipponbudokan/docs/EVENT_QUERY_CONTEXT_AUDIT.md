# Budokan Event Query Context Audit

更新: 2026-08-30

## 対象

通常固定ページやTOP派生から既存 `customPostList` ACF block を使って `event` カードを再利用する際の WordPress query ownership を、Figma / Theme / WordPress 全体依存から再確認した。

## 依存再確認

- Figma PC には Event archive master `1619:9554` と Event detail `1632:10382` が存在する。
- 現行SP page全体を再検索したが、PC Event archive/detailに対応すると断定できる専用SP counterpartは見つからなかった。したがってEvent archive/detailの新規visual実装はこの変更では行わない。
- News archiveは既に SP `1399:14225` / PC `413:2191` のmasterが実装・runtime QA済みなので再実装しない。
- ThemeのEvent一覧共有ownerは `acf/blocks/customPostList.php` → `template-parts/_list-card.php` → `_list-card_article.php`。
- `CURRENT_AUTHORITY.md` は News / Events をsample dataで進めることを許可しているため、既存Event card data ownershipの不具合修正はHuman判断待ちではない。

## 発見した不具合

Newsで修正済みだったquery-context leakと同じ形がEvent card側にも残っていた。

`customPostList.php` はEvent用のsecondary `WP_Query`を作り `$wp_query` を一時差し替えて `_list-card.php` を呼ぶ。しかし `_list-card.php` は `is_front_page() || is_page()` の分岐でglobal `$posts`を直接foreachしていた。

固定ページのglobal `$posts`はホストPage自身を所有するため、secondary Event queryの結果ではなくPage query stateをカードrendererへ流す可能性がある。`$wp_query` の差し替えだけではglobal `$posts`の所有権は移らない。

## 修正

- Event branchでも `customPostList.php` から `_list-card.php` へ `$query->posts` をtemplate argsで明示的に渡す。
- `_list-card.php` は明示 `posts` がある場合だけそれを使い、既存front/page fallbackとしてglobal `$posts` は保持する。
- archive側のWordPress Loop、pagination、markup、CSS、ACF field contractは変更しない。
- `parts.php` / Form / Formidable は変更しない。

## QA

temporary GitHub Actionsで次を実行する。

1. 対象PHP 2ファイルを `php -l`。
2. 実 `customPostList.php` をEvent sample query stubで実行し、`_list-card` argsへEvent Alpha / Event Betaが明示されることを確認。
3. ホスト固定ページglobal `$posts = [Host Page]` を維持したまま、実 `_list-card.php` を明示Event posts付きで実行。
4. 描画対象が Event Alpha / Event Beta のみで、Host Pageが混入しないことを確認。

CSS / DOM / responsive geometryは変更しないため、SP/PC visual diffの対象はない。既存Event card visual masterを変更せずdata ownershipだけを閉じる。

## 学びと昇格

このquery-context leakはNews rendererに続いてEvent card rendererでも再現した。単発ではなく2つの共有rendererで同じ原因が確認できたため、次のルールをTheme project standardへ昇格する。

> secondary `WP_Query` からshared rendererを呼ぶ場合、rendererが必要なpostsはtemplate args等で明示的に渡す。`$wp_query` の差し替えだけで `$posts` / `$post` ownershipが移ると仮定しない。

このルールはBudokan Theme内の共有rendererに限定して適用し、Company-wide policyには自動昇格しない。
