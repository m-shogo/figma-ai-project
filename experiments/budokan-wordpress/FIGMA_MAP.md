# Figma node map（nipponbudokan）

File: `FKQaJDu5TZXHoCzPsfP92E`  
Pages: PC `0:1` / SP `114:5409`

Human-selected current authority. Last live re-scan: **2026-09-03**.

実装時は保存済みnode-idを信用して始めない。必ず `CURRENT_AUTHORITY.md` のfile keyを確認 → current pageのtop-level frameを再走査 → 対象full-page frameを `get_design_context` で再取得する。

旧 file `fKYDn9ikpJk1nW7IWFtaUx` / `w7SGVY63FuW6JpaQVKjxm2` / `RfAQQ28V1HGaeIcpgRmQq1` のnode値・計測は historical evidence であり、current implementation authorityへ引き継がない。

## 優先ノード

| 用途 | 面 | node-id | name / status |
| --- | --- | --- | --- |
| TOP | PC | `1603:7062` | topdesign04 |
| Header シンボル | PC | `1086:3582` | header（component `2169:10597` 内） |
| Header in megamenu | PC | `2209:9850` | header（megamenu `2206:9672` 内。閉じヘッダー単体ではない） |
| Header instance 例 | PC | `2182:8241` | header |
| Header SP 閉じ | SP | `446:10020` | SP |
| Header SP 開き | SP | `2297:14268` | menu（旧 `2169:10017` は退役） |
| PC menu overlay | PC | `2096:6235` | menu |
| PC megamenu | PC | `2206:9672` / `2225:10512` / `2225:10730` / `2228:10923` | megamenu |
| PC search overlay | PC | `2295:8023` | search |
| Footer コンポーネント | PC | `2106:9471` | footer_subpage（下層・地図なし） |
| Footer コンポーネント | SP | `2189:10106` | footer-sp（下層・地図なし） |
| Page Title | PC | `2169:10270` | page_title-pc |
| Page Title | SP | `1399:18544` | page_title-sp |
| Page Title 画像付き | PC | `1450:5147` | page_title-img-pc |
| Page Title 画像付き | SP | `1465:6339` | page_title-img-sp |
| パーツ集 | PC | `1163:4245` | parts |
| パーツ集 | SP | `1399:19144` | SP_parts |
| お知らせ archive | PC | `413:2191` | news |
| お知らせ archive | SP | `1399:14225` | SP_archive |
| お知らせ detail | PC | `1235:6361` | post |
| お知らせ detail | SP | `1451:5197` | SP_post |
| Event archive | PC | `1619:9554` | event |
| Event detail | PC | `1632:10382` | event_detail |
| 大会・行事に参加したい | PC | `1148:6390` | navigation（3709h。SP canvas 上の `2197:5391` は PC 幅のため SP authority にしない） |
| 大会・行事に参加したい | SP | `1468:7508` | SP_navigation |
| 研修センター | PC | `1137:5348` | navigation_training-center |
| 研修センター | SP | `1468:6595` | SP_navigation |
| 現代武道9種目紹介 | PC | `1145:6042` | navigation |
| 現代武道9種目紹介 | SP | `1455:5489` | SP_navigation |
| 地域社会武道指導者研修会 | PC | `1203:4865` | page |
| 地域社会武道指導者研修会 | SP | — | dedicated current full-page counterpart未確認。旧lineage nodeを自動流用しない |

## 残ページ current PC authority

2026-09-03 のlive re-scanで、以下は current PC page `0:1` に存在する。

| Page family | node-id | current status |
| --- | --- | --- |
| 刊行物 / Backnumber | `1634:10806` | PC full-page current |
| 刊行物 detail | `1637:11288` | PC full-page current |
| Hardcover / 単行本 | `1656:5309` | PC full-page current |
| Hardcover detail | `1686:5574` | PC full-page current |
| 全日本少年少女武道錬成大会 | `2108:10725` | PC full-page current |
| 鏡開き式・武道始め | `2108:10871` | PC full-page current |
| 日本古武道演武大会 | `2108:10952` | PC full-page current |

旧 tournament IDs `1700:7080` / `1709:8313` / `1714:8761` はcurrent mappingとして使わない。

### 残ページのSP状態

Current SP page `114:5409` を2026-09-03にlive re-scanした結果、上記7面に対応すると証明できる専用SP full-page frameは **存在を確認できなかった**。

したがって残ページでは：

- PCは上記current full-page frameで目視・runtime diff可能
- SPは current pixel-perfect authority = **UNDETERMINED**
- old `560:*` Backnumber/Training/News系nodeを復活させない
- News SP、SP_navigation、別ページSPを見た目が似ているだけで代用しない
- Themeの既存responsive masterが効く場合も、それは「shared Theme behavior」であり「current page-specific SP Figma parity」とは呼ばない
- Humanがcurrent SP counterpartまたは「shared SP mastersをownerとする」と明示した時点でSP closureを再開する

## Current top-level re-resolution evidence（2026-09-03）

`CURRENT_AUTHORITY.md` の現行file `FKQaJDu5TZXHoCzPsfP92E` をlive取得した結果。旧 file の保存済みnodeは使わない。

### PC page `0:1`

Current top-level frames include:

- `1603:7062` `topdesign04`
- `413:2191` `news`
- `1619:9554` `event`
- `1632:10382` `event_detail`
- `1634:10806` `publications`
- `1637:11288` `publications_detail`
- `1656:5309` `hardcover`
- `1686:5574` `hardcover_detail`
- `1235:6361` `post`
- `1137:5348` `navigation_training-center`
- `1145:6042` / `1148:6390` `navigation`
- `1156:7728` `form`
- `1163:4245` `parts`
- `1203:4865` / `1206:5446` `page`
- `2108:10725` `page_youth-budo-tournament-02`
- `2108:10871` `page_kagami-biraki-02`
- `2108:10952` `page_kobudo-demonstration-02`
- `2096:6235` `menu`
- `2169:10597` `component`
- `2206:9672` / `2225:10512` / `2225:10730` / `2228:10923` `megamenu`
- `2295:8023` `search`

### SP page `114:5409`

Current top-level frames observed in the same live re-scan include:

- `446:10020` `SP`
- `2297:14268` `menu`
- `1399:14225` `SP_archive`
- `1451:5197` `SP_post`
- `1451:5737` `SP_form`
- `1455:5489` `SP_navigation`
- `1468:6595` `SP_navigation`
- `1468:7508` `SP_navigation`
- `1399:19144` `SP_parts`
- `2197:5391` `navigation`（1380-wide frame on this canvas; SP authorityと即断しない）
- `2197:5731` `topdesign04`（1380-wide frame on this canvas; SP authorityと即断しない）

旧 `560:*` lineage は current SP top-level に無い。復活させない。

These lists are discovery evidence, not automatic implementation authority. Page identityは page title / body / breadcrumb / global shell を突き合わせ、full-page `get_design_context` で確定する。

## 残ページのreuse-before-build観察

Current PC full-page contextを再取得した範囲では、残ページは新しいpage systemを要求していない。

### Publications / Publications detail

主に既存masterのcomposition：

- gold page title
- body texture
- h2 / h3 / h4
- standard button / CTA
- details/help panel
- ordered/unordered list
- white bordered boxes
- breadcrumb / footer

Repeated issue rowは見た目上繰り返していても、CPT/ACF Repeaterの証拠ではない。canonical editor/data ownerを確認するまでデータ構造を発明しない。詳細は `BACKNUMBER_DEPENDENCY_AUDIT.md`。

### Hardcover

主に既存masterのcomposition：

- gold page title
- h2 / h3
- standard detail link
- page-internal links
- repeated cover/title/author/price cards
- standard button

Figma内の後半カテゴリにはplaceholder的な重複文言もあるため、Figmaはlayout authorityとして使い、商品コンテンツのcanonical data contractとはみなさない。

### Tournament pages

`2108:10725` のcurrent full-page contextでは、本文・gallery・h3・table・list・standard button/PDF action・image+h4+text card・separator・Local Nav・breadcrumb/footerの組み合わせで構成される。

ページ固有CSSを先に作る理由はない。既存master composition → real runtime diff → 差が証明された箇所だけ最小derivative、の順を守る。

## 実装順との対応

1. Header / Footer → shared owners
2. Parts → `parts` / `SP_parts`（Theme `parts.php` はHuman ownerのため変更しない）
3. News / Event / Local Nav →既存ownerを再利用
4. 残ページ → PC current full-page authorityとreal WordPress runtimeを比較し、shared masterで閉じる差分だけ修正
5. SP専用authorityが無い残ページ → fail closed。旧nodeや別ページSPを流用しない
6. Slider → Humanが既存editor/data ownerを決めるまで保留。Swiper存在だけを理由にACFを新設しない
7. Event Calendar →最後。FullCalendar + Google Calendarの既存ownerを使い、ID/key Human待ち。自前UI禁止
8. Form / Formidable / `parts.php` → Human担当

## 注意

- PC canvas 幅は1380。案件契約のbody min-widthは1280
- Form frameは存在するがHuman担当のためAgentは触らない
- Searchはheader icon authorityまで。結果一覧を勝手に設計しない
- h1 / h5 / h6、nav-small、dropdown labelはcurrent Parts標本/契約がない限り発明しない
- top-level layer nameだけでpage identityを断定しない
- current file keyは必ず `CURRENT_AUTHORITY.md` から読む
- old lineageのnode IDが文書・履歴・過去PRに残っていてもcurrentへ自動昇格させない
- current nodeが消えた/見つからない場合、別fileの同nodeを探して代用せず、まずHuman-selected fileとcurrent pageを再確認する
- current SP authorityが不足しているページを「PCを縮めれば同じ」と決め打ちしない
- page-specific CSSは最後の手段。shared master / existing Gutenberg / Theme block CSS / current templatesで閉じられるかを先に確認する
