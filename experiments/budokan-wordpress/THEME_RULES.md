# nipponbudokan — Theme 専用ルール

観測日: 2026-08-28  
正本 Theme: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/`  
Human Authority: `CURRENT_AUTHORITY.md`（768/1280・パーツ集・form 担当など）

---

## 1. Theme family

**Classic theme（Block Editor / ACF Blocks 併用）**

- `style.css` Theme header / PHP templates / `header.php` `footer.php`
- `theme.json` なし
- ブロック向け CSS: `css/blocks/`
- ACF Blocks: Theme `acf/blocks/`（フィールド名は CURRENT_AUTHORITY。`acf/` を再読しない）

---

## 2. Header / Footer ownership

| 役割 | path |
| --- | --- |
| shell | `header.php` → `_head_contents` + `_header` + `.global_wrapper` 開始 |
| shell end | `footer.php` → wrapper 閉じ + `_footer` + `wp_footer` |
| Header markup | `template-parts/_header.php`（`#global_header.global_header`） |
| Footer markup | `template-parts/_footer.php`（`#global_footer.global_footer`） |
| Head meta/title | `template-parts/_head_contents.php` |
| CSS | `css/layout/global_header.css` / `global_footer.css` / `global_navigation.css` |
| Menu walkers | `inc/menu.php` |

Nav locations: `global-nav`（赤ハンバーガー） / `mega-nav`（PCメガ） / `sub-nav`（サブハンバーガー） / `footer-nav`（フッター1本）

**実装ルール:** Header/Footer は上記 parts を編集する。新規 shell を増やさない。クラスは既存 `gh_` / `gn_` / `gf_` に合わせる。

---

## 3. CSS architecture

- Entry: `css/style.css`（`@import` 連結）← `inc/front.php` が `common-style` として enqueue
- 層: `base/` → `global/` → `layout/` → `blocks/` → `module/` → `project/` → `wordpress/`
- 変数: `css/global/variables.css`（`--width-base: 1160px` 等）
- 命名:
  - layout: `global_*`
  - header 子: `gh_*`（例: `gh_inner` `gh_logo` `gh_menu` `gh_lang` `gh_search` `gh_buttons`）
  - nav: `gn_*` / footer: `gf_*`
  - module: `module_*` + 略称（`ms_` 等）/ 番号接尾辞 `-01`
  - TOP: `top_*`
  - blocks: `wp-block-*` 上書き
- **BEM の `--modifier` は使わない**（Theme 既存に合わせる）
- メディアクエリコメントは `/* MARK: header_breakpoint */` / `/* MARK: hover */` 形式
- ネストは Theme 既存 CSS と同じ native nesting

---

## 4. JS

- `inc/front.php` → jQuery 差し替え / Swiper / Modaal / `common.js`
- TOP のみ `home.js`
- form テンプレのみ `form.js`（**Agent は form 触らない**）
- TOP カレンダー: **FullCalendar + Google Calendar plugin**（Human Authority）。自前カレンダー禁止。ID/key は Human 待ち

---

## 5. Breakpoint（案件契約）

Human Authority どおり（Theme 内の header 1080 は無視）:

```text
layout: min-width 768px
PC min-width: 1280px (body)
フォント: SP/PC 固定。幅追従しない
```

QA は 〜767 と ≥1280 を主にする。

---

## 6. ACF

- フィールド契約の正本: `CURRENT_AUTHORITY.md` の ACF 節
- WordPress Local JSON / block PHP は Theme 実行に必要だが、Agent は `acf/` を再読してフィールドを増やさない。`acf-export.json` は退役
- Options / TOP fields / custom blocks あり。グローバルナビは WP メニュー（ACF メニューグループは現行に無い）
- **front-page は管理画面で editor 非表示**（`inc/custom.php`）→ TOP は ACF フィールド中心
- **secondary `WP_Query` → shared renderer はpostsを明示渡しする。** `$wp_query` の差し替えだけでglobal `$posts` / `$post` ownershipが移ると仮定しない。News listとEvent cardの2系統で同じleakが確認されたためBudokan Theme standardへ昇格済み。

---

## 7. Patterns / パーツ集

- `patterns.json` … ブロックパターン書き出し
- `parts.php` … 「●●パーツ集●●」本文正本（**変更なし・タグ追加禁止**）
- 固定ページは 1カラム（`templates/template-oneColumn.php`）。見た目は `css/blocks/` とページタイトル帯（`global_mainVisual.css`）で Figma parts / SP_parts に合わせる
- form ブロックがあっても Agent は触らない
- Gutenberg の style / palette 名は editor hook。Figma の見た目ではない（2026-09-01 Human）:
  - 標準 `.wp-block-button` = `button_L`。hover は `1163:4229`（閉じるとき default だけでは不足）
  - `.is-style-outline` = CTA `btn-03`。中空の輪郭にしない。`.small` は btn-02 のまま
  - hover で初めて `border` を足さない（共通: `docs/frontend-quick-contract.md` 節4）。rest から同じ太さ。Human 2026-09-04
  - ボタン hover に transition が無いものは `0.3s`（`--transition-duration`）。`::before` 含む。Human 2026-09-04
  - `has-gray-background-color` の塗りは白。slug `gray` は変えない
  - ページフレームの IMAGE TILE は Parts 専用ではない。news / event / post / page / form / navigation / TOP（`topdesign04`）も同じ。メニュー overlay だけ白無地。Theme は `body` に 700×700 tile。ページを閉じる前に親フレーム fill を見る
  - 新しい editor class（例: `.cta`）を足す前に、既存 style slot で足りるか Human にマップを確認する

---

## 8. Templates

- TOP: `front-page.php`（ACF slider / notice / news / event list）
- 固定ページ: `page.php` + `templates/template-*.php`
- 共通帯: `template-parts/_visual.php`
- 種類「ナビゲーション」: ナビゲーションテンプレート + `page_img`（画像タイトル）。デフォルトページは `page_img` なし（黄土色）。正本は `CURRENT_AUTHORITY.md` / `DIRECTORY_MAP.md`

---

## 9. CPT

- `event` + taxonomy `event_cat`
- News 相当は core `post` を使用している形跡（TOP の `get_posts`）
- sample 運用で進める（本番運用は随時）

---

## 10. Form

- `inc/form.php` / `templates/template-form.php` / Formidable 想定
- **Human 担当。Agent は実装しない**

---

## 11. Header/Footer 実装時の注意

1. 既存 markup / class / menu location を壊さない
2. Figma に合わせて見た目を寄せるが、デザイン変更前提で過剰に固定しない
3. logo は `images/common/logo.svg`（アウトライン SVG）
4. Footer 住所・TEL・copyright は現状プレースホルダ → 実データは Human 指示待ちでよい
5. SP ハンバーガーは `#gh_menu` / `#global_navigation` / `#overlay`（`common.js` 連動）

---

## 12. Figma から Theme へ入れる画像

Human Authority 2026-09-04（portable owner: `AGENTS.md` Images 節 / `docs/image-gradient-visual-tolerance.md` / `config/frontend-raster-asset-export-policy.yaml`。Theme / LP / HTML 共通。Cursor 専用ではない）:

```text
写真・ラスター fill → WebP
logo / icon（ベクター） → 文字・stroke を path にした SVG
```

- 短命 Figma URL は直貼りしない。実装の `images/` 等へ永続保存する
- JPEG / PNG の写真を納品物に残さない。取り込み時に WebP にする
- logo / icon は Figma のベクターをアウトライン（文字・stroke を path）して SVG で保存する
- Figma 側がラスターしか無い logo は SVG をトレースで捏造しない。その場合は WebP
- favicon PNG などフォーマット契約があるものだけ例外

---

## 13. 明示パラメーター / 流用しやすさ

`is_front_page()` / `is_home()` は使ってよい。明らかに TOP 専用で変動しないもの（TOP sticky、TOP 専用 CSS/JS など）はそれでよい。

流用しうる塊だけ、ページ身元に結びつけない。呼び出し側が明示する、変わりにくい引数にする。

- 正（流用）: `get_footer(null, array('map' => true))` → `_hasMap`
- 誤（流用）: `body.home` や CSS `.home` で地図を出す
- 正（TOP専用）: `is_front_page()` で TOP だけの CSS/JS / sticky
- パーツは default オフ。使いたいテンプレートだけ opt-in
- 引数名は機能（`map`）であり、ページ名ではない

共通正本: `docs/wordpress-acf-policy.md`。Footer 地図の適用メモは `HEADER_FOOTER_NOTES.md`。

---

## 14. Git 注意

Theme 実体は `theme-dropin/*` で **gitignore**。  
この research repo に乗るのは intake / 本ルール / runtime 基盤。  
Theme 差分の version 方針は Human に確認（必要なら別途）。