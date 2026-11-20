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
- ベース Theme は学習・再利用のための **サンプル**。納品の正本は今回のFigma。Figmaに合うように既存を再利用・改修し、足りなければ追加する。サンプル文言・画像・URLは本番表示しない
- 参照 Theme: `reference/`（編集禁止）
- 触ってはいけないファイル: まだなし（`guard.json`）

## CMS / ACF

- 既存 field group（ベース Theme の `theme/acf/json/`）: in_page_link / navigation_large / navigation_small / post_list / post_select / seo_setting / tag_setting / top_banner / top_notice / top_slider / visual_setting / visual_setting_post_type。TOP の項目はまずこれらに合うか確認する。ここに無いものは Human に確認してから作る
- 既存 ACF ブロック: `theme/acf/blocks/`（customPostList / inPageLink / navigationLarge / navigationSmall / tabContainer / tabPanel）
- `docs/SPEC.md` に書いた TOP の編集項目は Human の指示（2026-11-20）。field 名・置き場所はベース Theme に合わせる
- 管理画面で作るもの: メニュー 3 つ（PC ヘッダー / SP ハンバーガー / フッター）、固定ページ
- 投稿タイプは通常投稿・固定ページで進め、**新しいカスタム投稿タイプを追加しない**（Human 2026-11-20）。CODIAのサンプル「イベント」投稿タイプと `event_cat` は `theme/inc/custom.php` で登録をコメントアウト。サンプルの関数は学習用に保持

## Human が決めたこと

- 2026-11-20 slug `jwsnj`、案件名 ニュージャージー
- 2026-11-20 文字サイズは rem。ベース Theme の書き方に倣う
- 2026-11-20 プラグイン一覧は `docs/SPEC.md`（Autoptimize は入れるが無効）
- 2026-11-20 **改訂実装順**: **Figma／既存テーマの全体調査 → カラー・フォント・画像/SVG・CSS変数・共通レイアウトの整理と導入・確認 → ヘッダー → フッター → 一覧ページ → パーツ集 → 詳細ページ → 固定ページ（サイドバー） → TOP（セクションごと）**。コース紹介はまだ。Foundationの確認正本は `docs/DESIGN_FOUNDATION.md`
- 2026-11-20 進め方: **1つの変更/コミット/PRは小さく管理**。1パーツ（TOPは1セクション）ごとを基本に、作業ブランチ→検証→コミット→push→安全なら`so`へマージ。ただし**毎時の作業回では複数の小さい単位を安全に進めてよい**。1時間に1単位の上限ではない。作業運用の反省・実行記録は `docs/WORKFLOW_LEARNING.md`
- 2026-11-20 コース紹介はまだ作らない
- 2026-11-20 サイトの時刻は日本時間（`timezone_string = Asia/Tokyo`）
- 2026-11-20 ディレクトリーマップを `docs/DIRECTORY_MAP.md` に確定
- 2026-11-20 ベース Theme は `f-codiaTheme-block-in-vite`。theme 名は `jwsnj`。Git に残す（ACF JSON 含む）
- 2026-11-20 PCのメニューは hover、SPのメニューはクリック/タップで開閉。高度な追加操作は現段階で過剰に作り込まないが、既存の操作性を壊さない
- 2026-11-20 `white-space: nowrap` はjwsnj実装では禁止。テキストは2〜3行への自然な折り返しを優先。文字拡大150〜200%の専用テストは不要（PC/SP/中間幅と長文は確認）
- 2026-11-20 URL等の未決事項は後日Human指示。勝手にslugや新しい投稿タイプを創作しない。影響しないところから先に進める
