# 当面4 family（一覧＋詳細）

更新: 2026-09-19  
Figma visual authority: `zMjOY4euPBi9T23y7ZSM6y`  
旧 Figma `jqYoPtusYfTeDqRegMCsx3` は実装漏れ監査専用で、最終実装値の正本にはしない。  
正本の詳細: [`PUBLICATIONS_IMPLEMENTATION_STATUS.md`](PUBLICATIONS_IMPLEMENTATION_STATUS.md) / [`PUBLICATIONS_CPT_ARCHITECTURE.md`](PUBLICATIONS_CPT_ARCHITECTURE.md) / [`DIRECTORY_MAP.md`](DIRECTORY_MAP.md) / [`FIGMA_MAP.md`](FIGMA_MAP.md)  
溜め質問: [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)

## 順番（現在の Human authority）

```text
イベント 一覧→詳細（既存完成・回帰させない）
→ 武道＋月刊書写書道を同一 publication family として一覧／最新号／詳細 PC/SP 完成
→ 完了ゲート後のみ TOP
```

武道と月刊書写書道は同一レイアウト family として扱い、visual rule / CSS owner を共有する。書写は PDF back のみではなく、一覧・最新号・public single を PC/SP とも実装対象とする。旧「書写 single はまだ作らない」「書写 Figma なし」は superseded。

## 現行 Figma authority

- PC authority page/node: `0:1`
- SP authority page/node: `114:5409`
- 武道・書道 一覧 SP: `2608:5702`
- 武道・書道 詳細 SP: `2608:6933`
- PC の対象 frame は現行 file の PC authority から都度検索・特定し、旧 node 番号を最終実装値として流用しない

## 8面＋公開 URL / WP owner

| # | family | 面 | 公開 URL | WP | 現行 visual authority |
| --- | --- | --- | --- | --- | --- |
| 1 | イベント | 一覧 | `/event/` | CPT archive `event` | 既存完成面。刊行物作業で回帰させない |
| 2 | イベント | 詳細 | `/event/{slug}/` | CPT single | 既存完成面。刊行物作業で回帰させない |
| 3 | 月刊「武道」 | 一覧 | `/publications/budo/back/` | **page** | 新Figma。SP `2608:5702` |
| 4 | 月刊「武道」 | 詳細 | `/budo-book/{slug}/` | CPT single | 新Figma。SP `2608:6933` |
| 4' | 月刊「武道」 | 最新号 | `/publications/budo/latest/` | **page** 1件 | 詳細と shared part |
| 5 | 月刊書写書道 | 一覧 | `/publications/shodo/back/` | **page** | 武道と同一 publication family。SP `2608:5702` |
| 6 | 月刊書写書道 | 詳細 | `/shodou-book/{slug}/` | CPT single | 武道と同一 publication family。SP `2608:6933` |
| 6' | 月刊書写書道 | 最新号 | `/publications/shodo/latest/` | **page** 1件 | 詳細と shared part |
| 7 | 単行本 | 一覧 | `/publications/budo/books/` | **page** + tax `book` | 既存実装を回帰させない |
| 8 | 単行本 | 詳細 | `/tankoubon/{slug}/` | CPT single | 既存実装を回帰させない |

刊行物の一覧はネイティブ `/budo-book/` 等ではない。

## イベント ACF（これだけ。他グループは触らない）

JSON: `acf/json/group_event.json`。location = `event`。instructions 空。空値は出力しない。

| ラベル | name | 型 |
| --- | --- | --- |
| 開催日 | `event_date` | datetime |
| 時間 | `event_time` | text |
| 入場数 | `event_capacity` | text |
| 入場料 | `event_fee` | text |
| 主催 | `event_host` | text |

会場・募集ステータス等は足さない。`group_nbk_*.json` は触らない。

一覧はニュースカードを使わない（Figma `card_event`）。募集チップは出さない。月フィルタは `event_date`。詳細の表・お申込みは本文。

## 刊行物共通契約

```text
① テンプレ頭 = 既存 ACF + タイトル + アイキャッチ + 固定CTA（値があるものだけ）
② 本文 = the_content（既存 Parts。他件一覧は acf/custom-post-list）
空は出さない。非売品などを発明しない。
旧 Theme の HTML/CSS はコピーしない。
```

追加の確定契約:

- 月刊書写書道 ACF は `group_nbk_gekkan_shodou` を維持し、`group_nbk_*.json` は変更しない
- 表紙はアイキャッチ。`topimage` は TOP 専用
- PDF はテキストリンク
- 一覧「詳細はこちら」と詳細「バックナンバー一覧」は既存 `is-style-small` owner を武道・書道で共有
- `.publication_budo-coverLink` は箱サイズ固定 + `overflow:hidden`、img は `width/height:100%`。hover は画像 `opacity:0.7` のみで layout shift を出さない
- 武道・書道の視覚値は共通 wrapper/component/selector/CSS owner に寄せ、片方専用のコピペ layout CSS を増やさない
- 詳細な現在地と TOP 前の完了ゲートは [`PUBLICATIONS_IMPLEMENTATION_STATUS.md`](PUBLICATIONS_IMPLEMENTATION_STATUS.md) を正本とする
