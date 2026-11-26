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
- Human確定（2026-11-21）: CODIAのサンプル変数・CSS・コード・画像・文言・設定を保護する必要はない。Figma正本に合わせて**既存の共通定義・実装を直接修正**し、不要になったサンプル痕跡・重複token・互換overrideを参照関係の検証後に削除する。機能を壊さず、案件に必要な設計とWordPress契約は維持する。新規の`--jwsnj-*`を無条件に増やさず、既存tokenを適切に置換・統合する。
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
- 2026-11-20 **ローカルWordPressとブラウザの実機検証は現在利用できない（Human明示）**。`docs/DEFERRED_RUNTIME_QA.md` に `DEFERRED_ENV` として全件登録し、利用可能になった初回の作業でP0から優先実施。**現段階ではそれを理由にFigma/GitHubで進められるコード・静的QA・CI・PRを止めない**。環境が使えるまで毎時ローカル起動を繰り返さない

## 2026-11-23 Human-approved implementation unblocking (supersedes SVG-only hard stop)

- Human explicitly authorized proceeding with implementation while official Header/Footer SVGs are unavailable, using **development-only, clearly labeled, replaceable placeholders** where needed. This is **not** approval to invent production imagery, URLs, phone numbers, SNS, slugs, ACF or CPT values.
- Official SVG/logo export remains a separately tracked deliverable in Issue #524. Preserve source node, exact binary bytes, dimensions, SHA-256, rights, callsite and CI evidence before declaring final visual parity. Never commit temporary Figma asset URLs or overwrite Foundation-owned files concurrently.
- WordPress/browser/keyboard runtime QA remains **DEFERRED_RUNTIME_QA** in Issue #523. Static/CI checks do not imply runtime PASS. The Human permits independent source implementation to continue despite that deferral.
- Header/Footer source functionality, responsive/keyboard static checks, WordPress ownership and relevant CI must still be reviewed; any serious defect blocks dependent work. **Missing SVG bytes or deferred runtime QA alone must not halt unrelated, verifiable work.**
- The Human explicitly authorized moving toward the **parts catalog** after source-level Header/Footer quality review and phase transition documentation. This is a narrow exception to the older all-PASS phase gate, **not** permission to bypass unresolved functional or CMS blockers, or to start TOP/course/detail pages. Before implementing parts, read Figma parts PC `339:23` / SP `433:2015`, inspect Theme components and 10-point preflight, then make small CI-reviewed PRs. Track provisional vs final acceptance separately.
- If a scheduled prompt still says that every phase gate must PASS before any parts work, reconcile that stale launcher with this newer Human decision; do not silently claim full Header/Footer acceptance.

## 2026-11-24 公式素材は Git にある（全環境共通）

Header/Footer と TOP の公式 SVG / WebP は #599 / #600 でこのリポジトリに入った。上の「SVG が無いので仮置きしてよい」は、**まだ Git に無い素材**に限る。保存済みファイルを仮画像で置き換えない。

どの Agent でも `docs/DESIGN_FOUNDATION.md` の「残作業」を読む。チャットや Cursor 専用の記録は正本にしない。

- Cursor に依頼するのは、リポジトリにまだ無い Figma 公式バイトの取得だけ
- 保存済みファイルのテーマ接続と、未承認 URL を作らない実装は、どの環境でもできる
- ブラウザ確認は #523。表示できたと書かない

- Human 2026-11-25: Figma指定の配色・コントラストはデザイン判断として保持。今回の実装総点検では変更せず、配色の再指摘を繰り返さない。新規実装より既存Header/Footer/partsの品質監査を優先。

- Human 2026-11-25: テキストを含むボタン・タブ・カード等は固定heightで行数を制限しない。min-heightと自然な伸縮を基本とする。装飾、画像比率、可視viewport等の寸法とは区別する。

## 2026-11-25 共通UI 静的点検の一巡終了 / 次フェーズの境界

- 既存Header/Footer/パーツ集の静的コードとFigma個別ノードの残差監査を一巡した。修正PR #633 / #634 / #635 / #636 / #637 / #638 は `so` にマージ済み。文字を含むUIの固定高さ、長い文言と中間幅、不要サンプルCSS、画像・リンク未設定、hover/focus、画像比率、テーブルのスクロール対策を点検した。**これは静的の一巡であり、実機・画面一致の最終PASSではない。**
- #523 実WordPress・ブラウザ表示/フォーカス・端末差、#524 未取得の一部公式素材、未承認のFooter管理値・CTAリンク・Smallナビ固有デザイン・スライダー操作とCMS仕様をそれぞれ別の未完了として維持。カラーはFigma決定を尊重し変更しない。
- **新規実装の許可範囲は従来通り**。パーツ集・既承認の独立ソース修正までは可。記事一覧PR #515は開いているが、Human承認済みの実装開始・マージとは見なさない。記事詳細・固定ページ・TOP・コース紹介に自動で進まない。次ページを進めるにはHumanによる対象スコープの承認と最新Git/Figma/owner照合が必要。

## 2026-11-25 Human承認 — 記事一覧

- Human「承認するよ、どんどん実装進めて」により、直前に提示した**通常投稿一覧・カテゴリ一覧**（PC 390:666 / SP 478:2615）の実装を承認。既存Draft #515を継続し、最新soへ統合。#523/#524は実機・素材の最終受入として別途維持。
- 記事詳細・固定ページ・TOP・コース詳細はこの承認の範囲外。URL・ACF/CPT/未確定のサイト情報を追加しない。


## 2026-11-25 Human包括承認 — JWSNJ全ページ

- Human「全部承認するから待たないでいい」：現行Figma確定デザインの全ページ（記事詳細・固定ページ/サイドバー・TOP・コース紹介・オリジナルページを含む）の実装開始を包括承認。上記のページごとの承認待ち・コース保留はこの最新指示により解除する。PC/SPの正本と既存Theme/CMSを照合し、独立した小PRで継続し、ページごとの再承認を要求しない。
- これは未確定のURL・電話・SNS・CMSフィールド仕様・利用権・デザインの創作や実機未検証の受入PASSを許可するものではない。独立作業は継続し、不足データに依存する箇所のみ保留。#523/#524を維持。スケジュール/owner変更なし。


## 2026-11-26 Human指示 — オリジナルページのみ実装保留

- Human「[Figma 534:1706] はまだ実装しない許可あるまで待機それ以外やって」。Figma `K3SANPVHIEerfYBQtM4lXF` のPC `534:1706`（オリジナルページ）とその子ノードは `BLOCKED_HUMAN` とし、新規実装・専用テンプレート・専用パターン・素材接続・該当ページへの適用を行わない。再開はHumanの明示許可のみ。
- 2026-11-25包括承認のうち上記ページだけを例外とする。別フレームのPC `534:1282`（course）、TOP、固定ページ、記事一覧・詳細、既承認共通パーツは従来通り継続可。共通部品を当該保留ページ専用に変更しない。W9 ACF JSON承認待ち#664、#523/#524の未完了状態は変更しない。スケジュール/owner変更なし。

## 2026-11-26 Human指示 — TOPメインビジュアルの動き

- Human「メインビジュアルは https://www.osaka-kaisei.ac.jp/ 覚えて 右から左に流れていくループ感じ」。TOP MVの動作正本はこの参照サイトのような右→左の連続ループとする。Figma PC `184:797` / SP `279:2172` の静止画配置・既存ACF画像管理は引き続き正本。速度、周期、画像不足/追加行の扱い、PC/SPでの細部は今回未指定。ループの継ぎ目、レスポンシブ、動きの停止・軽減対応は実装時の検証対象とし、参照サイトの実動作を未確認のまま同一と断言しない。
- この指示により方向・ループの仕様待ちは解消。#664 W9、#523/#524、オリジナルページ `534:1706` の保留は維持。

## 2026-11-26 Human指示 — スライド系はSwiper

- Human「スライド系はswiperで実装して覚えて」。JWSNJのスライダー・カルーセル・連続画像ループ（TOP MV含む）は既存ThemeのSwiperを実装ownerとする。独自CSS/JSによるスライド駆動を新規採用しない。既存Swiperのバンドル・読み込みを再利用し、重複インストールしない。
- #678の独自CSS keyframesによるMVループはこの新しい実装方針を満たさないため置換対象（READY）。Figma PC184:797/SP279:2172、右→左の等速連続ループ、既存ACF・画像sizes、停止/再開・reduced-motion・画像不足時の静止fallbackを維持してSwiperへ移行する。速度・操作位置は未確定のまま。実機で継ぎ目、resize、keyboard、画像読み込み、fallbackを検証する。通常の非スライドUIのCSS animationやtransitionは対象外。
- 既存案件以外では会社/Theme依存の前提を先に確認し、Swiperを優先するHumanの実装方針として引き継ぐ。#664 W9、#523/#524、original 534:1706の保留は変更しない。
