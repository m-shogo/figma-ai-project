# 刊行物 CPT 実装進捗 — pause checkpoint

更新: 2026-09-17（書写実装 + 表紙 hover 切り出し + 新 Figma 正本切替）

## 正本

- GitHub: `m-shogo/figma-ai-project` / branch `so`
- Git 状態（Human 2026-09-17）:
  - local `so` HEAD: `1bea82b`（`bf6bf8e` 書写 + 表紙 hover と `74c2996` radar の merge）
  - `origin/so`: `74c2996` のまま
  - `.github/workflows/**` 変更を含むため、`workflow` scope 付き認証で `git push origin so` が必要
- **Figma 正本: `zMjOY4euPBi9T23y7ZSM6y`。旧 `jqYoPtusYfTeDqRegMCsx3` は historical reference。新規実装・Visual QA の基準にしない**
- 契約: `CURRENT_AUTHORITY.md` / `FOUR_FAMILIES.md` / `PUBLICATIONS_CPT_ARCHITECTURE.md`
- 未決事項: `PENDING_QUESTIONS.md`

## 新 Figma authority（Human 2026-09-17）

### 全体

- PC master: `0:1`
  - https://www.figma.com/design/zMjOY4euPBi9T23y7ZSM6y/nipponbudokan?node-id=0-1&p=f&t=EWCs3lo67ttNXTZL-0
- SP master: `114:5409`
  - https://www.figma.com/design/zMjOY4euPBi9T23y7ZSM6y/nipponbudokan?node-id=114-5409&p=f&t=EWCs3lo67ttNXTZL-0
- **TOP はコンテンツ変更あり。旧 Figma / 旧キャプチャの内容を正として流用しない**
- SP は今回の重要変更。PC から機械的に 1 カラム化せず、新 SP frame を直接確認する

### 刊行物で特に重要な SP frame

- 武道・書道 一覧: `2608:5702`
  - https://www.figma.com/design/zMjOY4euPBi9T23y7ZSM6y/nipponbudokan?node-id=2608-5702&t=EWCs3lo67ttNXTZL-0
- 武道・書道 詳細: `2608:6933`
  - https://www.figma.com/design/zMjOY4euPBi9T23y7ZSM6y/nipponbudokan?node-id=2608-6933&t=EWCs3lo67ttNXTZL-0

旧 file の node 番号（例: `1634:10806` / `1637:11288` / `1656:5309`）は implementation authority として使わない。単行本一覧など、まだ新 file の対応 node を固定していない面は、着手時に `zMjOY4euPBi9T23y7ZSM6y` 内の現行 frame を確認してから実装する。

## 現在地

### イベント

- `/event/` 一覧: `archive-event.php` / `taxonomy-event_cat.php`
- `/event/{id}/` 詳細: `single-event.php`
- 既存完了面として回帰させない
- `group_event.json` は Human 許可済みの仕様だけを使う。空値は出さない

### 月刊「武道」

- `/budo-book/{slug}/`: `single-budo-book.php` → `_budo-detail.php`
- `/publications/budo/latest/`: 同じ detail part
- `/publications/budo/back/`: 全件。アイキャッチ + `budo_backcontent` + 詳細はこちら
- 表紙リンクは `.publication_budo-coverLink`。関連5冊も同じ
- 残り: 新 Figma PC/SP を基準に表紙 hover とレスポンシブを人が確認

### 月刊書写書道

- `/shodou-book/{slug}/`: `single-shodou-book.php` → `_shodou-detail.php`
- `/publications/shodo/latest/`: 同じ part
- `/publications/shodo/back/`: 全件。アイキャッチ + `rensailist` PDF + 詳細はこちら
- 見た目は武道 family と揃えるが、テンプレートと ACF owner は分ける
- ACF は `group_nbk_gekkan_shodou` のみ
- ご注文 CTA: `/publications/shodo/form-shodo/`
- 総索引・おすすめ wysiwyg は出さない
- 残り: 新 Figma `2608:5702` / `2608:6933` を含む PC/SP Visual QA

### 単行本

- `/tankoubon/{slug}/` 詳細: コード実装済み
- `/publications/budo/books/` 一覧: **未着手**（次の大きな実装）
- 固定 page + tax `book`
- 旧 Figma `1656:5309` は正本ではない。着手前に新 Figma `zMjOY4euPBi9T23y7ZSM6y` の現行対応 frame を特定する

## 表紙 hover（Human 2026-09-17）

Parts の gallery / media-text / zoom に表紙 `<a>` を載せない。

- class: `.publication_budo-coverLink`
- 箱（`<a>`）のサイズは固定。`overflow: hidden`
- 画像は箱を埋め続ける（`width: 100%` / `height: 100%`）
- hover は **img の `opacity: 0.7` だけ**（`0.3s`）。箱・高さ・余白は transition させない
- `module_zoom-button.css` は coverLink を `:not()` で除外
- 詳細はこちら / バックナンバー一覧は武道 `is-style-small` のまま
- PDF はテキストリンク

以前見えた下側の白は zoom overlay ではなく、箱の高さが transition 中に動き、紙地が露出していたもの。関連の正方形サムネ（柚子 QA 画像など）は元画像自体の下側が白いので、静止時の白は overlay ではない。

## `group_event.json` の `modified` について

ACF Local JSON の top-level `modified` は field group の保存・書き出し時刻メタデータ。投稿の更新日時ではない。

`bf6bf8e` では `group_event.json` 自体に実変更があり、`event_date` を `date_time_picker` から `date_picker` に変更し、`event_status` を追加しているため `modified` も更新されている。`modified` の値だけを機能差分として扱わない。

Human が確認した `1789626430` → `1789635600` は JST で `2026-09-17 15:27:10` → `2026-09-17 18:00:00`（差 2:32:50）。値そのものは ACF の保存時刻で、開催イベント投稿データが変わったことを示さない。

## 再開地点

1. `workflow` scope 付きで local `1bea82b` を `origin/so` へ push し、remote SHA を一致させる
2. 新 Figma `zMjOY4euPBi9T23y7ZSM6y` を唯一の design authority として読む
3. TOP のコンテンツ変更を旧実装と比較し、必要箇所を更新する
4. 武道・書写を PC + SP（特に `2608:5702` / `2608:6933`）で Visual QA。表紙 hover は hover-in / hover-out と箱サイズ不変まで確認
5. 単行本一覧 `/publications/budo/books/` は新 Figma の対応 frame を特定してから実装
6. native CPT archive の 301 / noindex は `PENDING_QUESTIONS.md`

## 守る契約（再開時の短縮版）

- 空フィールドを出さない・値を発明しない
- `group_nbk_*.json` は Human が許可した変更以外触らない
- 刊行物一覧は固定 page query。ネイティブ CPT archive をメニュー一覧にしない
- `parts.php` / Form / `現行サンプルbudokan` は触らない
- hover で枠・zoom・箱アニメーションを足さない。表紙 hover は coverLink の img opacity のみ
- 武道と書写は見た目 family を共有してもテンプレート / ACF owner を混ぜない
- 旧 `budokan` Theme の HTML/CSS はコピーしない
- **旧 Figma `jqYoPtusYfTeDqRegMCsx3` を実装基準にしない**
- SP は新 SP frame がある面では必ずその frame を基準にする
