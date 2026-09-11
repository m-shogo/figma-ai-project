# 最新 Figma vs 前回 Figma — 差分と実装ロードマップ

日付: 2026-09-10  
状態: **比較完了。実装はまだしない。**  
LIVE 比較。スクリーンショット目測だけにしない。

| | fileKey | pages |
| --- | --- | --- |
| 最新（現行正本） | `jqYoPtusYfTeDqRegMCsx3` | PC `0:1` `🎨pc` / SP `114:5409` `🎨sp` |
| 前回 | `FKQaJDu5TZXHoCzPsfP92E` | PC `0:1` `pc` / SP `114:5409` `sp` |

前回 file は 2026-09-10 時点で LIVE 取得できた。Human から追加 URL は不要。

正本は最新 file。この文書は差分と今後の順。実装時は最新 file だけ LIVE 再取得する。

---

## 結論（先に）

ページの骨格（TOP / News / Event / 下層 / Parts / Menu overlay）は **ほぼ同じ node のままコピー＋整理**。新しく増えた実装契約は、PC 上の **実装指示 3枚**。

Theme 側でまだ閉じていない本丸は:

1. 実装指示どおりの **ホバー**（左→右下線、ネガポジ反転、Zoom 100%、タブ=アクティブ、ナビカードの矢印反転）
2. もともと fail-closed だった **残ページ SP / データ契約**（刊行物・単行本・大会3面・参加したい SP 本文・開催日フィールド・Event カレンダー chrome）
3. Human 専任（Form / `parts.php`）

フルページを作り直すフェーズではない。共有ホバーを先に直し、残ページは shared master の差分だけ。

---

## 1. 最新で追加された情報

前回 PC page に **無い**。最新 PC page `0:1` にだけある。

| node | 名前 | 中身 |
| --- | --- | --- |
| `2377:4054` | 実装指示_megaメニュー | 2階層 / 3階層 / 見出し付き3階層 / 4階層のホバー |
| `2377:4360` | 実装指示_ハンバーガーメニュー | テキストリンク / SNS / EN / 右側 |
| `2377:6598` | 実装指示_下層 | ローカルナビ / ナビゲーションカード / ページ内リンク / タブ / 投稿ページネーション / お知らせ一覧 / Zoom |

### Mega

- 二階層目: ホバー（行ハイライト＋右矢印の視覚。文言は「ホバー」のみ）
- 三階層目: **下線が左から右に切り替わる**
- 見出し付き三階層目: 同じく左→右下線。**グレー帯はリンクなし見出し**
- 四階層目: 左→右下線

### ハンバーガー

- テキストリンク: 左→右下線
- SNS: **ネガポジ反転**
- EN: **ネガポジ反転**
- 右側: 左→右下線

### 下層

- ローカルナビ: rest / hover の視覚標本あり。**文言指示は空** → 実装時は視覚を読む。推測で仕様を増やさない
- ナビゲーションカード: 矢印反転、カード下線は左→右に色切替、写真 / no-image は拡大
- ページ内リンク: 矢印反転、下線は左→右に色切替
- タブ: ホバー = アクティブと同様
- 投稿ページネーション: 矢印反転、数字はアクティブと同様
- お知らせ一覧: 左→右下線。注記「デザイン上では最初から下線になっていました。すみません。」→ **rest は下線なし、hover で出す**
- Zoom: 虫メガネエリアを **不透明度 100%**

---

## 2. フレーム差分（PC）

同一 node で高さだけ変わったもの、増減、配置移動。

| 面 | node | 前回 | 最新 | 意味 |
| --- | --- | --- | --- | --- |
| Event archive | `1619:9554` | 1380×2366 | 1380×3075 | **+709px**。カードが増えた sample。UI 系統の新設ではない |
| TOP | `1603:7062` | 1380×6182 | 同じ | 骨格維持 |
| news / post / publications / hardcover / tournament / form / parts 高さ | 各現行 node | 一致 | 一致 | ページ系統は維持 |
| 実装指示 3枚 | `2377:*` | **無い** | **追加** | 今回の本丸 |
| SP 幅 menu | `2297:14268` | PC canvas 上に 375×2982 | **無い** | 最新では SP page の `2169:10017` が SP menu 正本 |
| SP_parts 複製 | `2325:5462` | PC canvas 上 | **無い** | SP page の `1399:19144` だけ使う |
| parts 配置 | `1163:4245` | y=4997 | y=-68 | キャンバス整理。中身高さ 7124 は同じ |
| menu / megamenu / search | `2096:6235` 等 | 散在 | x=-2569 付近に縦積み | 配置整理。実装指示が mega の左に並ぶ |

PC のフルページ ID（`413:2191` news、`1235:6361` post、`1148:6390` 参加したい、`2108:10725` 少年少女 等）は **引き継ぎ**。ただし実装時は最新 file から LIVE 再取得する。

---

## 3. フレーム差分（SP）

| 面 | node | 前回 | 最新 | 意味 |
| --- | --- | --- | --- | --- |
| TOP SP | `446:10020` | 375×8492 | 同じ | 骨格維持 |
| SP menu | `2169:10017` | 375×2982（x=3799） | 同じ寸法（x=4324） | **最新の SP menu 正本**。配置だけ右へ |
| SP_archive / SP_post / SP_form / SP_navigation×3 / SP_parts | 各 node | 寸法一致 | 一致 | 維持 |
| 1380-wide navigation | `2197:5391` | SP canvas 上 1380×3709 | **無い** | PC 幅。SP authority にしない（前回もそう読むべきだった） |
| 1380-wide TOP | `2197:5731` | SP canvas 上 | 残っている | PC 幅。SP TOP 正本は `446:10020` |
| `2297:14268` | — | 前回は **PC canvas** 側 | 最新の両 page に無い | 使わない |

残ページ（刊行物・単行本・大会3面・地域研修）の専用 SP full-page は、最新でも **無い**。UNDETERMINED のまま。

---

## 4. Theme 現状 vs 最新 Figma

状態の読み:

- DONE — Theme owner があり、今回の新規指示で壊れない
- PARTIAL — owner はあるが、実装指示のホバーと不一致、または sample/データ不足
- GAP — 最新指示に対して未実装、または rest/hover が仕様と逆
- FAIL_CLOSED — Figma はあるが WP データ / template / SP counterpart が足りない。発明しない
- HUMAN — Agent 禁止
- UNDETERMINED — 最新 SP 専用 frame が無い

| 面 | PC | SP | Theme owner | 状態 | 今回の差分 |
| --- | --- | --- | --- | --- | --- |
| Header / GNavi | `2169:10597` 内 | `446:10020` | `_header.php` / `global_header.css` | PARTIAL | mega ホバーが新指示 |
| PC mega | `2206:9672` 系 | — | `global_navigation.css` | GAP | 左→右下線、見出し非リンクが未一致。現行は opacity / font-weight 中心 |
| PC hamburger overlay | `2096:6235` | — | `global_navigation.css` | GAP | テキスト左→右下線、SNS/EN ネガポジ |
| SP hamburger | — | `2169:10017` | `module_menu.css` | GAP | 同上を SP でも確認 |
| Search overlay | `2295:8023` | header 内 | `module_search-01.css` | PARTIAL | 今回指示対象外。既存 QA 維持 |
| Footer | `2106:9471` | `2189:10106` | `_footer.php` / `global_footer.css` | PARTIAL | 本番 URL Human 待ち。今回指示対象外 |
| TOP | `1603:7062` | `446:10020` | `front-page.php` / `top_*` | PARTIAL | 骨格維持。カレンダーは FullCalendar 契約どおり |
| News archive | `413:2191` | `1399:14225` | `archive.php` / `module_newsList-01.css` | GAP | rest 下線をやめ、hover で左→右 |
| News / Event pager | Parts pager | 同上 | `_pagination.php` / `module_newsList-01.css` | GAP | 数字=アクティブ、矢印反転 |
| Event archive | `1619:9554` | 専用無し | `_event-archive.php` | PARTIAL + FAIL_CLOSED | 高さ増は sample。年/月カレンダー chrome は WP owner 無しのまま |
| Event detail | `1632:10382` | 専用無し | `single.php` + event | PARTIAL | SP 専用 UNDETERMINED。開催日フィールド無しは fail-closed |
| Event カード日付 | — | — | `module_newsCard-01.css` | FAIL_CLOSED | `開催日：` ラベルは ACF 無し |
| Parts | `1163:4245` | `1399:19144` | `css/blocks/` `css/module/`。`parts.php` は読込のみ | PARTIAL | ホバー指示が下層と重なる |
| Navigation Large | `1145:6042` 等 | `1455:5489` 等 | `wp-block-navigation-style.css` | GAP | 現行は画像 scale + 本文 opacity。新指示は矢印反転 + 下線切替 + 写真拡大 |
| ページ内リンク | Parts | Parts | `wp-block-inPageLink-style.css` | GAP | 現行は opacity。新指示は矢印反転 + 下線 |
| タブ | Parts `1663:5661` | Parts | `module_tab.css` / `wp-block-tabs-style.css` | GAP | 新指示は hover=active。現行 hover は 70% mix |
| Zoom | Parts | Parts | `module_zoom-button.css` | GAP | 現行 hover はアイコン opacity 0.8。新指示は 100% |
| Local Nav | `1216:6311` | 専用 UNDETERMINED | `local_navigation.css` | PARTIAL | 指示行に文言無し。視覚だけ |
| 大会・行事に参加したい | `1148:6390` | `1468:7508` shell | Navigation Large 再利用 | FAIL_CLOSED | SP 本文が shell のみ。PC を縮めない |
| 研修センター | `1137:5348` | `1468:6595` | 既存 Gutenberg | PARTIAL | ページ専用 CSS を増やさない方針維持 |
| 地域研修 | `1203:4865` | 専用無し | 既存 heading/list/button + Local Nav | UNDETERMINED SP | 最新でも SP full-page 無し |
| 刊行物 / Backnumber | `1634:10806` / `1637:11288` | 専用無し | 未確定 template | FAIL_CLOSED | データ owner / 1カラム vs sidebar 衝突 |
| Hardcover | `1656:5309` / `1686:5574` | 専用無し | 未確定 | FAIL_CLOSED | 商品 CPT を発明しない |
| 大会3面 | `2108:10725` / `10871` / `10952` | 専用無し | 既存 composition | FAIL_CLOSED SP | ページ専用 CSS 先作り禁止 |
| 特集 `/feature/` | Figma に専用無し | — | CPT 無し | FAIL_CLOSED | マップの一覧 URL だけ |
| Form | `1156:7728` | `1451:5737` | Formidable | HUMAN | 触らない |
| `parts.php` | — | — | 参照ソース | HUMAN | 変更なし |
| Slider | Parts | Parts | `acf/slider` + `wp-block-slider-style.css` | PARTIAL | 2026-09-04 で ACF 許可済。見た目 QA は残る |

ホバーの共通ルール（既存 Frontend 契約と一致）:

- rest から border / 下線の厚さを確保し、hover で初めて寸法を足して箱をずらさない
- `any-hover` gate、keyboard focus 同等、touch fallback
- 期間は既存 duration、無ければ `0.3s`

---

## 5. やる事リスト（実装は次フェーズ）

優先は **共有ホバー**。ページ量産より先。

### Wave A — 実装指示ホバー（PC → 必要なら SP 同じ owner）

1. Mega 2階層目のホバー行（既存 `::after` / weight 600 を指示に合わせて再検証）
2. Mega 3階層目・4階層目の左→右下線
3. Mega 見出し付き3階層: グレー帯はリンクにしない
4. ハンバーガー テキスト / 右側の左→右下線
5. ハンバーガー SNS / EN のネガポジ反転（現行 opacity では不足）
6. Navigation Large: 矢印反転 + カード下線切替 + 画像拡大（opacity 減をやめるか指示どおりに置換）
7. ページ内リンク: 矢印反転 + 下線切替
8. タブ: hover = active
9. 投稿ページネーション: 矢印反転、数字 = active
10. お知らせ一覧: rest 下線なし、hover 左→右下線
11. Zoom: 虫メガネ 100%（現行 0.8 をやめる）
12. Local Nav: 文言が空なので LIVE 視覚だけ。新仕様を発明しない

各単位は現行どおり **SP 確認 → SP → SP QA → PC → PC QA**。

### Wave B — Event archive の中身増

- 高さ +709px は sample カード増。新コンポーネントを先に作らない
- 年/月カレンダー chrome と `カレンダーで見る` は WP owner 無し → 発明しない。Human が query 面を決めるまで FAIL_CLOSED

### Wave C — 残ページ（shared master 差分のみ）

- 刊行物 / 単行本 / 大会3面: PC は現行 frame で目視。ページ専用 CSS 禁止。データ契約が無い repeat は CMS 化しない
- 参加したい SP: shell のみ。PC 本文を流し込まない。Human が SP 本文 authority を出すか「shared SP master で閉じる」と言うまで待つ
- 地域研修・大会 SP: 最新でも dedicated frame 無し。UNDETERMINED

### Wave D — Human / データ

- Form / Formidable
- `parts.php`
- 開催日・募集ステータス ACF（無い → UI 出さない）
- `/feature/` CPT
- SNS / アクセス / 問い合わせ本番 URL
- 刊行物の template owner（`page.php` vs 1カラム 1040）

### やらない

- 前回 file `FKQaJDu5TZXHoCzPsfP92E` を実装の LIVE 源にしない
- `2297:14268` / `2197:5391` / `2325:5462` / 旧 `560:*` を復活させない
- 実装指示を理由に TOP や下層を redesign しない（VISUAL_FROZEN な確定見た目は維持し、hover だけ足す）
- Form / `parts.php` を触らない

---

## 6. 推奨実装順

```text
1. Wave A 共有ホバー（mega → hamburger → 下層パーツ）
2. Wave A の News archive / pager / zoom を同じ owner で閉じる
3. 実 WP で PC / SP の該当 interaction QA
4. Wave B は sample 増なので触らない（カレンダーだけ Human 待ち）
5. Wave C は Human の SP / template 決定が先。決まった面だけ shared master 差分
6. Wave D は Human
```

依存: mega ホバーは Header 既存 owner。Navigation Large は参加したい / 9種目 / 研修センターが再利用する。先にカードホバーを直すと残ページが追随する。

---

## 7. 比較方法の限界

- 全テキスト・全画像のピクセル diff はしていない。top-level 寸法 + 実装指示 LIVE + Event スクリーンショット
- Event 以外のフルページ内コピー変更は UNDETERMINED。実装単位に入るとき最新 `get_design_context` で取る
- ローカルナビ指示行は視覚のみ
