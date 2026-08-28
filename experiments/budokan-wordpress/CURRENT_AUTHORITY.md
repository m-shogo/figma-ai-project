# Budokan — Current Authority（案件正本メモ）

このファイルは **日本武道館 WordPress 案件**の会話決定を正本化する。  
以降の Agent は、ここを Current Authority として扱い、矛盾する旧命名・旧 LP runtime 前提で進めない。

更新日: 2026-08-28

---

## 命名

- ファイル名・新規ディレクトリに `ref-002` / `ref002` を付けない
- 案件名は `budokan`（Theme slug 実体は `nipponbudokan`）
- 旧 `experiments/ref002-*` / `experiments/wordpress-acf-pro-standalone-lp` は **残置**（リネームしない）
- 新規進行先:
  - `experiments/budokan-wordpress/` … 案件 intake / 本メモ
  - `experiments/wordpress-acf-runtime/` … WP+ACF 実行環境

---

## Theme

- 正本 Theme: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/`
- 出所: **オリジナル**（外部 git repo / commit なし。手元 Theme が正本）
- **この案件のみ Theme を git 追跡する**（Human Authority A）。他案件の drop-in Theme は引き続き ignore
- 差し込みは `theme-dropin/` に **1 Theme のみ**（倉庫として溜めない）
- 本番 Theme 構造を `theme/sample-theme` から継承しない
- 専用ルール: [`THEME_RULES.md`](THEME_RULES.md)

付属:

- Block Patterns: `theme-dropin/nipponbudokan/patterns.json`
- ACF export: `theme-dropin/nipponbudokan/acf-export.json`（加えて `acf/json/`）

---

## ●●パーツ集●● 固定ページ（必須）

- 固定ページ「●●パーツ集●●」の本文は次を正本とする:

```text
experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/parts.php
```

- **タグを追加しない**
- **デフォルトか、`parts.php` の内容を変更なしで使う**
- 勝手に HTML / ブロック markup / class を増やしたり書き換えたりしない
- `parts.php` は Theme PHP テンプレートではなく、ブロックエディタ用 markup の参照ソース

---

## 環境 / プラグイン

- WordPress / ACF PRO: **最新**
- Form: **Human が担当。AI は form 実装しない**（Formidable Forms / Pro は環境に載る想定）
- 最低限 plugin（増えるかも）:
  - Advanced Custom Fields PRO
  - Advanced Editor Tools
  - All-in-One WP Migration and Backup
  - Autoptimize
  - Custom Post Type Permalinks
  - EWWW Image Optimizer
  - Flexible Table Block
  - Formidable Forms
  - Formidable Forms Pro
  - Intuitive Custom Post Order
  - WP Multibyte Patch
  - Yoast Duplicate Post

---

## 業務・編集運用

- 詳細は **Human が随時教える**（先回りで決め切らない）
- News / Events 運用: **変更して sample**（本番運用確定前。実装は sample データで進める）
- editor のカード追加/削除/並び替え要否: **随時**（セクション実装時に確認。UNDETERMINED のまま進めてよい）
- 任意の本番 URL / 実コンテンツ: まだない。随時

---

## レスポンシブ / タイポ（Human Authority）

```text
- layout 切替: min-width 768px
- PC canvas: body min-width 1280px（タブレット専用 UI なし）
- フォント: SP 値 / PC 値は固定 px（幅追従・clamp/vw で変えない）
- SP: 〜767 まで幅・余白はレスポンシブ。フォントサイズは SP 帯で固定
- PC: ≥768 は PC レイアウト（必要なら横スクロール）。フォントは PC 固定
- hover: 幅ではなく Theme 既存の any-hover に合わせる
```

- Theme 内の header `1080px` は **イレギュラー。案件ルールとしては気にしない**（後で変える場合は Human が明示）
- デザイン変更あり前提。breakpoint 契約は上記で固定し、細部 px は後から差し替えてよい

---

## Figma（現行正本）

File: [nipponbudokan](https://www.figma.com/design/w7SGVY63FuW6JpaQVKjxm2/nipponbudokan)

| 面 | URL | fileKey | node-id |
| --- | --- | --- | --- |
| PC | https://www.figma.com/design/w7SGVY63FuW6JpaQVKjxm2/nipponbudokan?node-id=0-1 | `w7SGVY63FuW6JpaQVKjxm2` | `0:1` |
| SP | https://www.figma.com/design/w7SGVY63FuW6JpaQVKjxm2/nipponbudokan?node-id=114-5409 | `w7SGVY63FuW6JpaQVKjxm2` | `114:5409` |

- 旧 file key `RfAQQ28V1HGaeIcpgRmQq1` は使わない（証拠 lineage 参照のみ）
- **デザインは途中。これから変更あり** → pixel 固定しすぎない。Theme 規約優先で載せる
- Visual の正本は上記 Figma。既存実装の正本は Theme

---

## 実装順（Human Authority）

```text
0. Theme 観測 → この Theme 専用ルールを短く固定
1. Header / Footer
2. パーツ集（parts.php 変更なし）
3. TOP
```

Form は Human 担当のためこの順に含めない。

---

## Agent への短い命令

1. 本ファイルと Theme を先に読む
2. 実装前に Theme 専用ルールを短く決める（命名・Header/Footer・pattern・enqueue）。breakpoint は CURRENT_AUTHORITY の 768/1280 契約に従う（header 1080 は無視）
3. パーツ集は `parts.php` を変更なしで使う（タグ追加禁止）
4. form は触らない
5. `ref002` 名の新規ファイルを作らない
6. デザイン変更前提で、Theme に合わせて載せる。運用未確定・契約変更は Human が明示するまで変えない
7. 実装順は Header/Footer → パーツ集 → TOP