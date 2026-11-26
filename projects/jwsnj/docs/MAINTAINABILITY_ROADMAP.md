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
