# ACF JSON modified を未来にすると同期が残る — 2026-09-25

## 事象

検証で SEO設定・ビジュアル設定を同期したあとも、フィールドグループ一覧に「同期が利用できます」が残った。

## 原因

`modified` を同期時刻より未来にした。ACF は `JSON の modified > データベースの post_modified` のあいだ同期対象のままにする。WP Engine は同期時にテーマ JSON を上書きしないので、未来の時刻がファイルに残る。

## 次回ルール

- `modified` は未来にしない。動かすときは今より前、かつデータベースのフィールドグループ更新時刻より新しい値だけ。
- エディタに出る説明文・位置はデータベース側。JSON を保存しただけでは反映されない。
- SEO設定とビジュアル設定の position は `normal`。サイドバー `side` に戻さない。
- 一度保存された `meta-box-order_page` は ACF の position より優先される。この2つだけ、その保存列から外して ACF の position を画面に出す。他の枠は触らない。

正本: `CURRENT_AUTHORITY.md` の ACF 節。
