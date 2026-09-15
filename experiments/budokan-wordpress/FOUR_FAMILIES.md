# 当面4 family（一覧＋詳細）

更新: 2026-09-15  
Figma file: `jqYoPtusYfTeDqRegMCsx3`  
正本の詳細: [`PUBLICATIONS_CPT_ARCHITECTURE.md`](PUBLICATIONS_CPT_ARCHITECTURE.md) / [`DIRECTORY_MAP.md`](DIRECTORY_MAP.md) / [`FIGMA_MAP.md`](FIGMA_MAP.md)  
溜め質問: [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)

## 順番（この順がベスト）

```text
イベント 一覧→詳細
→ 武道 詳細（＋最新号 page 同じ part）→ バック一覧
→ 単行本 詳細→一覧
→ 書写 バック（PDF）。single 公開はメモ済み・まだ作らない
```

理由: イベントは PC Figma が両面あり、公開 URL が本物の archive、ACF が今回5本で閉じる。武道は刊行物の型（頭ACF＋本文）の正本。単行本は Figma あり・tax だけ余分。書写は Figma なしなので最後。

## SP（Human 2026-09-15）

専用 SP frame が無い面は **PC を参考にする。SP は1カラム。** `SP_archive` を刊行物・イベントに流用しない。PC と同じ情報を積み、横組だけ落とす。

## 8面＋Figma URL

ベース: `https://www.figma.com/design/jqYoPtusYfTeDqRegMCsx3/nipponbudokan?node-id=`

| # | family | 面 | 公開 URL | WP | PC Figma | URL |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | イベント | 一覧 | `/event/` | CPT archive `event` | `1619:9554` | [event](https://www.figma.com/design/jqYoPtusYfTeDqRegMCsx3/nipponbudokan?node-id=1619-9554) |
| 2 | イベント | 詳細 | `/event/{slug}/` | CPT single | `1632:10382` | [event_detail](https://www.figma.com/design/jqYoPtusYfTeDqRegMCsx3/nipponbudokan?node-id=1632-10382) |
| 3 | 月刊「武道」 | 一覧 | `/publications/budo/back/` | **page** | `1634:10806` | [publications](https://www.figma.com/design/jqYoPtusYfTeDqRegMCsx3/nipponbudokan?node-id=1634-10806) |
| 4 | 月刊「武道」 | 詳細 | `/budo-book/{slug}/` | CPT single | `1637:11288` | [publications_detail](https://www.figma.com/design/jqYoPtusYfTeDqRegMCsx3/nipponbudokan?node-id=1637-11288) |
| 4' | 月刊「武道」 | 最新号 | `/publications/budo/latest/` | **page** 1件 | 4 と同じ part | 専用なし |
| 5 | 月刊書写書道 | 一覧 | `/publications/shodo/back/` | **page**（PDF。single 非リンク） | なし | — |
| 6 | 月刊書写書道 | 詳細 | `/shodou-book/{slug}/` | CPT single | なし | — |
| 6' | 月刊書写書道 | 最新号 | `/publications/shodo/latest/` | **page** 1件 | なし | — |
| 7 | 単行本 | 一覧 | `/publications/budo/books/` | **page** + tax `book` | `1656:5309` | [hardcover](https://www.figma.com/design/jqYoPtusYfTeDqRegMCsx3/nipponbudokan?node-id=1656-5309) |
| 8 | 単行本 | 詳細 | `/tankoubon/{slug}/` | CPT single | `1686:5574` | [hardcover_detail](https://www.figma.com/design/jqYoPtusYfTeDqRegMCsx3/nipponbudokan?node-id=1686-5574) |

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

## 共通契約

```text
① テンプレ頭 = 既存 ACF + タイトル + アイキャッチ + 固定CTA（値があるものだけ）
② 本文 = the_content（既存 Parts。他件一覧は acf/custom-post-list）
空は出さない。非売品などを発明しない。
旧 Theme の HTML/CSS はコピーしない。
```
