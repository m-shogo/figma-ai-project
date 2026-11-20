# Budokan Event Detail Media Ownership Audit

更新: 2026-09-02

## 対象

共有 `single.php` が WordPress Featured Image をどの detail family に自動出力するかを、current Figma と実 Theme の archive/detail ownership から再確認した。

Current Figma authority:

- file: `fKYDn9ikpJk1nW7IWFtaUx`
- News detail PC: `1235:6361`
- Event archive PC: `1619:9554`
- Event detail PC: `1632:10382`

Current dedicated Event detail SP full-page counterpart は未確定のため、SP固有の新規visual contractは作らない。

## 発見

`single.php` は post type に関係なく Featured Image が存在すれば `.single_featured` として detail body 先頭へ自動出力していた。

しかし current Figma では役割が分かれている。

### News

News detail `1235:6361` は title/date/category の後に 800×534 の lead image と caption を明示している。通常投稿の Featured Image を detail lead media として再利用する現在の Theme contract は Figma と一致する。

### Event

Event archive `1619:9554` は event card に thumbnail/image を持つ。一方 Event detail `1632:10382` は title/date/category の後、本文 → table → CTA の順で、archive-card thumbnail を detail lead image として自動挿入する構成ではない。

つまり同じ WordPress Featured Image でも:

- News: archive/list media + detail lead media
- Event: archive card media。detail media は editor content が所有

という family ごとの責務差がある。

## 修正

- `single.php` の自動 `.single_featured` 出力を通常投稿 `post` に限定する。
- Event の thumbnail 自体は削除しない。`_list-card_article.php` が archive card image として引き続き利用する。
- Event detail 本文内に編集者が画像を置くことは妨げない。Gutenberg `the_content()` が detail media owner のまま。
- 新しい ACF field / CPT / template / page-specific CSS は作らない。
- Form / Formidable / `parts.php` / Slider / Calendar / Search は変更しない。

## Runtime QA

既存 `Budokan News Single Runtime` を拡張し、同じ実attachmentを News と Event の両方へ Featured Image として設定する。

検証:

1. News single は `.single_featured` を出力する。
2. Event single は同じ attachment を持っていても `.single_featured` を出力しない。
3. Event single は HTTP 200、shared title/pager/back-link を維持する。
4. Event back-link は既存通り `get_post_type_archive_link('event')` のWordPress-owned URLを使う。
5. 既存 News SP/PC pager/breadcrumb/type browser QAを維持する。

これにより「Eventで画像が無いfixtureだから偶然一致した」ではなく、thumbnailが実際に存在する状態で detail leakage を防ぐ。

## 学び

同じCMS fieldを複数surfaceで使っていても、表示責務まで同一とは限らない。

> source field を共有することと、presentation surface を共有することを分ける。list/card用途で必要な Featured Image を、detail側へ自動注入してよいとは推論しない。detail family の current authority と editor ownershipを確認する。

現時点では Budokan 1 project の evidence なので `PROJECT_ONLY` として保持し、別referenceの結果なしに cross-project rule へ自動昇格しない。
