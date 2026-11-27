# パーツ集 — Human提供の Gutenberg 確認サンプル（2026-11-27）

Human「パーツ集のサンプル？参考覚えてGIT入れといて これで確認できたらいいんだけど、、、」。

## 正本と用途
- [提供原文（839行）](../qa/fixtures/parts-catalog-owner-reference.html) は **QA参考資料**。WPコードエディター用のブロックコメントを保持。テーマ納品物ではない。原文は改変せず保管し、実際に投入するfixtureは現環境に適応した別物とする。
- JWSNJのデザイン正本は Figma K3SANPVHIEerfYBQtM4lXF PC 339:23 / SP 433:2015。提供例の40/20/10/15px・270px等をデザイン値として採用しない。
- 他案件では会社・Themeごとの既存ブロック、プラグイン、フィールド契約を照合し、テスト観点のみ再利用候補とする。サンプルCSS/画像/文言を本番へ流用しない。

## 確認マトリクス
| 対象 | ケース |
|---|---|
| 見出し・段落 | H1〜H6、見出し直後、太字/下線/コード、左中右揃え、長文、アンカー |
| Group/Columns | 背景あり/なし、2/3列、SP積み重ね有無、複合ブロック |
| Image/Media & Text | 左右回り込み/中央、caption、lightbox、リンク画像、左右配置、上中下揃え、SP積み重ね有無 |
| List | ul/ol/注釈、入れ子、2桁、リンク/強調、長文 |
| Link/Button | 標準/輪郭、左中右揃え、長文、内部/外部/PDF/添付、href未設定 |
| Flexible Table Block | ヘッダー、結合、等幅/可変、caption、縦配置、ストライプ、SP横スクロール |
| Gallery | 2/3列、奇数枚、caption有無、lightbox、Columnsとの比較 |
| Details | 通常/FAQ、長いsummary、画像/表の内包、開閉・keyboard・reduced motion |
| その他 | separator、引用、ページ内リンク、投稿出力、Large/Small Navigation（画像なし・長文・外部リンク）、タブ（長文・複合内容）、端末別表示 |

## 実際の WordPress 確認手順（#523 の実機 QA）
1. ローカル/使い捨てWPに検証専用固定ページを下書き作成。既存ページや公開コンテンツを上書きしない。
2. 原文を直接公開しない。現Themeの登録済みブロック、ACF field key、プラグインとバージョンを照合。旧投稿ID・画像ID・patternName・旧環境URL/パス・外部URL・イベントCPTを実環境の検証専用データへ置換。原文に含む空のmedia figure、重複段落、素のpは意図/ブロック妥当性を確認。画像は保存済み正規素材またはローカルQAダミー、外部画像への依存は避ける。新規ACF JSON、CPT、未承認プラグインを導入しない。未対応ブロックは個別に未検証記録。Cursor側の正式CMS接続を妨げない。
3. 適応済みHTMLをコードエディターに貼り付け、ビジュアルエディターに戻して無効/復旧ブロックがないか確認。保存→再編集で破損がないか、実際のフロント出力でも照合。必要なら既存QA seedに統合（再実行可能・明示的な開発限定・本番自動登録なし）。
4. PC/SP/中間幅・境界前後でFigmaと比較。長文の折り返し、余白、画像比率、表のoverflow、リンク状態、hover/focus/touch/keyboard、タブ/アコーディオン開閉、動きの軽減、レイアウト変動を確認。固定高さ・nowrap・本番ダミー禁止など現Authorityを維持。
5. 検証したSHA、WP/プラグイン版、画面幅、スクリーンショット、各ケースPASS/FAIL/DEFERREDを#523へ記録。静的HTMLの確認は実WPのPASSではない。

## 現状
原文保存とチェック観点の整理のみ。WPへの投入・ブロック登録/復旧・実際の描画・操作・Figma照合は未実施。#523/#524、ACF W9/#664、オリジナル534:1706の保留を解除しない。既存theme/スケジュール変更なし。

## 第1段階 — native Gutenberg 検証fixture（2026-11-27）

- 原文839行はそのまま維持。`qa/fixtures/parts-catalog-native.html` は現Themeの見出しH2–H4・段落・入れ子リスト・番号付きリスト・注釈・標準/長文ボタン・通常/長文/QA Detailsに絞った別fixture。外部画像、旧投稿ID、ACF、CPT、旧patternName、旧数値付きラベルは取り込まない。
- `qa/seed-native-parts-qa.php` はlocal・loopback・`JWSNJ_PARTS_QA_DISPOSABLE=1` の明示条件を要求。登録済みcore blockだけを許可し、既存の非fixtureページを上書きしない。使い捨てWPで保存・再読一致を確認する。実サイトの自動seedではない。
- 既存disposable WordPress CIで `qa/native-parts-browser-qa.mjs` を実行。3 engine × 320/375/768/1380px、見出し/本文の実測gap、ネイティブリスト、ボタン幅、Detailsの実際のPHP描画・キーボード・フォーカス・展開後の通常flow・閉状態復元・画像を確認する。Figma Details PC357:938/SP442:2908の新規session context/画像を確認済み。
- 設定時点では新CIの合否未確定。PHP parse/save一致はGutenbergビジュアル編集のvalidation/保存再編集を証明しない。外部フォント、実デバイス、Flexible Table Block、ギャラリー、ACF Navigation、タブ、端末別表示、全体視覚一致は別途#523。新規ACF・本番仮画像・未承認ページ・スケジュール変更なし。

## 第2段階 — 実エディター / Table / Gallery（2026-11-27）

- #771 merged `583e75b`。実Gutenberg core block 0 invalid、末尾段落のUI入力・保存・再編集・front反映PASS（Chromium、WP7.0.2）。案内modalを通常Closeで閉じる。再編集画像を確認したがeditor CSSの見た目はfrontと一致していないため別QA。Human原文839行は変更なし。
- #773でFlexible Table Block3.9.0の登録済みブロック・保存再読・4列固定/可変/縦並び・結合・長文・横スクロールhint/keyboard/resizeを実WP検証。既定セル余白のspecificity修正後12ケースPASS、ただし既存motion回帰がFAILしたため再実行中。#774で実core gallery 2/3列・奇数・3:2/長文caption・native lightbox・media-textを既存媒体の隔離コピーで検証中。各PRの最新CI/画像が完了するまでmergeしない。

## Navigation — 既存ACFブロックを正本として使う（2026-11-27）
Human提供839行の `acf/navigation-large` 2行・`acf/navigation-small` 3行のブロックコメントと現行ACF JSONを照合。repeater keyと全5 subfield keyは一致。画像ID・title・text・URL・target（checkbox「はい」）の既存契約を維持。旧添付IDと旧URLは使わない。

- `tests/parts-navigation-acf-reference.test.mjs` は原文から毎回データを抽出し、現行field keyと実PHP adapterを検証。PHP API stubであり実ACF Proではない。
- `qa/prepare-navigation-blocks-qa.php` は明示されたlocal loopback環境だけで、実登録済みACFブロック・field key・選択した2つのQA用添付IDを照合して、コードエディターへ貼れる適応済みブロックコメントをstdoutへ出す。DB更新なし。既存ローカル `/parts/`（post109、●●パーツ集●●）のコピーまたは別下書きで使用。既存ページを自動上書きしない。
- 実行例（CursorのローカルWP CLI、実際のQA画像IDを指定する）：`JWSNJ_PARTS_QA_DISPOSABLE=1 wp eval-file /path/to/project/qa/prepare-navigation-blocks-qa.php <QA画像ID1> <QA画像ID2>`。Dockerでは環境変数をコンテナへ渡す。出力はQA専用、実サイトへ登録しない。実ACF Proでの追加/編集/保存/再編集/表示、外部リンク・未設定URL・画像なし・長文をCUR-04で検証。TOPはパーツ合格後。

## 2026-11-27 Native tabs version gate / viewport visibility
- #785 head 89b506c, actual CI run45971303769/job140412133060 failed at disposable seed: `unexpected or unregistered tabs block: core/tabs`. WordPress official [Tabs block documentation](https://wordpress.org/documentation/article/tabs-block/) requires WP7.1+. Current WP7.0.2 runtime cannot establish this block family. Prior reading of a tabs view.js did not establish installed registration. Keep #785 open and unmerged; no automatic WordPress upgrade, Gutenberg plugin install, native block emulation or legacy ACF substitution. Confirm actual Cursor target version and authorized dependency choice before resuming.
- Fresh Figma official skill/session PC339:23/SP433:2015 indices and PC357:995/SP442:2771 high fidelity context/images: heading/body geometry confirmed; no separate viewport visibility visual target. This QA validates native CMS behavior, not visual parity.
- Native viewport metadata from exact four Human paragraphs added only to disposable fixture; original 839 lines unchanged. [WordPress 7.0 visibility dev note](https://make.wordpress.org/core/2026/03/15/block-visibility-in-wordpress-7-0/). Verify actual rendered native classes/display/zero geometry after resize (375/480/481/767/768/782/783/1380) in three engines; editor metadata save/reopen. Core 480/782 boundaries are separate from Theme 768. Existing theme and workflow unchanged. CI and screenshots pending, no runtime or visual PASS claimed.
- Cursor next: verify native tabs availability in actual target, viewport visibility editing, actual ACF Pro navigation and editor canvas parity. No TOP, #664, held page 534:1706, new schema, owner, schedule or production data changes.
- #787 diagnostic run46012005630/job140549610124 confirms real viewport481, native media matches tablet, no native visibility style element, and only Theme CSSOM rules 768/1024px. Source owner `theme/css/blocks/wp-block-hidden-style.css` is imported by front and editor styles. Align only its three media queries to installed WP7.0.2 Core 480/782px; do not alter Theme layout or global-style suppression. New QA also tests 1023/1024, three engines × ten widths, including the former breakpoints. WordPress 7.1 configurable viewport migration is a separate version gate. No production metadata/schema changes; runtime CI and screenshot verification pending.


## 2026-11-27 区切り線・リンクの実WP確認
- #793 merge 6ad4aa5f、CI3/3・実WP separator12/12（320/375/768/1380px、3engine）、Gutenberg core/separator登録・invalid0・保存再編集・front PASS。artifact15207771083 PC/SP6 PNG確認。実測はPC65/SP81px、直前見出しgap40/32、後段落24、公式花SVG decode成功。fixtureのPC幅はFigma960pxと異なるので厳密視覚受入は別。
- #794 は添付リンクの明示target/既存rel/path拡張子を維持する修正とQA。既存参照の旧URLは使用せず隔離fixtureの未遷移リンクを検証する。CI未確認。WP7.0.2標準タブ未登録の#785は承認されたバージョン/依存変更まで保留。既存本番データと原文は変更しない。
