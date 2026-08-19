# REF-001 LP パッケージ（ACFなし直書き版 + 差し替え用ACF一式）

`experiments/ref001-cku-theme-integration/`（cku本番テーマへ最小限のフックだけで
統合する版）とは**別の、もう一つの納品形態**。

こちらは「まずACF無しで直書きのページとしてそのまま動かし、後から
Student Voice / Swiperの2箇所だけをACF PROに差し替える」という運用を
想定したパッケージ。cku固有の`functions.php`規約には依存しない、
**完全独立LP**として作ってある。

**サイト共通のヘッダー/フッター（ナビ・ロゴ・共通フッター等）は
一切表示しない。** `get_header()`/`get_footer()`は使わず、
`<!DOCTYPE html>`から自前でHTML文書を組み立てている。WordPressが
必要とする`<head>`情報（enqueueされたCSS/JS、SEOプラグインのmeta等）
だけを`wp_head()`/`wp_footer()`で出力する。

## 構成

```
lp-originalPage.php   ページテンプレート本体。ACFなし、全セクション直書き。
lp/
├── css/ref001.css                 REF-001のフリーズ済みCSS
│                                   (url()の相対パスのみlp/image/配下に
│                                   合わせて書き換え済み。中身のCSSルール自体は無変更)
├── js/ref001-interactions.js      REF-001のフリーズ済みJS(Voiceアコーディオン/Swiper初期化)
├── image/
│   ├── icons/*.svg                 CSS/PHP両方から参照される全アイコン
│   ├── mv/*.svg                    メインビジュアルのオープンキャンパス飾り
│   ├── backgrounds/*.jpg           CSSがbackground-imageで使う写真素材
│   └── photos/{pc,sp}/*.webp       Figma書き出しの実写真(全てPHP<picture>から参照)
├── acf-swap/
│   ├── _helpers.php               ACF版の共通ヘルパー(repeater読み取り/フォールバック等)
│   ├── student-voice-acf.php      「学生の声」ACF差し替え版
│   └── swiper-acf.php             「Swiper(先輩たちの声)」ACF差し替え版
└── acf-json/
    ├── group_ref001_student_voice.json   ACF PROフィールド定義(Local JSON)
    └── group_ref001_swiper.json          同上
```

## 使い方: そのまま設置する（ACFなし）

1. `lp-originalPage.php` と `lp/` フォルダを、対象テーマのルート直下に
   そのままコピーする。
2. WordPress管理画面で固定ページを作成し、テンプレートに
   「LP オリジナルページ（ACFなし直書き版）」を選択する。
3. これだけで表示される。ACF PROは不要。中身は`lp-originalPage.php`に
   直接HTMLとして書いてあるので、文言や画像を変えたい場合は
   このファイルを直接編集すればよい。

## 使い方: あとからStudent Voice / SwiperだけACF化する

1. ACF PROを有効化する（`lp/acf-json/`は自動で読み込まれる）。
2. `lp-originalPage.php` の中の該当セクションを、コメントに書いてある通り
   include に置き換える。

   学生の声セクション（`<section class="ref-voice" ...>...</section>`）を:
   ```php
   <?php include __DIR__ . '/lp/acf-swap/student-voice-acf.php'; ?>
   ```
   Swiperセクション（`<section class="ref-messages" ...>...</section>`）を:
   ```php
   <?php include __DIR__ . '/lp/acf-swap/swiper-acf.php'; ?>
   ```
3. 管理画面で `ref001_student_voices` / `ref001_swiper_slides` の
   繰り返しフィールドを編集すると、その内容が反映される。
   フィールドが空/ACF無効のままでも、直書き版と同じ内容が表示される
   （`lp/acf-swap/_helpers.php`のフォールバック機構）。

## フォント / 外部ライブラリについて

- **フォント**: `lp/css/ref001.css`の先頭で`@import url('https://fonts.googleapis.com/...')`
  によりNoto Serif JP / Poppins / Zen Kaku Gothic NewをGoogle Fonts CDNから
  読み込んでいる。これはREF-001の元CSSからそのまま引き継いだ仕様で、
  ローカルにフォントファイルを同梱する構成ではない
  （インターネット接続がある環境であればそのまま動作する）。
- **Swiper**: `lp/js/ref001-interactions.js`が実行時に
  `https://cdn.jsdelivr.net/npm/swiper@11/...`からSwiper本体を自動読み込みする
  （`window.Swiper`が既に存在する場合は読み込まない）。ローカルには同梱しない。

## ページ構造 / CSS・JSの読み込み方

```
<!DOCTYPE html>
<html>
<head>
  <?php wp_head(); ?>   ← enqueueされたCSS等はここに出力される
</head>
<body>
  <main class="ref-page">...REF-001の全セクション...</main>
  <?php wp_footer(); ?> ← enqueueされたJS等はここに出力される
</body>
</html>
```

テーマの`header.php`/`footer.php`（ナビ・ロゴ・共通フッター等）は
呼び出さない。`<link>`/`<script>`を本文に直書きする代わりに、
`wp_enqueue_style()`/`wp_enqueue_script()`でCSS/JSを登録しており、
それが`wp_head()`/`wp_footer()`によって正しい位置に出力される。

**注意**: `add_action('wp_enqueue_scripts', ...)`で遅延登録する一般的な
書き方は、あえて使っていない。ページテンプレートはそのフックより後に
読み込まれるため、そこで登録しても間に合わず一度も実行されず、CSS/JSが
サイト全体で一切当たらなくなることがある（フォント等の見た目が
どこにも反映されない不具合として現れる）。このファイルはすぐ下で
自分自身が`wp_head()`/`wp_footer()`を呼ぶため、フックへ登録し直さず
直接enqueueして確実にタイミングを合わせている。

## QA実施済みの内容

- 全PHPファイル: `php -l` 構文チェック済み
- `lp/acf-swap/*.php` をACF不在の状態でレンダリングし、
  `lp-originalPage.php`の直書き部分と**バイト単位で一致**することを確認済み
  （`data-figma-*`属性の有無のみ意図的な差分）
- ACFの値を書き換えてレンダリングし、実際にDOM(タイトル/本文/枚数)が
  変わることを確認済み（`have_rows`/`get_sub_field`をモックしたテストで検証）
- ACF JSON 2ファイルとも `json.load` でパース可能なことを確認済み
- `lp/css/ref001.css`内の全`url()`相対パスが`lp/`配下の実ファイルに
  解決することを機械チェック済み（アイコン/背景画像の同梱漏れがないことの検証）

## 実施していないこと（人間側で必要）

- 実ACF PROライセンス＋実WordPress環境での目視QA
  （`experiments/wordpress-acf-pro-standalone-lp/` の `make qa` を、
  `.env`にライセンスキーを設定した上で実行してください）
- 実際のWordPress環境で`wp_head()`/`wp_footer()`が想定通りCSS/JSを
  出力するかの目視確認（SEOプラグイン等が`<head>`へ何を追加するかは
  環境依存のため、設置後に一度ページソースで確認することを推奨）
