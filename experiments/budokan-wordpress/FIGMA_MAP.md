# Figma node map（nipponbudokan）

File: `fKYDn9ikpJk1nW7IWFtaUx`  
Pages: PC `0:1` / SP `114:5409`

デザイン調整版（2026-08-31 Human Authority）。実装時は都度取り直す。**保存済みnode-idが解決できても、それだけで現行authorityとはみなさない。まず `CURRENT_AUTHORITY.md` のfile keyを確認し、current pageのtop-level frameを再走査し、対象full-page frameを`get_design_context`で再取得する。**

旧 file `w7SGVY63FuW6JpaQVKjxm2` / `RfAQQ28V1HGaeIcpgRmQq1` の値は引き継がない。

## 優先ノード

| 用途 | 面 | node-id | name |
| --- | --- | --- | --- |
| TOP（現行候補） | PC | `1603:7062` | topdesign04 |
| Header コンポーネント | PC | `2209:9850` | header（1380×100、左340ダークロゴレール） |
| Header instance 例 | PC | `2182:8241` | header |
| Header SP 閉じ | SP | `446:10020` | SP TOP 先頭（header-sp 相当） |
| Header SP 開き | SP | `2169:10018` | header-sp（menu 2169:10017 内） |
| Footer コンポーネント | PC | `2106:9471` | footer_subpage |
| Footer コンポーネント | SP | `2189:10106` | footer-sp |
| Page Title | PC | `2169:10270` | page_title-pc（金帯 220 / Mincho 32 Bold 白） |
| Page Title | SP | `1399:18544` | page_title-sp（金帯 180 / Mincho 24 Bold 白） |
| Page Title 画像付き | PC | `1450:5147` | page_title-img-pc（写真 1320×320 @x60 / 白 Mincho 32 パネル 360×79） |
| Page Title 画像付き | SP | `1465:6339` | page_title-img-sp（写真 375×240 / 白 Mincho 24 パネル 327×66 @y207） |
| Breadcrumb | PC | `1235:6479` | bread（Zen Kaku 13 / gap 10 / px 64 py 24） |
| Breadcrumb | SP | `1451:5316` | bread（Zen Kaku 13 / gap 8 / px 24 py 20） |
| Footer 例 | PC | `1901:14268` | footer_subpage |
| Footer SP 下層 | SP | `560:2524` / `560:188` 末尾 | news_sp / join_sp |
| パーツ集 | PC | `1163:4245` | parts |
| パーツ集 | SP | `1399:19144` | SP_parts |
| お知らせ archive | PC | `413:2191` | news |
| お知らせ archive | SP | `1399:14225` | SP_archive（full-page redesign authority） |
| お知らせ archive | SP | `560:2524` | news_sp（older named page; corroborating evidence only） |
| お知らせ detail | PC | `1235:6361` | post |
| お知らせ detail | SP | `1451:5197` | SP_post |
| Event archive | PC | `1619:9554` | event |
| Event detail | PC | `1632:10382` | event_detail |
| 大会・行事に参加したい | PC | `1148:6390` | navigation（本文あり） |
| 大会・行事に参加したい | SP | `1468:7508` | SP_navigation（shellのみ、本文authority未作成） |
| 大会に参加したい（別ページ） | SP | `560:188` | join_sp（本文あり。PC counterpart未確認） |
| 研修センター | PC | `1137:5348` | navigation（page title / body / pricing / breadcrumb で識別） |
| 研修センター（現行SP counterpart） | SP | `1468:6595` | SP_navigation（PCと同じ施設案内→料金→お知らせ→ご利用案内構造） |
| 研修センター（旧SP案・参照注意） | SP | `560:377` | training_center_sp（料金詳細を欠く旧案） |
| 地域社会武道指導者研修会 | PC | `1203:4865` | page（title/body/breadcrumbでSP counterpart確認） |
| 地域社会武道指導者研修会 | SP | `560:537` | training_sp |
| 地域社会武道指導者研修会 Local Nav | PC | `1216:6311` | local_nav |
| 地域社会武道指導者研修会 SP navigation | SP | `560:632` | selector/dropdown-style navigation area |
| 現代武道9種目紹介 | PC | `1145:6042` | navigation（9枚の Navigation Large を3列×3段） |
| 現代武道9種目紹介 | SP | `1455:5489` | SP_navigation（同9枚を1列表示） |
| SP TOP 候補 | SP | `446:10020` / `2169:10017` | SP / menu |

## Current top-level re-resolution evidence（2026-08-31）

`CURRENT_AUTHORITY.md` の現行file `fKYDn9ikpJk1nW7IWFtaUx` をライブ再取得した結果。Header は PC `2209:9850` / SP open `2169:10018`。旧 file `w7SGVY63FuW6JpaQVKjxm2` の測定値は使わない。

Current PC page `0:1` top-level frames include:

- `413:2191` `news`
- `1619:9554` `event`
- `1632:10382` `event_detail`
- `1634:10806` `publications`
- `1637:11288` `publications_detail`
- `1656:5309` `hardcover`
- `1686:5574` `hardcover_detail`
- `1235:6361` `post`
- `1137:5348` / `1145:6042` / `1148:6390` `navigation`
- `1156:7728` `form`
- `1163:4245` `parts`
- `1203:4865` / `1206:5446` `page`
- `1700:7080` / `2108:10725` `page_youth-budo-tournament*`
- `1709:8313` / `2108:10871` `page_kagami-biraki*`
- `1714:8761` / `2108:10952` `page_kobudo-demonstration*`
- `1603:7062` `topdesign04`

Current SP page `114:5409` top-level frames include:

- `446:10020` / `2096:9573` `SP`
- `1399:14225` `SP_archive`
- `1451:5197` `SP_post`
- `1451:5737` `SP_form`
- `1455:5489` `SP_navigation`
- `1468:6595` / `1468:7508` `SP_navigation`
- `1399:19144` `SP_parts`
- `560:188` `join_sp`
- `560:377` `training_center_sp`
- `560:537` `training_sp`
- `560:677` `backnumber_sp`
- `560:2524` `news_sp`
- `2096:9496` `TopPage PlanB SP①`

These lists are **discovery evidence, not automatic implementation authority**. Resolve page identity from title/body/breadcrumb and then call `get_design_context` on the selected full-page frame before implementation.

## 実装順との対応

1. Header/Footer → header instance + footer_subpage + SP menu
2. パーツ集 → parts / SP_parts（本文 markup は Theme の `parts.php` 正本）
3. 以降のページ → 固定ページ順ではなく master/derivative 依存と reuse-before-build で選択
4. 研修センター → `templates/template-oneColumn.php` + Gutenberg/既存 Parts composition が現行shell候補。`page.php` はPCでsidebarを持つ2-column shellのため、このFigma pageの960px centered bodyとは一致しない。production template assignmentはWordPress authority待ち。詳細は `TRAINING_CENTER_DEPENDENCY_AUDIT.md`
5. 地域社会武道指導者研修会 → `page.php` + Gutenberg/既存 shared block composition が現行候補。詳細は `REGIONAL_TRAINING_DEPENDENCY_AUDIT.md`
6. 現代武道9種目紹介 → `page.php` + 既存 Navigation Large master のcomposition。詳細は `MODERN_BUDO_DEPENDENCY_AUDIT.md`
7. TOP → topdesign04 + SP TOP（既存 master の thin derivative を優先）

## 注意

- PC canvas 幅は 1380。案件契約の body min-width は 1280
- form フレームあり → Human 担当のため Agent は触らない
- Figma の top-level layer name だけで画面を断定しない。汎用名・旧名が残るため、page title / 本文 / breadcrumb / global shell を突き合わせて authority を確定する
- 現行file keyは `CURRENT_AUTHORITY.md` の `fKYDn9ikpJk1nW7IWFtaUx`。`w7SGVY63FuW6JpaQVKjxm2` / `RfAQQ28V1HGaeIcpgRmQq1` は旧lineageとして参照可能でも、現行実装authorityへ自動昇格させない
- 2026-08-31の再監査では、旧lineage `RfA...` で `1468:6595` が解決しなかった一方、当時の現行 `w7...` では同nodeが解決した。その後 Human が `fKYD...` へ切り替えた。file keyを取り違えると「node削除」と誤診するため、node失敗時はまずfile authorityを確認する
- News archive/detailのSP redesign node `1399:14225` / `1451:5197` は現行 file で再確認してから使う。older named frame `560:2524` をcurrent redesignの代替として黙って使わない
- canonical SP pageにはPC Event archive/detailに対応すると証明できる専用SP frameがまだない。News SPをEventへ流用せず、SP authorityが出るまでfail closedとする
- `大会・行事に参加したい` はPC `1148:6390` / SP `1468:7508` でpage identityは一致するが、現行SPはshellのみで本文authorityがない
- `560:188` (`join_sp`) は `大会に参加したい` という別の本文付きSPページ。`1148:6390` の不足SP本文として流用しない
- 研修センターSPは `1468:6595` をPC `1137:5348` のresponsive counterpartとして扱う。両者は施設案内、6枚gallery、料金詳細、お知らせ、ご利用案内の構造と料金改定内容が対応する
- `560:377` は同名ページの旧SP案。料金詳細を欠くため最新実装authorityへ昇格させない
- 研修センターのshared shellはPCで `templates/template-oneColumn.php` が最も一致する一方、SP Figmaの本文railは約327px（24px inset）、shared `_content` railはTheme token上335px（20px inset）。この8px差をglobal padding変更で吸収しない。canonical page assignment/editor contentを得てruntime diffしてからscoped derivative要否を決める
- 地域社会武道指導者研修会はSP `560:537` / PC `1203:4865`。この実ページではPC `local_nav` に対してSPは4列navの縮小版ではなく、`560:632` のselector/dropdown-style navigationへinteraction formが切り替わる
- 現代武道9種目紹介はSP `1455:5489` / PC `1145:6042`。両面とも既存Navigation Largeとgeometry/情報構造が一致するため、ページ専用cardを作らない
