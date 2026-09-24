# 当面4 family（一覧＋詳細）

更新: 2026-09-19  
Figma visual authority: `OtS7731mhY2oD44HSpdADo`  
旧 Figma `jqYoPtusYfTeDqRegMCsx3` / `zMjOY4euPBi9T23y7ZSM6y` は historical/audit 参照専用で、最終実装値の正本にはしない。  
正本の詳細: [`PUBLICATIONS_IMPLEMENTATION_STATUS.md`](PUBLICATIONS_IMPLEMENTATION_STATUS.md) / [`PUBLICATIONS_CPT_ARCHITECTURE.md`](PUBLICATIONS_CPT_ARCHITECTURE.md) / [`DIRECTORY_MAP.md`](DIRECTORY_MAP.md) / [`FIGMA_MAP.md`](FIGMA_MAP.md)  
溜め質問: [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)

## 順番（現在の Human authority）

```text
イベント 一覧・詳細は Human 2026-09-24 で終了。次の指示があるまで触らない
→ 武道＋月刊書写書道を同一 publication family として一覧／最新号／詳細 PC/SP 完成
→ 完了ゲート後のみ TOP
```

武道と月刊書写書道は同一レイアウト family として扱い、visual rule / CSS owner を共有する。書写は PDF back のみではなく、一覧・最新号・public single を PC/SP とも実装対象とする。旧「書写 single はまだ作らない」「書写 Figma なし」は superseded。

## 現行 Figma authority

Human Authority 2026-09-19:

- file: `OtS7731mhY2oD44HSpdADo`
- PC page: `0:1`
- SP page: `114:5409`
- 武道一覧 PC/SP: `1634:10806` / `2608:5702`
- 武道詳細 PC/SP: `1637:11288` / `2608:6933`
- 書写一覧 PC: `2629:7385`。専用 SP なし → 武道 publication family を shared responsive authority とする
- 書写詳細 PC: `2630:8447`。専用 SP なし → 武道 publication family を shared responsive authority とする
- 単行本一覧 PC/SP: `1656:5309` / `2627:6075`
- 単行本詳細 PC/SP: `1686:5574` / `2628:6964`
- TOP 大会・イベント情報 PC: `1603:7488`


## 8面＋公開 URL / WP owner

| # | family | 面 | 公開 URL | WP | 現行 visual authority |
| --- | --- | --- | --- | --- | --- |
| 1 | イベント | 一覧 | `/event/` | CPT archive `event` | 既存完成面。刊行物作業で回帰させない |
| 2 | イベント | 詳細 | `/event/{slug}/` | CPT single | 既存完成面。刊行物作業で回帰させない |
| 3 | 月刊「武道」 | 一覧 | `/publications/budo/back/` | **page** | PC `1634:10806` / SP `2608:5702` |
| 4 | 月刊「武道」 | 詳細 | `/budo-book/{slug}/` | CPT single | PC `1637:11288` / SP `2608:6933` |
| 4' | 月刊「武道」 | 最新号 | `/publications/budo/latest/` | **page** 1件 | 詳細と shared part |
| 5 | 月刊書写書道 | 一覧 | `/publications/shodo/back/` | **page** | PC `2629:7385`。専用SPなし、武道shared family |
| 6 | 月刊書写書道 | 詳細 | `/shodou-book/{slug}/` | CPT single | PC `2630:8447`。専用SPなし、武道shared family |
| 6' | 月刊書写書道 | 最新号 | `/publications/shodo/latest/` | **page** 1件 | 詳細と shared part |
| 7 | 単行本 | 一覧 | `/publications/budo/books/` | **page** + tax `book` | PC `1656:5309` / SP `2627:6075` |
| 8 | 単行本 | 詳細 | `/tankoubon/{slug}/` | CPT single | PC `1686:5574` / SP `2628:6964` |

刊行物の一覧はネイティブ `/budo-book/` 等ではない。

## イベント ACF（これだけ。他グループは触らない）

JSON: `acf/json/group_event.json`。location = `event`。instructions 空。空値は出力しない。

| ラベル | name | 型 |
| --- | --- | --- |
| 募集状況 | `event_status` | radio（なし / 募集中 / 開催中 / 受付終了） |
| 開催日 | `event_date` | date |
| 時間 | `event_time` | text |
| 入場数 | `event_capacity` | text |
| 入場料 | `event_fee` | text |
| 主催 | `event_host` | text |

会場などは足さない。`event_status` の「なし」はチップを出さない。`group_nbk_*.json` は触らない。

一覧はニュースカードを使わない（Figma `card_event`）。並びは `event_date` の降順（開催日が遠い順）。月フィルタも `event_date`。詳細の表・お申込みは本文。

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
