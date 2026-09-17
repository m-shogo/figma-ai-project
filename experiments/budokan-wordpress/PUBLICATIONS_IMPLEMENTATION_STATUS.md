# 刊行物 CPT 実装進捗 — pause checkpoint

更新: 2026-09-17

## 正本

- GitHub: `m-shogo/figma-ai-project` / branch `so`
- Figma: `jqYoPtusYfTeDqRegMCsx3` のみ。旧 file は見ない
- 契約: `CURRENT_AUTHORITY.md` / `FOUR_FAMILIES.md` / `PUBLICATIONS_CPT_ARCHITECTURE.md`
- 未決事項: `PENDING_QUESTIONS.md`

## 現在地

### イベント

- `/event/` 一覧: 実装済み
- `/event/{slug}/` 詳細: 実装済み
- 既存完了面として回帰させない

### 月刊「武道」

- `/budo-book/{slug}/` 詳細: コード実装済み
  - 共通 `_budo-detail.php`
  - 既存 ACF の空値は出さない
  - 本文 owner は `the_content()`
- `/publications/budo/latest/`: コード実装済み
  - single と同じ detail part を共有
- `/publications/budo/back/`: コード実装済み
  - 固定 page query
  - 最新号を除外
  - 空概要・画像なし対応を実装
- 残り: ユーザーのローカル WordPress で PC/SP Visual QA を完了確認すること

### 単行本

- `/tankoubon/{slug}/` 詳細: コード実装済み、現在の停止地点
  - Figma `1686:5574` と構造照合済み
  - 「日本武道館発行の単行本」H2 + SVG octagon
  - アイキャッチ + `book_author` / `book_desc` / `book_info` / `book_price`
  - `readingttl` + `readingtest` / `amazon` / `book_addbtn` の CTA
  - CTA の octagon と external-link icon は SVG
  - 空値は要素ごと出さない
  - 本文 owner は `the_content()`
  - PC/SP CSS 実装済み
- 残り: 通常値 / 長文 / 空 ACF / 画像なし / CTA 長文の PC/SP Visual QA
- `/publications/budo/books/` 一覧: 未着手。次の実装対象
  - Figma `1656:5309`
  - 固定 page + tax `book`

### 月刊書写書道

- `/publications/shodo/back/`: 未着手
- Figma 専用 frame なし → PC既存設計を参考に SP 1カラム
- PDF 一覧。single 公開はまだ作らない
- `/shodou-book/{slug}/` の public single は Human 未確定のため着手しない

## 未完了を完了扱いにしない理由

このエージェント実行環境から、ユーザー Mac 上の `http://127.0.0.1:27247/` を直接ブラウザ操作できない。したがって QA seed の投入と実画面 PC/SP Visual QA は未確認のまま「完了」としない。

## 再開地点

1. `@GitHub` で `so` の最新 SHA と authority を確認
2. `@Figma` で正本 file の対象 node を直接取得
3. ローカル WP が操作できる環境なら、単行本詳細の QA を最優先で完了
4. QA が通れば単行本詳細を明示的に完了扱いにする
5. 単行本一覧 `/publications/budo/books/`（Figma `1656:5309`）を実装
6. 単行本一覧の QA 後、書写バックへ進む

## 守る契約（再開時の短縮版）

- 空フィールドを出さない・値を発明しない
- `group_nbk_*.json` は触らない
- 刊行物一覧は固定 page query。ネイティブ CPT archive をメニュー一覧にしない
- `parts.php` / Form は触らない
- hover で枠を足さない
- octagon invert は SVG chip
- 旧 `budokan` Theme の HTML/CSS はコピーしない
- SP frame が無い面は PC 参考・1カラム
- 未決は `PENDING_QUESTIONS.md` に寄せ、推測実装しない
- 既存のお知らせ・イベント・stylesheet import graph を回帰させない
