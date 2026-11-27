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

## 2026-11-27 継続 — native Details motion・Gutenberg editor QA

- Start so `ad9b0d279dd06b3b409fcdaf5555251fe89b5b21`。#768は開始時点でmerge済み、今回のmergeに計上しない。実WP run45949261996/job140341038820を再読、registered core block/save再読と3engine×4幅=12ケースPASS。artifact15176197753から開状態PC/SP×3engine×3種類=18 PNGを今回目視確認。外部フォントなし・検証文言・focus outlineあり、全体のFigma一致や実サイトの証明ではない。
- Fresh official skill/session、Figma PC357:938/SP442:2908 high-fidelity context/画像確認。#770 `b4db9ded`：native detailsのstate/markup/FAQ配色・CMS構造を維持し、feature detection付き`::details-content` grid 0fr→1fr、0.3s tokenとcontent-visibility discrete transitionで本文の開閉。Chromium144の局所probeで中間高さを確認し、閉じ途中のTab漏れを再現したためnative toggleで一時inert、Escape、focus、reduced motionを追加。JS/機能非対応時native fallback。実WPで3engine×4幅×3種類のmotion/反転を検証する。旧ブラウザは即時開閉のfallback。CI/画像を確認してからmerge。
- #771 `c1f0f2cd`：別PRで実WP Gutenbergのvalidation・実編集canvas末尾段落の変更・保存・再編集・フロント反映をChromiumで検証。既存local/loopback/opt-in fixtureだけに限定し本番データを変更しない。公式 WordPress Block Editor Data / Post Editor Data handbook参照。実CI成功前は未検証。
- 次READYは#770/#771の実CIログ・画像を確認し、失敗時は原因を修正、最新soと非競合差分を照合してmerge。続いてテーブル・ギャラリー・画像の隔離fixture、Large NavigationとTOP Courseは#664/現adapter/ownerを確認したうえで既存共通パーツ優先。未承認534:1706、ACF・owner・#523/#524・schedule変更なし。

## 2026-11-27 継続 — 実Gutenberg編集・Flexible Table・Gallery

- Start so `e93eaa0fb48c7cafa9e44534fbfcbfd6fbbecb56`。#770/#772は開始時点でmerge済み。Figma正式skill/new session、PC357:970/SP442:2890/442:2891、PC344:1079/SP442:2973、PC344:927/SP442:2787の高精細context/画像確認。
- #771: 旧head実WP45951696618/job140348792913は初回Welcome modalが実canvas clickを遮ってFAIL。強制clickを使わずUIのCloseを実行し、最新soを統合した `8e8a9be6267b3504cd356e10db6d6f5b7bf6c6a9` でCI3/3成功、run45952446661/job140351177824にcore block invalid=0、実段落編集/save/reopen/frontend PASS、motion36 PASS。artifact15177427243の再編集PNGを今回確認し `583e75b052a2343a9b21173efceb4d58d9ac779f` にmerge。編集canvasのH2/H3/ボタン/Details等の見た目はfrontと異なる。編集機能PASSをeditor視覚一致としない。
- #773: SPECの実Flexible Table Block3.9.0、local-only fixture、4列/結合/可変/縦並び。初回実WP45952585912/job140351618575は登録/save成功、SP padding 7.5px (expected12) FAIL。公式tag v3.9.0 classes/class-helper.php/get_block_css と class-enqueue.phpでduplicate-class generated defaults確認。既存table ownerのspecificityを調整し、inline cell padding18pxを尊重（padding important禁止）。`e1970a86` 実WP45953164677/job140353467897のtable12/12 PASS、artifact15177617483のscroll table PC/SP初期/最終9 PNGを確認。PC fixture幅1171px等は実サイトの960pxデザインコンテナそのものではない。OS/browser native scrollbarの常時表示・Figmaの下部バー間隔は別検証。既存motion testの非同時inert測定FAIL（line132）を同一frameで中間高さ/native state/inert/focusを必須にするテストへ変更、`611cc066a2f14b5ad4ba4d96537fb0e18c364d8c` 最新CIを確認してからmerge。根本原因を断定せず、同時測定もFAILなら実装側を修正。
- #774: existing official WebP3枚を隔離WPにsideload（実Figma gallery写真との同一性は主張しない）、core/gallery/image/media-textの長文/奇数/3engine×4幅。初回45952884289/job140352567427はseed成功、Chromium320 3列variantの1枚目が125×179相当（ratio0.697）、他は1.5でFAIL。artifact15177821448の失敗画像も確認。WP7.0.2 gallery/style.cssの:is-cropped系:not(#individual-image)とflex-grow/align-selfを確認。既存カードownerのspecificity/align-selfを修正、native zoom buttonを画像と同一grid cellに配置して44px/16・20px inset・FA glyph・hover/focusを維持、装飾重複を削除。実際の操作buttonと見た目の一致を測る。最新so統合 `cf4a5323c3c3d50b462e4576e4518e848b2e4549`、実WP・画像再検証前は未マージ。明示したfigure selectorのID除外はcore互換のため、core実装の版差も後日確認。
- 次READY: #773/#774 最新CI・画像・最新soとの差分を確認し修正/merge、共通workflowの並行hunkを両方維持して統合、editor canvas styles別QA、残るタブ/ページ内リンク、Large NavigationとTOP Course共通化（#664/adapter/owner維持）。本番データ・ACF・534:1706・#523/#524・既存schedule変更なし。

## 2026-11-27 追加継続 — テーブル完了、ページ内リンク、Gallery残件

- 開始so `f142c1147c6fd44c397a5ac502855c595c21c5c1`。正式Figma skill/new session、PC357:970/SP442:2890、PC344:1079/SP442:2973、PC357:1022/SP442:2948の高精細contextと画像取得。
- #773: run45953564390/job140354748659はtable12/12、Details29ケース成功後WebKit375の既存高さsettled測定でFAIL。フォントready・個別のreduce時の実測endpoint・タイムアウト時の実測/PNGを追加（高さ/中間状態/inert/focusの条件維持）。最新 `df5c55629e49df2d3b7fc168b95dc739d342c2ec` run45954666101/job140358248320でtable12/12、motion36/36、Gutenberg保存/再編集/frontend PASS、全5CI成功・ログ確認後 `d8c0842b21ebb4e743ebe4c6343ad45f74ea8dcd` へmerge。実サイト/実機、実960pxコンテナでの完全視覚一致は未検証。
- #776: 既存ページ内リンクownerのhover transitionにreduced-motionを追加。Figma PC/SPの304px最小幅、SP全幅、48px以上、長文折返し、24px FA矢印、focus、0.3s/0sを実CSS・隔離ブラウザ3engine×5幅で検証。run45954817055/job140358734716に15/15 PASS、artifact15178138201。全4CI成功・ログ確認、#773と非競合確認して `2e3a6ec7413607c6d60daf2b5e5c12d9672114a6` へmerge。ACF Pro実編集・実リンク遷移・新規画像レビューは未検証。ACF/リンク先/配色不変。
- #774: 旧run45953421183/job140354285047はcrop/ボタン寸法通過後EscapeでFAIL。WP7.0.2公式view.jsの非同期setOverlayFocus、hideLightbox後450msのfocus復帰を確認し、実dialog focusを待つ・Escape・復帰を待つテストへ変更。run45954695418/job140358344727でChromium4幅PASS、Firefox320でopen失敗（triggerにfocus、aria-label未付与、overlay非active）。hydration未完/失敗の可能性はあるが未確定。最新 `e6f819107425ecdba0eafaa07a1f027e9aa871bd` は実aria-labelを待ち、pageerror/console/同origin request failure/importmapを記録、#773追加workflowを維持してsoを統合。最新CI・画像確認まで未マージ。単に待ち時間を増やす/Firefoxをskipすることは禁止。次は記録された具体的エラーに応じて実装修正またはQAの環境差を特定する。
- 次READY: #774実ログ/画像/最新so統合確認、残り共通パーツ（Large Navigation PC384:817/SP442:3079、タブはFigma対象を確認してから）、editor canvas CSS差分。#664/ACF/534:1706/owner/schedule/本番ダミーは変更なし。

## 2026-11-27 Cursor次回依頼とGalleryの続き

- Human「進めて / cursorは全部やってくれた？残りある？ / またやってもらいたい事溜めてね」。最新so `337d410` のCursor #764 merge、実Course JSON/adapter、DEFERRED_RUNTIME_QAの午後ローカル記録を照合。完了と未検証を分離し、[DEFERRED_RUNTIME_QA.md](DEFERRED_RUNTIME_QA.md) の「Cursor 次回まとめ依頼」を継続的な未完候補キューとする。次回も追加/完了証拠/重複除去。Cursor実行や新スケジュールはここから開始しない。
- #774 run45956719176/job140364785255: Chromium4幅成功、Firefox320で core moduleの bare specifier @wordpress/interactivity 解決失敗。実DOM順序はheadのlocal Vite client → footerのwp-importmap → native image module。WordPress7.0.2 class-wp-script-modules.php の add_hooks はclassic themeのmapをwp_footerに出力。修正 `e0e9d29fd4d0791f40e9580378bb1e553d843d9d` では local限定Viteをwp_footerの後へ移動し、実WPでmap→module順序を追加検証。既存開発モードを維持し、vendor/ACF/配色変更なし。新CIの合格・画像確認まで未マージ。Figma PC344:1079/SP442:2973 再取得・画像確認済み。
- 次READY: #774の最新実WPログ/画像→安全merge。残る共通パーツ、Large Navigation/TOP Course共用、editor視覚差をChat側で進め、ローカルCMS/Pro/物理機/素材はCursor候補へ蓄積する。#664/534:1706/既存owner・スケジュールは維持。

### #774 完了・次READY（同日）

- `e0e9d29fd4d0791f40e9580378bb1e553d843d9d` のCI5/5と実ログを確認。実WP run45961879217/job140381365447: gallery/media-text/lightbox 3engine×4幅=12/12、table12/12、Details36/36、Gutenberg editor invalid0・編集保存再編集front PASS。artifact15180599658のgallery/media-text/zoom-control PC/SP×3engine計24 PNGを今回確認。3:2、長文、列数とzoom buttonは成功。検証用写真/文言、実960pxコンテナ・実機・物理タッチ・厳密な全Figma一致は別。Chromium/WebKitの一部zoom-control screenshotはスクロール時headerが画像上部に重なった状態を含む（通常gallery画像は別途取得）。実画像と操作計測を区別する。
- #778 Cursor候補9行は `0cde9835c34dad03bbdd37780da724dc653dc330` にmerge済み。変更パス非競合を確認し #774 を `97714572fd25abb66b439ba018e0aee8422b5062` へmerge。#664・ACF・owner・schedule不変。
- Large Navigation PC384:817/SP442:3079、TOP Course PC114:635/SP279:2336、hover294:852の高精細contextと画像を今回再取得。共通の3:2/radius5/corner48/radius20/PC矢印32/24px picture-gap/20px copy-gapを1表示ownerに、TOPのみSP矢印24・右5/下6・20/16px gap、Swiper/配置・hover反転/拡大をoverride。既存のACF adapter/取得処理は分離維持。現在は旧 class と markup を直接assertする parts-navigation-contract、top-notice-contract のPHP fixture stub と css-browser-probe が依存している。共通化の試行は旧PHP stub anchorの非一意で書込み前に中断、ブランチ/commitなし。次はテストの対象範囲を限定して共有viewの実PHP出力と両variantのブラウザ寸法・hrefなし見た目を検証し、小PR化。未承認534:1706と#664の旧PRは変更しない。

## 2026-11-27 最新優先順・Large Navigation単体

- Human「いや、パーツから」によりTOP全体ダミー組み立ては後段。開始so 97714572、#779 CI2/2実ログ確認→c92781c1 merge（前回Galleryの証拠）。#780でPC384:817/SP442:3079を新session高精細context/画像取得し、既存Large NavigationのACF取得と表示を分離、共通 `_navigation-large-card.php` / `.module_navigationCard` に整理。TOP側ファイル、ACF schemaは変更なし。hrefなしでもFigmaの矢印を表示、実リンクのないものは操作不可。写真は既存媒体をQAだけに使用し、Figma写真の一致は主張しない。
- #780初回head b696f55、静的QA/guard/audit成功、CSS run45963460243/job140386456641はChromiumでhrefなしaのtabIndex getter=0（期待-1）によりFAIL。getterではなく実focus/Tab移動を検証する修正 ea008b17027b702b43cc5568d793c9794df31dce。最新CIと画像を確認してからmerge。次は実WPで共通viewをQA専用fixtureからレンダリングして、ACF Pro未接続でもパーツ単体を確認。実ACF編集はCUR-04。既存SliderのFigma PC344:1139取得、SP442:3073候補をmetadata確認。既存実装/承認済み操作と照合して次READYを決める。TOPはパーツ合格後。

## 2026-11-27 Navigation・既存ACF/パーツ集優先（Human追加指示）
- Start so `c92781c125451186d42621413613865b58cbeac2`。#781 CI2/2実ログ確認し `7e9d0b463b33bd45102fcd883185fb9ca0f30b22` merge。Figma正式skill、新session PC384:817/SP442:3079高精細context/画像取得。
- #780前head ea008b1 CSS job140387406420 はChromium5/Firefox320のgeometry成功後Firefoxで最終Tab移動FAIL。hrefなし要素への直接focusは不可。次の実buttonをfixture後方に置いてTabの遷移先を必須assert、ブラウザchrome/wrap差と区別。新head d1eef878b75bcf664609b2f0467a9f7f001eb7c2 CI4/4、job140400960970 Large 3engine×5幅15/15成功、artifact15183177905 PC/SP6 PNG実確認（長文/画像なし/矢印/crop）。`05fdc1ff8d4d1dba5ba7d87cb3e9a3e1b8d5ba06` merge。隔離CSS/実PHP、実ACF/実機は未検証。
- #782 Human提供839行のLarge2/Small3 block commentsと既存2 ACF JSONのrepeater/5 subfields keysが完全一致。原文/ACF JSON変更なし。新テストは原文抽出とactual PHP adapterをstubで実行、QA image/URLのみ置換。read-only local-only generatorは実登録ブロック・field・明示添付ID確認後stdout出力、DB変更なし。最新so統合head68b155c7879dc00a1680a2c08fa50f0ef876daf3、CI3/3、PHP lint/両adapter test成功、`cbeb077f87286dbc71c8766c6805a4f074620aca` merge。実ACF Proでgenerator実行はCursor。既存/parts/ post109は上書きしない。詳細PARTS_CATALOG_QA_REFERENCE。
- #783 Small Navigation既存意匠（Figma partsに独立Small nodeなし）の隔離CSS test、3engine×5幅、画像あり/なし・長文・外部リンク・hrefなし、hover/focus/reduced-motion。head bfb78614cb1fde231299e795dd5b5a48654e3726、CI/画像結果確認後にmerge。次READYはSmall→実WPパーツ集/CUR-04→未完の共通パーツ、TOP後段。#664/534:1706/owner/ACF schema/scheduleは変更なし。

## 2026-11-27 継続 — Small Navigation完了・native tabs
- 開始so cbeb077f87286dbc71c8766c6805a4f074620aca。#783 bfb78614cb1fde231299e795dd5b5a48654e3726 CI3/3、CSS job140402754235 Small15/15・Large回帰15/15。artifact15183464229からPC/SP×3engineのSmall6 PNGを確認（画像あり/なし、長文、外部アイコン、既存意匠）。#782とのパス非競合を確認し477b31ad01af2692da0a5cad1009c8acb00c4070へmerge。#784 CI2/2、非競合確認し124e77092bd59a31684a978a6f46aecbcbc4a924へmerge。実ACF ProはCUR-04。
- #785 89b506cbbe04a6d2e649c875472101c96f7e51bf: Human原文は旧ACFタブでなくnative core/tabs・tab-list・tab-panels・tab-panel。原文3パネルを抽出、旧pattern metadata/外部placeholder/リンクを隔離QAへ適応。既存gallery mediaとFlexible Table Block3.9.0を再利用。登録・保存再読、3engine×4幅、長文・スクロール・manual activation（Arrow移動、Enter/Space選択）・ARIA・複合内容を実WP検証。WP7.0.2公式tabs/view.jsのmanual activationに基づく。独立したタブFigma nodeはPC/SP索引に見当たらず、既存CSS/native JSを保持。CI/画像未確認、未マージ。
- Fresh official skill/session Figma Slider PC344:1139/SP442:3073高精細context/画像：PC660×439、SP335×223、radius10、caption gap20、PC14px/1.5、SP12px/1.6、weight500、center。1枚の画像+captionだけで操作/複数枚/ACFの根拠なし。Human原文839行にslider/swiper blockなし、既存はTOP slider ACFだけ。汎用スライダーのCMS構造を創作せず、Swiper使用方針を維持し、表示ownerと既存編集経路の確定後に実装。画像は編集者管理と公式素材の確認を分離する。
- 次READY: #785 CI実ログ・PNG、原文末尾のnative viewport visibility（WP7.0.2 block-visibility.phpはmobile <=480px、tablet 480<width<=782px、desktop >782px、テーマの768pxとは別契約）を実WPで境界検証。残る共通パーツ集総合QA→TOP共通化。CursorへのCUR-04にnative tabs/visibility実編集を追加候補。TOP、#664、534:1706、ACF schema、owner、schedule変更なし。

## 2026-11-27 継続 — native viewport 実測差・背景テキストボックス

- 開始so `18100872c05e012382d985951a74dfacae3931ff`。最新Humanのパーツ先行、#664 W9/旧PR、534:1706保留、#523/#524 OPEN、Cursor既存ownerを維持。
- #785 actual run45971303769/job140412133060: WP7.0.2 seedで `core/tabs` 未登録、ブラウザ未実行。公式Tabs block要件WP7.1+。既存WP版/登録済みブロックをCursorで確認し、許可なくWP更新・Gutenbergプラグイン導入・独自タブ代替をしない。旧記録のview.js参照は実登録の証拠ではない。
- #787 initial head41a3444 run46010773263/job140545390585: Chromium320/375/768の既存native parts、1380までの12 Details motion casesとviewport375/480 PASS、481pxの tablet非表示でFAIL（classは存在、display:block）。公式WP7.0.2 `wp-includes/block-supports/block-visibility.php` は width<=480、480<width<=782、width>782 を block-supports context に出力する。Theme `inc/front.php` に既存のglobal-styles無効化/core-block-supports dequeueがあるが、原因は未確定。#787 head402dcc04273eb19fe6fe63d2f153b7cb8db83ff7 に実CSSOM、style要素、matchMedia、viewport widthの診断を追加。期待値を変更せず、実ログで原因を確定してから最小修正。#787未マージ。
- 新Figma sessionで背景付き2-Box PC344:917/SP442:2775 の高精細contextと実画像を照合。PC各460×255・padding40/gap40、SP335×291・padding32/gap24、radius5、H4 18px/500/花・本文まで20px。既存Group/Columns、保存済み公式ico_blossom、H4 ownerを維持。#788 head416dcca44d8b82e884906a49d21c7c77e1bd17a6 は既存CSSを3engine×5幅・frontend/editor scope・直接/inner-container markup・長文で測定、SVG decodeとPNGを収集。Core Columns stack/実editor/実機は別QA、未マージ。
- 次READY: #787の実CSSOM/メディア条件→原因修正→CI、#788実CSS CI/PNG確認→必要なら修正→merge、Cursor CUR-04のWP版・標準タブ登録・実ACF編集/viewport設定編集、既存パーツの総合実WP QA（Group/Columnsの実stack含む）。本番Theme/ACF/URL/held page/スケジュール変更なし。CI待ちを実機PASSにしない。

### 2026-11-27 実測確定・独立PRのmerge
- #788 `416dcca44d8b82e884906a49d21c7c77e1bd17a6` CI3/3、CSS run46012129173/job140550016915 3engine×5幅=15/15（各front/editor CSS scope）、artifact15204467743 PC/SP×3engine計6 PNG確認。PCの画像はCore Columns CSSを含まないため縦積みであり、Figmaの2列完成証拠ではない。余白・H4・花・長文・枠のみ合格。merge `2b41a8fe6d40b4fd06c3fb2f43a22e4b9f7fbd19`。#789 docs CI2/2、非競合確認後 `6392ef20abad9cb6ec769cbef6d27037d2c18e98` へmerge。
- #787 diagnostics run46012005630/job140549610124: viewport481/client481、Core tablet matchMedia=true、native visibility style要素なし、実CSSOMにThemeの768/1024px旧条件のみ。所有元はfront/editor両方からimportされる `wp-block-hidden-style.css`。Core WP7.0.2の固定480/782pxを採用、Theme layout境界とglobal-styles抑制はそのまま。修正 e3c1523c、旧1023/1024も試験追加3a1d3fea、docs f8e1cd50。#787最新実WP/CSS/Guard/AuditとPNG確認まで未マージ。#785標準タブは別のバージョンgate。
- 次READY: #787 CIログ/画像→merge、native Group/Columnsの実WP二列/積み重ね・editor保存再編集と境界を検証。Cursor CUR-04（実ACF、WP版とタブ登録）・CUR-08（実canvas）に引継ぎ。TOP/ACF/owner/534:1706/スケジュールは無変更。


## 2026-11-27 継続 — 区切り線の実WordPress検証・添付リンク属性
- 開始 so b549e3e0。正式Figma skill、新規sessionでPC344:1134/SP442:2939、PC344:1027/SP442:2880の高精細context/画像。#793 head2bfc293e CI3/3、実WP run46018109894/job140570373863でseparator12/12、Gutenberg invalid0・段落編集保存再編集/front PASS。artifact15207771083から3engine×2幅の6 PNGを確認。merge 6ad4aa5f021effa634c4045d82113b4019002b41。PC fixture本文幅1156–1171pxでFigma960pxの厳密比較とは別、学校実環境・物理機・editor視覚未受入。
- 独立 #794 head690aa8e1: the_contentの旧正規表現がdata-target/data-hrefを誤認し既存relを重複追加し得る。既存WP_HTML_Tag_Processorを使用し、明示target・rel token・既存拡張子範囲を維持。実WP8ケース/idempotence、inlineリンク3engine×4幅・focus・保存再編集を追加。最新CI/PNG確認前は未マージ。URL query/大文字拡張子で既存CSSアイコンが判定を外す課題は別READY（front/editor両方のowner照合を先行）。
- 次READY: #794 CI実ログ/PNG/最新so/差分→安全merge、残るリンク/小ボタン/実editor CSS比較。#785 WP7.1+ gate、CUR-04実ACF、#664旧PR、#523/#524、534:1706保留・owner・scheduleは維持。TOPへは進まない。


## 2026-11-28 継続 — 添付リンクと大小ボタンのファイルアイコン
- 開始so 6ad4aa5f。#795 docs CI2/2、実ログ確認→c60dc25c7f165fb7524a32cb71b720f5bdaee0c0 merge。正式Figma skill、新規sessionでPC344:1027/SP442:2880、PC357:938/SP442:2908、PC344:969/SP442:2833の高精細context/画像確認。
- #794 initial head690aa8e1 run46021308174/job140581347195: 実WP属性8ケース・inline link11ケースはPASS、WebKit768のQA Details（index2）Escape後の同一frame中間状態待ち1秒でFAIL。原因を断定せず、Escape入力前に実ページrAF計測をarmし、高さ・open・inert・focusの同時条件を維持、失敗時に全frameの時系列と最終値を記録するテスト修正 ed96deeae8fa861199c36a12fe5c9d4ab43c8720。最新CI/画像確認前は未マージ。再発時はtraceに基づき実装/計測の原因を切り分け、条件緩和・skipはしない。
- 独立 #796 bc3d14c1964d320a2c7e5aa02b66b6d43abbc7c1: 既存の本文・大小ボタン拡張子selectorにASCII case-insensitive flag、file種別と外部SVG除外を揃えた。front/editor CSS scope・3engine×5幅で大小文字/PDF/添付/通常新窓を比較。既存小ボタンSP gap20pxは#622のCMS区別なしの判断を維持。新素材/配色/拡張子追加なし。URL pathを正確に解析できないCSS substringでqueryを対応したとはしない。CI/PNG未確認、未マージ。
- 次READY: #794/#796最新CI実ログ/PNG/最新soと非競合確認→安全merge。path query/fragmentのアイコン分類は通常ページのqueryに含まれる拡張子を誤認しない設計とfront/editor両方の既存ownerを調査。小ボタン長文・hover/focus/optical alignmentの実描画、CUR-04/08へ実ACF/実canvasを引継ぎ。#785 WP7.1+ gate、#664、#523/#524、534:1706、ACF・owner・スケジュール変更なし。


## 2026-11-28 継続 — 拡張子アイコンのmergeと小ボタンの操作QA
- 開始so c60dc25c。#796 head bc3d14c1 CI5/5、CSS run46024235475/job140591376048で15/15（front/editor CSS scope）、実WP run46024235433/job140591376036 Details36/36・editor invalid0/save/reopen/frontend PASS。artifact15211601525からPC/SP×3engineの6 PNG確認。merge dd71c19cbf34b4edf285f2c19a71569b54d812eb。#797 docs CI2/2→8c5b25de56754d9006e101ce46becf3ef4465ff1。公式Figma skill/sessionでPC344:1027/SP442:2880とPC344:969/SP442:2833のcontext/画像再取得。実canvas・物理端末未受入。
- #794 head ed96deea: run46024071055/job140590794609 属性8/inline11/Details30 PASS後WebKit768で失敗。診断catch内read()が別loopのscopeでReferenceErrorになりtrace出力不能。ef739bcdでreadMotion()と入力前状態・frame traceを修正し同じ受入条件を維持。根本原因は未確定、最新CI確認前にmergeしない。
- 次の独立QAは小ボタンの実CSS long text、30px円/8px gap、keyboard focus、hover色の両方向復帰、0.3s/reduced-motionを3engine×5幅で検証しPC/SP PNGを記録。既存SP gap20pxの#622判断は維持。本番CSS変更なし。query/fragmentの正確なpath分類は#794のfront.php ownerが解決してからfront/editor両scopeを設計。#785 WP7.1+ gate、#664、#523/#524、534:1706、ACF・owner・scheduleは維持。


## 2026-11-28 小ボタン合格・本文リンクhover改善

- 2026-11-28 continuation: start 8c5b25de, #798 head1f0e976 CI3/3, run46027241142/job140601687216 smallButtonInteraction15/15, artifact15212044206 6 PC/SP PNG inspected (stress copy; not exact Figma or school/editor acceptance), merged 8f9f19f1. Fresh official skill/session PC357:938/SP442:2908, PC344:969/SP442:2833 and PC344:1027/SP442:2880 context/images. #794 ef739bcd run46027145928/job140601358242 trace: WebKit375 first Details before Escape height192.765625 vs expanded193.1875, at6ms192.171875 then 30ms77 (closed), open=false/inert=true/focus restored; duration0.3s. Incomplete opening/reversal is a hypothesis, not proven root. 325af07f requires actual opening duration and stable frames before ordinary closing, then separately checks real closed state before reopening (no coalesced same-task toggles); latest CI pending. No skip/relaxed closing threshold. Inline link hover previously switched non-interpolable text-decoration-line despite color transition; new independent CSS uses transparent underline → currentColor with 0.3s decoration-color fade, immediate keyboard focus, reduced-motion none, unchanged glyphs and layout, 3engine×5width probe pending. Keep #785 WP7.1+ gate, #664, #523/#524, held 534:1706, CMS/owner/schedule unchanged. Next READY latest CI logs + actual PNG, #794 trace if failure, query/fragment path icon only after owner reconciliation.


## 2026-11-28 独立QA — 150/200%文字拡大
- #799 CI4/4、inlineLinkMotion15/15、artifact15219435028六PNG確認→6ef26723。#800 CI3/3、actual editor iframe1100/744で6 tokens空/見出し16px、front375/1380正常、artifact15219405231四PNG確認→c8ceca95（診断merge、意匠未受入）。#801 c0f9d347は既存editor entryをenqueue_block_assets/is_adminへ移す修正とstrict heading regression、CI待ち。
- 既存20px root単体rem試験と異なり、approved H2/H3/H4＋本文リンクの実CSSを150/200% root font（24/32px）、375/768/1380×3engine×2scaleで確認する。長文の実range rect、scroll/client、自然高さ、キーボードfocus、PC/SP stress PNG。実際のbrowser zoom、AT/物理端末、Gutenberg実canvasではない。PC357:995/998/1001、SP442:2771/2768/2765、PC344:1027/SP442:2880 fresh context/images照合済み。新規CSSや既存値変更なし、#801非競合。CI/PNG確認後に合格・修正判断。#523/#524、#785、#664、534:1706、owner/ACF/schedule維持。


## 2026-11-28 継続 — ページ内リンク合格・URL pathアイコン
- 開始so66e1f12。#805 head66ad0ff CI3/3 actual WP run46051913056/job140685050673 checkout30dd2e42、inPageRuntime9/9、Details36/36、Gutenberg invalid0/save/reopen/frontend PASS。artifact15225013071 inpage PC/SP×3engineの6 PNG確認。merge670ddef56898a006a1efb82d6abe4143a5b69274。ページ内リンク到着点はヘッダー下約30px、long fixtureのPC幅はFigma同一文言の視覚一致ではない。以前のWebKit早期collapseは再現しなかっただけで解決未確定。
- 新規公式Figma skill/session PC357:1022/SP442:2948・PC344:1027/SP442:2880・PC344:968/SP442:2842 context/画像。URLクエリ/fragmentでファイル末尾のCSS判定が誤るため、既存CSSのplain suffix fallbackを維持し、?/#入りだけ既存12種のglyph分類をURL.pathnameで解決する共有JSを追加。WP公式content hook https://developer.wordpress.org/block-editor/how-to-guides/enqueueing-assets-in-the-editor/ に従いfront/iframeへenqueue、href変更・追加nodeを追従、表示専用data属性のみ、PHP target/rel・CMS保存内容は不変更。通常クエリ末尾/fragment末尾の誤認防止、JS無効時はplain suffixのみfile glyph（複合URLのfile glyphはJS必要）。3engine×5width CSS、native inline+大ボタン、actual editorでmarker/save不汚染/外部SVG、PC/SP PNGの検証候補。#785のworkflow ownerを変更しない（今回front.php/CSS変更がCIを起動する。将来JS単独変更のpath triggerはowner調整後）。#664、#523/#524、534:1706、ACF/TOP/schedule unchanged。最新CI/PNG未確認、next READY 実結果とWebKit close transitioncancelの根本検証。


## 2026-11-28 #806 continuation — independent actual editor evidence
- Start so670ddef, official skill/new session PC344:1027/SP442:2880 and PC344:968/SP442:2842 context/screenshots reviewed. #806 head029e10d9 CI4/5, CSS run46054474355/job140693502504 fileIconCase15/15 incl href mutation; artifact15226126199 six PC/SP stress PNG reviewed (not Figma identical copy). Actual WP run46054474448/job140693502228 checked merge1d95c1fb: nativeFileLinks11/12 (WebKit768 then early stop), Details30/36; WebKit768 index0 expanded167.59375→167.453125 at2ms→77 at18ms; native open=false/inert=true/focus=true. In-page8/9, WebKit375 local stamp REST access control error reappears. Actual editor skipped, no merge. No evidence that new icon logic caused either existing intermittent defect.
- Change QA execution only: native parts output seeded=true after successful verified fixture seed, actual editor independently runs if setup/seed succeeded even when earlier browser steps fail; earlier failures still fail job. #785 held tabs workflow path inspected; its insertion before native parts is unchanged, reconcile on future WP7.1+ rebase. Add file-link-icons.js to runtime path trigger. Add actual ::details-content computed visibility/display/grid/durations/animation state and transitionrun/start/end/cancel/toggle trace (extra style reads can affect timing; diagnostic not root cause); preserve all existing thresholds. In-page logs exact stamp request/response/status/ACAO/failure and page URL when uncaught JS error occurs, no request credentials or suppression. WebKit bug290915 (https://bugs.webkit.org/show_bug.cgi?id=290915) and MDN content-visibility transition behavior (https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility) are related background, not evidence of same bug. No speculative production accordion/runtime owner change. Next READY actual editor path marker + save/reopen, trace comparison if early closure recurs; runtime stamp evidence for CUR-08. #523/#524, #664, #785 version gate, 534:1706, Foundation/ACF/TOP/schedule unchanged.
