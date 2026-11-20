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
| `color/accent` | `#EC6B61` |
| `color/base--lightgreen` | `#F5FDEB` |
| `color/base--lightgreen02` | `#EAFFD9` |
| `color/base--lightblue` | `#D7F2F1` |
| `color/foreground/text--gray-700` | `#484848` |

確認済み Figma Font Variables: `Roboto`、`Zen Kaku Gothic New`、`Font Awesome 6 Pro`、`Font Awesome 6 Brands`。PCメニュー `599:2726` の実レイヤーには `Noto Serif JP`・`Roboto Condensed` の使用も見える。**使用箇所・weight/style・提供ファイル・読み込み方式・利用ライセンスはこれから検証**。Font Awesome Pro の有償ファイルを公開リポジトリに追加しない。使用できる正規のアセット・ライセンスを確認する。

## 画像・部品・挙動

- PCメニュー展開: `599:2726`、SP開閉状態: `480:3954`
- PCヘッダーは hover 展開、SPは click/tap 展開を基本とする（Human決定）。既存アクセシビリティの最低限の操作性は損なわない
- 実装はFigmaデザインを正本とし、ベース Theme は**書き方と再利用候補のサンプル**。必要ならFigmaに合わせて既存部品を改修・新規追加する
- 画像・ロゴ・装飾SVG・アイコンはFigma assetとsite側の具体的fileを対応づける。対象が異なるサンプル素材は流用しない
- 通常コンテンツはFlow/Flex/Grid。座標写経のabsoluteは避け、装飾・意図的な重なりはabsolute可
- `white-space: nowrap` はjwsnjの新規実装に使わない。テキストのline-height `1` は原則 `1.3`、2〜3行・PC/SP・中間幅で確認
- **文字拡大150〜200%の専用テストは対象外**（Human決定）。通常の折り返し・視認性・レイアウト確認は実施

## 残るFoundation導入チェック

- [ ] PC/SP全文字スタイルと色・余白・ブレークポイントを部品単位でマッピング
- [ ] ベース Theme 側のCSS変数とfont-face / 読み込み状況を照合
- [ ] 必要な画像・SVGのFigma出力とローカル配置を確認
- [ ] Foundation のコード反映とWordPress/Viteでの検証
- [ ] 前後の差分、PC/SP Visual QA、PR/CI確認

ログ: この文書は「初期調査」。今後の各作業回は実装結果と未確認点を更新する。
