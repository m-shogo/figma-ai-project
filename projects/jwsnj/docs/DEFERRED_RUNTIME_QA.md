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

- Existing TOP banner malformed attachment IDs: verify boolean/float/array/negative do not resolve another photo, valid numeric-string and title-only valid link retain output. PHP stub, actual WordPress #523; Figma photo still watermarked #524.

- Course schedule `jwsnj-course-schedule`: outer Group, chronological child Groups with optional Image + Paragraph. Verify editor save/reopen, native block wrappers, 200px/4:3 image, alternating PC rows, long text, 0/1/8 entries, missing image, captions, narrow stacking and no overlap. Current Figma slots are gray placeholders, not photos; do not seed them. SP provisional. #523 actual WP/render pending.

- Preschool schedule pattern: verify native pattern discovery under Text, insert into draft, no block recovery warnings, heading centered, eight chronological editable paragraphs, add media before paragraph, save/reopen, add/delete/reorder rows, no automatic page content. #523 actual WP deferred.

- Course intro pattern `jwsnj/preschool-intro`: insert manually in approved course page draft, add exact approved native Image as sibling of copy Group, verify no block recovery warning, long text/grades wrap, optional media, PC520/440 gap80 and narrow single column, actual crop, page-level hero/breadcrumb/CTA separate. No original-page use; #523 DEFERRED_ENV.

- Course FAQ section/pattern: insert into draft, verify native block validity and manual edit/add/reorder/remove, 1/6/long Q/A, actual open/closed and keyboard/focus, 961px max/48px heading gap/24px rows at PC, narrow provisional 24px heading gap and generic Details unaffected. Confirm answers before publication; five sample answers not seeded. #523 DEFERRED_ENV.

- Course template: choose explicitly in course draft, verify default page unchanged, actual parent breadcrumb/one H1, password form/no body, missing intro/first intro/later intro, long title and breadcrumb, 320/375/768/1079/1080/1380 widths, full background and contained later FAQ, keyboard focus; #523 DEFERRED_ENV. No SP Figma.

- Course schedule media fallback: direct and inner-container native Image, mixed/no/all images, narrow wrapping, PC alternating rows, 200×150 crop, adjacent text-only rows 24px gap, long text/caption, generic Image unchanged; actual editor and browsers #523. Isolated Chromium command timed out; no browser PASS.

- Course rhythm: actual PC heading→lead 32 / lead→body 40 / body→grades 48; schedule heading→first row 74; verify direct/inner-container blocks, editor-added/reordered paragraphs, long wrapping, narrow fallback 32, generic headings/groups unchanged. #523 DEFERRED_ENV; no SP reference.

- Course title fallback: actual rendered course template with first intro heading removed, literally empty H2, intact non-empty H2, later intro group, password form and long page title. Verify visible H1 fallback and one accessible H1; CSS :empty cannot establish meaningful text when whitespace or empty nested markup remains. #523 DEFERRED_ENV.

- News detail pager sparse destinations: actual WP PC/SP 0/1/2/3 links, especially only the published posts-index return link (no previous/next articles). Confirm no phantom first row / 40px gap on SP; normal SP 40px two-row gap, desktop three-slot geometry, natural text wrapping, focus/hover and DOM order retained. #523 DEFERRED_ENV.

- TOP MV responsive source selection: actual WP 1–6 valid images and distinct PC/SP media, verify full-grid sizes hints (PC 25/50vw, SP 50/100vw), partial grid retains 100vw, plugin custom sizes/WordPress lazy auto prefix preserved, actual selected currentSrc/resource bytes at DPR1/2 and 375/1079/1080/1380 widths, hidden slots 4/5 and LCP; actual core tag processor and browser #523 DEFERRED_ENV. No claim of measured transfer savings.

- TOP MV continuous loop: WP 0–6+ valid/invalid rows, distinct PC/SP photos, slow/error decode, no-JS and reduced-motion initial/change, native pause/resume keyboard & pointer, 320/375/768/1079/1080/1380 widths, resize while running/paused, seam at full iteration, no horizontal document scroll or blank frames, original semantic image count, currentSrc/LCP. Compare actual reference speed and finalize provisional 18s/36s and pause placement. #523 DEFERRED_ENV.

- Swiper migration supersedes custom MV loop QA: actual bundled v14.0.1 in WP, verify three-panel loop over multiple cycles, 375/1079/1080/1380 widths, interruption during transition, repeated pause/resume and resize while paused (may snap to current grid), reduced-motion dynamic toggle, decode/init failure and unavailable library, semantic clones, no overflow. Static VM stub tests controller, not library rendering. #523 DEFERRED_ENV.

- MV Swiper lifecycle: verify queued zero-delay autoplay frame immediately after stop (no loopFix/movement), pause/resume during transition, same-breakpoint resize or zoom changing computed gap before snapGrid calculation; resize may internally realign paused panel. Actual bundled browser behaviour remains #523; controller fixture is not real rendering.

- TOP fixed-copy rhythm: compare About PC114:180/SP279:2318 title/lead/body spacing (32/24px PC, 24/20px SP), Applicants PC158:2645/SP279:2443 first topic icon gap (16px PC,10px SP), other rows16px and horizontal inset (24/20px PC,20/16px SP). Verify ordinary and narrow widths, wrapping, official icon/photo placement and no fake controls. #523 DEFERRED_ENV; actual rendered geometry not yet measured.


- TOP Course view / #523: pass normalized five-row fixture to `_top-course-view.php` in disposable QA only; verify PC three columns, SP centered cards/20px gaps, all five dots, prev/next bounds, long titles, keyboard focus, swipe, resize across 1080, reduced motion, 0/1/many rows, missing image/link and static fallback. Compare PC114:635/SP279:2336 at natural widths. No production fixture or ACF connection until Cursor adapter; DEFERRED_ENV.


- TOP About cards / #523: use QA-only four-row fixture with `_top-about-intro.php` items; verify PC stack overlap/order/click/Tab/focus, no horizontal overflow at 1080/1280/1380, SP 320/375/767 and intermediate stacking, long labels, no-JS disabled buttons and exact photo crops vs Figma. Selection is not navigation. No new field or URL; production adapter and actual browser evidence deferred.

- Preschool features / #523: insert optional pattern in disposable WP page; verify editor serialization, direct/inner-container Groups, 3-column at >=1080, narrow one-column, long titles/body, optional real illustration canvas/outline, heading rhythm and unchanged generic H3/Image. Plain number prefix and no artwork until #524; no SP reference or visual PASS.

- CSS robustness 2026-11-26: verify rem conversion fallback vs enhanced typed/trig path in required engines and non-default root settings; About map with/without actual following list at 1079/1080/1380 and keyboard focus over selected cards; Course hover at both motion preferences. Static selectors/feature-query tests are not actual WP/visual acceptance. #523 remains OPEN.

- 2026-11-26 CSS search/form baseline: static source contract only. Search module natural min-height, long labels, keyboard outline and narrow grid at 320/375/768; check actual search/404 callsite and former page-specific desktop max width. Form text inputs/select/textarea and labels at 150–200% text, actual plugin styles and native textarea sizing/fallback; Formidable label focus on actual nested input. Remaining HIGH-risk legacy CSS: global normalize outline reset (#688 owner), CF7 generic checkbox/radio display:none and file proxy, Formidable input pseudo-elements/zero-height and .frm_button label text hiding, fixed confirmation-flow geometry, plugin-specific aria/validation. Do not mechanically delete or rewrite before actual supported plugin markup/runtime (Formidable Pro active in SPEC). #523 DEFERRED_ENV; no form submission/data or page design tested.

- CSS token cleanup: 12 tokens have zero source consumers in 285 tracked project text files (inventory run 45793160124); verify imported CMS additional CSS/DB and plugin-injected markup before production, restore only a proven external contract if needed. About flat scoped selectors preserve specificity, check actual PC/SP geometry and overlap. Stylelint warnings (nesting/duplicate selector/specificity) require cascade/context review, not autofix.

- Formidable native choices: actual free plugin fixture QA uses semantic radio/checkbox inputs, native checked state, long label, keyboard and pointer. Pro file/dropzone, confirmation/repeater, actual production form schema and plugin style settings remain deferred; no actual submissions. No CMS configuration changed. Existing legacy CF7 branch separate from active Formidable scope.

## Human指示による全体再点検の継続（2026-11-26）

残りの独立READYがなくなった場合は、[MAINTAINABILITY_ROADMAP.md](MAINTAINABILITY_ROADMAP.md) の P2 に従い、Header → Footer → parts → 既実装ページ → 統合回帰の順にPC/SPを再確認する。従来の個別QAを再利用し、同じIssueを増やさない。各回の証拠・差分・PR・再撮影結果を既存案件文書に残す。未確認の実機・学校WP/Pro・素材はそれぞれ #523/#524 の保留を維持する。

- TOP精密再点検（Human 2026-11-26）：P2-TOPの各セクション別索引と検査手順を使用。個別PC/SPスクリーンショット、全可視装飾layer/素材/callsite/実render、共通背景・隣接境界、文字・画像crop、状態遷移を照合して差分を記録。About〜Course背景は未接続・候補素材の正本照合が必要。実機・実学校WP/ACF/Proは#523、素材/権利は#524。静的CIだけで視覚PASSにしない。

## Cursor local runtime（2026-11-27、tested_sha 作業開始 `fa4ab148`）

環境: Windows、Docker 29.0.1、`.\wp.ps1 up jwsnj`、`http://127.0.0.1:28000` HTTP 200。WordPress 7.0.2、PHP 8.3.33、テーマ `jwsnj`、`timezone_string=Asia/Tokyo`。ACF Pro 6.8.9、Formidable 7.1.1、Formidable Pro 6.27、Flexible Table Block 3.9.0 は有効。Autoptimize 3.1.17 は導入済み無効。既存 ACF グループ 12 件は Local JSON から読込済み。`top_course` グループは未登録。

| ID | status | evidence | remaining |
|---|---|---|---|
| ENV-01 | PASS（起動のみ） | compose `wp-jwsnj`、ポート 28000、PHP Fatal なしでフロント 200 | 全ページの console/404 総点検は未了 |
| ENV-02 | PARTIAL | テーマ・時刻・プラグインを WP-CLI で確認。メニュー 0 件。`show_on_front=posts`、`page_on_front=0`、`page_for_posts=0`。サイト名は Sample Theme Fixture | 固定ページ割当・メニュー・学校名は Human の値がないので未設定。管理画面のログイン操作は未実施 |
| FOUND-02 | PARTIAL | Chromium。自然幅 481 と emulation 1380。Zen Kaku Gothic New は hero h1 とロゴ名で loaded かつ computed。Roboto Condensed と Font Awesome 6 Pro（regular/light woff2）は loaded。News ピルは `--font-sansSerif-en` = local Roboto。Footer 要素の computed は local Noto Sans JP | Brands はこの画面では未使用。Firefox/WebKit と物理 iPhone は未検証。フォント未読込時のフォールバック操作は未実施 |
| PAGE-HEADER | PARTIAL | 1380px で header 高さ 120px（Figma 603:2939 は 90px）。公式ロゴ SVG は 200。検索 UI は表示。メニュー未設定のため hover の子項目は出せない | 90px 化は検索・CTA・補助メニューの承認前にしない。SP 開閉の今回操作は emulation が次の計測で解除され未了 |
| PAGE-TOP | DEFERRED_ENV | フロントは投稿一覧。`front-page.php` の TOP は静的フロントページ未設定のためこの URL では出ない | 静的フロントページの割当は未承認。MV の実画像ループは未計測 |

## 追記（2026-11-27 午後、TOP は対象外）

上表の ENV-02 / PAGE-HEADER / PAGE-TOP は作業開始時点の記録。午後のローカル DB と管理画面で次を確認した。TOP の見た目・MV・各部紹介の視覚照合は未実施。

- 表示設定: ホームページ = HOME（固定ページ ID 5）、投稿ページ = お知らせ（ID 6）。`/` は `front-page.php`。サイト名は Sample Theme Fixture のまま。
- メニュー: PC 4、SP ハンバーガー、フッター 8、ヘッダー右上 3。教育方針はリンクなし。寄付と Instagram は URL 未定のため未登録。テーマ側の PC/SP 分割は未コミット。
- 管理画面: fixture-admin で `wp-admin` にログイン。テーマ `jwsnj`。ブロックエディターが下書き「ローカル表確認」（ID 106、非公開）を開き、本文は `flexible-table-block/table`。登録済み: Flexible Table、Formidable Forms、ページ内リンク、ナビゲーション（大）（小）、投稿の出力。
- Formidable: 初回は `wp_frm_forms` が無く、`FrmMigrate::upgrade()` でテーブルを作成。プラグイン同梱の Contact Us が1件。メール通知は draft。ローカル入力1件（entry 1、`example.invalid`）を保存。公開の `/contact/` には接続していない。管理画面は Pro のライセンス未入力を表示する。
- 画像: 3倍の再書き出しは中止。表示サイズの2倍を足りる基準とし、既存 WebP は置換していない。SVG は倍率の対象外。
- コース ACF JSON は Human の明示（2026-11-27）で `group_jwsnj_top_course.json` を追加。項目は画像・タイトル・テキスト・リンク・外部リンク。TOP の見た目照合は未実施。
