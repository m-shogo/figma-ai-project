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
- ACF Blocks: `acf/blocks/` + Local JSON `acf/json/`

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

Nav locations: `global-nav` / `sub-nav` / `footer-nav`

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

- Local JSON: `acf/json/`（save/load とも）
- Export 参照: `acf-export.json`
- Options / TOP fields / custom blocks あり
- **front-page は管理画面で editor 非表示**（`inc/custom.php`）→ TOP は ACF フィールド中心

---

## 7. Patterns / パーツ集

- `patterns.json` … ブロックパターン書き出し
- `parts.php` … 「●●パーツ集●●」本文正本（**変更なし・タグ追加禁止**）
- 固定ページは 1カラム（`templates/template-oneColumn.php`）。見た目は `css/blocks/` とページタイトル帯（`global_mainVisual.css`）で Figma parts / SP_parts に合わせる
- form ブロックがあっても Agent は触らない

---

## 8. Templates

- TOP: `front-page.php`（ACF slider / notice / news / event list）
- 固定ページ: `page.php` + `templates/template-*.php`
- 共通帯: `template-parts/_visual.php` 等

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
3. logo は `images/common/logo.svg`
4. Footer 住所・TEL・copyright は現状プレースホルダ → 実データは Human 指示待ちでよい
5. SP ハンバーガーは `#gh_menu` / `#global_navigation` / `#overlay`（`common.js` 連動）

---

## 12. Git 注意

Theme 実体は `theme-dropin/*` で **gitignore**。  
この research repo に乗るのは intake / 本ルール / runtime 基盤。  
Theme 差分の version 方針は Human に確認（必要なら別途）。
