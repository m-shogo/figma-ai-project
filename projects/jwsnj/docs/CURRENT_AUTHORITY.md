# Current Authority

## Figma

- fileKey: `K3SANPVHIEerfYBQtM4lXF`
- Figma ページ: PC = `0:1` / SP = `263:12`
- 更新履歴（古い fileKey は SUPERSEDED と書いて残す）: なし

### ページ別 node（2026-11-20 に Figma で名前を確認）

| ページ | PC | SP | 備考 |
|---|---|---|---|
| TOP | `114:28` topdesign | `279:2136` top_sp | |
| TOP 実装指示書 | `294:852` 実装指示_トップページ | — | hover と配置の指示。`docs/SPEC.md` に転記 |
| メニュー展開 | `599:2726` menu_open | `480:3954` menu_sp | PC はドロップダウン、SP はハンバーガー |
| パーツ集 | `339:23` parts | `433:2015` parts_sp | |
| 記事一覧（アーカイブ / カテゴリー一覧） | `390:666` archive | `478:2615` archive_sp | Human から届いた PC リンクは `339-23`（パーツ集）だった。要確認 |
| 記事詳細 | `392:1279` single | `480:3566` single_sp | |
| 固定ページ | `384:1046` page | `445:3245` page_sp | PC だけ SideNavigation `476:1741` あり |
| コース紹介（下層） | `534:1282` course | なし | まだ作らない（Human 2026-11-20） |
| OGP | `294:1629` ogp | — | |

TOP の主なパーツ（PC）:

| パーツ | node |
|---|---|
| メインビジュアル画像 | `184:797` pic（MV `114:29` の中） |
| CTA | `134:823` cta |
| 重要なお知らせ | `114:349` Notice |
| Course | `114:635` course |

### Figma で読めなかったもの

- コメント: API が 0 件を返す（UNDETERMINED）。メインビジュアルのコメント（director.all）は Human が転記した（`docs/SPEC.md`）。ほかのコメントがあれば Human から聞く。

## Theme

- 正本 Theme: `theme/`（WordPress 上の theme 名 `jwsnj`）
- ベース: CODIA `f-codiaTheme-block-in-vite`（https://github.com/CODIA-Corp/f-codiaTheme-block-in-vite ）commit `f347c05` の `wp/wp-content/themes/codiatheme-block-in-vite-theme/` を 2026-11-20 に取り込み。変えたのは `style.css` の Theme Name だけ
- 書き方はベースに倣う（Human 2026-11-20）。ベースの README の CSS 規則（変数 `--` / 個別 `--_`、HTML タグに直接スタイルを当てない、入れ子は擬似要素・状態・メディアクエリ等だけ、ファイル名 = ブロック名、PHP と HTML を分ける）
- Vite（画像の WebP/AVIF 変換と自動リロード）は案件直下: `package.json` / `vite.config.mjs` / `vite-plugins/` / `src/images/`。`src/images/` の画像が `theme/images/` へ変換される
- 取り込んでいないもの: ベースの `docker/`（この repo の `runtime/wordpress/` を使う）、FTP デプロイ workflow（CODIA 開発サーバー向け）、サンプル記事 XML、`wp/php/php.ini`
- 参照 Theme: `reference/`（編集禁止）
- 触ってはいけないファイル: まだなし（`guard.json`）

## CMS / ACF

- 既存 field group（ベース Theme の `theme/acf/json/`）: in_page_link / navigation_large / navigation_small / post_list / post_select / seo_setting / tag_setting / top_banner / top_notice / top_slider / visual_setting / visual_setting_post_type。TOP の項目はまずこれらに合うか確認する。ここに無いものは Human に確認してから作る
- 既存 ACF ブロック: `theme/acf/blocks/`（customPostList / inPageLink / navigationLarge / navigationSmall / tabContainer / tabPanel）
- `docs/SPEC.md` に書いた TOP の編集項目は Human の指示（2026-11-20）。field 名・置き場所はベース Theme に合わせる
- 管理画面で作るもの: メニュー 3 つ（PC ヘッダー / SP ハンバーガー / フッター）、固定ページ

## Human が決めたこと

- 2026-11-20 slug `jwsnj`、案件名 ニュージャージー
- 2026-11-20 文字サイズは rem。ベース Theme の書き方に倣う
- 2026-11-20 プラグイン一覧は `docs/SPEC.md`（Autoptimize は入れるが無効）
- 2026-11-20 コース紹介はまだ作らない
- 2026-11-20 サイトの時刻は日本時間（`timezone_string = Asia/Tokyo`）
- 2026-11-20 ディレクトリーマップを `docs/DIRECTORY_MAP.md` に確定
- 2026-11-20 ベース Theme は `f-codiaTheme-block-in-vite`。theme 名は `jwsnj`。Git に残す（ACF JSON 含む）
