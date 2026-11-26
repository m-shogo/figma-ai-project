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
| READY-2 | 公式 SVG / WebP は #599 と #600 で保存済み。次は未接続の装飾を、未承認 URL を作らずにセクション単位でテーマへつなぐ。写真は ACF の既存項目へ置き、`front-page.php` へ直書きしない | 保存先・node・未接続一覧は下記「残作業」と一致し、接続した callsite を PR で説明できる |
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

2026-11-24 追記: この節の「実体を保存していない」「curl できない」は当時の記録。Header/Footer と TOP の公式バイトは #599 / #600 で Git にある。今の分け方は下の「残作業」。

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

## 2026-11-24 Cursor で公式 SVG 実体を保存

前回の DNS 失敗は、この作業環境では再現しなかった。Figma file `K3SANPVHIEerfYBQtM4lXF` から SVG 実体を取得し、`src/images/common/` と `theme/images/common/` の両方へ同じバイトで置いた。SHA-256 と root の width/height は `tests/official-svg-asset-contract.test.mjs` が固定する。短命 URL はコードへ置いていない。

| ファイル | Figma | root |
|---|---|---|
| `footer/img_footer-left.svg` | `221:335` img_footer-left | 408×99.9255 |
| `footer/img_footer-left-sp.svg` | `279:2637` | 155×81.8729 |
| `footer/img_footer-line.svg` / `-sp` | `221:335` / `279:2687` | 309×1 / 117.461×1 |
| `footer/img_student-01.svg` / `-sp` | 同上 | 49×75.6629 / 37.8264×59.7736 |
| `footer/img_puzzle-02.svg` / `-sp` | 同上 | 100×75.6627 / 79.6345×59.7732 |
| `footer/img_footer-bullet.svg` | `221:335` ellipse | 5.41839。保存のみ。サイトマップは WordPress メニューのまま |
| `img_njws-logo.svg` | `114:489` | 51×48。フッター |
| `img_njws-logo-header.svg` | `221:334` / `114:46` | 60×57。ヘッダー |
| `ico_admission.svg` / `ico_parents.svg` / `ico_recruit.svg` | `221:334` | 保存のみ。遷移先 URL が未承認のためボタンは未接続 |
| `ico_blossom.svg` | `506:2533` | 12×12。区切り線 `344:1134` と見出し h4 `344:901` は同じ花。18×17 の書き出しは root 寸法が違うだけで、別デザインではない |
| `ico-blank.svg` | `344:985` | 13×12。外部リンク用。既存サンプル `icon-external.svg` とは別バイト。ボタン CSS は Font Awesome のまま |
| `ico_school.svg` | `599:3205` | 40×37。メインビジュアルの学校アイコン。保存のみ |

既存 `logo.svg` は別物（サンプルのワードマーク）で、公式マークでは上書きしていない。Header/Footer の電話・住所・SNS・寄付 URL は追加していない。ブラウザ表示は #523 のまま未検証。

パーツ集 `339:23` を層ごとに確認した。SVG として新規だったのは外部リンク `ico-blank` だけ。見出し h4 と区切り線の花は保存済みの `ico_blossom` と同一。大ボタン・ページ内リンク・アコーディオン・リストの印、ナビの矢印は Font Awesome の文字で、SVG ファイルは無い。ナビ写真は JPEG なので今回は保存していない。PC メニュー展開に見えていた SVG 14 点は、メインビジュアルのアウトライン文字と既に保存したロゴ／アイコンの再掲。

## 2026-11-24 TOP の公式 SVG と写真

TOP PC `114:28` / SP `279:2136` から、ベクターは SVG、写真は元画像を WebP（quality 90）にして `src/images/top/` と `theme/images/top/` に同じバイトで置いた。Figma が同時に返す 1/4 縮小プレビュー、ほぼ白のマスク、ぼかし用の楕円、SP 枠最上段のステータスバー画像は納品していない。Font Awesome の矢印・Instagram 印は SVG にしていない。

| ファイル | 役割 |
|---|---|
| `img_catch-480.svg` / `482` / `481` / `483` / `img_catch-493.svg` | PC キャッチコピーのアウトライン。`220:12` `220:16` `220:20` `220:25` `220:30` |
| `img_catchphrase-sp.svg` | SP キャッチコピー。文字の並びが PC と違う `279:2149` |
| `img_map.svg` / `img_map-pin-01.svg` / `img_map-pin-02.svg` | 地図 `123:643` とピン `123:717` `123:736`。SP は同じベクターの縮小 |
| `img_course-layer.svg` / `img_course-mark.svg` / `img_course-math.svg` | 各部紹介の装飾 `142:1731` `142:1766` `148:1841` |
| `ico_flow.svg` / `ico_fee.svg` / `ico_visit.svg` | 入学手続き・学費・学校見学。ページ全体の書き出しではなくアイコン本体 |
| `img_instagram.svg` | `166:233` |
| `img_about-underline.svg` | 「すべての生徒が」の下線 `162:36` |
| `img_mv-01.webp` から `img_mv-06.webp` | メインビジュアル `114:31` `114:30` `114:32` `114:33` `114:34` `114:35`。`114:32` は枠比率の `img_mv-03.webp` と別フィルの `img_mv-03-fill.webp` |
| `img_about-overview.webp` / `img_about-education.webp` | 学校概要 `114:598`、教育内容 `114:603`。交通アクセスは `img_mv-06`、教育環境は `img_mv-05` と同じ写真 |
| `img_about-bg.webp` / `img_about-bg-02.webp` / `img_about-bg-03.webp` | 背景 `114:38` の大きい画像フィル 3 点。上下の波 `114:39` `114:40` は写真ではなく、元画像は無かった |
| `img_course-preschool.webp` ほか 4 点 | 幼児部 `294:1442`、初等部 `294:1435`、中等部 `114:139`、高等部 `114:150`、国際学級 `114:160` |
| `img_banner.webp` / `img_banner-02.webp` / `img_banner-03.webp` | バナー `114:419` の別フィル |
| `img_applicants.webp` | 入学検討の写真 `158:2647` |

`front-page.php` にはまだ置いていない。メインビジュアル・各部紹介・バナー・About の写真は管理画面の画像で、コースと CTA のリンク先は未承認のため。ブラウザ表示は #523 のまま。

## 残作業（2026-11-24、`so` #599 / #600 / #601）

正本はこの Git。Cursor / Claude / Codex / Copilot のどれでも、`so` のこの節を読む。チャットだけの記録は使わない。

### Cursor に依頼すること

リポジトリにまだ無い Figma 公式バイトの取得だけ。2026-11-21 の別環境は `www.figma.com` の DNS が解けず、短命 URL を保存できなかった。

- メニュー展開の写真。PC `599:2726` と Large ナビ `384:817` の JPEG は意図的に未保存。必要なら公式バイトを WebP で `src/images/` と `theme/images/` の両方へ置く
- 上の一覧と `tests/official-svg-asset-contract.test.mjs` に無い、新しい公式 SVG / 写真が出たとき

依頼しないこと: Font Awesome の SVG 化。保存済みファイルの再ダウンロード。電話・住所・SNS・寄付 URL の創作。コース紹介の下層。

### Cursor が Git に入れたこと

- #599: Header/Footer の公式 SVG。ヘッダーとフッターの桜マーク、フッターの左右・線・生徒・パズルはテーマから参照している。サンプル `logo.svg` は上書きしていない
- #599: 保存のみ。フッターのドット、`ico_admission` / `ico_parents` / `ico_recruit`、`ico_blossom`、`ico-blank`、`ico_school`
- #599: パーツ集 `339:23` の新しい SVG は `ico-blank` だけ。h4 と区切り線の花は `ico_blossom` と同じ。矢印・ページ内リンク・アコーディオンは Font Awesome
- #600: TOP の SVG と WebP を `src/images/top/` と `theme/images/top/` に同じバイトで保存。`front-page.php` には未接続
- ハッシュは `tests/official-svg-asset-contract.test.mjs`。短命の Figma URL はコードに無い

### 残っていること（ファイルは Git にあるので、どの環境でも実装できる）

- 未接続の SVG をテーマへつなぐ。`ico_school`、TOP のキャッチコピー、地図、各部紹介の装飾、手続きアイコン、Instagram イラスト、見出し下線（TOPの装飾）
- 2026-11-25: 大・小ボタンは #606 で公式 `ico-blank` 接続済み。Gutenberg本文外部リンクも公式SVGのmaskに変更。共有 `.module_textLink` の他画面callsiteは別レビュー。#605 でパーツ集H2の二色下線を修正済み。実機は #523。
- 2026-11-25: パーツ集のLargeナビ `384:914` / `442:3081` に既存画像・ACFを維持した右下矢印装飾を追加。Smallナビの独立デザインはPC/SP索引に見当たらず未確認。スライダー `344:1139` / `442:3073` は画像とキャプションのみで操作状態が示されておらず、専用CMS項目も未承認。新規ACF/スライダーを作らない。
- 次の候補: Largeナビの既存画像未設定・URL未設定時の意味と表示を確認（HumanのCMS方針と照合、仮画像やリンクは作らない）、パーツ集の既存画像/表/リストのPC/SP差分をレビュー、共有 `.module_textLink` の外部アイコンcallsiteを確認して安全なscopeを選ぶ。
- 2026-11-25: H4と区切り線の花は #603 で接続済み。PC Footer のドットも既存WordPressメニューの第1階層リンクへ接続。いずれも実描画は #523 で未検証。
- `ico_admission` / `ico_parents` / `ico_recruit` と CTA は、遷移先 URL が承認されるまでボタンを作らない
- TOP の WebP は既存 ACF（`top_slider`、コース、バナー、お知らせ）へ。`front-page.php` へ写真を直書きしない。交通アクセスは `img_mv-06.webp`、教育環境は `img_mv-05.webp`
- TOP は 1 セクションずつ。コース紹介の下層は作らない
- ブラウザの hover / open / SP・PC は #523。`DEFERRED_RUNTIME_QA.md` の PAGE-TOP と FOUND-03。静的テストの成功を表示確認と書かない


## Human typography policy（2026-11-21）

- 基本フォントはGoogle Fontsを第一候補とする。
- メインビジュアルや装飾キャッチなど、ほぼ変更されない表示文字は、Figma忠実性を優先してアウトラインSVGを使用してよい。
- 更新される本文・ナビ・CMS文言・SEO/アクセシビリティ上テキストとして必要な箇所はHTMLテキストを維持する。
- SVG化は固定度と役割を確認して選び、必要な代替テキスト/accessible nameとライセンス条件を確認する。
- 個別のHuman指示がある場合はそちらを優先する。

## 2026-11-25 パーツ集の継続レビュー
- #608 Largeナビの装飾をマージ後、#609 リストの累積字下げ・番号・注釈間隔を修正。ギャラリーの既存zoom装飾もPC/SPの配置と色反転を修正（実機は #523）。
- 次のレビュー候補: SP表 `442:2890` / `445:3237` の横スクロールヒント。基本の960px表/セル/スクロールCSSは既存。scroll-hint.css と scroll-hint.min.js は保存済みだが現行enqueue/initに接続なし。既存表プラグインとの重複・適用対象・keyboard/ariaを確認してから変更する。独自の表構造/CMSは追加しない。
- Largeナビ既存画像/URL未設定、共有リンクcallsite、media-textの画像左右指定とSP積み重ねも独立レビュー候補。Smallナビ/スライダーは仕様未確定のまま。TOP・下層ページに着手しない。
- 画像＋テキスト `344:929` / `442:2788` の既存gridをcoreの編集選択と照合し、768px境界のstackと左右幅を修正。画像・キャプション寸法は既存を維持。表スクロールヒント、共有リンク、Largeナビ未設定時、Smallナビ/スライダー仕様は引き続き残る。実機 #523。
- LargeナビのURL/画像未設定時は既存ACFを変えず、無効hrefと未承認サンプル画像出力を除去する。代替画像の表示仕様はHuman確認事項。#523で未設定組合せを検証。#611は全CI成功後にmerge済み。
- #612 Largeナビの未設定フィールド修正はマージ済み。SP表の横スクロール案内を同梱ScrollHintと既存CMS設定に接続（実機 #523）。次の独立候補は共有テキストリンクのcallsiteとFigma、Header/Footerの既存範囲に限る。Smallナビ/スライダー、未承認下層/TOPは保留。
- Footer最下段はPC 114:536/SP 279:2805に合わせて通常フローのcopyright＋60px page-topに修正。プライバシーポリシーのURLは未承認につき保留。次はPC sitemapの列構成/外部アイコンと既存WPメニューの照合。実機 #523。
- #614 Footer最下段はマージ済み。PCサイト情報＋サイトマップの配置、3列、外部FA glyphを修正。既存SP sitemapの非表示は未決、メニュー編集構造維持。共有リンク全体は別画面へ波及するため保留。残る独立候補: Footer brandStatementのPC/SP外側余白・並び、パーツ集の残差確認。実機 #523、未承認URLは作らない。
- #615 PCサイトマップはマージ済み。Footer brandStatement PC 114:422/SP 279:2632 のコピー順・余白と拡幅注記を反映。保存済みSVGはそのまま、広幅の線のみCSSで延長。実機#523で線の接合を確認。残るFooter要確認: SPサイトマップの表示、住所/電話/SNS/プライバシー/英語サイト名の管理と承認。共有リンクは個別デザインの根拠がある場合のみ変更。
- #616 Footer brand flowはマージ済み。ページ内リンクは既存ACFの空欄除外とliteral fragment解決を修正。既存Figmaサイズを維持。次の独立候補はQAアコーディオンのopen時タイトル余白・Q/A配置、既存render_blockとの整合。#523実機検証、未承認ページは保留。
- #617 ページ内リンクは全CI成功でマージ済み。PC 357:938/SP 442:2908 のアコーディオンopen余白とQ/A中央揃えを修正。旧render_blockのnested details変換は別レビュー、#523で実機確認。次の候補は既存承認済みパーツの余白/操作の残差確認と、未確定事項を整理すること。未承認ページは開始しない。
- #618 マージ済み。アコーディオンの既存render_blockを親自身のsummary/終端だけに限定し、子のrender済みHTMLを維持する。PHP CLI callback検証とWordPress実機QAを区別。残りはパーツ集の差分整理、Smallナビ/スライダーの仕様確認、#523/#524。未承認ページは開始しない。
- #619 マージ済み。テキストBoxの薄緑背景/カラムを既存Gutenberg opt-in styleで補完。次はパーツ集の全項目と既存PRの対応表整理、未確定Smallナビ/スライダー/実機に分離。#523でeditor/frontendを確認。
- #619/#620は並行runのmergeを確認済み。本文 PC 344:916/SP 442:2774 の太字500・5px黄色markerを段落限定で修正。パーツ集の主要なsource実装は進んだが、#523の実機・#524のasset受入・Smallナビ/スライダーとFooter未承認事項は残る。今後は同時runのwrite scopeを毎回直前にも確認し、重複PRを作らない。
- #621はマージ済み。ギャラリーPC 344:1079/SP 442:2973の連続40px gapと長文captionフローを修正。既存画像/キャプション/列設定を維持し、未承認のfallbackは追加しない。#523でcore CSSの実際のcascadeとlightboxを確認。次はパーツ集の残差と受入条件整理。
- #622 ギャラリー間隔とcaption修正はmerge済み。大小ボタンのグループ間隔（PC 344:968/969・SP 442:2832/2833/2842）を修正。SPの小ボタン混在gapは既存CMSの区別がないため20pxに統一し実機#523に記録。次は部品一覧と未決事項の照合。

- 2026-11-25: 注釈リストの通常本文ブロックとの隣接余白を20pxに限定するsource修正。見出し/区切り線の独立余白は維持。次の候補はパーツ集の全項目対PR対応の照合、共有テキストリンクの既存callsite限定レビュー。Smallナビ/スライダー仕様、Footer管理値、実機#523/素材受入#524は引き続き未決。#515はdraftのまま、未承認ページには着手しない。

- 2026-11-25: 本文リンクのPDF/添付glyphをPC/SP共通13px、PDF橙・添付coralに補正。既存FA token・公式外部SVG・リンク状態を維持。共有 `.module_textLink` の包括変更は見送り。次のREADY候補はパーツ集の残差（既存sourceと高精細contextで確定できるもの）の照合。Smallナビ/スライダーの管理・操作仕様とFooter未承認事項は確認待ち、実機#523/素材受入#524は未完了。

- Human FB 2026-11-25: 小ボタン矢印の見た目の中央ずれを優先修正項目として追加。PC 344:971/SP 442:2835の高精細context・画像確認済み。実装のglyph描画確認と補正は#523でOPEN。次回はoptical alignmentを受入基準にし、ボタン・丸アイコン等の同種の違和感も確認する。実機未確認のため補正値は未確定。

- 2026-11-25 ボタン視覚整列のsource修正: Figma PC 344:971/344:969・SP 442:2835/442:2842。大小添付F15Bと本文F15Cの使い分け、30px円とglyph独立、各variant共通中心、tracking隔離、実FA outline測定に基づきline-height:1/trimなし。#523で実font・実機視覚受入未完。

- 2026-11-25 丸矢印の同系改善: ページ内リンク 357:1022/442:2948 と大ナビ 384:1005/442:3085 のFigma現物・実FA TTF metricsを照合。円寸法/色/既存CMSを維持しglyph tracking/line boxのみ修正。視覚受入は#523。

- 2026-11-25: galleryズーム PC 344:1079/SP 442:2973 の44px円、20px F002、PC20/SP16px insetと反転を再確認。gallery限定でborder-boxとglyphのstyle/tracking/trim隔離。光学的補正は実描画待ち。H3白文字 #fff / 水色 #6bd2ce のコントラスト不足はHuman/デザイナー判断待ち（色変更なし）。次の独立候補はgalleryの既存CMS列数の確認。#523実機未検証。

- 2026-11-25: H2のFigma内側stroke3pxをpadding28/24に含める。PC 344:906 frame70 = text42+28、SP 445:3209 frame126 = text102+24。CSS局所stroke変数を差し引き、既存二色線・余白・wrapを維持。隔離Chromium geometry PASS、実機#523は未検証。gallery F002のCI outline bounds [0,-71,519,448] / advance512、units512。光学重心補正は実機待ち。galleryの未指定列数は既存ベースも固定gridでありHumanの意図確認待ち。次は承認済み範囲で実描画・残差を確認。

## 2026-11-25 共通UIソース総点検 一巡結果

| 範囲 | 静的結果 | 残る最終受入 |
|---|---|---|
| ヘッダーPC/SPとメガメニュー | #633 viewport・長文、#636 Gridトラック。PC hover / SP tap / focusの既存JS契約を維持 | #523 実機の開閉、フォント、狭幅、ブラウザ差 |
| フッターPC/SP | #599公式画像と既存WP sitemap接続を確認。既存可変copy・footer bottom、独立のデザイン根拠なしに構造を変更しない | #523。未承認の住所・電話・SNS・privacy・CTAとSP sitemapは未決 |
| 見出し・本文・リスト・注釈 | typography・自然折返し、H2 stroke、Figma注釈PC 344:937/SP 442:2796を再照合 | #523 editor/front 実測 |
| 大小ボタン・矢印・テキストリンク・ページ内リンク | #629/#630 glyph精度に基づく隔離、#625添付PDF、#634 tabs長文を確認 | #523 optical alignment/hover/focus |
| 画像・ギャラリー・media-text | Figma PC 344:1079/344:929、SP 442:2973/442:2788を再照合。3:2 crop、動的画像、caption flow、editor選択の維持を確認 | #523 実ブラウザ・Core/lightbox CSS cascade |
| アコーディオン | Figma PC 357:938/SP 442:2908を再照合、75px `min-height`、既存PHP nested block契約、#637不活性CSS整理 | #523 native details keyboard/open |
| タブ | #634 ラベル折返し・横scroll。#638無効コード整理。旧ACFタブJSはコメントアウトされており、core/tabsと混在している。安易に有効化しない | #523 core/edit selection、旧ACF使用の有無・所有確認 |
| 表 | Figma SP 442:2890 / 445:3237の横スクロール、960pxテーブル、ScrollHintのオプトイン、既存focus/aria対策とテストを確認 | #523 実表のoverflow/keyboard/ScrollHint |
| CSS/保守性・性能 | 既存import/依存・明らかな空CSSを小scopeで整理 (#637/#638)。画像のlazy/本番font/JS実行は未計測 | #523 / Vite build/lighthouse が可能な環境 |

**検証境界**: Figmaから取得した現物高精細context+スクリーンショットはデザイン根拠で、WordPress表示のスクリーンショットではない。旧サンプルと未接続公式素材を無断削除・置換しない。点検可能な独立source修正の探索を無限に延ばさず、以降は承認済み新規スコープを優先する。

## 記事一覧（Human承認 2026-11-25）
- PC 390:669 / 392:1265 / 390:1178 / 392:1244、SP 478:3027 / 478:3039 / 478:3089。高精細context・画像を確認。960px内幅、PCカテゴリ240×50・20px gap、SP全幅、行PC24px/SP20px 16px inset、日付14px Roboto Condensed、pill 80px/11px、タイトル16px、pager 40px/20px gap。既存通常投稿・カテゴリとURL、記事リンク、公式花SVGを再利用。
- #515の既存一覧構造を継続し、index.phpにも同じownerを接続。カテゴリはGETのcat=0/固定ページルーティング問題を避け、native detailsと実カテゴリURLを使用（openのデザインは未提示）。pagerはWP query/get_pagenum_link、PC最大5/SP最大3を現在頁周辺に出す。日付形式は一覧限定。パンくずは一覧下に移動。
- 次のREADY: 一覧固有hero 390:799/SP対応node、既存ACF visual設定・公式素材の確認。下部バナーは公式素材と管理ownerの確認後。共通他ページは変更しない。実WP #523未検証。

- 記事一覧hero PC 390:799/SP 507:2741 を高精細context・画像で照合。既存ACF page_img-post (attachment ID) を保持し、PC 1:2 grid / min400px、SP padding32/24・335:146、h1 32/24px、News pill を一覧限定partで実装。写真未登録は画像非表示でsampleなし。Figma画像のcrop比率から PC70%/SP76%を初期値にしたが実画像未設定のため#523で検証。PC装飾の人物390:803/390:832・吹き出し390:856は公式bytes未保存。下部バナー390:668/478:2756は透かし入り画像がFigma上にあり、権利確認済み画像と正しいPC/SPファイル待ち。代替素材なし。#524受入。旧body min-width1280は一覧のみ解除、他ページの幅規則は未承認につき保持。

- 記事一覧パンくず PC 390:792/SP 507:2818 を高精細context・画像で確認。既存BreadcrumbTrailの一覧限定optionで「ホーム」・FA Light F80B/F054・13/12px・PC64/SP20px inset、min-height50/48、自然折返しとfocusを追加。WordPressカテゴリ祖先とURLを維持し、page_for_posts未設定は誤リンクを出さない。#523実機受入待ち。次は#524の未取得公式hero装飾/権利確認済みバナーと#523。新規ページはHuman承認後。

- 記事一覧PC 390:669/SP 478:3027の最終行線の差、pager PC 392:1244/SP 478:3089のtracking 5%を反映。共有newsListのno-link hover色を一覧だけ抑制。CMS・PC行グルーピングは変更なし。残りREADY: #524公式hero装飾の取得/権利確定バナー、#523実機・keyboard/hover確認。未承認ページには進まない。

- 2026-11-25: 一覧の「すべて」・hero・パンくずを同一のWP投稿一覧設定で整合。公開済み固定ページまたは最新投稿frontのみ有効な全件URL。未設定/不正時は誤リンクを生成しない。次は公式人物SVG（390:803/832/856）と権利確認済みバナーPC 390:668/SP 478:2756、#523実機。新規sessionでデザイン画像再確認、公式SVGのcurl DNS失敗。素材の推測代替なし。

- 記事行のPC 390:1178/SP 478:3039再照合。無効URLは非リンク、欠損親カテゴリは余分なclassなし。既存rowの外観、通常の親slug/URL契約維持。次のREADYは#524公式SVG受入/権利確認済みバナー、#523実機。未承認ページには進まない。

- 一覧の非リンク行のHTML content modelをdivへ修正し、pager装飾FA F060/F061をaria-hiddenに分離（PC 392:1244/SP 478:3089）。見た目/通常リンク/CMSは維持。次のREADYは#524の公式装飾/権利確認済み画像、#523実機。show_on_front=posts時のfront-page.php優先による一覧ルーティングは実機確認、TOPは未承認で変更なし。


## 記事詳細（Human包括承認 2026-11-25）
- PC 392:1279 / SP 480:3566、本文PC 392:1282、タイトル392:1712/480:3912、pager392:1740/480:3921を高精細context・画像照合。既存news heroを再利用し見出しは記事h1のみ、本文はthe_contentと共通ブロック。日付PC16/SP13、Light F073、タイトルPC28/SP24、下線と余白32/24、内幅960、前後と一覧ボタン（260/min50、SP下段）を実装。記事サムネイル・カテゴリはFigmaにないため新規通常投稿詳細では出さない。既存redirect/CPT経路は保持。写真は既存ACF、人物・吹き出し・下部バナーは#524受入待ち。
- 次のREADY: 固定ページPC384:1046/SP445:3245、サイドバー、TOP各section、コース/オリジナルPC。SP未提示のページは既存共通のresponsive方針で確定できる独立部分に限り、デザイン未決を記録。全ページ包括承認済み、#523実機未検証。


## 固定ページ shell / sidebar
- PC 384:1046 / SP 445:3245、hero 384:1400/507:2729、sidebar 476:1741、bread 384:1395/507:2812。既存ACF page_imgとタイトル、Gutenberg、sidebar-navを利用。PC 840/256/75、SP 1列、狭いtabletでrail非表示。英語副題の管理契約・公式装飾/下部バナーは保留。次のREADY: sidebar深い階層の操作検証、TOP独立section・コース/オリジナル。#523/#524。


## TOP 重要なお知らせ
- PC 114:349/SP 279:2233で既存ACFの表示・繰返し・日付・本文・非表示を再利用。空行/無効日付、実リンクのみ、60pxはmin-height、PC/SPの配置とFA Solidベル。既存MVの直後。TOP他section・素材・ルーティングは別READY。#523実機未検証。


## 2026-11-26 TOP News source implementation
- PC 114:542 / SP 279:2524 high-fidelity context and images: 5 standard posts, heading 46/36px, 560/295px panel, 32px heading gap, 24/20px row padding, PC 40px row gap, shared date/category and official flower. Existing post URL owner and actual published configured posts-page only; no fake URL or CMS fields. TOP marker uses existing light-green token; exact marker color not specified in the hover instruction, review against actual hover reference. Instagram sibling, remaining TOP sections, TOP body min-width and complete layout remain separate. Runtime QA #523.


## 2026-11-26 TOP MV固定キャッチコピー
- PC 114:29/220:7、SP 279:2142/279:2144の高精細contextと画像を取得。既存公式PC glyph 5点とSP専用SVGを接続し、後続コピーはHTML（Zen Kaku Gothic New 48/28px）。装飾だけ位置指定、可変テキストはflexで自然に折り返す。既存TOPの1280px body最小幅をhome限定で解除。PC切替1080pxは785pxコピーと既存headerの境界を踏まえた実装判断で、Figma中間幅仕様なし。画像グリッド・CTA管理・motionは既存ACFと実装指示の確認後の別READY。実機#523。


## 2026-11-26 TOP旧イベントサンプルの除去
- PC 114:541/SP 279:2523 News親ノードの高精細contextと画像を照合。現行はNewsとInstagramの並びであり、CODIAのイベント一覧は存在しない。CURRENT_AUTHORITYのevent/event_cat登録停止に合わせ、front-pageのサンプルイベントsectionと専用CSSのみ除去。学習用関数や投稿データ、既存ACF、バナー・MV・Newsは変更しない。InstagramのURLは未確定のため捏造しない。次のREADY: TOP Aboutの固定テキスト/公式素材の接続、CMS依存部の切り分け。実機#523。


## 2026-11-26 TOP About固定紹介文・地図装飾
- PC 220:57/114:180、SP 279:2241/279:2318 の高精細context/画像で確認。SPECのTOP管理対象にない固定テキストをHTML化し、既存公式map/pin2点/強調点/花SVGを接続。PCは文と地図の自然なgrid、SPは装飾のみ背面配置。1080切替は既存headerに合わせた暫定中間幅判断。カード・共通背景・リンク・重なりの完成配置は別作業（CMS/リンク/素材受入を照合）。新規ACF・URLなし。実機#523。


## 2026-11-26 TOP News / Instagram integration
- Fresh PC 114:541/114:581 and SP 279:2523/279:2562 context + images. Fixed Instagram copy, saved official SVG and FA Brands icon; two-column PC 560/80/320 within 960, stacked SP 40 gap. 1080px column boundary is implementation choice; intermediate width remains stacked. Account URL/owner unconfirmed: omit Follow action, not a fake/disabled link. News arrow escape corrected to one CSS backslash. No new ACF/CPT or footer menu change. Actual CTA and runtime #523 remain pending.


## 2026-11-26 TOP For Applicants 固定部分
- PC 158:2645 / SP 279:2443 high-fidelity context+images, flower 506:2537. SPEC does not designate this section as CMS-editable. Connect saved official ico_flow/fee/visit and img_applicants; heading flower uses existing official blossom silhouette with the Figma cyan color as mask. PC 440/90/430, SP30 inset/64 block/40 gap, photo aspect 4:5 and 6.98% decoration; topic rows min80/100 (no fixed text height). Existing links/slug contract unconfirmed: rows are static information, no arrow/action/focus until actual destinations are provided. 1080px layout boundary is provisional. #523 actual browser and asset rendering pending.


## 2026-11-26 TOP MV初期静止コラージュ
- PC 114:29/184:797、SP 279:2142/279:2172 high-fidelity context and images: four PC columns with 20 gap, six slots; SP two columns 11 gap, slots 1/2/3/6 only. SPEC specifies each image CMS-managed; existing group_top_slider.json uses top_slider-01/img_pc/img_sp attachment IDs. Keep schema and all saved rows/text untouched; initial still uses first six valid image rows in order (PC fallback to same row SP if PC invalid, SP fallback to same row PC), fewer rows natural grid without empty placeholders; extra rows reserved for future motion mapping, not deleted. This slot mapping is implementation decision, not a newly confirmed editor/motion contract. Remove obsolete sample full-screen slider markup/CSS/initialization. No production fallback photos, no CTA URL or animation invented. 1080 boundary matches prior TOP decisions; real rendering and motion reference #523 pending.


## 2026-11-26 TOP既存バナーの異常系修正
- PC 114:419 / SP 279:2630の高精細context・画像を確認。確定デザインは全幅の写真だが現物に透かしがあり、権利確認済み原本未受入 (#524)。既存 `group_top_banner` のrepeater（img/title/url/target）と編集者のデータを維持し、実画像なし・空タイトルのrowは出さず、WP生成画像/タイトルescape、有効で名前のあるリンクのみ、外部relとfocusを追加。長文はgrid内で自然伸縮。これは既存CMSバナーの安全修正で、確定写真の実装・視覚一致ではない。#523実機未検証。


## 2026-11-26 TOP About shared background: visible paint/effect evidence (not connected)
- Fresh high-fidelity context + screenshots PC 220:56/SP 279:2137 and read-only property inspection PC 114:38/SP 279:2138. Sole visible source hash `bda617bb2353903d9be480597619657682f9d95b`, 1586×992, opacity 1; other 1586×992 and 3639×2276 fills are hidden. GitHub WebPs `img_about-bg-02.webp` and `img_about-bg-03.webp` were actually read/displayed; both VP8 header dimensions 1586×992. -02 is a photograph, -03 is an illustration visually matching the Figma scene/landmarks. -03 is the strong visible-source candidate, not selected by filename. Figma hash vs converted WebP provenance has not been cryptographically verified (base filename >1MB unavailable via contents; blob fetch rejected non-UTF-8). Keep all saved variants intact.
- PC frame 1380×1380, image slot x0/y91/w1380/h1159; visible crop transform [[0.690522,0,0.154739],[0,0.927200,0.072800]]. White rectangles 114:39 x-133/y1151/1644×229 and 114:40 x-132/y0/1644×397, both layer blur radius80. White ellipse 114:218 x-2/y416/1380×558, fill opacity0.8, layer blur radius160. Annotation: background adapts to browser width.
- SP frame 375×1870, image slot x0/y347/w375/h1493; visible crop transform [[0.122290,0,0.504239],[0,0.778415,0.221585]]. White rectangles 279:2139 x-93/y1724/599×146 and 279:2140 x-52/y0/479×477, blur radius80. White ellipse 279:2141 originally 1166×358, rotated -90°, visible bounds 358×1166 centered horizontally at top461, fill opacity0.9, blur radius40.
- Blur layers are native Figma primitives, not separate photographs. CSS primitive translation may be evaluated once shared section geometry is available; Figma radius vs CSS sigma requires actual rendering verification. Background spans About card area and overlaps Course; both lack complete CMS/section integration. No background source/CSS change, no new field or placeholder, no Figma mutation. Final acceptance requires exact source provenance and #523 runtime QA.
- Run handoff: #657 merged 24cc417, #658 merged 58b1619 after all three CI logs each. READY after owner evidence: Course card data mapping / About card links and media owner, then shared background and MV motion/CTA; exact URL/assets #524, actual WP/AT #523. No schedule action. The first attempt to create this docs tree returned 422 (base_tree invalid despite verified HEAD/tree); switch to single-file contents update on same branch, no force push.


## 2026-11-26 コース詳細：和文＋英文セクション見出し
- Human包括承認の範囲。PC 534:1282 はsparse metadata、子609:3046/612:3095/612:3256の個別高精細context・画像を確認（534:2369は導入見出し36/15pxで別）。PC section H2 Zen Kaku Gothic New 32px/700/tracking10%、英文Roboto Medium 13px/tracking5%、gap20、green。既存core/groupのopt-in style `jwsnj-course-heading` を追加し、Row内に標準H2と英文Paragraphを編集者が置く。中央揃えはRowの既存設定で指定。新ACF/CPT/URL/固定ページ・本文の自動生成なし。SP正本未提示なので24px H2・自然wrap・縦gap8は暫定実装判断。PCの通常H2の線をこのstyle内だけ解除、その他既存見出しは不変。両CSS importと静的テスト。エディタの選択・保存・再編集・PC/SP実描画は#523。
