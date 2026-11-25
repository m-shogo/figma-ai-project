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

## 2026-11-25: PC Footer sitemap の公式ドット接続（通常Chat、PROJECT_ONLY）
- Figma PC `114:523` / SP footer `506:1632` の高精細contextと画像を確認。PCは5.41839pxのドットと12px gap、Zen Kaku Gothic New medium 13px・5% letter spacing。SP referenceにはsitemapが見えないが、現行WordPress管理メニューと開閉機能を削除する根拠にはしない。
- PC既存 `.gfl_link-02` のownerで公式SVGを背景装飾として接続、13px/500/1.4で長文を自然に折り返す。固定メニュー項目、URL、階層、列構成、SP表示、CMS、SVGバイトは変更しない。既存の768px PC breakpointを維持。PC全体の3列構成とSP sitemap表示有無は別のsource/runtime review。#523で実描画・keyboard・中間幅を確認。

## 2026-11-25: H2の二色下線（通常Chat、PROJECT_ONLY）
- Figma PC `344:906` / SP `445:3209` の高精細contextと画像を取得。生成コードは単色borderと表現したが、画像は二色。正式figma-use skillを読み、読み取り専用Plugin APIで `344:907` / `445:3207` の実stroke paintを確認: 両色ともstop 0.16、横方向、bottom weight 3、main #28ac5f / base-lightgreen02 #eaffd9。
- 既存のH2 ownerとCSS tokenを再利用し、border-imageのhard stopで既存3px borderを描画。余白、見出し文字、HTML、Foundation値、H4は変更しない。生成コードの単色化を見抜くため、画像と構造が矛盾する場合は元のpaintを取得する。#523でPC/SP/中間幅の実描画・長文・editor/frontendを比較。自動スケジュールの復旧は未証明。

## 2026-11-25: 大・小ボタンの公式外部リンク SVG 接続（通常Chat、PROJECT_ONLY）
- PC `344:968` / SP `442:2832` の新規高精細context・画像、PC小 `344:985` と各iconのvariableを確認。公式保存済み `ico-blank.svg` は白13×12、大小で14×13/13×12の枠。色の反転はSVGを書き換えずCSS mask（contain）と既存色tokenで表現する。
- 大ボタンは既存右側pseudo、小ボタンは既存30pxの円を維持し、装飾だけ中央に重ねる。既存PDF/添付ファイル拡張子はSVG対象から明示除外しFont Awesomeを維持。target属性/URL/CMSは変更なし。PCの後段mediaが小ボタンに260px min-widthを再適用する重複を削除（大のbase指定は維持）。長文/hover/focusは既存ownerを維持。
- #523でブラウザPC/SP/中間幅、外部と添付/PDF、outline/hover、実描画と長文を確認。静的CIだけで視覚PASSとしない。本文の外部リンクは別PRで扱う。

## 2026-11-25: Gutenberg本文リンクの公式外部アイコン（通常Chat、PROJECT_ONLY）
- PC `344:968` / SP `442:2832` と外部アイコン `344:1029` / `442:2882` の高精細context・実画像、variableを取得。両アイコンは14×13枠、foreground main-orange #f0813b。本文のコーラル #ec6b61 とは別。保存済み白SVGの形をmaskで利用し、該当ownerだけの色として指定する（Foundation token追加なし）。
- 既存Gutenberg本文、リスト、表のリンク選択を維持し、ファイル種類の判定・フォーカス・hover・リンク属性は変更しない。共有 `.module_textLink` はヘッダー/フッター等への波及があるため今回変更しない。#523で折返しとアイコンのベースライン、色、PDF/file優先、editor/frontendを確認する。

## 2026-11-25: Largeナビの右下装飾（通常Chat、PROJECT_ONLY）
- 新規sessionでPC `384:914` / SP `442:3081` の高精細context・画像と親metadataを確認。白い48px四角（左上radius20）と右下32px緑丸、FA Regular f061 10pxが未実装。既存画像のoverflowと3:2は維持し、Large専用CSSの装飾だけを追加。画像とCMSリンク、ACF、Small、実際のhover動作は変更しない。既存is-disabledのカードには矢印を付けない。
- PC/SP両パーツ索引のナビはLargeの3columnのみ。Smallナビの独立デザインは未確認。スライダーは単一画像＋キャプションで操作/管理仕様未確認。既存Smallや新規slider/CMSは推測実装しない。#523で画像拡大中の重なり、キーボード、長文、リンク無し、PC/SP/中間幅を確認。

## 2026-11-25: リストの累積余白と native numbering（通常Chat、PROJECT_ONLY）
- PC `344:936` / SP `442:2795` の高精細context・画像を取得。子bulletは親左端から24px、子本文42px。既存親liの18pxにさらに24pxを加えていたため、子ulのpaddingは6pxに修正。12/8px間隔と色、文字は維持。
- 番号リストは既存独自counterがHTML start/reversed/valueを無視するため、暗黙のlist-item counterへ変更。番号の左揃えは実画像（1./10.とも左端）に従う。注釈と通常リストの隣接marginは既存48pxの高詳細度ルールより優先して20pxへ。注釈と他種類ブロックの余白は別実機確認。
- 既存WordPress構造・ACF・Foundation変更なし。#523で実ブラウザの番号属性、混在入れ子、長文、隣接余白、editor/frontendを確認する。静的CIは実描画保証ではない。

## 2026-11-25: ギャラリーのズーム装飾（通常Chat、PROJECT_ONLY）
- PC `344:1079` / SP `442:2973` の高精細contextと実画像、zoom `344:1106` / `442:3063` / `442:3069` の変数を照合。44px円・FA f002 20pxは既存ownerに存在。右下0pxとopacity hoverだけが不一致のためギャラリー限定でPC20px/SP16pxの内側配置と白背景/緑文字への反転を追加。
- 既存 .lightbox_wrap は common.js の画像ラップ処理が生成する。既存リンク/WordPress lightboxの操作・外部/PDFの装飾・他画面は変更せず、focus-visible/focus-withinとreduced-motionも装飾側に対応。実際のnative triggerとの重なり、開閉・フォーカス復帰、画像比率、キャプションへの干渉は #523 で検証する。実機PASSではない。

## 2026-11-25: Media & Text の配置と編集設定（通常Chat、PROJECT_ONLY）
- Figma PC `344:929` / SP `442:2788` 高精細context・画像でPC左410/右510、上揃え、SP画像→本文の縦積み、40px gapを確認。WordPress公式Gutenberg media-text style.scss と公式ブロック説明を参照し、coreが子にgrid-column/rowを指定し、通常のstackは600px、inline幅の上書きはstack時のみ、画像左右・縦位置・stackの選択が編集者設定であることを照合。参考: https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/media-text/style.scss / https://wordpress.org/documentation/article/media-text-block/ 。案件の実機core版は未確認。
- 既存の無条件1列では中間幅に暗黙の2列が発生し得るため、既定410:510、右画像は510:410、768px未満かつis-stacked-on-mobileでのみ1列＋明示行にする。core同様、stack時だけ!importantでinline幅を上書きする。stack無効は横並び、既定は上揃え（center/bottom明示選択を維持）。既存画像/キャプション、HTML、ACF、Foundationは変更なし。
- #523で実機の600/601/767/768px、右画像、stackオン/オフ、カスタム幅、垂直配置・crop・長文、editor/frontendを確認する。静的QAは実描画保証ではない。

## 2026-11-25: Largeナビの未設定フィールドとリンク意味（通常Chat、PROJECT_ONLY）
- 新規sessionのPC 384:914 / SP 442:3081 高精細context・画像とACF group/既存CSSを照合。既存 href="" は pointer-events:none でもkeyboardに残り得る。URLはesc_url後に判定し、URLなし/有効な名前なしはhref/targetなしのplaceholder anchorとする。既存is-disabledのCSS/矢印非表示を再利用。外部targetは有効リンクのみ、rel=noopenerを付ける。
- 画像未設定時は公式代替画像の根拠がLargeナビのFigmaにないため、既存サンプルnoimage.webpを出力せず本文を保持。空rowはskip、画像のみでaltなしならリンクにしない。画像altは編集済みattachment altを利用し創作しない。ACF定義/Small/URL/画像素材は変更なし。#523で空/不正URL、画像なし、長文、tab/focus、editor/frontを確認する。

## 2026-11-25: SP表の横スクロール案内（通常Chat、PROJECT_ONLY）
- 新規sessionでPC 357:970 / SP 445:3237 の高精細context・画像を取得。SPの既存表は幅960px/横scrollだが案内表示なし。Figma内の案内はライブラリUIの画像参照でありスクリーンショット自体を本番素材には使わない。同梱MIT ScrollHint 1.2.8のCSS/JS・constructorのinline overflow/position変更を確認し、既存の手・矢印・案内表示を再利用。公式Flexible Table Blockの公開save.tsxでfigureのis-scroll-on-mobile、tableのis-stacked-on-mobileを照合（main、案件の3.9.0実機は未確認）。
- 既存の横scroll選択かつ実overflowがあるSPだけ初期化。ライブラリのinline変更を直後に復元し、PC設定やstack/既存ヒントを上書きしない。DOM追加の案内はaria-hidden、必要なtabindexとラベルは自分で付けた場合だけ解除。既存caption/ariaを尊重。フォーカス時に案内を隠し、reduced-motionを追加。HTML/ACF/表データ/ライブラリ本体は変更しない。
- #523で実機のプラグイン版、PC/SP/中間幅、複数表、scroll/stack設定、caption、長文・横overflow、touch/keyboard、案内位置と実描画を確認。Figmaのラスタ案内と同梱UIの完全一致は未検証。

## 2026-11-25: Footer最下段とページトップ（通常Chat、PROJECT_ONLY）
- 新規Figma sessionでPC 114:536 / SP 279:2805 の高精細context・画像を取得。copyrightの高さ60px、左余白PC80/SP20、Roboto Condensed 12px/5%、右60pxの四角ボタン #4dce83、FA Regular f341 16px。旧CODIAの固定丸ボタン40pxとスクロール量による表示切替を撤去し、通常フローのgridへ。既存WPサイト名/年とhref="#"、pageScrollのreduced-motion分岐は維持。hoverはSPECのmain color。長文で行高を伸ばせる。
- プライバシーポリシーはPCデザインにあるがURL/ページ管理が未承認のため追加しない。ロゴ/住所/電話/SNS/メニューは今回変更しない。#523で実機のクリック/Enter・スクロール・focus・長いサイト名・短いページを確認。別案件publication-runtime失敗（tankoubon detail the_content owner missing）は開始soで確認し対象外。

## 2026-11-25: Footerのサイトマップ配置と外部リンク（通常Chat、PROJECT_ONLY）
- 新規sessionでPC 114:484 / 114:523 / 154:2619 とSP 506:1632の高精細context・画像を確認。PCは左サイト情報308px/右サイトマップ541px、3列、列間80px、縦16px gap。既存WPメニューは同じWalker/同じlocationで保持し、列はCSS multi-columnで可変件数に対応。固定個数/タイトル/URLによる並べ替えはしない。DOMはサイト情報→メニュー。SPは既存開閉メニューを残し、情報の後に表示（FigmaにはSP sitemapなし、非表示はHuman確認まで保留）。
- PC最上位の外部リンクはFigmaのFA Regular f2d2 12pxと4px gapを既存tokenで復元。共通.module_textLinkは変更せず、既存file拡張子の表示は維持。Footer hover色はSPEC mainに修正。住所・電話・SNS・プライバシーURL・英語サイト名の新規固定値は未承認のため追加しない。
- #523で実メニュー8件/増減/子階層/長文、列バランス、タブ順、SP開閉、PC/SP/中間幅を確認。実機未検証、CSS columnsの可変配置は実装判断。#614 merge済み。

## 2026-11-25: FooterブランドコピーのPC/SP flowと拡幅注記（通常Chat、PROJECT_ONLY）
- Figma PC 114:422 / SP 279:2632 高精細context・画像と線279:1516/279:1567の変数を取得。PC注記「パズルとLEARN IN～の距離をあまり広げたくない。ブラウザ拡幅時は線を伸ばす」、両線main #28ac5f。SPはコピー→左右絵の一段、現行flexはDOM順の左絵がコピー前の別段に出る。SPを2列grid、コピー1行目、絵2行目、外側余白0に修正。
- PCは中央484px上限、gap40px、左右既存SVG各408px上限を維持し、外側の可変空間だけ1px線で延長。左+1px/右+19.16pxの中心基準はFigma座標と保存済み枠寸法から算出した実装値。1380px超の線接合、狭幅の縮小・実描画は未検証。既存SVGバイト/HTML/font tokenに変更なし。旧Footer全体の50px上余白を削除して既存コピー56/40pxの余白と二重にならないようにした。
- #523で375/320/767/768/1079/1080/1380/1920px、長文、線の接合と公式SVGの寸法・位置を確認。#615は全CI成功でマージ済み。実機なしで視覚一致を宣言しない。

## 2026-11-25: ページ内リンクの空欄・literal ID（通常Chat、PROJECT_ONLY）
- Figma PC 357:1022 / SP 442:2948 の高精細context・画像を新規sessionで確認。既存ボタンの寸法/色/折り返しは維持。ACF既存repeaterのタイトル/IDの空欄を除外し、有効行だけで列数を計算。先頭#貼付は1個だけ除去、空白/#を含むIDは無効扱い、その他のIDをrawurlencodeして保持。新しいID/slug/CMS項目は作らない。
- common.jsの既存pageScrollはjQuery selectorではなくdocument.getElementById＋decodeURIComponentで解決。存在しない/壊れたfragmentで動かないよう、初期ロードの先行scrollTop(1)も削除。既存ページトップ、header offset、reduced-motionは維持。模擬DOMで日本語・記号・無効ID・ページトップを確認する。実機の初期hash/クリック/keyboard/長文は#523。

## 2026-11-25: アコーディオンのopen余白・Q/A位置（通常Chat、PROJECT_ONLY）
- 新規Figma sessionでPC 357:938 / SP 442:2908 の高精細contextと実画像を確認。閉じた通常タイトル24px、開いたタイトル32px、Q/Aは通常幅Roboto Medium 24px・本文と中央揃え・16px間隔。既存CSSのQ/A 32px枠と上揃えを16px枠・中央揃えへ修正、既存通常Roboto tokenを再利用。開いた直接summaryだけ左32pxにする。開閉minusとQ/A装飾のselectorを直接所有要素に限定し、親open/_qaが子detailsの状態を巻き込まないようにした。
- 既存field.phpのrender_blockがsummary/title/button/content/innerを付ける契約を確認。PHP/HTML/ACF/画像/JSは変更なし。ネストされたdetailsの旧regex変換は別の潜在問題であり、本PRでは未修正・実機未検証。#523で通常/QA、open/closed、長文、nested、keyboard/focus、PC/SP/中間幅、editor/frontと実Robotoを確認。#617はマージ済み。

## 2026-11-25: details render_blockの所有境界（通常Chat、PROJECT_ONLY）
- Figma PC 357:938 / SP 442:2908 を新規sessionの高精細context・画像で再確認。#618は全CI成功でマージ済み。既存field.phpは子のcustom summaryを検出すると親の変換をskipし、逆に全summary/全details終端を置換すると子HTMLまで壊す。coreの内側blockが先にrenderされる契約に合わせ、先頭のouter details/素のsummaryと末尾のouter closingだけを変換。本文の子HTMLはbyte-for-byte保持し、既存custom/未知のsummary属性付き構造は変更しない。装飾iconのみaria-hidden。CSS/ACF/保存形式は維持。
- NodeテストからPHP CLIで実際のcallbackを隔離実行し、子render済み/生HTML、親のopen/name/id、inline rich text、再変換、未知形式を検証する。WP実機ではない。#523でエディター出力形式とnested/keyboard/focusを確認。

## 2026-11-25: 背景付きテキストボックス（通常Chat、PROJECT_ONLY）
- Figma PC 344:916/918/920 / SP 442:2774/2776/2779 の新規高精細context・画像を確認。薄緑 #f5fdeb、角5px、PC40/SP32px内側、H4と本文20px、PC2列40px/SP縦24px間隔。既存枠付きstyleと通常Columnsは維持。Gutenberg core/group と core/columns に明示選択styleを追加し、既存token・H4の公式blossom SVGを再利用。既存ACF、保存済み画像、Foundationは変更なし。coreの幅/stack設定を強制しない。1カラムに背景groupのみの場合はflexで高さ追従。
- ブロックstyleによるCMS表現は実装判断（新ACFなし）。#523でstyle選択、実エディターのwrapper/余白、heading+paragraph間隔、画像の有効geometry、長文、同高、PC/SP/中間幅、coreのstack設定を確認。#619マージ済み。静的CIのみ。

## 2026-11-25: 本文の太字とマーカー（通常Chat、PROJECT_ONLY）
- 今回開始時3e96c1c。並行runの#619/#620を検出し、アコーディオンPHPと背景boxの重複書込みを中止、最新c22af79へ切替。Figma PC 344:916/SP 442:2774 高精細context・画像とmarker 442:2784 の変数を取得。本文のstrongはZen Kaku Gothic New Medium 500、下線例は5px #ffebb3のマーカー。既存の段落外strongと通常underline、編集者が背景を明示したspanを維持し、段落だけにmarkerを適用。box-decoration-break:cloneで複数行に対応する。単一callsiteの色のためFoundation tokenは追加しない。既存インラインのunderline指定を上書きするためtext-decoration-lineに限り!important。
- #523で実機の太字weight、長文・複数行のマーカーの位置と色、既存リンク下線、明示背景、editor/frontend、PC/SP/中間幅を確認。CSSの書式対応は実描画PASSではない。

## 2026-11-25: ギャラリーの連続余白と可変キャプション（通常Chat、PROJECT_ONLY）
- 新規sessionでFigma PC 344:1079 / SP 442:2973 の高精細contextと画像を取得。連続ギャラリー間40px、画像3:2、画像-caption間20px、PC14/SP12px、カード上揃え。既存margin-large 48pxを連続galleryに限り40pxに修正。gridの上揃え、img/captionのflex伸縮抑制、captionのmax-height/overflow/text-shadowを明示して長文の自然な伸長を優先。既存CMSの画像・caption・lightbox、全カラム設定と公式素材を維持。新規サンプル写真やNoimageの固定出力は作らない。
- #523で実際のcore/gallery CSS詳細度、1〜3行以上のcaption、画像の実寸、隣接gallery40px、PC/SP/中間幅とlightbox keyboardを確認。静的テストは実機PASSではない。

## 2026-11-25: 大小ボタンのグループ間隔（通常Chat、PROJECT_ONLY）
- 新規sessionでPC 344:968/969・SP 442:2832/2833/2842の高精細context・画像を確認。大ボタンのSP16px gapを20pxに変更し、連続大ボタン群20px、大小群の切替40pxにする。小ボタンはPC横30px/行20px、SP縦配置。既存CMSのcustom width、ラベル折返し、リンク/FA/公式外部SVG、hover/focusは維持。旧PC共通gap上書きは除去。SP例の小ボタン群は30pxと20pxが混在するが、既存CMSに同一群内の区別がないため項目番号による強制はせず20pxで統一する実装判断。#523で長文、配置、編集者指定、group分割、PC/SP/中間幅の実描画を確認。

## 2026-11-25: 注釈リストと通常ブロックの隣接余白（通常Chat、PROJECT_ONLY）
- 正式skill、新規sessionでPC 344:937/SP 442:2796の高精細contextと960×118/335×199の実画像を確認。注記は内部10px・隣接20px。#609の既存リスト同士の修正を維持し、段落・画像・ギャラリー・グループ・カラム・media-text・ボタン・details・表・既存ページ内リンク/Largeナビとの隣接時に次のブロックのmargin-topを20px、前のmargin-bottomを0とする。通常flowとmargin非相殺の編集レイアウトで二重余白を抑える意図。heading/区切り線の独立したセクション余白、未確認ブロック、CMS、画像、Foundationは変更しない。
- #523で実際のcore/editorのblock gap、インライン指定、両方向、連続注釈、最初/最後、PC/SP/中間幅・長文を検証。静的契約は実描画保証ではない。#515はdraft・mergeable=false・別scopeのため変更しない。#524のIssue本文は古い素材状態を含むためFoundation正本の#599/#600を優先する。
