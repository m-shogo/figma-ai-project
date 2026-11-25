# Learnings

## 案件中の FB

| 日付 | W | 何が起きたか | 直したコミット |
|---|---|---|---|
| 2026-11-20 | W10 | Figmaの1行表示に合わせて `line-height: 1` のままにすると、2〜3行に折り返したときに行間や固定高さが破綻し、後戻りしやすい。通常テキストは原則 `1.3` にし、複数行・PC/SP/中間幅を事前チェック。例外はアイコン等の理由を記録。 | [5649ee9](https://github.com/m-shogo/figma-ai-project/commit/5649ee90fe9d17dd4e763093d211aeab45b75dc7)（仕様化） |

| 2026-11-20 | W9 | ベースThemeのサンプル機能を案件仕様と誤認するリスク。今回CPTは不要なイベントのみだったので登録処理をコメントアウト、関数は学習用に保持。ほかのCPTを創作しない。 | `theme/inc/custom.php`（登録無効化） |
| 2026-11-20 | W10 | Human再確認: `nowrap` を使わない、150〜200%の文字拡大専用QAは過剰。通常テキストの2〜3行とPC/SP/中間幅に集中し、Figmaの座標を固定レイアウトに写経しない。 | `docs/SPEC.md` / `docs/IMPLEMENTATION_CHECKLIST.md` |

W は `docs/agent-human-fb-weak-spots.md` の W1–W10。

## 閉じるときの振り返り

- W ごとの件数:
- 一番多かった種類と、その原因:
- 次の案件で着手前にやること:

## 2026-11-21: repeated token audit stalled (recovery)

- Symptom: repeated attempts to inspect all 116 CSS/PHP/JS files consumed connector calls without completing a reference inventory or code changes. The exact previous limit/error was not captured; do **not** assume an API rate-limit diagnosis.
- This run: local `rg` is installed but no repository clone was present; GitHub code search for the literal CSS custom property returned HTTP 422 (`QUERY_PARSING_FATAL`), while a punctuation-free search returned no matches (not proof of no references).
- Recovery: **do not repeat 116 individual reads or delete tokens based on empty search results**. Prefer a local clone plus one `rg -n -- 'jwsnj-color-' projects/jwsnj/theme`, if repository access is available. Otherwise inspect only files affected by the next concrete change and record coverage. Proceed with independent header accessibility work while the token audit is blocked.
- Figma PC `0:1` and SP `263:12` screenshots were retrieved. Required design-to-code skill was absent from the installed skills listing, so detailed design context was **not** obtained; no font or visual-parity claims.
- Verification: the header `:focus-visible` CSS rule was checked in the PR branch. Browser keyboard navigation and WordPress runtime remain deferred; PR CI must pass before merging.

## 2026-11-22: @Figma design context is operational — use it every run

- Human reiterated **`@Figma` is mandatory** for this project. Do not substitute an old screenshot, search snippet, or generic Figma mention for a fresh connected-tool read.
- Load `figma-design-to-code` skill first, create a file session, and fetch BOTH design context and screenshots for the relevant PC/SP/open nodes. Current relevant nodes: PC page `0:1`, SP page `263:12`, PC menu-open `599:2726`, SP menu `480:3954`, footer `221:335`. Whole-page design context may require selecting a child node; the three component nodes returned actual high-fidelity context on 2026-11-22.
- **Do not keep reporting `get_design_context` as unavailable based on earlier runs:** this run successfully retrieved content for `599:2726`, `480:3954`, and `221:335`. Re-verify on new sessions rather than assuming availability or failure forever.
- Figma footer `221:335` confirms distinct decorative SVGs, a slogan, a logo, sitemap, contact and SNS presentation, green copyright strip, and page-top control. These are design evidence, not approval of phone number, SNS URL, external donation link, or Font Awesome Pro license.
- Reviewer must distinguish Figma SOURCE_CONFIRMED from actual assets downloaded, WordPress markup/CSS/JS implemented, static checks, and browser visual/runtime QA. No downstream phase until the Header/Footer gate is fully passed.
- Found a concrete regression: CSS uses desktop `min-width: 1080px` while JavaScript previously treated 1080px as mobile; align all related conditions and verify 1079/1080/1081px. Also ensure every mobile menu close path releases the scroll lock, including overlay and Escape.

## 2026-11-23: source-level parts transition and test integrity

- Human-approved project authority (PR #558) permits **parts catalog source implementation** with Header/Footer final SVG #524 and live WordPress/browser QA #523 separately deferred. Do not interpret this as full visual parity or permit unapproved URLs, CPT/ACF or unrelated downstream pages.
- PC parts `339:23` / SP `433:2015` design contexts are sparse at whole-page scale. Load precise child design contexts and screenshots before each component; this run verified heading, paragraph, list, bordered group and media/text nodes. Never use short-lived Figma download links in production code.
- PRs #559–#561 added focused component source changes and Node tests. However the existing CI workflow did not trigger for parts CSS or run their tests. PR #562 added paths and a parts Node test step to the **existing** JWSNJ Common UI Static QA workflow. Future component changes must confirm actual test-step success in job logs, not infer test coverage from an unrelated Project Guard PASS.
- PR #563 initially failed live CI despite correct numbered-list assertions: the older unordered-list test extracted CSS by searching a *comment* marking the next section. Changing the comment broke that brittle boundary. The recovery changed selectors to structural anchors in both unordered and ordered tests; rerun 3 GitHub checks SUCCESS before merge. Avoid coupling contract tests to comments or incidental formatting; assert semantically meaningful CSS declarations and existing selector ownership.
- A CSS change to shared Gutenberg selectors impacts fixed pages outside the parts catalog. Static/CI evidence only; record cross-page PC/SP, long text, viewport transitions, editor-side controls and WordPress runtime in #523 DEFERRED_RUNTIME_QA. Assets remain #524 BLOCKED until real bytes, SHA-256, rights, callsites and visual QA are verified.

## 2026-11-24: パーツ集Largeナビのsource差分

- PC `384:817` / SP `442:3079` を高精細contextで取得。既存ACF `navigation-large` のfield/PHPは維持し、Large専用CSS ownerを更新。PCは3列40px gap、SPは1列40px gap。画像比率3:2、radius5px、画像→本文24px、title18px/本文16px、本文内部20pxを照合。Smallナビは別仕様として変更しない。
- 長文のgrid/flex shrinkと折返し、focus-visible、reduced-motionを追加。画像・矢印装飾の完全一致は今回未実装。既存CMS画像/placeholderをFigma素材と同一とは認定しない。#524の素材作業と競合しないCSS変更のみ。
- 既存JWSNJ workflowのpathsへLargeナビCSSとテストを追加し、既存partsテストstepを利用する。実機PC/SP/中間幅、長文、keyboard、画像と矢印はPAGE-PARTSのDEFERRED_RUNTIME_QA。

## 2026-11-24: 公式 SVG は Cursor の Figma 取得で実体保存

- 以前の実行環境は `www.figma.com` の DNS が解けず、Issue #524 の SVG バイトを保存できなかった。この Cursor セッションでは同じ file から Footer `221:335`、SP 装飾 `279:2637` / `279:2687`、Header `221:334`、blossom `506:2533` の SVG を取得できた。
- 既存 `logo.svg` は公式の桜マークとバイトが違う。上書きせず、Header/Footer の呼び出しだけ公式ファイルへ切り替えた。CTA アイコンと箇条書きドット、blossom はバイトだけ保存し、未承認 URL や未解決の h4 には接続していない。
- 静的契約は `tests/official-svg-asset-contract.test.mjs`。表示・キーボードの実機確認は引き続き #523。
- パーツ集 `339:23` の未取得 SVG は外部リンク `ico-blank` だけだった。h4 と区切り線の花は `ico_blossom` と同一バイト。矢印・ページ内リンク・アコーディオンは Font Awesome で、SVG 化しない。
- TOP の残りベクターと写真は `src/images/top/` と `theme/images/top/` に保存した。写真は WebP。キャッチコピーの SP は PC と並びが違うので別 SVG。管理画面が持つ写真と未承認リンクは `front-page.php` へ直書きしていない。
- 他環境への引き継ぎは `docs/CURRENT_AUTHORITY.md` の「2026-11-24 公式素材は Git にある」と、`docs/DESIGN_FOUNDATION.md` の「残作業」。Cursor へ頼むのは未保存の Figma バイトだけ。保存済みの接続はどの環境でもできる。

## 2026-11-24: Codex desktop 接続とアコーディオン照合

- 実行環境はMacのCodex desktop local。Figmaプラグインのローカルcatalog掲載 `figma-design-to-code/SKILL.md` を直接読み、create_sessionとFooter高精細context/screenshotに成功。PC/SPパーツ集はsparseのためアコーディオン `344:1116` / `442:2906` とナビ `384:817` / `442:3079` を直接取得した。過去のskill取得失敗はこの手動環境の現在の状態ではない。
- 案件: 閉じた通常アコーディオンの左余白はPC/SPとも24px、右アイコン領域68px。既存desktopの32px上書きと余分な8px予約を除去。Q/A本文のflex子にmin-width:0を追加して長い非改行文字列による押し出しを抑える。
- Theme: iconのrotate状態は既存native detailsを維持し、reduced-motionでtransitionを停止。静的契約テストは実際のWordPress表示やkeyboard動作を証明しない。後者は#523の既存アコーディオンQAで再確認。
- 共通化候補（未昇格）: `git fetch origin so` はFETCH_HEADを更新したが、このcheckoutのorigin/soは別SHAだった。最新branch APIとFETCH_HEADの一致を確認してから分離worktreeを作った。`gh`の認証は無効でもGitHubプラグインとSSH fetchは成功した。秘密情報の取得やGit認証設定変更は行わない。
- scheduler: 同一chat heartbeat診断を登録。COUNT=1は「future runsなし」で拒否されたため、繰返しruleと診断後PAUSED指示を使用。自動呼出結果はまだ未観測。手動成功を自動成功として報告しない。旧ChatGPT毎時タスクは変更していない。

## 2026-11-25: H4・区切り線の公式花SVG接続（通常Chat、PROJECT_ONLY）
- 開始 so `36eceb51ecc9a1ff6a8334ec77f3adc6f4578538`。正式 figma-design-to-code skill、新規session、PC/SP H4 `344:901` / `442:2766` と区切り線 `344:1135` / `442:3204` の高精細context・画像を取得。既存の `ico_blossom.svg` を利用し、素材の再生成・再ダウンロード・SVG属性の書換えはしない。
- H4 は18px/500/1.4/5%・下20px・左装飾18px枠＋8px gap。通常テキストの折返しを保つため背景装飾とpaddingを採用。区切り線はnative hrの意味を保持し、背景レイヤーで公式花、白8px、緑50%の1px線を重ねる。SP 32px余白、PC 65pxのframeをCSSの17px装飾高＋25/23px marginで表現。SVGの固有比率を保つため高さ17px、横auto（Figmaの18×17枠との差は実機要確認）。
- 既存Gutenberg/editor ownerのみ変更。#523でPC/SP/中間幅・長文・リンク付き見出し・editor・隣接余白・SVGの実描画サイズを確認。source implementation と runtime visual PASS は別。自動スケジュールの復旧を意味しない。
