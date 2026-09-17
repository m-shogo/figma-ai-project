# 刊行物 CPT 実装進捗 — pause checkpoint

更新: 2026-09-17（書写実装 + 表紙 hover 切り出し後）

## 正本

- GitHub: `m-shogo/figma-ai-project` / branch `so`（この案件の HEAD）
- Figma: `jqYoPtusYfTeDqRegMCsx3` のみ。旧 file は見ない
- 契約: `CURRENT_AUTHORITY.md` / `FOUR_FAMILIES.md` / `PUBLICATIONS_CPT_ARCHITECTURE.md`
- 未決事項: `PENDING_QUESTIONS.md`

## 現在地

### イベント

- `/event/` 一覧: `archive-event.php` / `taxonomy-event_cat.php`
- `/event/{id}/` 詳細: `single-event.php`
- 既存完了面として回帰させない

### 月刊「武道」

- `/budo-book/{slug}/`: `single-budo-book.php` → `_budo-detail.php`
- `/publications/budo/latest/`: 同じ detail part
- `/publications/budo/back/`: 全件。アイキャッチ + `budo_backcontent` + 詳細はこちら
- 表紙リンクは `.publication_budo-coverLink`。関連5冊も同じ
- 残り: ローカル WP で PC/SP Visual を人が見る

### 月刊書写書道

- `/shodou-book/{slug}/`: `single-shodou-book.php` → `_shodou-detail.php`
- `/publications/shodo/latest/`: 同じ part
- `/publications/shodo/back/`: 全件。アイキャッチ + `rensailist` PDF + 詳細はこちら
- Figma 専用 frame なし → 武道 chrome。ACF は `group_nbk_gekkan_shodou` のみ
- ご注文 CTA: `/publications/shodo/form-shodo/`
- 総索引・おすすめ wysiwyg は出さない
- 残り: `#1137` と back の Visual を人が見る

### 単行本

- `/tankoubon/{slug}/` 詳細: コード実装済み
- `/publications/budo/books/` 一覧: **未着手**（次の大きな実装）
  - Figma `1656:5309`
  - 固定 page + tax `book`

## 表紙 hover（Human 2026-09-17）

Parts の gallery / media-text / zoom に表紙 `<a>` を載せない。

- class: `.publication_budo-coverLink`
- 箱（`<a>`）は `overflow: hidden` + 固定 aspect-ratio。ホバーで高さを動かさない
- hover は **img の `opacity: 0.7` だけ**（`0.3s`）
- `module_zoom-button.css` は coverLink を `:not()` で除外
- 詳細はこちら / バックナンバー一覧は武道 `is-style-small` のまま
- PDF は `ul.wp-block-list` テキストリンク

関連の正方形サムネ（柚子 QA 画像など）は、絵の下側が白い。overlay ではない。

## 再開地点

1. `@GitHub` で `so` の最新 SHA と authority を確認
2. `@Figma` で正本 file の対象 node を直接取得
3. 書写 / 武道の表紙 hover を人が PC で一度見る（下半分が白く動いたら箱サイズが動いている）
4. 単行本一覧 `/publications/budo/books/`（Figma `1656:5309`）を実装
5. native CPT archive の 301 / noindex は `PENDING_QUESTIONS.md`

## 守る契約（再開時の短縮版）

- 空フィールドを出さない・値を発明しない
- `group_nbk_*.json` は Human が許可した layout 以外触らない
- 刊行物一覧は固定 page query。ネイティブ CPT archive をメニュー一覧にしない
- `parts.php` / Form / `現行サンプルbudokan` は触らない
- hover で枠を足さない。表紙 hover は coverLink の img opacity のみ
- 武道と書写はテンプレを分け、ACF 名を混ぜない
- 旧 `budokan` Theme の HTML/CSS はコピーしない
- SP frame が無い面は PC 参考・1カラム
