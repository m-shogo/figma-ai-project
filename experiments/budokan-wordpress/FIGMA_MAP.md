# Figma node map（nipponbudokan）

File: `w7SGVY63FuW6JpaQVKjxm2`  
Pages: PC `0:1` / SP `114:5409`

デザイン変更前提。実装時は都度取り直す。

## 優先ノード

| 用途 | 面 | node-id | name |
| --- | --- | --- | --- |
| TOP（現行候補） | PC | `1603:7062` | topdesign04 |
| Header コンポーネント例 | PC | `1399:12372` | header (instance) |
| Header SP 閉じ | SP | `446:10020` | SP TOP 先頭 |
| Header SP 開き | SP | `2096:9573` | SP TOP（menu open） |
| SP メニュー展開例 | SP | `2096:9496` | TopPage PlanB SP①（別案） |
| Footer 例 | PC | `1901:14268` | footer_subpage |
| Footer SP 下層 | SP | `560:2524` / `560:188` 末尾 | news_sp / join_sp |
| パーツ集 | PC | `1163:4245` | parts |
| パーツ集 | SP | `1399:19144` | SP_parts |
| 研修センター | PC | `1137:5348` | navigation（layer name は汎用名。page title / body / breadcrumb で研修センター画面と確認） |
| 研修センター（現行SP counterpart） | SP | `1468:6595` | SP_navigation（PCと同じ施設案内→料金→お知らせ→ご利用案内構造） |
| 研修センター（旧SP案・参照注意） | SP | `560:377` | training_center_sp（料金詳細を欠き、旧料金改定文言を含む） |
| SP メニュー展開例 | SP | `2096:9496` | TopPage PlanB SP① |
| SP TOP 候補 | SP | `446:10020` / `2096:9573` | SP |

## 実装順との対応

1. Header/Footer → header instance + footer_subpage + SP menu
2. パーツ集 → parts / SP_parts（本文 markup は Theme の `parts.php` 正本）
3. 以降のページ → 固定ページ順ではなく master/derivative 依存と reuse-before-build で選択
4. 研修センター → `page.php` + Gutenberg/既存 Parts composition が現行候補。詳細は `TRAINING_CENTER_DEPENDENCY_AUDIT.md`
5. TOP → topdesign04 + SP TOP（既存 master の thin derivative を優先）

## 注意

- PC canvas 幅は 1380。案件契約の body min-width は 1280
- form フレームあり → Human 担当のため Agent は触らない
- Figma の top-level layer name だけで画面を断定しない。汎用名・旧名が残るため、page title / 本文 / breadcrumb / global shell を突き合わせて authority を確定する
- 研修センターSPは `1468:6595` をPC `1137:5348` のresponsive counterpartとして扱う。両者は施設案内、6枚gallery、料金詳細、お知らせ、ご利用案内の構造と料金改定内容が対応する
- `560:377` は同名ページの旧SP案として残っている。最新実装authorityへ昇格させない
