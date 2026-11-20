# 仕様（Human 指示 2026-11-20 + Figma 実装指示書 `294:852`）

## 共通

- 文字サイズは rem。ベース Theme の書き方に倣う
- アイコンは Figma 上 Font Awesome（`arrow-right/f061` など）。読み込み方はベース Theme に合わせる

## TOP の管理画面で編集する項目

field 名・ACF の置き場所はベース Theme を見てから決める。ここに無い項目は作らない。

| パーツ | Figma（PC） | 編集できるもの |
|---|---|---|
| メインビジュアル | `184:797` | 各画像。動きは https://www.osaka-kaisei.ac.jp/ を参照（Figma コメント director.all、Human が転記 2026-11-20） |
| CTA | `134:823` | アイコン / テキスト / リンク先 / 表示・非表示 |
| 重要なお知らせ | `114:349` | セクション全体の表示・非表示。項目は繰り返し（日付 / WYSIWYG / 表示・非表示） |
| Course | `114:635` | コースごとに 画像 / タイトル / テキスト / リンク / 外部リンクかどうか |

## hover（実装指示書 `294:852` から転記）

| 箇所 | 指示 |
|---|---|
| ヘッダー | ロゴは不透明度 70%、ナビのテキストは main color。CTA は下の指示 |
| 編入・学校見学ボタン | 白い部分を 10px 広く、テキストの色を変える |
| 重要なお知らせ | テキストの下線を外す |
| ニュージャージー補習授業校とは | クリックしたら前面に来る。テキストの色を変える。背景画像とニュージャージーの地形は別書き出しでも一緒でもよい |
| 各部紹介 | 矢印を反転、画像は拡大 |
| 入学をご検討されている方 | テキスト色を変更、矢印は枠線付きで反転 |
| お知らせ | テキストリンクは marker が左から右に出る。お知らせ一覧の矢印は反転 |
| Instagram | ボタンを枠線付きで反転 |
| フッター | テキストリンク = main color、Instagram アイコン = 反転、ページトップボタン = 背景を main color、ロゴ = 不透明度 70% |

## プラグイン

| プラグイン | 状態 |
|---|---|
| Advanced Custom Fields PRO | 有効（有料。Git に入れない） |
| Advanced Editor Tools | 有効 |
| Autoptimize | 入れるが **無効** |
| Category Order and Taxonomy Terms Order | 有効 |
| Custom Post Type Permalinks | 有効 |
| Flexible Table Block | 有効（ローカルは 3.9.0。最新 3.10.0 は WordPress 7.1 以上が必要） |
| Formidable Forms | 有効 |
| Formidable Forms Pro | 有効（有料。Git に入れない） |
| Yoast Duplicate Post | 有効 |
