# 千葉経済大学 LP パッケージ

`lp-originalPage.php` と `lp/` フォルダをテーマ直下にコピーするだけで動く、
自己完結型の LP です。

- まずは **ACF なし** の直書き状態でそのまま公開できます
- あとから **学生の声 / スライダーの2箇所だけ** を ACF PRO で編集可能にできます

---

## 1. 何がどこにあるか

```
lp-originalPage.php   ページ本体。全セクションが見た目どおりの順で直書きしてあります。
                       （REF-001 自身の Header / Footer も含みます）
lp/
├── css/ref001.css                スタイル（このLP専用。1ファイル）
├── js/ref001-interactions.js     アコーディオン / スライダー / ページトップ
├── image/
│   ├── icons/*.svg                アイコン
│   ├── mv/*.svg                   メインビジュアルのあしらい
│   ├── backgrounds/*.jpg          CTA の背景写真
│   └── photos/{pc,sp}/*.webp      写真（PC用 / SP用）
├── acf-swap/                      ACF で編集したくなったときだけ使うファイル
│   ├── _helpers.php
│   ├── student-voice-acf.php
│   └── swiper-acf.php
├── acf-json/                      ACF PRO のフィールド定義（Local JSON）
│   ├── group_ref001_student_voice.json
│   └── group_ref001_swiper.json
└── acf-export.json                上2つをまとめた確認用ファイル
```

---

## 2. 設置手順（ACF なし）

1. `lp-originalPage.php` と `lp/` をテーマのルート直下にコピーする
2. 管理画面で固定ページを作り、テンプレートに
   **「LP オリジナルページ」** を選ぶ
3. 以上。ACF PRO は不要です

文言や画像を変えたいときは `lp-originalPage.php` を直接編集してください。
セクションごとにコメントで区切ってあります。

---

## 3. あとから ACF で編集できるようにする

1. ACF PRO を有効化する（`lp/acf-json/` は自動で読み込まれます）
2. `lp-originalPage.php` の中の該当セクションを、丸ごと include に置き換える

   学生の声 … `<section class="p-voice"> 〜 </section>` を:
   ```php
   <?php include __DIR__ . '/lp/acf-swap/student-voice-acf.php'; ?>
   ```
   スライダー … `<section class="p-messages"> 〜 </section>` を:
   ```php
   <?php include __DIR__ . '/lp/acf-swap/swiper-acf.php'; ?>
   ```
3. 管理画面の繰り返しフィールドで編集する
   - 学生の声 … `ref001_student_voices`
   - スライダー … `ref001_swiper_slides`

フィールドを空にしたまま／ACF を止めた場合でも、直書き版と同じ内容が
表示されます（PHP の警告も出ません）。
スライダーは枚数を増減すると、右下のカウンター（1 ── 4）も自動で追従します。

---

## 4. CSS の決まりごと

あとから人が直すことを前提にした構成です。

### 探し方

HTML のセクション名で CSS を検索してください。1箇所だけに当たります。

| HTML | CSS |
| --- | --- |
| `<section class="p-reason">` | `.p-reason { ... }` |
| `<section class="p-courses">` | `.p-courses { ... }` |

各セクションのブロックの中に、そのセクションの **PC / SP 両方** の指定が
入っています。別の場所を探し回る必要はありません。

### 名前の付け方

| 接頭辞 | 意味 | 例 |
| --- | --- | --- |
| `l-` | レイアウトの入れ物 | `l-container` |
| `c-` | 使い回すパーツ | `c-btn` / `c-kicker` / `c-heading` / `c-checklist` |
| `p-` | ページのセクション | `p-mv` / `p-reason` / `p-courses` |

### 書き方のルール

- **高さ・幅を決め打ちしない。** 中身と余白（`padding` / `gap`）で決まるようにする
- **並べるときは flex か grid。** `position: absolute` はレイアウトに使わない
- `absolute` を使ってよいのは **あしらいだけ**
  （吹き出しの尻尾、OPEN CAMPUS バッジ、ページトップボタン）
- 要素どうしを重ねたいときは、`absolute` ではなく
  **grid の同じマスに置く**（`grid-area: 1 / 1`）
  → メインビジュアルと「まずは大学を体験してみよう！」がこの方法です
- 見出しなどを境目にまたがせたいときは、`absolute` ではなく
  **マイナスマージン**（`p-reason__title` / `p-courses__rec-label`）
- **ブレークポイントは 768px の1本だけ。**
  767px以下 = SP / 768px以上 = PC。中間の境目は作らない
- 色や余白は先頭の `:root` にまとめてあります。まずそこを見てください
- 初期化（reset）は `:where()` で囲んで詳細度を 0 にしてあります。
  囲まないと `.p-lp a {}` が `.c-btn--doc {}` より強くなり、
  ボタンの文字色が効かない、といった事故が起きます

---

## 5. フォント / 外部ライブラリ

- **フォント**: `lp/css/ref001.css` の先頭で Google Fonts から読み込みます
  （Zen Kaku Gothic New / Poppins）。ファイルは同梱していません
- **Swiper**: `lp/js/ref001-interactions.js` が実行時に CDN から読み込みます。
  テーマ側に既に Swiper があればそれを使い、二重読み込みしません

どちらもインターネット接続がある環境でそのまま動きます。

---

## 6. 確認済みの内容

`php scripts/ci-render-contract.php .` で自動チェックできます（全31項目）。

- 全 PHP の構文チェック
- CSS の相対 `url()` がすべて実ファイルに解決する（素材の入れ忘れ検出）
- `@media` が 767/768px の1本だけ（中間ブレークポイントが増えていない）
- `<!DOCTYPE html>` から始まる単独ドキュメントで、`wp_head()` / `wp_footer()`
  が正しい位置にある
- CSS/JS を `add_action` 経由にしていない（発火せず CSS が当たらない事故の防止）
- テンプレートが参照する素材がすべて存在する
- 旧クラス名（`ref-*`）が残っていない
- ACF 未設定時に直書き版と同じ内容が出て、PHP 警告が出ない
- ACF 設定時に内容・件数・画像が実際に切り替わる

ブラウザでの実測（Chromium）:

- PC 1380px / SP 375px とも横スクロールなし
- 画像 50 点すべて読み込み成功
- ページ全体の高さ PC 7794px（承認済みデザイン 7714px とほぼ一致）
- 学生の声のアコーディオンが開閉とも動作
- スライダーが「次へ 2→3→4→1」「戻る」ともに動作し、カウンターが連動

---

## 7. 人の手が必要な残作業

- 実 ACF PRO ライセンス + 実 WordPress での目視確認
  （`experiments/wordpress-acf-pro-standalone-lp/` の `.env` にキーを入れて `make qa`）
- リンク先 URL の最終確認（現在は千葉経済大学の公開ページを指しています）
- 「数字で見る千葉経済大学」のリンク先だけ未確定のため、
  暫定で大学トップを指しています
