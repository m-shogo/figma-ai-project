# 当面4 family（一覧＋詳細）

更新: 2026-10-02  
Figma visual authority: `D4c05PxMEw6oZxgRggfcks`（Human 2026-10-02。PC `0:1` / SP `114:5409`）  
イベント一覧は PC `1619:9554` / SP `2991:11982`。それ以前の Figma file は historical/audit 参照専用。  
正本の詳細: [`PUBLICATIONS_IMPLEMENTATION_STATUS.md`](PUBLICATIONS_IMPLEMENTATION_STATUS.md) / [`PUBLICATIONS_CPT_ARCHITECTURE.md`](PUBLICATIONS_CPT_ARCHITECTURE.md) / [`DIRECTORY_MAP.md`](DIRECTORY_MAP.md) / [`FIGMA_MAP.md`](FIGMA_MAP.md)  
溜め質問: [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)

## 順番（現在の Human authority）

```text
イベント 一覧は Human 2026-10-02 の新デザインへ更新中。PC `1619:9554` / SP `2991:11982` を正本にする。詳細は別指示まで現行を維持
武道 一覧・詳細は Human 2026-09-24 で終了。次の指示があるまで触らない。最新号は同じ詳細部品なので、指示があるまでまとめて触らない
単行本 一覧・詳細は Human 2026-09-25 で終了。次の指示があるまで触らない
→ 月刊書写書道は publication family として一覧／最新号／詳細 PC/SP を続ける
→ 完了ゲート後のみ TOP
```

武道と月刊書写書道は同一レイアウト family として扱い、visual rule / CSS owner を共有する。書写は PDF back のみではなく、一覧・最新号・public single を PC/SP とも実装対象とする。旧「書写 single はまだ作らない」「書写 Figma なし」は superseded。

## 現行 Figma authority

Human Authority 2026-10-02:

- file: `D4c05PxMEw6oZxgRggfcks`
- PC page: `0:1`
- SP page: `114:5409`
- イベント一覧 PC: `1619:9554`
- イベント一覧 SP: `2991:11982`
- 旧 file / 旧 node は historical/audit 参照専用。実装値は必ず上記 file から LIVE 再取得する。


## 8面＋公開 URL / WP owner

| # | family | 面 | 公開 URL | WP | 前 file の frame（新 file では使わない） |
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

## イベント ACF / 一覧契約

イベント名は WordPress 投稿タイトル。カテゴリは既存 taxonomy `event_cat` が owner で、ACF に重複カテゴリフィールドを作らない。空値は出力しない。

| ラベル | name | 型 |
| --- | --- | --- |
| 投稿選択 | `post_type` | radio（詳細 / リンク / なし） |
| 開催日 | `event_date` | date |
| 開場時間 | `event_open_time` | time |
| 開会時間 | `event_start_time` | time |
| 問合せ先 | `event_contact` | textarea |

「リンク」の場合のみ既存 `postType_url` / `postType_target` を使用する。旧 `event_status` / `event_time` / `event_capacity` / `event_fee` / `event_host` は現行イベント表示では使わない。

一覧は PC `1619:9554` / SP `2991:11982`。カテゴリタブは `全て / 一般 / 武道 / 書道`。選択月内を `event_date` 昇順、10件/ページ。PCは12か月、SPは前月・当月・翌月の3か月を表示する。イベント行は1カラムの交互背景で、旧2カラムカードへ戻さない。


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
