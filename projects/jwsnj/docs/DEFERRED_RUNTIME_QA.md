# jwsnj — ローカルWordPress・ブラウザ検証 後日実施リスト

Status: **DEFERRED_ENV / 検証未着手**（Human決定 2026-11-20）
Scope: **ニュージャージー補習授業校だけ**。詳細の技術仕様は `CURRENT_AUTHORITY.md` / `SPEC.md` / `DESIGN_FOUNDATION.md` / `IMPLEMENTATION_CHECKLIST.md` を優先する。

## なぜ今は実施しないか / いつ再開するか

- Human: **現在はローカルWordPress環境を操作できない**。この実行レーンから `127.0.0.1:28000` やHumanのPC上のWordPressへアクセスできるとは限らない。**今回実際に接続/ブラウザ確認をしていない**。CLIやGitHub CIの静的成功をローカル表示確認と混同しない。
- 現段階での優先作業は **GitHub + Figmaでできる調査、共通Foundation導入、テーマ/ACFの既存契約に沿ったコード、静的検査、CI、PR/merge**。ローカル環境が利用できないことだけでこの作業を停止しない。ローカル実機を毎時無意味に再試行しない。
- **再開トリガー**: HumanがローカルPC/Work/Codex等を操作可能と示した、または実際に接続できるWordPress/ブラウザ実行環境が提供された時。
- **優先順位**: 再開トリガーが成立した最初の作業回で、このファイルを**作業開始時に読む**。まず下記 `ENV-01` → `P0` を新規ページ実装より優先し、関連する不具合を修復する。P1以降は実装完了範囲/変更時点に応じて順次実行。実行できないものは `DEFERRED_ENV` のまま残す。
- ここに記した **「後で確認する」≠「確認済み」「不具合がある」**。実機アクセス不可以外の事実（Figmaにないnode、未決URL等）を勝手に埋めない。未実装パーツのQAは `NOT_READY_IMPLEMENTATION` と区別する。

## Status・証拠の記録ルール

- `DEFERRED_ENV`: 実装の有無にかかわらず現在のレーンで実行不可 / 未検証
- `NOT_READY_IMPLEMENTATION`: 対象パーツがまだ未実装のため時期尚早
- `READY_LOCAL`: 実装済みかつローカル環境で実行可能になったが未実行
- `FAIL`: 実際に実行して不合格。症状、再現方法、原因・関連PRを記録
- `PASS`: 対象の正確なコミットSHA・ブラウザ/幅・操作・スクリーンショット/ログに紐づく実測結果あり
- `N/A`: 適用不要と判断した理由が明示されている

最初の状態はすべて**未実施**。HTML/CSSの静的レビューやGitHub CIが成功してもこのチェックをPASSにしない。後で新しいCSS・font・共通部品の変更が入ったら、その依存範囲の既存PASSは再検証する。

## 0. 環境・編集の再現性（復旧時最優先）

| ID | 優先 | 状態 | 確認内容・実施時の受入条件 |
|---|---|---|---|
| ENV-01 | P0 | DEFERRED_ENV | repoの最新 `so` を取得、`./wp.ps1` ではなく **Windows PowerShellの `.\\wp.ps1 status jwsnj` / `.\\wp.ps1 up jwsnj`** で案件の実行状態を確認。ローカル `http://127.0.0.1:28000` が実際に表示され、PHP Fatal/404がない。起動できなければコマンド出力を記録 |
| ENV-02 | P0 | DEFERRED_ENV | WordPress管理画面ログイン、テーマ `jwsnj` の有効化、必要なプラグイン（特にACF PRO / Formidable Pro）の有効状態とバージョン、`Asia/Tokyo`、Web表示に必要な固定ページ・メニューの割当を**実際に確認**。認証情報/有料ライセンスはGitへ保存しない |
| ENV-03 | P0 | DEFERRED_ENV | `projects/jwsnj/` で `pnpm install`（必要な場合のみ）/ `pnpm build`、必要なら `pnpm dev`。Vite画像変換とホットリロードが機能するか、生成物が期待パスかを確認。実行できたコマンド・終了コード・ログを記録 |
| ENV-04 | P0 | DEFERRED_ENV | QA用DB/uploadsの `.\\wp.ps1 snapshot jwsnj` の可否、既存データ保護、空/長文/画像なし等のテストデータを安全に再現できるseedの有無を確認。作業前に**破壊操作を行わない**。スナップショットは `.local/` でGit外 |

## 1. 共通Foundationのローカル実装・描画確認

| ID | 優先 | 状態 | 確認内容・実施時の受入条件 |
|---|---|---|---|
| FOUND-01 | P0 | DEFERRED_ENV | Figma `114:28` 由来の10色が、`theme/css/style.css`→ `global/variables.css` の読み込み経路でCSS Custom Propertiesとして解決し、**実際に使用するパーツのcomputed styleへ反映**されている。CODIAサンプル色の残存で想定外の青/橙表示にならない |
| FOUND-02 | P0 | DEFERRED_ENV | Figmaの各テキストに必要な `Zen Kaku Gothic New` / `Roboto`、レイヤーにあれば `Noto Serif JP` / `Roboto Condensed` のfamily・weight/style・実際の配信・fallbackをブラウザ上で確認。Font Awesome Pro/Brandsは正規利用権限とCSSの読み込みを確認し、不正なフォント/代用品を加えない |
| FOUND-03 | P0 | DEFERRED_ENV | Figmaの正確な画像・ロゴ・SVG・アイコンが `theme/` の意図したパスで表示される。404/一時Figma URL/不適切なcropや伸縮がない。SP/PCで必要な画像の切替・見え方を確認 |
| FOUND-04 | P0 | DEFERRED_ENV | 通常テキストの自然な2〜3行折返し（日本語・英語混在・長いCMS文言）・基本行間`1.3`・中間幅・横スクロール/overflowを確認。**150〜200%の専用文字拡大テストは本案件では要求しない**。新規テキストへの`white-space: nowrap`は不可 |
| FOUND-05 | P0 | DEFERRED_ENV | 共通Font/CSS/asset変更によって他の実装済みページを破壊していないか、影響範囲のPC/SPを再検証。CSS lint/build PASSだけでは代替不可 |

## 2. ページ/状態ごとの後日UI・CMS QA

現段階で未実装のページは `NOT_READY_IMPLEMENTATION`。着手・完成後にlocalが使えなければ `DEFERRED_ENV` へ移し、**登録し忘れを防ぐ**。

| ID | 優先 | 初期状態 | 参照Figma・完了条件 |
|---|---|---|---|
| PAGE-HEADER | P0 | NOT_READY_IMPLEMENTATION | PCメニュー `599:2726`、SP `480:3954`。PC hover 展開・SP click/tap 開閉、focus/keyboard・close状態、重なりとレイアウト、ナビ管理画面の編集/反映、横スクロール。**1079/1080/1081px** でPC/SP状態・`inert`・操作対象がCSSと一致すること、SPでボタン・閉じる・overlay・Escape・幅跨ぎの全閉鎖経路で `_contentFixed` が解除され元のスクロール位置に戻ることを確認。PR #518 のNode静的テスト成功は実機PASSではない |
| PAGE-FOOTER | P1 | NOT_READY_IMPLEMENTATION | Figma Footer `221:335` とPC/SP全体 `0:1` / `263:12`。WordPress管理画面で**フッターメニュー位置 `footer-nav` に設定したメニューだけが、1回だけ**出力されること（Header用 `sub-nav` が重複しないこと）。メニュー未割当時にCODIAサンプルや別メニューが表示されないこと、長いメニュー名・日本語英語混在・リンクキーボードフォーカス・nav landmark・PC/SP/中間幅を確認。ロゴ、SVG装飾、Instagram、ページトップ、hover、住所等の許諾済み情報、フッター下帯の視覚一致も確認。PR #519 の静的テスト/CIはブラウザ・WordPress実機PASSの代替にならない |
| PAGE-ARCHIVE | P1 | NOT_READY_IMPLEMENTATION | 記事一覧 `390:666` / `478:2615`。投稿0/複数件、カテゴリ表示、長いタイトル、日付、ページ送り、正しいリンク（URL確定後） |
| PAGE-PARTS | P1 | NOT_READY_IMPLEMENTATION | パーツ集 `339:23` / `433:2015`。共通部品のPC/SP geometry、状態、画像・hover動作と他テンプレートへの適用 |
| PAGE-SINGLE | P1 | NOT_READY_IMPLEMENTATION | 記事詳細 `392:1279` / `480:3566`。本文・画像・見出し・空欄・関連記事等の構造をFigmaと実データで確認（URL未確定部分は別途保留） |
| PAGE-STATIC | P1 | NOT_READY_IMPLEMENTATION | 固定ページ `384:1046` / `445:3245`。PC SideNavigation `476:1741`、長文/画像、管理画面の編集のしやすさ |
| PAGE-TOP | P1 | NOT_READY_IMPLEMENTATION | TOP `114:28` / `279:2136`、実装指示 `294:852`。MV、CTA、Notice、Course、各hover、空欄/非表示、ACF編集、画像比率・動き。コース紹介**下層**はHuman指示まで実装しない。公式 SVG / WebP は #600 で `images/top/` に保存済みだが `front-page.php` 未接続。接続と表示確認が残作業。詳細は `DESIGN_FOUNDATION.md` の「残作業」 |
| PAGE-SHARED | P1 | NOT_READY_IMPLEMENTATION | 共有Header/Footer変更後の全実装済み画面（PC/SP）でレイアウト・動作回帰。固定要素・オーバーレイ・スクロールロック、横幅境界 |

## 3. 実行結果を残すときの形式

各項目を以下の形式で更新（仮のPASS禁止）:

`ID / status / tested_sha / environment(ブラウザ/バージョン/幅) / data(試験内容) / evidence(ローカル screenshot/log path or PR) / failure_or_remaining / next_action`

- Figma素材はスクリーンショットを実装アセットに流用しない。
- 必要な画像・ファイル・ページURLなど現時点で不明な値は**未確定**と書く。想像で埋めない。
- ローカル検証で見つかった問題は、`../LEARNINGS.md` と関連する実装チェックシートへ反映し、小さな修正PRで対応。復旧後は最新 `so` SHAから再テストする。

## 4. 今できる作業 — local復旧を待たず進める

- FigmaのデザインFoundation（画像/フォント/変数/共通UI）とCODIAベースを照合して必要な改修を実装。
- GitHubで可能な差分レビュー・lint・CI結果の確認、PHP/JSの静的な安全性・ACF既存構造・テンプレートの保守性を検証。
- PC/SPのFigmaデザイン情報を取得し、Header/Footerなど個別パーツを作業ブランチで実装。画面表示未検証の範囲はこの台帳へ登録。
- 既存PRを安全にマージし、`READY`の次の作業へ進む。ローカルWP実機がないこと自体をGitHub/Figma作業の全面停止理由にしない。

### PAGE-PARTS — H4 / separator blossom (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC/SP/intermediate widths, long Japanese/English and linked H4, editor/frontend parity, adjacent block margin collapse, official blossom loaded and centered with native SVG aspect ratio, native hr semantics and no horizontal overflow. Compare Figma PC 344:901 / 344:1135 and SP 442:2766 / 442:3204. No actual browser PASS claimed.

### FOOTER — PC sitemap official bullet (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC top-level menu links display 5.41839px official dot with 12px gap, correct type, multiline and focus, unchanged link/child disclosure behavior. Compare PC 114:523 and SP 506:1632; PC column grouping and SP sitemap visibility remain separate review. No real browser PASS claimed.

### PAGE-PARTS — H2 two-color bottom stroke (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:907 / SP 445:3207; compare 3px bottom-only border, horizontal sharp 16% main/84% lightgreen stroke, natural multiline wrapping and unchanged surrounding spacing in editor/frontend at PC/SP/intermediate widths. No actual browser PASS claimed.

### PAGE-PARTS — official external icon, large/small buttons (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:968 / SP 442:2832. Compare large 14×13 right and small 13×12 centered in 30px circle, default/outline/hover/focus, PDF/file precedence for target=_blank, small fit-content desktop, long labels and narrow widths, frontend/editor. Confirm masks and colors render correctly. No real browser PASS claimed.

### PAGE-PARTS — inline external link official SVG (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:1029 / SP 442:2882, coral link and separate orange 14×13 icon, multiline paragraph/list/table at narrow width, baseline, hover/focus and file-icon precedence including external PDFs, editor/frontend. No actual browser PASS claimed.

### PAGE-PARTS — Large navigation arrow corner (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 384:914 / SP 442:3081. Verify 48px white corner, 20px top-left radius, 32px green circle and Font Awesome 10px arrow, actual image clipping/zoom, focus, no arrow on disabled cards, long text and narrow width, editor/frontend. Existing CMS image fallback and disabled-anchor semantics are separate review; no browser PASS claimed.

### PAGE-PARTS — list nesting and native numbering (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:936 / SP 442:2795. Check child bullet marker 24px / text 42px relative to parent left, 12/8px gaps, native ol start=10/reversed/li value and nested lists, 1/2/3-digit labels, adjacent annotation clearance 20px in both orders and with other blocks, long text and editor/frontend at PC/SP/intermediate widths. No actual browser PASS claimed.

### PAGE-PARTS — gallery zoom affordance (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:1079 / SP 442:2973. Verify existing 44px icon and 20px glyph, inset PC20/SP16, green/white reverse, actual WP lightbox button visibility (no duplicate control), mouse/tap/keyboard open-close and focus return, reduced motion, captions and external/PDF link preservation. No browser PASS claimed.

### PAGE-PARTS — media/text grid and editor settings (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:929 / SP 442:2788, compare default 410:510 top-aligned grid and 40px gap, 600/601/767/768px stacked left/right and nonstacked, editor custom widths, explicit center/bottom alignment, image-fill/link/caption and long text. Validate against installed WP version and editor/frontend. No actual browser PASS claimed.

### PAGE-PARTS — Large navigation empty fields and link semantics (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 384:914 / SP 442:3081. Verify empty/invalid URL is not focusable or navigable, valid external URL gets noopener, empty rows omitted, missing image has no sample placeholder or broken img, image-only named/unnamed card, title/body-only card, keyboard, editor/front parity and long text. Missing-image layout is a conservative fallback, not a Figma visual acceptance claim.

### PAGE-PARTS — mobile table scroll hint (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 357:970 / SP 445:3237; confirm existing Flexible Table Block 3.9.0 markup, core tables, multiple tables, 767/768px resize, explicit stack/PC scroll settings, actual overflow only, native keyboard/touch scroll, caption and labels, one hint per table, hint disappears on scroll/focus, reduced motion, actual glyph/overlay/scrollbar visual parity. No real browser PASS claimed.

### FOOTER — in-flow copyright / page-top bar (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 114:536 / SP 279:2805, 60px right square and left-aligned 12px copyright, native anchor click/keyboard with existing pageScroll, reduced motion, long site names and short pages, hover/focus, no fixed overlay. PC privacy link pending approved destination. No browser PASS claimed.

### FOOTER — adaptive PC sitemap and site identity row (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 114:484 / 114:523 / 154:2619; verify 308/541 layout, 3 balanced columns, 80/16px gaps at reference width, 8/variable item counts and nested submenus, long labels, keyboard tab order, external f2d2 and hover/focus, SP existing disclosure retained (visibility needs Human confirmation), intermediate widths. No browser PASS claimed.

### FOOTER — brand flow and wide viewport line extension (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 114:422/SP 279:2632 and line variables 279:1516/279:1567. Check SP copy above two edge-aligned artworks, PC 484px center / 40px gaps / 408px art, 320/375/767/768/1079/1080/1380/1920 widths, long copy, no extra 50px top gap, 1px extension joins on wide PC, actual SVG geometry and line alignment. No browser PASS claimed.

### PAGE-PARTS — in-page links and literal IDs (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 357:1022 / SP 442:2948. Verify empty/partial/all-empty ACF rows, pasted #, Japanese/punctuation IDs, missing/malformed fragments, deep-link load, page-top, actual header offset, keyboard and long labels at PC/SP/intermediate widths. No browser PASS claimed.

### PAGE-PARTS — accordion open geometry and Q/A markers (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 357:938 / SP 442:2908; verify closed 24px / open 32px title inset, Q/A regular-width Roboto Medium 24px in 16px rail with 16px gap and centered on wrapped content, native summary click/Enter/Space, focus/reduced-motion, nested open/closed and _qa isolation, actual legacy render_block and editor/frontend markup. Existing nested regex rendering is a separate potential issue, not fixed or verified. No browser PASS claimed.

### PAGE-PARTS — details render ownership (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): verify core/details nested rendering order, editor markup, native open/name/keyboard/focus, rich-text summary and body, predecorated and unfamiliar summary attributes; PHP CLI isolated callback tests are not full WordPress runtime. Unsupported outer summary markup is intentionally preserved. No browser PASS claimed.

### PAGE-PARTS — background text boxes (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:918/920 / SP 442:2776/2779. Choose background group and columns styles in editor; verify #f5fdeb/5px radius/PC40 SP32 padding, 20px H4-body gap, official blossom geometry, PC40/SP24 column gap, long/unequal text, single and pair, default/custom widths and mobile stack, editor/frontend. No browser PASS claimed.

### PAGE-PARTS — paragraph marker and medium emphasis (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:916 / SP 442:2774 and marker 442:2784. Check strong weight 500, yellow #ffebb3 5px marker on editor underline, multiline fragmented inline, explicit background and non-paragraph underline preservation, links/long Japanese and English/editor/frontend at PC/SP/intermediate widths. No browser PASS claimed.

### PAGE-PARTS — gallery caption flow (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:1079/SP 442:2973. Verify consecutive gallery gap 40px, card top alignment with unequal captions, natural long-caption height, exact image 3:2 and 20px caption gap, core CSS cascade, PC/SP/intermediate, native lightbox keyboard/focus and optional captions. No new fallback images or runtime PASS claimed.

### PAGE-PARTS — button group spacing (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:968/969 SP 442:2832/2833/2842; verify large gap20, adjacent large/small40, small PC 20/30 row/column and SP vertical flow, long labels/custom widths/alignment, icons/focus/hover. Mixed 30/20 SP small group gaps require author grouping confirmation; current uniform 20px. No runtime PASS claimed.

- DEFERRED_RUNTIME_QA (#523): 注釈 PC 344:937/SP 442:2796。段落・画像・gallery・group/columns・media-text・buttons・details・表・既存ページ内リンク/Largeナビとの前後20px、連続注釈、margin相殺/非相殺、core/editorのblock-gap・編集者指定・先頭末尾・長文、PC/SP/中間幅。見出し/区切り線の独立余白は維持を確認。実機未検証。

### PAGE-PARTS — inline file/PDF icon geometry (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:1027/344:1028/357:924 and SP 442:3202. Check FA Regular 13px PDF F1C1 orange #f0813b / attachment F15C coral #ec6b61, existing external SVG, normal links and long wrapping text, hover/focus/keyboard, PC/SP/intermediate widths, actual editor/frontend. No runtime PASS claimed.

### PAGE-PARTS — 小ボタンの矢印 optical alignment（Human FB 2026-11-25、優先修正）
- OPEN_VISUAL_DEFECT / #523: PC 344:971 / SP 442:2835。Humanが矢印の見た目の中央ずれを指摘。Figmaの原寸30px円/12px glyphと実装スクリーンショットを比較し、実FA6 Proの描画範囲、継承letter-spacing、baseline、左右上下余白、視覚重心を測る。必要ならglyphだけ補正し円/ラベル/クリック領域を維持。通常/外部/PDF/添付、hover/focus、長文、PC/SP/中間幅。原因・補正値・修正後描画は未検証。静的PASSでcloseしない。

- 2026-11-25 optical alignment source repair: circle/glyph分離、共通center、tracking隔離、実FAのhheaとink中心が一致するためtrimなし、alignment classの競合対策、大小F15B。#523 OPEN_VISUAL_DEFECT継続。実FA6 Pro/font loadと対応browserでPC/SP・中間幅、normal/external/PDF/file、hover/focus、長文、WP editorのalignment classを再描画。補正値を推測追加しない。本文F15Cは別ownerのまま。

- 2026-11-25 同系丸矢印: ページ内リンク F063 Solid（24px円/10px）、大ナビ F061 Regular（32px円/10px）は実TTFのinkとhhea中心一致を確認しtrackingを隔離。PC/SP・中間幅、2〜3行、focus/hover、画像cropとcornerの位置、WP editor/publicで実fontの原寸描画を確認（#523 DEFERRED_ENV）。

- 2026-11-25 galleryズーム: 44px外径（border込み）、20px F002 Regular、PC20/SP16px inset、通常/hover/focus、実fontの原寸重心、長いcaption、320/375/768/中間/PC幅、native lightbox keyboard、外部/PDF非対象の回帰。#523 DEFERRED_ENV。H3白/水色のcontrastはデザイン判断待ち、現行色変更なし。

- 2026-11-25 H2 stroke inset: PC 344:906/SP 445:3209、3px線を下余白28/24pxに含める。隔離Chromium 320/375/767/768/960/1380で旧新差3px、水平overflowなし（system font、WPではない）。#523でPC/SP/中間幅の実font・複数行・editor/frontend block gap・二色線を検証。視覚PASS未宣言。

- 総点検第1回: SP nav 100dvh + 100vh fallback、長文flex shrink。iOS Safari/Android Chromeでアドレスバー表示・非表示、最下部へのscroll、1079/1080/1081px、長文・開閉・focusを確認。Header/Footerの構造差は承認済みCMS/assetと照合。parts全体の視覚・操作QAは未完。配色は変更しない。

- tabs: 長文・複数行・横スクロール・focus・editor/public。lightbox: mobile browser chrome表示時の画像と閉じる操作、縦横画像。静的修正のみ、#523で実機確認。

- 小型ACFナビ: PC/SP中間幅・長い日本語/英数字・画像有無・空行・リンク有無・外部リンク・キーボードをWordPress実データで確認。ソース健全性対策は実機PASSではない。

## 2026-11-25 共通UIソース一巡後の #523 優先QA

- P0: Header PC/SP 320/375/767/768/1079/1080/1380pxの長文・日本語英数混在、menu open/close、PC hover/touch/focus、モバイル可視viewport、footer実SVG/lineとメニュー、アイコン実font/optical alignment。最新 `so` を用いる。
- P1: parts PC/SPのgallery/zoom/lightbox、メディア＋テキスト、accordion通常/Q&A、core tabs +旧ACFタブの利用状況、表960px横スクロール/ScrollHint、見出し・本文・注釈・大/小ナビの折返し、Core/Editor cascade。
- P2: プライバシー/住所/電話/SNSなど未承認管理値、スライダー挙動/ACF項目、Smallナビ専用デザインは**推測実装の対象外**。確認可能となった段階でHuman契約に合わせて別の小scopeで着手。配色変更なし。


### NEWS ARCHIVE — #515（Human承認 2026-11-25）
- PC 390:666 / SP 478:2615: 0/1/10+ posts、投稿一覧/index fallback、category URL・全件復帰・ページ送りとquery string、カテゴリ0/多数/長文、日付、no-link/external/file、keyboard details開閉/Tab順・focus、現在頁、PC/SP/中間幅、パンくず位置。既存共通heroは別READY。静的/isolated PHP とWP runtimeを分離。#523 DEFERRED_ENV。

- NEWS ARCHIVE hero: PC 390:799/SP 507:2741。ACF page_img-post 設定/未設定/不正ID、長いページ名、PC/SP/768/1080境界とheader/footerのoverflow、実image srcset/crop、パンくず1回を検証。隔離PHPの条件分岐と静的CIは実WP表示ではない。PC装飾/下部バナーは#524（バナー透かし・権利未確定）。

- NEWS ARCHIVE breadcrumb: PC 390:792/SP 507:2818。ホーム文字/アイコン、深いカテゴリ・長文・ページ未設定、1回表示、focus、FA Light読み込み、PC/SP/中間幅を確認。PHP CLI stubはWordPress実機ではない。

- NEWS ARCHIVE row rhythm: PC末尾線なし/SP末尾線あり、0/1/10+件、PC/SP/中間幅・長いタイトル/カテゴリ、pager文字trackingとFA glyph、非リンクhoverで色が変わらないこと・リンクhover/focus維持。実WP/browser #523 DEFERRED_ENV。

- NEWS ARCHIVE routing: show_on_front=posts（旧page_for_posts残存含む）、page+公開投稿ページ、page+未設定/非公開/削除/異種post/同じfront ID、categoryからの全件復帰とhero/breadcrumbの整合。実WPの設定切替とquery、keyboard disclosureを確認。PHP stubは実WPではない。

- NEWS ARCHIVE row data safety: 不正URL・空URL・正常内部/外部/添付リンク、親カテゴリ削除/取得失敗・複数カテゴリ、HTML属性・長文・keyboard focus対象を実WPで確認。隔離PHP stubと実機を区別。#523 DEFERRED_ENV。

- NEWS ARCHIVE semantics: 非リンク行のHTML flow content、pager 前へ/次へ のaccessible nameに装飾FA glyphが混入しないこと、先頭/末尾のdisabled幅、PC/SP/中間幅と長文・Tab/Shift+Tab。show_on_front=posts時に既存front-page.phpが優先される実経路（#643の全件リンク）を検証し、TOP変更が必要ならHuman承認待ち。#523実WP/AT未検証。

- NEWS DETAIL PC 392:1279/SP 480:3566: 実WPで通常投稿・password保護・既存ACF URL/file/none、前後記事なし/片側/両側、一覧設定有無、h1一つ、Gutenberg本文、長文・PC/SP/中間幅・keyboard/hover、hero画像/装飾・バナー#524を検証。静的/PHP stubのみ。

- FIXED PAGE: PC384:1046/SP445:3245、本文840/rail256、1024境界、長い見出し/メニュー、空メニュー、password、既存ACF画像の登録/未登録、親階層パンくず、sidebarの深い階層のopen/keyboard、実描画とCMS編集を確認。英語副題の管理は未確定、公式装飾/バナー#524。実WP #523。

- TOP notice PC114:349/SP279:2233: ACF表示/非表示、0/1/複数行、空本文/日付/不正日付、既存リンク/長文/改行、PC/SP/中間幅、keyboard/focus/hover、実FA glyphと円の重心、MVとの間隔。#523実WP未検証。

- TOP News PC 114:542 / SP 279:2524: verify 0/1/5 posts, actual posts page URL, no self-link, long title/multiple categories, pointer/keyboard focus, marker and arrow, desktop/tablet/mobile dimensions and official flower. DEFERRED_ENV; not visual PASS.

- TOP MV catchphrase: official PC/SP assets, accessible text once per viewport, 320/375/768/1079/1080/1380 widths, actual font and asset alignment/spacing, home width override and no horizontal overflow. DEFERRED_ENV; photos/CTA/motion remain separate.

- TOP: confirm no CODIA event sample/empty event message or archive link; adjacent News and banner remain functional. Actual Instagram section/URL separately pending. #523 DEFERRED_ENV.

- TOP About intro: actual 320/375/768/1079/1080/1380 render, long/zoom text, map behind SP copy, dot alignment, future card overlap and shared background. #523 DEFERRED_ENV.

- TOP Instagram: verify actual PC/SP/mid-width News sibling, official illustration ratio and Brands glyph, long text, absent CTA until account authority, actual button hover/focus after real URL. #523 DEFERRED_ENV.

- TOP Applicants PC158:2645/SP279:2443: 320/375/768/1079/1080/1380 widths, natural row wrap, actual image crop, flower mask/color, badge and photo shadow; when destinations are confirmed, real links, arrow inversion, hover/focus and target semantics. Current topic rows are non-interactive, not final CTA PASS. #523 DEFERRED_ENV.

- TOP MV grid PC114:29/SP279:2142: 0/1/4/6/more rows, invalid IDs, PC/SP image crops and alt consistency, lazy/priority network and 320/375/768/1079/1080/1380 actual geometry, no JS errors; motion reference and CTA pending. #523 DEFERRED_ENV.

- TOP banner: existing ACF row 0/1/multiple, missing/invalid image, long escaped title, image-only alt/link, bad URL, external rel and keyboard focus; final full-width PC114:419/SP279:2630 photo pending licensed original #524. #523 DEFERRED_ENV.

- Posts-on-front routing: verify WordPress Reading settings latest posts vs static page/assigned posts page, category reset to real index, root pagination, shared header/footer once and body classes; PHP stub now passes route selection, actual WP remains #523 DEFERRED_ENV.

- TOP MV attachment validation: check imported malformed/negative/array/boolean IDs do not select unrelated image; valid numeric strings and PC/SP same-row fallback work. PHP stub, real WP #523.

- Course heading opt-in `jwsnj-course-heading`: create Row with native H2 + paragraph; verify editor style visible, save/reopen, left/center justification, long Japanese/English wrap, PC 32/13 and provisional SP 24/13, generic H2 unchanged. #523 DEFERRED_ENV; no SP Figma supplied.

- Course FAQ opt-in `jwsnj-course-faq`: select native Details style; closed/open, keyboard focus/activation, long question/answer, nested content, reduced motion; PC title stays32px on toggle, provisional narrow24px. Editor save/reopen, actual render #523. No SP Figma supplied.

- Course introduction heading/lead opt-in styles: editor Row H2 + English paragraph and native Paragraph lead; verify save/reopen, PC36/15/24 and provisional narrow24/15/20, long wrapping, normal section heading unchanged. Actual WordPress/render #523 DEFERRED_ENV.

- Course grades style: Group/Row with label Paragraph and unordered List; verify editor selection/save/reopen, PC badge and FA Pro Solid pencil, grade separator, long grade strings, narrow wrapping/stack, list semantics and unchanged generic lists. SP provisional; actual render #523 DEFERRED_ENV.
