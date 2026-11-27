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

- 実装状況更新: #680 は `so` ddf4a0d へマージ済み（Swiper版のソース実装、CI済み。実機は#523）。旧#678の置換READYは解消。保留中#664のCourseカードは旧native scroll snap案を含むため、W9解除後に最新Swiper方針と現行home.jsへの統合を確認する。承認前に#664のowner・ACF・branchを変更しない。

## 2026-11-26 Human指示 — ACFはCursorへ後回し、フロント先行

- Human「ACF後回しcursorでやるからダミー画像入れてそれ以外できない？」。既承認Figma範囲では新規ACF JSON/field group/取得接続を今回のChat側実装の必須前提とせず、HTML/PHP表示構造・CSS・レスポンシブ・Swiper・hover/open/focusを先行する。新規ACF追加・変更および管理画面実機接続はCursorへ引き継ぐ。既存ACFは維持し、W9を迂回しない。
- 表示コンポーネントとデータ取得を分離し、開発/QA専用のfixtureで表示を成立させる。既にGitに保存された正規画像を優先（Course 5枚のWebPと装飾SVGは保存済み、公式asset contractあり）。未取得素材のみ明確に識別できる置換可能なダミーを開発/QAに限定して使用。本番でのダミー自動fallback、仮URL・仮slug・短命Figma URLは禁止。未確定リンクは実リンクとして出さない。公式素材受入・実機QAは#524/#523のまま。
- #664のACF変更自体は未承認・保留のまま。その既存PRの表示側コード/設計を参照し、最新so上で独立したACF非依存の表示コンポーネントに整理し、SPを既存Swiper方式に移行する。#664 branch/ownerは変更しない。Cursor接続時は旧PR丸ごとのmergeによる二重実装を避け、必要なACF差分とデータadapterだけを統合する。
- Course表示、Aboutカードの見た目・前面切替、未取得素材に依存していた既承認箇所を新たな独立READY候補とする。未指定のCMSスキーマ、リンク遷移の意味、共通スライダーの操作仕様はこの指示で確定したとみなさない。オリジナルページ534:1706の実装禁止、スケジュール変更禁止を維持。

## 2026-11-26 Human指示 — CSSはクラス単位にまとめる（全案件）

- Human「全部そうしてこれからの案件もそうして欲しい」。SP/baseとPC/TBのmedia、hover/focus/state・疑似要素を対象class内にまとめ、親block末尾・stylesheet末尾に子classを再列挙しない。既存JWSNJ CSSも対象。既存breakpoint・rem計算・セレクタ詳細度・カスケード・見た目を維持し、外部ライブラリは除外。複数ownerの条件や安全な移動を証明できないものは例外として記録する。共通正本AGENTS.md / frontend-quick-contract §7。ACF後回し、#664 branch保留、original 534:1706禁止、#523/#524維持。


## 2026-11-26 Human指示 — インデントは半角スペース2（今回・全案件）

- Human「タブも半角スペース2がいい 今はスペース4？かな にしてほしい今回もこれからも」。JWSNJ自作CSS・フロントエンドコードは1階層2スペース、タブ文字なし。全案件共通AGENTS.md・.editorconfig・frontend-quick-contractへ反映。既存sourceは整形専用commitで移行、vendor/generated・文字列/HTML出力で有意な空白は変更しない。ACF保留・原ページ534:1706禁止・既存ownerは維持。

## 2026-11-26 Human指示 — CSS/JS整合と保守性改善の継続

- Human「よくないね 全部治すためのスケジュール？GITに入れて直していって」。改善の作業順・完了条件・残作業は [MAINTAINABILITY_ROADMAP.md](MAINTAINABILITY_ROADMAP.md) を正本とする。既存作業回で最新soとopen PRを確認し、READYの小単位を複数進め、検証・merge・進捗更新。重大な懸念は先に共有し、数字や行数の減少だけを目的にしない。新規/既存スケジュールの変更なし、ACF Cursor保留、#664 owner、534:1706禁止、#523/#524を維持。共通契約はAGENTS.md / frontend-quick-contract §8.1。

## 2026-11-26 Human指示 — 残作業後の全体再点検

- Human「やる事なくなったら最初からヘッダー、フッターから全部スマホ、pc確認していってズレや間違いないか」。承認済みの残実装・保守改善の独立READYがなくなった時点で、待機ではなくHeader → Footer → 共通パーツ → 実装済み各ページのPC/SP全体再点検へ進む。既存の作業回で実行し、新規automation/既存schedule変更なし。正本は [MAINTAINABILITY_ROADMAP.md](MAINTAINABILITY_ROADMAP.md) の全体再点検と [DEFERRED_RUNTIME_QA.md](DEFERRED_RUNTIME_QA.md) の既存QA項目。
- 最新Figmaの正式skill/new session/高精細contextと画像、最新Git、実際にrenderした画面を照合し、余白、配置、文字、画像、操作状態のズレ・間違いを調べる。根拠のある修正は小PRでCI/差分確認/merge、変更後に再撮影して影響範囲を回帰検証。PC/SPだけでなく既存境界前後・中間幅・長文も確認。意図的なデザイン/実装差と不具合は区別。配色変更、未承認仕様の創作、ACF追加、#664変更、534:1706の実装禁止は維持。
- 実環境が使えない場合は取得できるFigma/source/isolated browser/disposable WPの証拠を区別し、実画面・実機未確認をPASSにしない。#523/#524は未完了を維持。全体を一巡したら最新変更による回帰や未解決差分を再評価し、根拠のない変更・同条件の失敗診断の反復はしない。

## 2026-11-26 Human指示 — TOPはセクション単位で高精度再点検

- Human「aiがよくミスする所 特にtopは時間かけてかなりセクションずつ正確にやって背景や、あしらい、アイコン しっかりみてデザイン」。P2全体再点検のTOPは縮小した全体スクリーンショットだけで合格にせず、PC/SP各セクションの個別高精細context・実画像・子layer/プロパティ・実renderの照合を必須とする。共通背景・隣接セクションのつながりも独立して検証。時間・件数を優先せず、証拠の揃った範囲から正確に修正し、修正後再撮影。実装したコードだけで欠落なしと判断しない。
- TOPの対象表・AIが見落としやすい箇所・受入条件は [MAINTAINABILITY_ROADMAP.md](MAINTAINABILITY_ROADMAP.md) P2-TOP。正式な素材が存在する場合は再生成・近似素材への置換をしない。未取得/権利不明/未確定データは#524/#523へ残し、ACF追加・#664 owner・534:1706保留・未確認URL・配色変更禁止を維持。新規scheduleや変更なし。

## 2026-11-27 Human指示 — Header未確定URL・Footer・バナーはFigma正本で先行

Human「Header CTAのURL、検索・補助メニューの扱い URLはあとででいいからa空で実装」「Footer 正式な連絡先・SNS・英語学校名 figma figmaにないものはきにしないでいい」「バナー 利用権確認済みの画像原本 figmaが正でそれをつかって」「これは覚えておいて」。

- Header: CTA等のFigmaにあるリンク要素は、遷移先URLが未確定でも見た目の実装を先行する。空のa要素（例：href未付与、リンク先確定後に接続）で表示し、誤遷移・空hrefによる現在ページ再読込・#ダミー遷移を避ける。実URL/slugは創作しない。確定済みの既存CMSリンクは維持。検索・補助メニューについてはFigmaを表示の正本として照合し、今回のURL保留解除をCMSデータ削除や検索機能廃止の明示承認とは解釈しない。URL未確定だけで90pxレイアウト・CTAの表示実装を止めない。
- Footer: Figma記載の連絡先・SNS・英語学校名等を表示の正本とする。Figmaにない情報は追加せず、情報が存在しないことを理由に全体の表示実装を止めない。FigmaにあるリンクでURL未確定なら上記と同様に表示先行。既存編集機能・データを破壊しない。
- バナー: Humanが現行Figmaの画像を採用することを指定したため、Figmaにある実素材の取得・接続・PC/SP crop確認を先行する。正規のexportで画像バイトを取得し、node・hash・src/theme・callsiteを記録。保存済みの一致素材は再利用。画像を再生成・推測代用・透かし除去しない。Figmaに透かしがある場合は原状を保持し、別途利用許諾が必要な公開条件とデザイン実装を区別する。取得不能なら当該素材だけを#524に残す。
- この指示は従来の「URL/連絡先/バナー原本待ちで表示実装を保留」のうち上記範囲を更新する。ACF W9/#664の承認ゲート、534:1706の実装禁止、#523/#524の実機/公式バイト受入、既存owner・スケジュールは変更しない。Cursorへの引継ぎにも適用する。

## 2026-11-27 Human指示 — WordPressメニューのダミーデータでPC/SP実装先行

Human「あとwordpressのメニュー使うにしてもダミーで入れてハンバーガーやPCのメニューメガメニューなど実装してほしい」。

- WordPressの既存メニュー位置・walker・管理画面編集を本番データの正本として維持する。メニュー未登録・URL未確定・画像未設定を理由に、Figma確定済みHeader、SPハンバーガー、PCドロップダウン/メガメニューの表示・操作実装を止めない。
- Figmaの実際のラベル・階層・配置・open/hover状態を使い、ローカル/使い捨てWP用のseedまたは明示的な開発プレビューfixtureにダミーメニューを登録する。既存メニューの割当を上書きせず、再実行可能・削除可能にし、本番の自動seedや未設定時の強制フォールバックにはしない。検証ページと検証用URLは本番リンクと区別する。未確定の公開リンクはhrefなしのaで表示し、階層開閉は独立したbuttonで動作させる。
- PC/SPの実際のWordPress出力でFigmaの全対象メニュー（通常、展開、子/孫階層、メガメニューの画像/アイコン等）を個別に確認する。公式保存素材優先、未取得画像のみ開発用ダミーを許可し、本番素材とは区別する。hover/focus/touch/keyboard/close/resize・長文・中間幅・低いviewportをテストし実画像を確認する。
- 本番登録前でも見た目と操作を完成させ、データ差し替えだけで済む構造にする。既存CMSデータ・メニュー管理を削除しない。#523/#524の未検証事項、ACF W9/#664、534:1706実装禁止、並行ownerは維持する。ChatGPT/Cursor双方の次の優先READYとする。
