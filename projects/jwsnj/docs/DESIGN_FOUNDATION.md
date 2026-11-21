# jwsnj Design Foundation / 実装前確認

状態: **FIRST PREFLIGHT**（2026-11-20）。Figmaの変数定義とPCメニューframeを確認した初期記録。**導入済みの証明ではない**。デザインと実装の正本: `CURRENT_AUTHORITY.md`。

## 実装より先に確定する順番

1. `so` 最新SHA・他PR・案件仕様・ベース Theme の構造 / 利用範囲を確認する
2. Figma **PC/SP全体**（必要な hover / open 状態も）を実際に確認する
3. Variables / Text Styles / Fonts / Colors / Images / SVG / Icons / グリッド・余白・breakpointの evidence と node を収集する
4. ベース Theme の実ファイル・読み込み済みフォント・既存CSS変数・画像変換・ライセンスと照合する。**不足アセットはFigmaから正確に取得**し、勝手に代用しない
5. tokenの命名、font-weight、line-height、見出し・ボタン・テキストの規則、asset path と共通コンポーネントを決めて導入・確認する
6. デザインFoundation/WordPress設定の機能確認とPC/SPの目視比較を通してから、実装順 **ヘッダー → フッター → 一覧 → パーツ集 → 詳細 → 固定ページ → TOP（1セクションずつ）** に進む。コース紹介（下層）はまだ作らない

単に文書を書くことは「導入完了」ではない。font/CSS/assetの実装と環境での確認結果を都度追記する。

## Figmaの確認済み変数

取得元: fileKey `K3SANPVHIEerfYBQtM4lXF`、PC TOP `114:28` の variable definitions（2026-11-20）。**Figma値**であり、CSSに反映・ロード済みとは限らない。

| Variable | 値 |
|---|---|
| `color/main` | `#28AC5F` |
| `color/sec` | `#6BD2CE` |
| `color/white` | `#FFFFFF` |
| `color/text` | `#333333` |
| `color/separator` | `#D7D4D4` |
| `color/separator_light` (PC menu `599:2726`) | `#F2F2F2` |
| `color/accent` | `#EC6B61` |
| `color/base--lightgreen` | `#F5FDEB` |
| `color/base--lightgreen02` | `#EAFFD9` |
| `color/base--lightblue` | `#D7F2F1` |
| `color/foreground/text--gray-700` | `#484848` |

確認済み Figma Font Variables: `Roboto`、`Zen Kaku Gothic New`、`Font Awesome 6 Pro`、`Font Awesome 6 Brands`。PCメニュー `599:2726` の実レイヤーには `Noto Serif JP`・`Roboto Condensed` の使用も見える。**使用箇所・weight/style・提供ファイル・読み込み方式・利用ライセンスはこれから検証**。Font Awesome Pro の有償ファイルを公開リポジトリに追加しない。使用できる正規のアセット・ライセンスを確認する。

## Color tokens の導入状況（2026-11-21更新）

**導入済み（静的）:** `theme/css/global/variables.css` の `:where(:root)` にTOP確認済み10色とPCメニュー確認済み1色を `--jwsnj-color-*` として追加。既存 `css/style.css` はこの変数ファイルを既に `@import` している。PR #506で既存共通 `--color-primary` を `#28AC5F`、`--color-accent` を `#EC6B61` に直接変更済み。PR #507でヘッダーナビの6参照を `--jwsnj-color-main` から `--color-primary` に統合済み。`--jwsnj-*` の残存定義・他参照は全件確認前なので削除しない。**画面完成・視覚一致を意味しない**。

| Figma | CSS custom property |
|---|---|
| `color/main` | `--jwsnj-color-main` |
| `color/sec` | `--jwsnj-color-sec` |
| `color/white` | `--jwsnj-color-white` |
| `color/text` | `--jwsnj-color-text` |
| `color/separator` | `--jwsnj-color-separator` |
| `color/separator_light` (PC menu) | `--jwsnj-color-separator-light` |
| `color/accent` | `--jwsnj-color-accent` |
| `color/base--lightgreen` | `--jwsnj-color-base-lightgreen` |
| `color/base--lightgreen02` | `--jwsnj-color-base-lightgreen-02` |
| `color/base--lightblue` | `--jwsnj-color-base-lightblue` |
| `color/foreground/text--gray-700` | `--jwsnj-color-text-gray-700` |

**検証境界:** Figmaのvariable definitions `114:28` を再取得し一致を照合。PC `114:28` / SP `279:2136` のスクリーンショットURLを取得。実機WP、computed styles、ブラウザ表示比較、フォント配信は**未検証**。変更は変数の定義だけで既存表示への意図的な変更はない。

## CODIAテーマとの一次照合（カラー共通値は改修済み、表示未検証）

対象: `theme/css/global/variables.css`、`theme/css/style.css`、`theme/css/base/reset.css`、`theme/inc/front.php`、`theme/fonts/` と `theme/webfonts/`（2026-11-20）。

| 対象 | ベースThemeの現状 | 導入前に確認する差 |
|---|---|---|
| メインカラー | `--color-primary: #28AC5F`（PR #506） | 既存利用箇所の回帰QAと重複 `--jwsnj-color-main` の参照調査が残る |
| アクセントカラー | `--color-accent: #EC6B61`（PR #506） | 利用箇所の回帰QAと `--jwsnj-color-accent` の参照調査が残る |
| テキスト | `--color-text: #333` | Figma `#333333` で同値 |
| 行間 | `base/reset.css` の `body { line-height: 1; }` だった | **このPRで `1.3` に変更済み**。個別セレクタに残る `1` と上書き・長文表示は後続で検証 |
| フォント | `NotoSansJP`、`NotoSerifJP`、`Roboto` のwoff2と`@font-face`あり | Figmaの `Zen Kaku Gothic New` は現時点でテーマ定義に見当たらず、正規の読み込み方法を確定する |
| Font Awesome | `theme/webfonts/` に素材あり、`inc/front.php` の `fontawesome-style` enqueue はコメントアウト | 実際のCSS経由で読み込まれているか／使用権限を検証し、必要な導入のみ行う |
| CSSの入口 | `css/style.css` → `global/variables.css` をimport | ベース構造に沿って共通値を管理。末尾の場当たり的overrideを積まない |

**重要:** 既存のフォントファイルの存在は配信・ライセンスの確認完了を意味しない。FigmaのTOP 10色とPCメニュー1色は `--jwsnj-color-*` としてCSSに**定義済み**だが、既存の `--color-primary` と `--color-accent` はFigma確認値に変更済み（PR #506）。ヘッダーナビ6箇所のprimary参照も統合済み（PR #507）。その他の利用箇所・視覚一致は未検証。

## フォント読み込みの小改善（2026-11-20）

`theme/css/global/variables.css` の既存12件の `@font-face`（Noto Sans JP / Noto Serif JP / Roboto 各4 weight）に `font-display: swap` を明示。既存ファイルやfont-family/weight/srcは変更せず、フォント取得中のテキスト不可視を避けるCSS設定を追加した。**Figmaの `Zen Kaku Gothic New`、`Roboto Condensed`、Font Awesome Pro/Brandsの正規アセット導入は未実施**。追加フォントのライセンス・実際のweight・適用nodeを先に確認し、未承認の有料ファイルは追加しない。

静的確認: 既存12件に `font-display: swap` が各1回追加されたことをコード差分で確認。WordPressでの配信・フォールバックのレイアウトシフト、PC/SP視覚一致は**DEFERRED_ENV**（`DEFERRED_RUNTIME_QA.md` の FOUND-02 / FOUND-05）。

PCメニュー `599:2726` の `get_variable_defs` で `color/separator_light = #F2F2F2` を追加確認（2026-11-20）。既存 `color/separator = #D7D4D4` と用途が異なるため、置換せず独立トークンで保持。Figma PC/SPスクリーンショットとasset inventoryは取得済みだが、SVG/画像の各node・権限・配置先の対応が未確定なのでURLや仮画像を本番Themeに投入しない。**色の利用箇所・ブラウザ表示は未検証**。

## 2026-11-21 04:35 JST 引き継ぎ確認

- 基準 `so`: `bf935370efc221f6ce3d11f8a0ef08bb9fc5af89`。jwsnjのopen PRなし。PR #505/#506/#507は統合済み。
- Figma PC page `0:1`、SP page `263:12` のスクリーンショットURLを再取得。全ページ縮小画像だけでは個別font/weightやhover動作を証明できない。
- Figma design contextの必須ガイダンスが現接続で発見できず、今回の詳細context取得は未実施。推測による新規フォント追加・アセット代用はしない。
- READY: (1) CSS変数の全参照確認後の重複削除、(2) Figma文字nodeとThemeのfont/weight・ライセンス照合、(3) PC/SP headerの詳細比較。WordPress/browser QAは `DEFERRED_RUNTIME_QA.md` に保留。

## Google Fonts導入（2026-11-21）

- Figmaで使用確認済みの **Zen Kaku Gothic New** と **Roboto Condensed** はGoogle Fonts公式配布を使用する方針に確定。
- Google Fonts公式リポジトリで両familyの **SIL Open Font License 1.1** を確認。Zen Kaku Gothic Newは300/400/500/700/900、Roboto Condensedは100〜900を提供。
- Header/Footerで確認済みのweightに合わせ、frontendでは **400 / 500 / 700** のみを `inc/front.php` からGoogle Fonts CSS APIでenqueueする。
- `theme/css/global/variables.css` に `--font-jwsnj-ja` と `--font-jwsnj-en-condensed` を追加し、既存Noto Sans JP / Robotoをfallbackとして保持。既存のTheme全体font tokenはこのFoundation変更では置換しない。
- 現実行環境ではGoogle Fonts/GitHubのfont binaryをDNS経由で取得できないため、今回の実装は公式Google Fonts配信を利用する。WordPress実機での外部CSS取得、CSP、最終render/CLS、Figmaとのvisual一致は **DEFERRED_ENV**。
- **Font Awesome Pro / Brandsの利用許諾は別問題であり未解決**。Google Fonts導入によってFont Awesomeの権利確認が完了したとは扱わない。

## 画像・部品・挙動

- PCメニュー展開: `599:2726`、SP開閉状態: `480:3954`
- PCヘッダーは hover 展開、SPは click/tap 展開を基本とする（Human決定）。既存アクセシビリティの最低限の操作性は損なわない
- 実装はFigmaデザインを正本とし、ベース Theme は**書き方と再利用候補のサンプル**。必要ならFigmaに合わせて既存部品を改修・新規追加する
- 画像・ロゴ・装飾SVG・アイコンはFigma assetとsite側の具体的fileを対応づける。対象が異なるサンプル素材は流用しない
- 通常コンテンツはFlow/Flex/Grid。座標写経のabsoluteは避け、装飾・意図的な重なりはabsolute可
- `white-space: nowrap` はjwsnjの新規実装に使わない。テキストのline-height `1` は原則 `1.3`、2〜3行・PC/SP・中間幅で確認
- **文字拡大150〜200%の専用テストは対象外**（Human決定）。通常の折り返し・視認性・レイアウト確認は実施

## 次回の短い引き継ぎ（READY / BLOCKED / NEXT）

この欄は**次回の作業開始時に最新`so`・open PR・Figmaと突き合わせて**から使用する。特定のSHAのまま古くなった項目を盲目的に引き継がない。

| 種類 | 次の単位（実機なしで進められるもの） | できたと判断する最低条件 |
|---|---|---|
| READY-1 | Figmaのfont family/weightの実利用nodeと、Theme内`@font-face`/CSS・enqueueの差分を調査。ライセンスと代替禁止範囲を整理して必要な実装修正へ | 使用文字のfont/weightの対応・導入変更・静的チェックを具体的ファイル/PRで説明できる |
| READY-2 | Figma画像・SVG・アイコンとCODIAのAsset経路を照合。サンプル画像の流用を避け、本物の素材取得/配置と使用箇所の検証に進む | asset node・保存先・参照箇所・不足分とライセンスが確認できる |
| READY-3 | PC `599:2726` / SP `480:3954` のHeader open/close状態のdesign context + スクリーンショット、既存Theme menuテンプレートの関係を確認し安全な1パーツの実装に進む | Figma/実コードの根拠・変更範囲と静的QA・残るローカル検証がPRに記録される |
| DEFERRED_ENV | WordPress・ブラウザ実機での描画/操作の確認 | **現在は実施しない**。利用可能になった初回に `DEFERRED_RUNTIME_QA.md` のP0から優先的に実行 |

**停滞確認**: 次回実行時に前回と同じ `READY` / PR が変化なく続いているかと、実際に解除可能な阻害要因の有無を確認する。連続2回の解除可能な無進展が確認できたら `STALLED` と根拠を記録し、別の作業レーン/修復方法を検討。`DEFERRED_ENV` は停滞回数に含めない。現在、変更後の複数回の実行効果は**未測定**。

## 残るFoundation導入チェック

- [ ] PC/SP全文字スタイルと色・余白・ブレークポイントを部品単位でマッピング
- [ ] ベース Theme 側のCSS変数とfont-face / 読み込み状況を照合
- [ ] 必要な画像・SVGのFigma出力とローカル配置を確認
- [ ] Foundation のコード反映とWordPress/Viteでの検証
- [ ] 前後の差分、PC/SP Visual QA、PR/CI確認

ログ: この文書は「初期調査」。今後の各作業回は実装結果と未確認点を更新する。

## 2026-11-21 Foundation asset inventory（GitHub tree 検証）

- 基準 `so` SHA: `42aae717cfd23b19b543062ba9990b7d3ec01660`（PR #509 マージ済み）。Figma PC page `0:1`、SP page `263:12`、TOP PC `114:28`、TOP SP `279:2136` のスクリーンショット取得を確認。ページ全体の縮小表示では文字nodeのweight・画像の原本・使用許諾は判断できない。
- GitHub tree のファイル名一覧で `theme/fonts/` に **12 woff2**（NotoSansJP / NotoSerifJP / Roboto 各 Regular・Medium・SemiBold・Bold）を確認。`theme/css/global/variables.css` の **12 @font-face** の相対パス・weight 400/500/600/700 とファイル名は対応。これは**静的なファイル存在・参照の照合**であり、実際の配信・ライセンス・Figma一致を保証しない。
- `theme/webfonts/` に **Font Awesome 系の ttf/woff2 各11組＝22ファイル**が存在。Pro系と思われる `fa-light`、`fa-duotone`、`fa-sharp-*` 等を含む。既存ファイルであっても利用許諾が確認されるまで新規使用・外部配布・追加導入を正当化しない。**ライセンス確認がBLOCKED**。
- Figmaに現れる `Zen Kaku Gothic New` / `Roboto Condensed` に対応する名前のローカルwoff2は上記 `theme/fonts/` にはない。**Figmaでの具体的な使用node/weight、合法な提供経路を確認するまで追加・代替しない**。
- 今回の環境は `git` と `rg` を備えるが GitHubホストのDNS解決に失敗し、clone不可。116ファイルの個別取得は再試行しない。Figmaのdesign-to-code skillも installed skills が空のため未取得で、`get_design_context`は規約により呼ばない。`get_variable_defs` は「layer未選択」で失敗したため値の新規検証なし（以前の取得値を未検証のまま変更しない）。
- READY（Foundation担当）: (1) 合法なfont入手方法と使用node/weightを確認して実コード反映、(2) Figma asset nodeと実ファイルを限定して1件ずつ対応、(3) GitHub検索/cloneが使える環境でCSS token参照を一括検索し重複削除。BLOCKED: Pro系アイコンの許諾、Figma詳細context、実機WP/browser。ページ・Header/Footerの構造は他担当の所有範囲。

**判定:** Asset inventory = **調査済・静的確認済**。追加アセット導入・フォントのデザイン一致・WP表示 = **未検証**。ドキュメントだけの更新を画面実装の完了と扱わない。


## 2026-11-21 Header/Footer限定・Figma実アセット照合（工程ゲート継続）

- 開始 `so`: `49df7a1f3a63d4bc688d428bda0b129025da2a43`。open PR #515 は一覧のDraftで下流工程として保留、#516 は全案件共通ゲート規約の未統合PR。Header/Footerのページ担当ファイルは編集しない。
- Figma PC `0:1` / SP `263:12` のスクリーンショット取得、footer `221:335`、PC open menu `599:2726`、SP menu `480:3954` の design context を実際に取得。前回の「context未取得」は今回解消。skill一覧は空で必須skillの本文は取得不能、従ってskill遵守までPASSとはしない。
- Footer `221:335` は **SVG 6点 / raw image 0点**、PC menu `599:2726` は **SVG 14点 / raw image 14点** とFigmaのasset inventoryで確認。これはエクスポートURL取得の成功であり、リポジトリへの素材配置完了ではない。URLは短命なので正本へ記載しない。
- Figma footer context の識別名: `img_footer-left`、`img_student-01`、`img_njws_logo` 等。PC menu context の識別名: `pic01`〜`pic06`、`ico_school`、`ico_admission`、`ico_parents`、`ico_recruit`、`njws_logo` 等。SP menu context には入学案内・保護者専用・採用情報のCTAアイコン、ロゴ、アコーディオン矢印がある。実ファイル名と一対一対応・SVG内容検査はまだ必要。
- Footer Figma context は `Roboto Condensed` medium と `Zen Kaku Gothic New` bold、SP menu は `Zen Kaku Gothic New` medium を明示。現Themeの12件 `@font-face` は Noto Sans JP / Noto Serif JP / Roboto のみ。**未導入フォントを勝手にNoto/Robotoへ代替しない**。Font Awesome Pro系は既存バイナリがあってもライセンス未確認。
- Footerのvariable defsで `main #28ac5f` / `sec #6bd2ce` / `white #fff` / `text #333333` を再確認。現 `variables.css` の値と静的に整合。CSS変数の大規模整理は今は不要。
- アセットの取得経路検証: Figma `download_assets` でURL発行は成功したが、この実行環境の外部DNS解決失敗により `curl` でSVG実体取得不可。**ファイルを取得・検査していないため実アセットのcommitを行わない**。既存 `logo.svg` をFigmaのロゴと同一と推測しない。
- ページ担当への引き渡し: Footer装飾SVG群、PC menu写真14点とSVG14点、SP menu CTA/accordion icons、Zen Kaku Gothic New medium/bold、Roboto Condensed mediumの依存を確認。Figma識別名を使い、未確定の写真/アイコン/ライセンスは本番で代用しない。
- 次のCURRENT PHASE内READY: (1) Figma SVG/画像実体を取得できる経路で保存し、各識別名とhash/ライセンス/保存先を照合、(2) Header/Footer使用フォントのweight/合法な配信元とTheme読み込みを確定、(3) 既存logo.svgとFigmaロゴの実体差分確認、(4) Header/Footerアセット読み込み静的QA。BLOCKED: assetバイナリの取得経路、Font Awesome Pro利用許諾、WP/ブラウザ実機QA。
- Reviewer/Auditor: downstream変更ゼロ、ページ担当PHP/CSS変更ゼロ、未取得素材の偽装導入ゼロ。文書の照合結果のみでHeader/Footer完了扱いはしない。ゲートはCLOSED。
