# JWSNJ — 保守性・操作安定性の継続改善ロードマップ

Owner request: 2026-11-26。Gitを引継ぎ正本とする。既存の実装回で進める（新規automation・並行ownerを作らない）。時間や完了日を保証せず、依存順と検証ゲートで管理。各回は latest so / open PR / owner を確認し、READYを複数進めてよい。CI未完了・競合時は保留、別の独立READYへ。既存のQAを優先し、実装をテスト都合で複雑化しない。

| 順 | 作業 | 状態 | 完了条件 / 根拠 |
|---|---|---|---|
| P0-1 | CSS/JS responsive整合 | SOURCE_DONE (#721/#727); runtime保留 | common.js header 67.5rem / footer 48rem vs numeric 1080/768、html legacy flags 768/1024のconsumer調査、home.js・table-scroll-hint.js・Swiper設定等全自作JS調査。意味の同じ境界はmatchMediaへ、異なる機能は別契約。境界・往復・初期font size・focus/scroll/ARIA確認。 |
| P0-2 | form.js安全性 / sample plugin scope | PARTIAL (#722/#723 merged) | file.name HTML injection、jQuery value誤使用、未選択、CF7/AjaxZip3とFormidable/yubinbango責務、動的再描画と重複wrap確認。実free plugin QA、Pro/本番は#523。#717 native input修正済み。 |
| P1-3 | JS状態owner / 初期化 | PARTIAL (#725 merged) | common.jsのmenu/overlay/scroll lockの状態一元化、重複listener・DOM再初期化を点検。分割は既存Themeと修正頻度に合わせる。 |
| P1-4 | asset/cache | PARTIAL (#724/#726 merged) | CSS @import childだけ更新時のキャッシュ失効、editor/front両方の依存、既存配信環境を確認。不要buildを作らない。 |
| P1-5 | HTML/CSS/JS命名・検索性 | READY | existing naming維持、visual vs behavior hook、同一ownerへの集約。selector renameの全consumer確認。 |
| P1-6 | PHP/WP template責務 | PARTIAL (#729 merged) | template-parts/data/markup、escape、hook/query、副作用、optional dataを点検。既存ACF schema維持。 |
| P1-7 | sample/vendor/ライブラリ | PARTIAL (#722/#726/#727 merged) | CF7、旧CPT、無効コード・sample文言/素材、未使用ライブラリをconsumer調査後に除去。vendor/generatedは対象外。 |
| P1-8 | WP/plugin依存 | PARTIAL (#729 merged) | jQuery登録解除・global styles・enqueue順・plugin shortcode二重renderの影響。会社既存方針と実WP証拠を確認し、勝手に依存更新しない。 |
| P1-9 | CSS owner locality残り | READY | 多階層ナビ、Gutenberg group/table、form等。詳細度・カスケード・PC/SP維持。警告数は参考。#718/#719済み。 |
| P1-10 | 人間の修正シナリオ | READY | 文章増減、画像交換、カード増減、任意リンク、WP editor、keyboard/touch/resize、ブラウザ差、cache。適切なrisk-based QA。 |
| 全工程 | 再発防止・先回り | ACTIVE | quick-contract、foundation preflight、必要な既存テストに反映。全案件共通原則と案件固有値を分離し、未検証仮説はLEARNINGSへ。 |

## 受入と保留

- source / static / isolated browser / disposable WP / actual school WP / Figma visual を区別。安全なsource修正は#523/#524を理由に全停止しない。
- ACF追加・変更はCursor、#664 branch/ownerは変更しない。Figma 534:1706は明示許可まで実装禁止。既存デザイン・配色・公式素材・Swiper方針を維持。
- 各作業完了時にPR・commit・実際に成功したQA・残課題を記録する。新規の問題は根拠・影響・優先度・安全な対処を追加し、仕様の不明点だけHumanに相談。実行時間を約束しない。

## 2026-11-26 起点

so 033a7d4: #715–#719 merged。#717 disposable WordPress/free Formidable、#718/#719 source/isolated CSS QA PASS。保守性ロードマップ以後の項目は未完了。

## 2026-11-26 継続実行

- #721 merged `afe8251`: all 5 checks success; Header state/static 50/50; real CSS/JS query alignment in Chromium/Firefox/WebKit at 375/767/768/769/1079/1080/1081/1380 and round trip. Initial browser font preference and actual school WP still unverified.
- Remaining P0-1: all five authored JS files reviewed; home active MV/Course already use 67.5rem, table hint uses `<48rem`, disabled legacy News Swiper has 1000px (not active; no arbitrary change). `common.js` legacy html `_sp/_tablet/_pc` still uses 768/1024 numeric comparisons; trace actual CSS/PHP/JS consumers before removal or alignment. Element width comparison is not a media boundary.
- #722 Form JS source + actual free Formidable fixture opened; await new head CI. Separate file CSS scope candidate: `.file` and `.file label` inherited CF7 styles can leak to other forms; preserve exact CF7 specificity with `:where(.wpcf7)` and test actual CSS. Next independent READY: legacy flags consumer audit and asset/cache dependency inventory. No new page, ACF, schedule or owner changes.

- #722 merged `bc95939`: all 4 checks success; actual disposable WP/free Formidable file adapter + select replay + unrelated submit at 9 engine/width combinations, 27 native choice keyboard checks. #723 merged `e01a9d7` with 6/6 checks. Pro/AJAX/school database still separate. P1-4: CSS entry manifests preserved, each imported local child versioned in WordPress; editor residual rules moved unchanged to separate imported stylesheet. Actual editor iframe, server/CDN query-key policy and image/font binary cache remain to verify.

## 2026-11-26 継続実績（今回の開始 e01a9d7、実装終了 89bab54）

- Figma skill loaded, new session; PC599:2726/SP480:3954 full design contexts and inline screenshots obtained. Existing design and official assets unchanged; no final visual acceptance claimed.
- #722 merged bc95939 (4/4 CI; real disposable WP/free Formidable 9 engine/width cases; 27 native-choice cases).
- #725 merged 9479da4 (4/4 CI): actual toggleMenu regression tests after fixing legacy root-class stub; unified scroll lock and backdrop owners, resize/search independence, zero scroll position. No real device or full site menu QA yet.
- #726 merged b3f2216 (4/4 CI): duplicate Font Awesome head links/dead preload example removed. Existing WordPress enqueue and active font stack retained.
- #724 merged fef0121 (6/6 CI): first runtime failed because wp_enqueue_style alone did not register a source-free alias; explicitly wp_register_style then enqueue. 60 child links with ordered unique versioned URLs at 9 engine/width cases in actual disposable WP; existing form regression passed. CSS entrypoint retained for standalone previews. Actual editor iframe, server/CDN policy, mtime preservation on deployment and binary asset cache remain separate.
- #727 merged 89bab54 (4/4 CI): 150 authored files inventory, zero retired width flag references at tested head. Remove unused numeric producer and disabled navigation code. Existing active matchMedia and measured geometry unchanged. External DB custom CSS/JS and initial browser font settings unverified.
- All five implementation PRs merged, no overlapping base paths at merge. Their CI is per PR, not proof of combined final site behavior. #523/#524 OPEN, #664 untouched, ACF/534:1706/schedule unchanged.

### Next independent READY (priority)

1. P1-6/P1-8: inspect and fix proven PHP/WP source defects. `inc/front.php` renders `apply_filters('the_content', get_the_content())` at enqueue time to detect postal fields (potential duplicate shortcode rendering/side effects); keep YubinBango conditional and existing editor content owner, verify actual shortcode rendering and address setup. Inspect `add_page_slug_class_name` (`get_post(0)` for root page duplicates current slug, missing ancestor guard) and `my_body_id` (query object absent on certain routes). Use actual queried object, preserve existing valid IDs/classes and test no data/parent scenarios. No new CMS fields.
2. P1-3: real disposable WP menu keyboard/resize/scroll roundtrip at current combined HEAD, then audit duplicate init/other modules. Keep source owner simple; don't split files for line count alone.
3. P1-4: actual editor iframe link/ordering and one-child version change/fallback test; inspect deployment cache policy. No production-server access assumed.
4. P1-5/P1-7/P1-9: continue naming/unused source and class-local CSS review with actual consumer inventory; retained disabled legacy News Swiper not an active breakpoint mismatch. P1-8 jQuery replacement and core styles require plugin compatibility evidence before changing.

## 2026-11-26 継続実績（開始 89bab54、実装終了 46e3b39）

- #728 previous handoff merged 8c4350d after 3 successful CI logs; current run implementation is #729/#730/#731, not previous run's five PRs.
- Official figma-design-to-code skill loaded and new session; PC384:1046/SP445:3245 high-fidelity design context + inline screenshots. No Figma writes, visual CSS changes, ACF schema, held original page or schedule changes. Existing design/asset ownership retained.
- #729 merged da1c8e5, all 5 CI success. Register YubinBango without executing content early; scoped late filter on actual form template content detects postal class with WP_HTML_Tag_Processor and enqueues footer script; remove filter even after exception. Actual disposable WP/Free Formidable fixture plus local-only shortcode counter: no-postal form renders shortcode once and no postal script; postal child renders once, script present once, expected root/child classes, all 3 engines. No real postal lookup or Pro verification. Page slug class uses queried WP_Post, validates ancestor, avoids duplicate and missing object. No change to unused legacy my_body_id or actual header body id.
- #731 merged ad2bbbd, all 4 CI success. PHP temporary file test verifies one child mtime change only, dependency ordering, alias registration, missing/conditional/non-import/duplicate import fallback. Detect flattened handle collision before partial registration. Actual browser cache/CDN and editor iframe not proven.
- #730 merged 46e3b39, all 5 CI success. Real bundled jQuery/extracted authored functions in isolated Chromium/Firefox/WebKit at 375/768/1380: table/password/lightbox wrap exactly once, intentional empty p attributes retained, anonymous empty p removed, overflow state retained. One namespaced table resize handler. Not full common.js replay or full WP editor acceptance.
- All 3 implementation PRs merged after actual CI logs and disjoint base-path review. #523/#524 open; #664 unchanged.

### Next READY (supersedes earlier candidates)

1. P1-3/P1-10: combined disposable WordPress menu fixture with actual navigation HTML/registered WP locations and real common.js, keyboard/touch/resize/scroll round trip. No real school DB or physical device claim. Continue individual init/observer owner audit rather than globally replaying all scripts.
2. P1-6/P1-8: audit actual consumers of unused my_body_id versus header.php's current slug id before changing anything; inspect legacy _visual.php missing attachment/false array, archive query assumptions, and output escaping. Preserve approved visible title/layout, no invented fallback image; existing sample behavior only change with proof. Avoid unverified jQuery deregistration changes; test actual free plugins and record Pro requirement.
3. P1-4: real editor iframe link order/scope and deployment mtime/query key/CDN behavior; source one-child/fallback test done. No production access assumed.
4. P1-5/P1-7/P1-9: continue source and class-local CSS review; avoid arbitrary rename and cascade/geometry changes. Keep #664 and original 534:1706 protected.

## P2 — 全体再点検（Human 2026-11-26）

Trigger: 承認済み残実装・保守改善に安全なREADYがなくなったら開始。既存作業回の継続先。現在の統合QAなど先行可能な作業は妨げない。

| 順 | 対象 | 初期状態 |
|---|---|---|
| 1 | Header：ロゴ、CTA、PCメガメニュー、SPハンバーガー、暗幕、検索、フォーカス | NOT_STARTED |
| 2 | Footer：PC/SPロゴ・装飾・リンク・SNS・ページトップ | NOT_STARTED |
| 3 | 共通パーツ：見出し・本文・リンク・ボタン・カード・表・アコーディオン・ナビ・フォーム・画像等。PC339:23/SP433:2015から現行実装を照合 | NOT_STARTED |
| 4 | 実装済み記事一覧/詳細・固定ページ・サイドバー・フォーム・検索/404等（Figma/既存仕様が確定した範囲） | NOT_STARTED |
| 5 | 実装済みTOP・各部紹介・コース等、既承認の表示部分のみ。ACF未接続箇所はQA fixtureを別記 | NOT_STARTED |
| 6 | 全体統合：共通部品の変更による各ページの回帰、リンク/操作、残差再確認 | NOT_STARTED |

### 各対象の完了条件

- Figma正本のPC/SP対象nodeを最新skill/sessionで取得、画像と構造・数値を照合。Git SHA・node・スクリーンショット・browser/version/viewport・データ条件を記録。既存実装に対する確認であり未承認ページ534:1706の実装や#664/ACFへの着手ではない。
- PC/SPは実デザイン幅（例1380/375）と中間幅、既存切替の直前/直後（例767/768、1023/1024、1079/1080は該当するownerのみ）を確認。狭幅320等は頑健性の追加候補。Chromium/Firefox/WebKitの利用可能な環境を明記し、エンジン検証と物理端末実機を区別。
- 余白・位置・寸法・フォント・weight・line-height・折返し・画像比率/トリミング・欠落・横スクロール・重なり、hover/open/tap/keyboard/focus、長文・空データ・実CMS/fixtureを確認。色は正本と異なる実装ミスのみ報告し、Human指定の配色を勝手に変更しない。
- 差分は原因・修正範囲・証拠・優先度を記録。仕様不明は質問/保留、確実な不具合は小PR・CI・安全merge・修正後再比較。自然な折返しや既承認レスポンシブ方針を壊してpixel matchを強制しない。
- 状態を NOT_STARTED / IN_PROGRESS / PASS / FAIL / DEFERRED_ENV / BLOCKED_HUMAN / BLOCKED_ASSET で管理。source/static/isolated/disposable WP/actual school WP/Figma visual acceptanceを別々に記録し、CIだけで全体PASSとしない。完了判定は確認可能な実画面と根拠に基づく。#523/#524は既存追跡先、重複Issueを作らない。
- 一巡後は残差・変更影響を再評価し、有意な差分があるものから再検証。変化なし・全確認済みなら根拠と残保留を報告し、無意味なコード変更を作らない。

### P2-TOP — セクション単位の高精度視覚監査（Human 2026-11-26）

以下は既存DESIGN_FOUNDATIONとfront-page.phpから起こした探索・確認索引であり、今回新規Figma取得・render済みという意味ではない。最新Figmaで全可視子layerとセクション境界を再取得し、索引漏れがあれば追加する。全項目初期 NOT_STARTED。

| 対象 | 既存PC / SP node索引 | 重点 |
|---|---|---|
| Header / CTA / SP固定導線 | 599:2726 / 480:3954、CTA PC134:823（SPは最新Figmaで探索） | ロゴ、正確なアイコン・矢印・配置、開閉、sticky、safe-area、重なり |
| MVキャッチコピー | 114:29・220:7 / 279:2142・279:2144 | PC/SP専用SVG、文字・行間、装飾の相対位置 |
| MV画像・Swiper | 184:797 / 279:2172 | 各画像の順序、比率、crop、段差、gap、連続ループと継ぎ目 |
| 重要なお知らせ | 114:349 / 279:2233 | ベル、日付、背景、長文、余白、表示条件 |
| About紹介文・地図 | 114:180 / 279:2318 | 地図、pin、花、ドット、文字と装飾の重なり |
| Aboutカード | 220:57 / 279:2241 | 写真、回転、重なり順、選択時前面、SP配置、QA fixtureと本番を区別 |
| About〜Course共通背景 | 220:56 / 279:2137 | 画像fill 114:38 / 279:2138、hidden fill除外、crop、ぼかし・白いoverlay・前後の境界、ブラウザ幅適応。既存img_about-bg-03.webpは強い候補だが出所未証明、未接続。#524保持 |
| Course各部紹介 | 114:635 / 279:2336 | 全5カード・写真・矢印・花・背景との重なり、PC3列/SP Swiper・dots、既存QA fixture、ACFはCursor |
| 入学検討者向け | 158:2645 / 279:2443 | 公式アイコン3点、花、写真crop、バッジ、装飾・影・hover、未確定リンク |
| News | 114:542 / 279:2524 | 見出し・カテゴリ・日付・花・矢印・marker、長文 |
| Instagram / News隣接 | 114:541・114:581 / 279:2523・279:2562 | 正式イラスト、Brands glyph、左右の比率・gap、PC並び/SP順、実URL未確定 |
| 下部バナー | 114:419 / 279:2630 | 写真crop・配置・余白、透かし/権利保留#524、仮画像はQAのみ |
| Footer / 全体のつながり | 221:335 / 506:1632 | 背景、公式SVG、ロゴ・リンク、ページトップ、前sectionとの接続 |

#### AIの典型的な見落としを検出する手順（各セクション）

1. 正式skill/new sessionでPC/SP個別context・高精細画像を取得。sparseは子nodeを取得し、生成コードや全体縮小画像だけで判断しない。可視layerを列挙（装飾、背景、疑似要素で表現するもの、空/hiddenを区別）。親子境界、意図的な重なり、マスク/clip、z-orderも記録。
2. 背景は色、画像fill、gradient stop/角度、opacity、blur/effect、repeat、crop、position、size、基準box、全幅/inner、セクションを跨ぐownerを照合。実画面で上下左右端と隣接sectionまで比較し、勝手な近似や全幅不足を防ぐ。
3. あしらい・アイコンを1点ずつFigma node→正式素材→Gitファイル→実際のcallsite→実renderへ照合。SVG viewBox/固有寸法、stroke/weight、FAのfamily/style/glyph、fill/mask、向き、影、比率、透明余白、hover時反転を確認。似たアイコン・PC/SP素材取り違え・非表示/欠落・描き直しは不可。固定装飾の位置指定と可変テキストの自然なlayoutは区別。
4. 文字（font/weight/size/tracking/line-height/折返し）、余白（上下/左右/gap）、画像（正しい写真・比率/crop/焦点）、PC/SPの順序、各container幅を測る。Figma実幅1380/375、狭幅320、中間幅、該当breakpoint前後を確認し、長文・空データ・画像差替えでも崩れない。Figma固定heightをそのまま文字boxに適用しない。
5. 実renderを同じ幅/状態でセクション単位に比較。スクリーンショット、測定値、差分overlay等（利用できる手段）で欠落/位置ずれ/大きさ/状態を確認。動く箇所は静止画だけではなく開始・中間・停止・resize、hover/tap/focus/keyboardも見る。fontロード・画像ロード・DPR・ブラウザとデータ条件を記録。
6. Figmaとの差異を「実装ミス」「Human承認済み自然wrap等の意図的差」「資料/素材/環境不足」に分類。確実な修正を小PRで行いCI→再撮影→隣接sectionと共通部品の回帰を確認。未取得素材は創作せず#524、実環境不足は#523。個別sectionのPASSとページ全体PASSは別。

一巡の合否は個別sectionの証拠と未解決差分の一覧で判断。全体写真が似ている、静的CIが通る、SVGがGitにあるだけでは合格にしない。必要なら複数回に分けるが、処理量や時間を理由に検査項目を省略しない。

## 継続実績 — 年度クエリと長文・タッチQA

- Start a6b2a75; #738 previous handoff merged a51087b (3/3 CI), parallel #735 audit-plan docs merged 6b8698a (5/5 CI). Fresh official Figma skill/session PC599:2726/SP480:3954 full context/screenshots; no Figma edit.
- #740 merged 6acf44e (5/5 CI). Preserve original year in WP query before fiscal rewrite clears native year; shared title/breadcrumb resolver, no raw URI slicing. Actual disposable WP HTTP requests ?year=2024, ?year=2024&paged=2, ?m=2024 verified boundary posts, fiscal visual/title/breadcrumb and pagination; static PHP regression also passed. Month/day queries, actual school DB and permalink variants remain unverified.
- #739 open, head a7b550f. Initial test error browser variable corrected; second run Chromium actual emulated touch PASS (first/second tap, another parent, outside/resize/mobile), Chromium/Firefox 320/375 text geometry PASS, Firefox timed out waiting for touch capability/marker. Latest retry logs actual maxTouchPoints/TouchEvent/coarse; only explicitly records DEFERRED_ENV if Firefox maxTouchPoints=0, never fake capability; WebKit and latest run pending at record time. Recheck exact CI logs before merge.
- #741 open, head 42a130e. Actual #740 logs revealed first result article title leaked into document title when page_for_posts=0. Guard configured ID/missing post type and retain fiscal year without invented label; actual runtime assertions strengthened; CI pending.
- Editor canvas: current hook enqueue_block_editor_assets needs review for split CSS. Official WP handbook https://developer.wordpress.org/block-editor/how-to-guides/enqueueing-assets-in-the-editor/ explains editor UI versus iframe content; enqueue_block_assets with admin condition is candidate, not applied. Attempt to write login-based browser QA rejected by connector safety gate; no commit/PR (only empty branch), no bypass. Use approved local developer QA or credential-free core asset collector test; distinguish actual iframe from inline editor; verify every child/token/order and no front duplication before changing hook. #741 owns front.php until settled.
- Visual concern to carry into Header P2: fresh desktop Figma 599:2726 shows compact school submenu below parent, SP480:3954 shows stacked open navigation with CTA. Current source global_navigation.css desktop gnl_wrapper-02 is fixed/full-width and _header.php uses CMS identity/menu. This is a source-vs-design discrepancy candidate, not a rendered visual acceptance result. Compare actual PC/SP captures, exact node/variant and existing assets/CMS owner before targeted changes. Do not treat interaction tests as visual PASS.
- Next: resolve #739/#741 CI first, then editor canvas asset owner or actual PHP remaining route/unused my_body_id consumer audit. P2 Header then Footer when independent READY exhausted; #735 TOP section audit criteria retained. No new schedule, #664/ACF/534:1706 unchanged, #523/#524 OPEN.

## 継続実績 — Header P2 / SP開閉・行デザイン（2026-11-27 JST）

- 開始so 6acf44e、引継ぎ#741は4/4 CI・年度実WP HTTPログ確認後7df954aへmerge、#742は既存docsのみ2/2 CI確認後88a6347へmerge。#739はWebKitでもhasTouch要求に対しmaxTouchPoints=0を観測したためFirefoxと同じDEFERRED_ENV判定へ修正（head 7e5227f）、3/3 CI確認後5fc061bへmerge。Chromium実エミュレーション操作、3engineの320/375長文、keyboard/resize/scroll復元はPASS。Firefox/WebKitのtouchは未検証。
- 正式Figma design-to-code skill、新規session、PC599:2726（1380×768）/SP480:3954（375×1021）の高精細context・実PNG取得。Figma書換えなし。#743 head 351b3c2、merge b06f8e7、5/5 CI。SP480:4686/4688/4690の60×60緑背景・白24×1.5px交差線±45°・中央・menu文字非表示を既存state owner内に実装。実WP run 45848184761 job 140007226093の全3engineで寸法・色・角度・focus・閉状態復帰を確認。
- #744 head 54c38fc、merge 5afbf1a、5/5 CI。SP512:2449/2454の親行薄緑・子行白、16/14px・500・20/15px余白、2px親間隔・1px子区切り、12px緑線・52px開閉領域を既存token、class内media、2スペースで実装。line-height 1.4はFigma normalの実装解釈、固定行高なし。CSS run 45848421401 job 140008061584で3engine×320/375/767/1079/1080/1380=18ケース、実WP run 45848421506 job 140008062225で3engine長文・keyboard・resize・footer回帰、Chromium touch、年度query PASS。#743と#744は差分パス非競合確認後に順次merge。各PRのCIであり最終統合HEADの全画面visual PASSではない。
- 次READY: PC599:2726の学校案内flyout（216×206、内200、横8、行padding12、Zen Kaku 13px/500、hover背景#f2f2f2・緑文字）と旧固定全幅3列の差異を独立修正。604:3024/3025のunion素材は既存正式asset同定が未完了、近似SVGの創作禁止。PCの深いCMS階層・端部overflow・hover bridge・keyboard/touch・実画面比較を守る。次いで90pxデザインと現120px headerの共有consumer、SPロゴ/CTA/secondary/SNS（URL/管理ownerと素材根拠を先に確認）。全体Header→Footer→parts/pages、TOPは既存section audit。actual editor iframeは前回環境制約継続、#523/#524 OPEN、#664/ACF/534:1706保持。schedule/owner変更なし。

## 継続実績 — PC親ナビ・Header/Footerロゴ・実画面からの回帰発見（2026-11-27 JST）

- Start so 86ee211; only JWSNJ prior open #664, retained. #523/#524 OPEN, parallel #516 common policy not edited. Official Figma design-to-code skill and fresh session; full PC599:2726 (1380×768), SP480:3954 (375×1021), compact flyout604:3018, PC Footer221:335 (1380×551), SP506:1632 and PC114:487 context/images. Figma unchanged.
- #747 head fd2fa4f → 45050be (5/5 CI): saved exact 60×57 header SVG, SP46×43.7, left16, gap8; PC60×57, left40, gap12; CMS Japanese name Zen Kaku 15/20px, 1.4/1.5. CSS run45851117942 (job140017418496) 18 width/engine cases, moderate long title wraps without overlap; actual WP run45851117887 passed. English identity management and content-driven shared height remain unresolved; extremely long/150–200% text not accepted by this fixture.
- #746 first head 0b999b9: Firefox close-state timeout after moving pointer within full-width legacy flyout. Move pointer to header left padding, assert actual hover/focus exit, verify bundled FA Regular via document.fonts.load, integrate #747 base. Final head31de1d6 → 26f38f1 (5/5 CI). Actual WP run45851624854 job140019177945: three engines ×1080/1380, parent 15/500/22.5px, 8px gap, 14px FA Regular F107/F106; decorative aria-hidden span only for parent, SP hidden. Real keyboard/resize/long menu/Chromium touch PASS; Firefox/WebKit touch DEFERRED_ENV. PC compact panel not implemented.
- #748 head9629ecf → e5c9967 (5/5 CI): Footer PC114:487/SP279:2769 Japanese site name 18px/500/1.5/0.05em, exact saved 51×48 SVG with intrinsic aspect, existing CMS name. CSS run45851816213 job140019843565 verified 15 engine/width cases including longer name. Actual WP run45851816203 navigation regression PASS; no English/address/phone/SNS/copyright values created. #746/#748 changes disjoint.
- New material evidence: GitHub Actions artifact download tool returned actual mounted ZIP, successfully opened screenshots (not just logs). #747 artifact15134152354 nav-{chromium,firefox,webkit}-375-long shows official mark and close control; Chromium classic scrollbar gutter leaves right15px versus Firefox/WebKit full375. Fixture uses CSS QA title and long labels, not school menu data or loaded remote Google Fonts; missing CTA and site identity remain independent. #746 artifact15132589560 nav-*-1080/1380-parent: Chromium captured only partial open panel, Firefox/WebKit full. CSS specificity of desktop transition vs generic reduce-motion, plus possible SP data-open=false leak into desktop grid, are independently repairable. #749 head b82058c fixes exact transition owners and SP-only grid-track states; actual WP test explicitly collapses SP parent before resize, measures 0s and all text line hit targets on hover/focus. Merged #749 at 12b0a81324fa074732e61ca95631d8ceab57ab00 after 5/5 CI logs checked. Actual WP run 45852369268: Chromium/Firefox/WebKit at 1080/1380, SP collapse then desktop hover/focus, 0s duration and fullyHit=true across all six cases. Downloaded artifact 15134418357 and inspected both Chromium PNGs: full panel visible at both widths. Legacy full-width layout remains pending compact official SVG; normal-motion timing and physical devices not claimed. #748 artifact15133503333 nav-chromium-767 shows preserved logo and old SP sitemap, plus apparent closed-row gaps; investigate independently, not full Footer acceptance.
- BLOCKED asset: Figma compact flyout604:3024 and604:3025 exact SVGs (shadow and white union), high fidelity context and actual image obtained; curl attempt failed DNS "Could not resolve host: www.figma.com". Neither source nor deployed common inventory contains identified union exports. Do not repeat same DNS probe, fabricate substitute, or commit temporary URLs. Resume with authorized exact exports from environment with working DNS, validate node/bytes/root geometry/SHA256, preserve natural height and edge positioning; no new rights or owner inferred. Existing #524 tracks asset handoff. CTA icons saved but destinations unapproved; no invented links.
- Next READY after #749: review fresh screenshot and actual CSS cascade for both motion preferences; audit shared header-height-PC/SP consumers (global_header, global_wrapper, global_navigation, common.js smooth scroll) before changing 120→90; current two-row search/secondary structure and unknown CTA management preclude blanket height reduction. Audit root scrollbar-gutter vs classic/overlay behavior without introducing layout shifts; verify Footer closed rows and SP sitemap visibility authority before changes. Then continue Header→Footer→parts, section-level TOP recheck only within approved scope. Keep #523/#524/#664/ACF/534:1706 and schedule unchanged.

## 継続実績 — Footer開閉とSP補助ナビ（2026-11-27 JST）

- Start so 3cf1e65, previous #749 actual WP workflow 5/5 verified; fresh official design-to-code skill/session, PC599:2726/SP480:3954 and Footer PC221:335/SP506:1632 high-fidelity context and screenshots. #523/#524 unclaimed/open; #664 held, #516 policy unrelated.
- #751 final head a30ee05 → edf7960, all 5 workflows successful. Footer desktop sitemap 114:523 has no mobile accordion; SP506:1632 has no sitemap, but retain current editor-managed menu rather than hide it without approval. SP data-open grid state scoped below 768; remove desktop nested button selectors from later display:grid group; transition owner honors reduced-motion. Actual WP run45926277448 job140268197302: 3 engines ×768/1080/1380, close first at767, three descendant links (including grandchild) remain within desktop wrapper, all buttons hidden, duration0s; keyboard and resize regressions pass. Artifact15166691538 downloaded, Chromium 767 closed footer screenshot inspected; SP rows present as intended, not full Figma parity.
- #752 head2a80e81 → e2509cf, 5/5 workflows. SP480:3954/512:2520/2521/513:2660/579:3753: existing sub-nav remains WordPress-owned; single column, 40px horizontal/preceding inset, 16px gap and bottom padding, 13px Zen Kaku Medium/5% tracking, 1.4 line-height as provisional interpretation of Figma normal, separator token, existing external glyph 12px/4px gap; natural grid tracks. PC existing flex20 gap and no borders. CSS run45926367270 job140268482396: all 18 width/engine cases pass, long label wraps 2–4 lines at320/375. Actual WP run45926367239 job140268482394: keyboard, resize, long menu and Chromium touch pass; Firefox/WebKit touch DEFERRED_ENV. Artifact15166995769 downloaded and Chromium375 open screenshot inspected: secondary items form one column, old search and close controls retained; full Figma not achieved, gutter 15px still visible, remote fonts blocked by fixture. Paths of #751/#752 disjoint; separate PR CI, not final combined visual acceptance.
- Root normalize.css has scrollbar-gutter:stable and legacy body min-width1280 at>=768; do not remove global constraints blindly. Next READY: measure classic/overlay scrollbar and scroll-lock geometry before scoped remedy; investigate existing middle-width page horizontal overflow separately; Header 120→90 requires shared height/offset owners and PC search/CTA management decisions. Compact flyout604:3024/3025 exact official asset still BLOCKED #524 from prior DNS failure, no same-route retry. SP Footer sitemap visibility/English identity/address/SNS/CTA/search require confirmed owner/intent before removal or new values. Actual school runtime, physical touch and final visual parity remain #523. No TOP/course/original534:1706/ACF/Figma or schedule changes.

## 継続実績 — スクロールロック・空Footer（2026-11-27 JST）

- Start so fc72eb2; previous #751/#752 merged; #523/#524 OPEN unassigned, #664 held, #516 unrelated. Fresh official Figma design-to-code skill/session and PC599:2726/SP480:3954/SP Footer506:1632 context/images.
- #755 head52e9de6 → e1b2f74, 4/4 workflow success. Unassigned/empty footer-nav no longer emits blank landmark/layout wrapper; preserve assigned menu and existing walker. PHP output test covers false/null/empty/whitespace and populated exactly once; actual WP run45927246410 job140271354552 three-engine assigned-menu keyboard/resize regression PASS, Chromium touch PASS; actual unassigned WP runtime not tested. No changes to assets or CMS values.
- #754 first head6a70aee: static tests PASS; actual WP run45927148228 job140271035859, Chromium375 geometry PASS (body width360 of375, gutter stable, unchanged through lock/unlock); 900px assertion failed because actual fixed-page fixture overrides body min-width to zero. Source audit corrects earlier assumption: body.home, blog/category, single-post, body:has(.jwsnj_fixedPageMain), body:has(.jwsnj_courseMain) already override legacy min-width1280; do not assume every middle-width page scrolls horizontally. New head c6dcecd reproduces legacy width ONLY in disposable WP fixture at900/1079 and tests normal375/900/1079 separately. Stores x/y, offsets body left/top, clears inline offsets and restores both; static state tests pass; final run45927470241 job140272089466 success, all 15 cases across Chromium/Firefox/WebKit (normal 375/900/1079, disposable legacy-width 900/1079). X120/Y400 restored and body/header coordinates unchanged during lock; Chromium stable gutter15px, Firefox/WebKit0px. All 4 workflows success, merged #754 at549fa10.
- PC header Figma603:2939 height90, 60×57 logo, 40px main nav gap, three CTA; current variable120 feeds header, wrapper padding, desktop fixed flyout and smooth scroll reads header geometry. Existing search/secondary two-row structure and unknown CTA links preclude blanket change. Preserve root stable scrollbar gutter; classic Chromium15px vs overlay engines is expected layout difference; no global width/policy change. Next: #754 geometry complete; screenshot artifact not inspected for this change. Scope header height/layout after CMS intent and #524 compact SVG are established, continue approved parts checks independently. #523 physical device/real school WP, #524 exact assets, #664/ACF, original534:1706 and schedule unchanged.

## 継続実績 — PC短画面・Footer実WordPress空メニュー（2026-11-27 JST）

- Start so5c8bb1b, #757 already merged before this run; checked actual CI logs, #523/#524 open unclaimed, #664 held, #516 unrelated. Fresh official Figma design-to-code skill/new session and PC603:2939/SP506:1632 context/images. Existing #758/#759 from previous run reviewed, all CI logs read and merged without overlapping paths.
- #758 head f5269ca → fc591b5 (5/5 workflows). Actual WP run45928182346 job140274385387: 3 engines ×1080/1380 with 240px viewport height, deliberately expanded fixture label; panel top120/bottom240/clientHeight120, scrollHeight1463–1838, last text rect hit and link focused after scroll in all 6 cases. Downloaded artifact15167647028, inspected six short-flyout PNGs: bottom label and visible panel at both widths in all engines. No compact Figma geometry acceptance; legacy two-row header and full-width blue panel remain. Only vertical padding cap/scroll owner changed, no colors or CMS changes. Normal-height regression passed; physical devices/normal-motion dedicated test remain deferred.
- #759 head1005ce0 → 85b43e4 (3/3 workflows). Actual WP run45928246808 job140274597419: unassigned=0, assigned-empty=0, assigned-populated=1 landmarks, logo and footer bottom preserved. Real WP CLI template output, not empty-state browser screenshot. Restore seeded menu before browser tests; no production changes.
- #757 previous merge5c8bb1b confirmed. Next: PC header actual Figma90px/one row/CTA vs current120px/two rows/search and sub-nav; need explicit mapping of CTA destinations and decision about search/secondary controls, English identity. Compact flyout604:3024/3025 exact asset bytes still #524; no same failed download route or substitute. SP Footer sitemap absent from design but existing editor-managed menu retained; contact/English/SNS values unresolved. Continue independent approved shared-part audit after closing these PRs, using current PC339:23/SP433:2015 index and actual rendered evidence. #523 real school runtime, physical touch, full visual parity still open. No TOP/course/original534:1706/ACF/Foundation/schedule changes.

## 2026-11-27 Cursor local evidence

- `origin/so` remained `fa4ab148` at start. Local `http://127.0.0.1:28000` is up. Chromium at 1380px measured header height 120px; Figma PC header remains 90px. Search and the two-row structure stay until CTA destinations and the search/secondary decision exist.
- Official `604:3024` / `604:3025` vector bytes are now in Git. They are not yet the CSS flyout, because the current panel is the recently verified short-viewport menu. Swap only with a side-by-side check against that behavior.
- Course adapter reads the five SPEC fields and renders nothing until the W9 JSON is explicitly approved. #664 is not merged.

## 共通パーツ再点検 — 2026-11-27

- Start e9ee9e1; #760 merged, #523/#524 unclaimed, #664 held, #516 unrelated. Fresh PC/SP numbered/unordered list and large-button context/images; no color changes or new assets. Existing list rules match reference dimensions at source; added computed browser regression, and custom-width button container cap. CI pending until verified; next READY check rendered list/button screenshots, then headings, annotation, table, disclosure and other common parts individually. Full editor iframe/actual school runtime still #523; Header/Footer remaining decisions unchanged. No TOP/course/original534:1706/ACF/schedule changes.

## 継続実績 — 共通リスト・NEWS・実WPパーツ集（2026-11-27）

- Start so `0f004b10c6694112d26eb1e930ce367c1160e5be`。Cursor #764既存mergeを維持。Figma正式skill、新規session、PC344:947/SP442:2806、PC390:669/SP478:3029、PC357:938/SP442:2908の高精細context/画像を再確認。
- #761: 最新soの並行doc追記を保ったmerge commit `8f006168`、CI 4/4成功。CSS実ログ run45948647202/job140339087910、artifact15175986410のPC/SP 6 PNGを確認。2桁10.の左端欠け解消、長文ボタン/入れ子list維持。本文34px insetをolに集約し、native numberingを維持。単桁番号の右寄せはFigmaの左寄せと差が残る。実Gutenberg editorは未検証。merge `733423e112aa03ad0019af2158832129b191f347`。
- #766: 前head `b025908f` の実WP run45948001144/job140337040400はFirefox768の固定ラベル2行でFAIL。親Flexのintrinsic幅だけでは不足。明示span + grid配置、同一行の複数text rectを区別するQAへ変更し、Cursor #764のHeader/hero/メニューQAを保ったmerge commit `577253dd`。CI 5/5、実WP run45948694890/job140339240839 3 engines×375/768/1380の9ケースPASS。absolute、0.3s、開閉時のflow不変、Escape/連打/focus復帰/reduced-motion。artifact15176092136の9 PNGを確認。merge `618530d28edc4a19fe8d8b878a8aa01ca8c8e86b`。長い編集カテゴリは折返し可、固定ラベルは1行。未確定リンクと検索窓の扱いはHuman指示の範囲。
- #768: 原文839行を保持し、native core blockに限定した別fixture/明示的disposable seed/既存WP CIブラウザQAを追加。CI結果と実画像を確認するまで未マージ・未検証。次READYは #768の最新soとの統合/実ログ/画像、実Gutenberg編集・保存再編集、他パーツ（table/gallery/ACF navigation/tab）の適応。Large Navigation→TOP Course共通表示はCursor最新adapterと照合し、ACFを変更しない。#523/#524は未完、534:1706・#664・スケジュールは変更なし。
