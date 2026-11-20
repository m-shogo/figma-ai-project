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
