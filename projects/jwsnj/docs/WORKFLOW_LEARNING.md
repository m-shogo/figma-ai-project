# jwsnj 作業運用の事例・学習記録（案件固有）

Status: PROJECT-ONLY EVIDENCE / Human feedback: 2026-11-20
正本: `CURRENT_AUTHORITY.md`、`SPEC.md`、`DESIGN_FOUNDATION.md`、`IMPLEMENTATION_CHECKLIST.md`、`../LEARNINGS.md`。

この文書はニュージャージー補習授業校の**実際の経緯、原因、証拠**を残す。**他の案件に適用する原則は** `../../../docs/agent-recurring-work-preflight.md` と `../../../docs/frontend-foundation-preflight.md` を参照。別案件に本案件の色値、フォント、Figma node、URL、コード規則、時間目標を流用しない。

## 実績・問題の再現（2026-11-20）

| 観測値 | 内容 |
|---|---|
| 案件 | `m-shogo/figma-ai-project` / `projects/jwsnj` / `so` |
| 実行タスク | 「ニュージャージー毎時実装」、毎時35分開始 |
| 対象実行 | 2026-11-20 19:32:57〜19:34:11 JST、約74秒（当該1回の記録） |
| Humanの期待 | 毎時の作業機会で、50分前後の密度を目指しつつ丁寧に進める。1時間に何単位も進めてよい |
| 実際の成果 | Figmaカラー変数10件を案件CSSに追加し、Foundation文書を更新。変更はPR [#487](https://github.com/m-shogo/figma-ai-project/pull/487) としてpush |
| 実際の不足 | CSSのブラウザ適用、WordPress実機、PC/SP視覚一致、フォント配信は未検証。次のfont/assets調査まで進まず1単位で終了 |
| Human FB | 「それだけで終わった事がきになるもっと作業出来なかった？」「1時間1単位じゃない 何単位もやっていい」「毎時がよくわかってないかも」「今回のカラーとかから設計先やるのも次の案件に活かせるように」 |

**注:** 約74秒はその回の実行記録であり、自動タスク全般の制限時間でも、常に74秒で終わるという意味でもない。毎時のスケジュールは起動頻度であり、毎回50分の稼働保証ではない。

## なぜ起きたか（今回の原因分析）

1. 1つの安全なコミット/PRに切る**変更粒度**を、毎時タスクの**作業回の上限**と取り違えた。
2. 共通Foundationの「色コードの収集→登録」を区切りにし、読み込み・表示QA・次のfont/asset工程まで続行しなかった。
3. 実行時間の制約と早期終了の判断を区別せず、作業量が少なかった理由を当初説明できなかった。
4. 毎時50分という希望を、実際にその時間実行したかの検証なしに、確保された実行時間のように受け取った。

## jwsnjでの再発防止と事前確認

- 最初に最新 `so`、open PR（とくにFoundation作業）、Figma正本、`DESIGN_FOUNDATION.md` とチェックシートを読む。既存成果を上書き・二重作成しない。
- **1コミット/PRは小さく、1回の毎時実行では複数単位を進める。** 1単位完了で止めず、次の独立・安全な作業を探索する。
- 新規実装順は **カラー・フォント・画像/SVG/アイコン・共通CSSの確認→必要分導入→実際の表示/動作QA→ヘッダー→フッター→一覧→パーツ集→詳細→固定→TOP**。コース紹介下層は保留。
- 導入済み≠コードに宣言しただけ。実際にCSSが読み込まれ、font weightが正しく表示され、assetが揃ったかを証拠付きPASS/FAIL/未検証で判定。
- CI待ちは次の独立した作業に移る。未確認のまま無理にmergeしない。
- 報告では実際の開始/終了時刻（取得できる場合）、成果、差分、CI・ブラウザ・WordPress QA、**今回なぜここで作業を終えたか**を記録。
- 今後の新たなHuman FBは `../LEARNINGS.md` と `IMPLEMENTATION_CHECKLIST.md` に追加し、W1–W10分類は増やさない。

## 今回と次回の境界

| jwsnjの実装契約として保持 | 次案件でも使える改善方法 |
|---|---|
| Figma fileKey `K3SANPVHIEerfYBQtM4lXF`、PC/SP node、具体的な色/フォント/素材 | Figmaの変数・asset・fontを**最初に確認**し、既存Themeと照合 |
| CODIAベースThemeをサンプルとして利用、ACF・PHP/JS/CSSの今回の規則 | **既存資産がサンプルか正本か**を開始時に判断し、流用条件を検証 |
| `nowrap`を使わない、通常テキスト行間`1.3`、150〜200%文字拡大専用QAは行わない | **可変の複数行とレイアウト耐性を考慮**。具体的な禁止や数字は次案件では再決定 |
| PC hover/SP click、CPTを追加しない、個別URLは保留 | デザイン・WordPress仕様を勝手に発明せず、Human決定と未決事項を分けて管理 |
| 毎時35分のタスク設定、当該実行約74秒という履歴 | **毎時は起動頻度**で実行時間保証ではない。小単位を複数積み重ねる |

### 更新の原則

案件固有の事実・失敗・測定値はこの文書、`DESIGN_FOUNDATION.md`、`LEARNINGS.md` に追加する。次案件へ移せる手法は共通文書へ提案・適用し、単発の経験則を自動で全案件に拡張しない。Humanが「今後の案件へ」と明示した方法については共通文書に**範囲付き**で記録する。新案件開始時は共通文書→新案件の正本→必要に応じ本事例の順に確認する。

## 案件に属する参考リンク

- [Figma・Theme Authority](CURRENT_AUTHORITY.md)
- [ニュージャージー案件のデザイン基盤（色・フォント・assetの実値）](DESIGN_FOUNDATION.md)
- [ニュージャージー案件の実装チェック](IMPLEMENTATION_CHECKLIST.md)
- [jwsnj PR #487（カラー変数の初期実装）](https://github.com/m-shogo/figma-ai-project/pull/487)

## 2026-11-25 共通UI点検を一巡した時の引継ぎ判断

- Figma skill→fresh session→PC/SPの個別高精細context/スクリーンショットを使い、問題の根拠があるsource修正だけ小PR/CI/merge。今回 #633〜#638 は独立修正として `so` に着地。新規サンプル文字やURLを発明せず、Figma外のCMS規則を追加しない。
- WP/ブラウザ不可は#523、未保存の一部公式assetは#524、未承認のサイト情報/スライダー/ページは別項目。静的QA完了→最終視覚受入PASSにしない。次のページは自動で始めず、最新Humanスコープ承認と既存PR #515のownerを確認する。


## 2026-11-25 記事一覧フェーズの開始

- Human承認を #515 の CURRENT_AUTHORITY に保存。旧Draftは最新soを第二親として安全に統合し、force pushなし。記事一覧・カテゴリ・pager・パンくずを先行、heroは別PR。#515のCI 3/3、一覧テスト4/4（PHP CLI stub含む）、既存parts87/87成功。実WordPress QA #523未検証。
- 次のREADYは同ページ内の公式装飾/下部バナー受入（#524）と実WP QA（#523）。バナーはFigma上に透かしあり、使用権確認済み原本が必要。記事詳細/固定/TOP/コースは未承認のまま。

- #640 hero（CI 3/3、一覧5/5）に続き、パンくずの一覧限定実装。静的CI/PHP stubと実WPを区別。以降の独立READYは公式バイトが必要な装飾/下部画像（#524）と実機QA（#523）で、他ページ承認がない間は新規ページへ進まない。


## 2026-11-25 全ページ包括承認
- Human「全部承認するから待たないでいい」をCURRENT_AUTHORITYへ記録。以降はページ単位の承認待ちをしない。実装・CI・競合確認と未確定素材/CMSの分離は維持。記事詳細→固定/サイドバー→TOP section→コース/オリジナルを優先順とし、安全な独立作業を連続する。


## 2026-11-26 ブラウザ引継ぎ実行
- 開始so 1727105、正式skill取得・新規session成功。#649 TOP Newsを静的CI3/3実ログ確認後にdf29806へmerge。MVの公式素材・PC/SP根拠を並行で確認しキャッチコピーの独立実装へ継続。実WordPress QA#523、素材受入#524はOPEN。スケジュール変更なし。

- #650 merged c0143aa after actual three CI job logs. Fresh News parent PC/SP context + image established sample event removal as independent work; no event CPT or SNS URL added. Next: TOP About independent approved content and CMS boundaries; #523/#524 remain OPEN.

- #651 merged 4e8261e after three actual CI job logs; About PC/SP parent and text child high-fidelity context/image then isolated fixed copy/map. Card destinations and shared background remain separate.

- New browser run start 801ddef (#652 merged), fresh skill/session. PC/SP News + Instagram panel connected without unconfirmed CTA; next READY: independent fixed For Applicants content and About background after exact asset/rights review; cards and Course CMS mapping separately.

- #653 merged 92581f7 after actual 3/3 CI logs. Next fixed For Applicants scope uses saved exact photos/icons without fake links, pending CTA mapping. READY next: About background (exact fills/crop), Course existing ACF mapping (do not invent field IDs); MV image structure after approved owner/motion review. #523/#524 remain OPEN.

- #654 merged 3ea01ee after three final CI logs. MV initial still uses existing ACF image IDs, no schema/data rewrite. Extra rows and motion/CTA contract remain pending; no new fake links. Next READY: About card CMS/destination mapping, Course editor mapping, shared background only after correct fill/rights/geometry evidence.

- #655 merged 3ac168d after final CI 3/3; initial test-only PHP quoting failure fixed with chr(34), no bypass. Course PC114:635/SP279:2336 read; no Course-specific ACF JSON in current theme; do not invent fields. About background PC220:56/SP279:2137 spans About/cards/Course, fill/crop and shared structure need confirmation. TOP banner PC114:419/SP279:2630 watermarked, no final photo until rights evidence; existing banner CMS safety repair separately. Next READY: confirm actual Course/CTA/links owner and MV motion reference/extra row semantics; About cards require approved images/destinations. #523/#524 remain OPEN.

- New browser run base 4f3aeb5 (#656 merged, 3 CI successes); fresh skill/session. Correct existing front-page priority conflict with posts index using existing index owner. No new CMS. Next: independent MV input validation and scoped source audit; About background asset mapping and Course schema still require evidence. #523/#524 OPEN.

- #657 merged 24cc417 after actual 3/3 CI logs. Fresh MV design reconfirmed; reject malformed attachment IDs without changing schema/slots. About background read-only Figma fill inspection: PC114:38/SP279:2138 each have same sole visible hash bda617bb2353903d9be480597619657682f9d95b (1586x992), hidden hashes 9df97ae73cc0da6595a07ce668edae9524e78796 (1586x992) and 7a7eee8cb62d7cee3d8fe5c3c909909975026a33 (3639x2276); PC visible crop transform [[0.690522,0,0.154739],[0,0.927200,0.072800]], SP [[0.122290,0,0.504239],[0,0.778415,0.221585]]. #600 saved three variants but no per-file Figma hash mapping in docs/contract; do not select by filename/size alone. READY after exact source mapping and shared About/Course structure. Course/CTA actual fields and URLs remain unconfirmed. #523/#524 open.

- New run base fc1908e (#659 merged 2/2 docs CI). Fresh official skill/session; course detail approved by latest CURRENT_AUTHORITY. Sparse parent 534:1282 resolved to section title child 609:3046/612:3095/612:3256 with actual screenshots. Opt-in native Group/Row style only; no CMS contract invented. Next independent READY: course fixed-content Gutenberg component where exact asset and owner available, otherwise await SP/field/page contract. About background and TOP Course/CTA mapping remain blocked. #523/#524 open.

- #660 merged c644a4b after 3/3 actual CI logs; existing native Group/Row style adds course bilingual section heading. Fresh PC FAQ closed612:3182/open612:3193 images show stable inset32; independent native details style reuses shared renderer, no CMS fields. Next: course feature illustrations and schedule assets/owner, SP course reference, and TOP pending CMS links. #523/#524 remain OPEN.

- New run base 86460bf (#661 merged, 3/3 CI). Fresh official skill/session; PC534:2369/534:2363 actual design images. Reuse course heading owner for introduction variant and native editable lead. SP page metadata has no course detail frame. Next READY: course independent exact illustration assets or approved grade label/text row; do not invent CMS or URL. #523/#524 open.

- #662 merged a95085e after all three actual CI logs. Fresh course grade row PC539:3627/534:2360/534:2357 context and images; opt-in Group/Row label and native List, no fixed data. Next independent READY: feature illustrations once exact official bytes are available, schedule structure once asset/owner evidence exists. SP course detail frame absent; #523/#524 open.

- Start 5c1e29a (#663 merged, 3/3 CI). Fresh official skill/session. TOP Course #664 is a separate unmerged PR, blocked by W9 explicit Human approval for ACF JSON; SPEC lists five business fields but no explicit JSON-change permission recorded. Do not treat broad all-page approval as override; no fake Human-Approved marker. Initial static test matched its own comment; branch follow-up fixes executable-code test and button focus at slider bounds. Keep #664 separate; after explicit permission reconcile base and rerun all CI. Independent existing TOP banner attachment validation uses fresh PC/SP evidence, no schema or visual change; this PR touches different production/test paths (docs append overlap to reconcile on #664 after approval). Next READY after new evidence: actual asset/links owner, approved JSON scope, #523 runtime. No schedule action.

- Start e4d734c (#665 merged 3/3 CI). #664 W9 pending unchanged, no reattempt or approval claim. Fresh official skill/session, course full screenshot and child context prove eight gray image rectangles, correcting earlier missing-photo diagnosis; native Group schedule style is independent of #664 and uses editor-owned optional photos without fallback. Next: course feature art/source and intro media/CTA mapping; actual SP reference absent. #523/#524 stay open. Shared doc append overlap with #664 to reconcile on approval.

- #666 merged d113c0e (3/3 actual CI). Follow-up native opt-in pattern reuses styles and exact eight Figma texts; no automatic page write or placeholder images. #664 W9 remains held. Next READY: native course introduction/feature layout once exact photo/illustration and CMS/page ownership confirmed. #523/#524 open.

- Human 2026-11-26 narrows all-page approval: PC534:1706 オリジナルページ and descendants BLOCKED_HUMAN until explicit release. Metadata confirms course PC534:1282 is a separate frame; continue approved independent work elsewhere. #664 remains W9 blocked; no new ACF approval inferred. Start 3e04c5c, #667 merged. Authority recorded in CURRENT_AUTHORITY.md.

- #668 merged 7c88bbf (2/2 CI). New authority excludes original PC534:1706 only. Fresh course PC539:3658/539:3628/534:2350 context and screenshots; compose editable intro layout/pattern from approved course design, no original-page changes. #664 remains W9; exact photo/CTA and page-level hero owner pending, #523/#524 open.

- Browser continuation base 56bef7b (#669 merged). Fresh official skill/session, PC FAQ 612:3259 and child images. Independent FAQ section/pattern reuses native Details; five hidden sample answers omitted, one visible editable example only. Original PC534:1706 held, #664 W9 blocked, #523/#524 open. Next READY requires actual course feature illustration bytes or verified independent source defect; course shell/CTA and TOP CMS remain separate.

- #670 merged 412eb61 after 3/3 actual CI logs. Next independent course page shell based on fresh full PC and intro/breadcrumb contexts; explicit page template, no automatic content or URLs. #664 remains W9 held; shared CSS import and doc appends must be reconciled on its eventual approval. Next READY: exact course feature illustration bytes/photo/CTA owner or verified independent defect; #523/#524 open, original PC534:1706 held. No schedule change.

- Start 8299c17 (#671 merged; 3/3 PR CI). #664 W9 held, #523/#524 OPEN/UNCLAIMED, original 534:1706 excluded. Fresh official Figma session confirmed schedule slots and feature art. Independent schedule source correction only; feature bytes still not in Git. Next READY requires exact asset transfer or independently evidenced source defect. No schedule/owner change.

- Start 3d5317f (#672 merged, 3/3 CI); fresh official Figma session, full course and individual intro/schedule contexts. Scope exact PC copy and schedule heading rhythm only. #664 W9 held, #523/#524 OPEN, original 534:1706 excluded. Feature/CTA/photo prerequisites unchanged; no new asset retry, no schedule action.

- Start 0fafaeb (#673 merged, 3/3 actual CI). Independent source defect: course H1 suppression matched any first intro Group even without its heading. Fresh PC534:2369 high-fidelity context/image confirms the visible heading belongs inside intro; narrow selector to authored heading H2:not(:empty). No title, CMS or Figma mutation. Browser computed visibility remains #523; #524 assets, #664 W9, and original PC534:1706 still held. No schedule action.

- Start 9e0a20d (#674 merged, 3/3 CI). Fresh official session and news single PC392:1279/SP480:3566 plus pager PC392:1740/SP480:3921 high-fidelity context and images. Independent defect: only-return state previously allocated an empty row and extra 40px gap on SP. Scope .back:only-child row1; all eight destination combinations covered by isolated PHP/static test. #664 W9 held, #523/#524 open, original 534:1706 excluded; no new assets, links, CMS or schedule action. Next READY requires actual new evidence or previously blocked asset/approval/runtime input; avoid repetitive cosmetic audit.

- Start ebfc3b7 (#675 merged, 3/3 CI). Fresh official Figma session and PC184:797/SP279:2172 context/images establish full MV slot geometry. Independent responsive image sizes improvement only: complete grid PC quarter/half and SP half/full hints, partial conservative, preserve WP attachment markup/auto/custom sizing and older-core fallback. No motion, CMS, assets or links changed. #664 W9 held; #523/#524 OPEN, original534:1706 held. Next READY requires new asset/approval/runtime input or demonstrated independent defect; no redundant asset retry.

- Human 2026-11-26: TOP MV should continuously loop right to left like https://www.osaka-kaisei.ac.jp/. Direction and loop intent confirmed; next READY is the independent MV motion implementation after reference behavior and existing image/grid ownership review. Speed/cycle and incomplete/extra row handling not specified. Preserve Figma PC184:797/SP279:2172, ACF and #676 responsive hints; runtime #523. This turn records authority only; no production motion change or schedule action.

- Start 3f43e08; #677 authority merged b62cdf4 after both CI logs. Fresh official design/motion guidance and session: PC184:797/SP279:2172 screenshots, no authored keyframes. Human clarified direction/loop. Implement independent complete-grid progressive motion, preserve #676 responsive hints and existing ACF, no CTA/extra-row schema. Reference actual speed and runtime acceptance pending #523. #664 W9 and original534:1706 held, #524 assets open; no schedule change.

- Human 2026-11-26 explicitly requires Swiper for slide/carousel implementations including continuous TOP MV. Base 3f84de3 (#678 merged); existing theme enqueues Swiper JS/CSS and home.js. Next READY: replace custom MV keyframes/controller with existing Swiper, preserve current Figma layout/ACF/responsive images/accessibility/fallback, verify continuous linear seam and real browser when available. This change records authority only; production migration not yet performed. No schedule action.

- Start 3f84de3; #679 authority merged 880d73e after both CI logs. Fresh Figma official skill/session PC/SP MV image/context and empty motion tracks; bundled Swiper 14.0.1 confirmed. Migrate #678 custom keyframes to Swiper-native loop/autoplay and scoped control, preserve ACF/sizes/fallback. Next READY requires new asset/approval/runtime input or independently proven defect; #664 W9, #523/#524 and original534:1706 held. No schedule action.

- Start ddf4a0d (#680 merged; three CI success). Fresh official skill/session PC184:797/SP279:2172 context/images. Bundled v14.0.1 source shows delay:0 schedules uncancelled next-frame slideNext; public disable guard rejects before loopFix. Move gap read to beforeResize because core updateSlides precedes ordinary resize handler. Keep pause/resume via native API. No new visual/CMS/assets. #664 remains W9 held; its native scroll snap proposal must be reconciled with Swiper authority only after unblock. #523/#524 and original534:1706 unchanged. Next READY requires new evidence or prerequisites; no repeated cosmetic audit.

- Start 6724531 (#681 merged, 3/3 CI). Fresh official Figma skill/session PC114:180/SP279:2318 and PC158:2645/SP279:2443 context/images. Independent fixed-copy rhythm: SP About title→lead 24px, lead→description 20px (was 24px both); PC 32/24px preserved. Applicants SP first topic icon/text gap 10px vs 16px elsewhere, SP right inset 16px vs left20; PC16px gap and 24/20px padding preserved. Existing official assets/copy and noninteractive unresolved topics unchanged. #523 runtime deferred; #664 W9, #524 and 534:1706 held. Next READY requires new evidence or prerequisites; no repeated cosmetic audit.

- Start 2b3e3d3 (#682 merged, prior 3/3 CI); fresh official skill/session and PC344:1139/SP442:3073 contexts/screenshots confirm slider image/caption only, no operation or CMS contract. #664 sole JWSNJ open PR; W9 failure actual log, #523/#524 OPEN/unassigned, Figma unresolved comments empty. No new independently actionable production scope. Update DESIGN_FOUNDATION remaining-work entry to distinguish merged source from old historical READY and actionable dependencies. No production, owner, Figma or schedule changes; no claim of runtime QA. Next READY: explicit W9 approval, exact official asset/URL delivery, runtime access or demonstrated new independent defect.

- Human 2026-11-26: defer new ACF/adapter work to Cursor; frontend first with development-only fixtures. Latest so c882b4e and #664 patch reviewed; fresh official PC114:635/SP279:2336 context and screenshots; five exact Course WebP paths and three decorative SVGs already stored and covered by asset contract. No need for dummy Course images. Next READY: reuse #664 display work on latest so, separate normalized input from data adapter, Swiper SP, preview fixture only; leave #664 branch and W9 untouched. Cursor integrates only needed schema/adapter diff, not wholesale stale PR. Other approved missing-asset sections can proceed with labeled QA-only placeholders. No production code or schedule changes in this authority update.

- Human 2026-11-26: all projects use class-local SP/base, PC/TB media and interaction/pseudo rules. #685 policy merged; #686/#687 migrated 12 distinct project CSS files, both 3/3 CI after updating the old news-last-child assertion to assert the 768px-only override. This pass adds normalize/header/contents. Existing rem breakpoints, declaration values and per-selector conditional declaration sequence retained; lightweight source comparison is not proof of global cascade or browser equivalence. Remaining: global_footer/global_navigation complex grouped rules, applicable blocks (buttonLink, details, gallery, group, hidden, inPageLink, media-text, navigation, tabs, table), modules (breadCrumb, dropdown, menu, newsCard, newsList, pager-01/02, search-01, searchList-01, table), and WordPress password/form exceptional contexts. Review scope and source order, keep justified cross-owner/reduced-motion rules and exclude vendor CSS. #523 real browser QA pending; no ACF/schema/asset/design changes. Do not mark all CSS done until shared CSS review/migration is complete.

- 2026-11-26 #688 continuation: latest so checked byte-identical for all five source paths relative to its original base. Carry forward isolated CSS layout-only commit and separate functional focus reset repair/test; original branch untouched. Remove global outline suppression; preserve UA fallback and owner-specific focus styles. Body minimum width/legacy theme geometry unchanged pending actual browser and Company contract. #523 open.

- 2026-11-26 CSS audit #696/#697/#698 merged: 186→187 static tests, global focus restored, original #688 superseded and closed, Stylelint actual 65 CSS/285 text file inventory, 12 unused source tokens and three duplicate declarations removed, About owner flattened preserving scope. Three-engine isolated CSS fixture pass (21 width cases) on Playwright1.65.1/Ubuntu24.04; actual WordPress and device QA separate. Deep nesting/specificity warnings remain as context-sensitive review candidates; never mass-autofix. Container/layer mechanism probes and 20px root/fallback checks are expanded separately, no production adoption without a consumer. Newer feature research recorded in shared CSS strategy. #523/#524 and original534:1706 held; Pro and school DB unknown.

- 2026-11-26 CSS owner locality: move uniquely scoped Footer brand/copy/font/details declarations and wide decorative extension, navigation search/close, WP responsive visibility and search result padding to owning blocks; remove redundant identical desktop grid-area and padding-block declarations. Keep shared menu hierarchy buckets and ordered open/hover/motion overrides where moving them could alter cascade. No design values, URLs, ACF or assets changed. Static contracts and isolated browser probe, not full WP visual equivalence.

- 2026-11-26 Human two-space migration: #703 shared contract, #704 56 CSS changed/60 reviewed, #699/#701 remaining five CSS migrated and full CI passed; #705 56 PHP/JS changed (ordinary HTML indentation only, protected heredoc/embedded script/style sources excluded, existing 2-space JS untouched). Formidable free plugin in disposable WP passed actual 18 checkbox/radio interactions across three engines/three widths; Pro upload and school production settings remain #523. Gutenberg gallery, in-page link, media-text and tabs owner-local responsive/hover scope; preserve original selector, values, explicit editor opt-out and grouped layout states. No ACF schema or design change.

- 2026-11-26: inherited module_menu/module_dropdown empty selector groups and completely empty 768px bucket removed; retained shared multi-level state/hover rules. Table cell SP padding and scroll wrapper variant grouped with their owners; separate desktop hint suppression is deliberately cross-owner (only data-jwsnj-table-hint), existing Stripe row alternation preserved. Button generic frontend-only hover must retain .block-editor_wrap scope and original ordering before small override, do not move into shared editor block; Footer/global nav dangling selector lists are live CSS, not empty placeholders, require computed-state comparison before changing. Two-space style retained, no color changes.

- 2026-11-26 #707 removed 561 lines in inherited module_menu/module_dropdown (no declaration removals), verified real CSS menu close/open/reclose and table padding/960px scroll/hint at 375/768/1380 in three engines; #708 deduplicated 18 entries within four live Header/Footer selector lists, preserving actual matches, and placed frontend-only button hover on owner without broadening editor scope. #709 reviewed literal inline code indentation and replaced mobile web app sample title with escaped WP identity. This pass moves navigation card PC grid/media/title/text and hover, password label/hover, breadcrumb hover to owners. Preserve grouped reduced-motion and state scopes and intentionally don't reinterpret old WP viewport policy. #523/#524 remain open; no ACF changes.

- 2026-11-26 #711 source CSS custom-property reference audit: 65 authored files, 74 definitions/registrations, 71 referenced names, one missing source definition without fallback (`--enText`, legacy numeric pagination), zero unused global-source candidates. Replace with existing English font token `--font-sansSerif-en`, already used by approved news archive pager; no new palette/font alias or color value. This is an intentional legacy font-family correction, not proof of production visual equivalence. External CMS/DB/JS definitions and per-element cascade are outside lexical audit. Runtime QA #523 remains.

- 2026-11-26 follow-up to #712: Details has only the rotating vertical icon stroke as an animated property; search-result text changes color (arrow inherits it); image/gallery zoom changes opacity and, for gallery, foreground/background. Bound transitions to those properties and co-locate motion reduction on each owner; retain existing hover/focus, geometry, palette, native details interaction and external/PDF icon variants. Added isolated three-engine probe for actual pseudo-element computed styles and keyboard open/close. CI and final WordPress/Figma acceptance are separate; #523/#524 remain open.

- 2026-11-26 chrome motion owner: Header hamburger only background-color/top/transform, Footer plus/minus only rotating ::after, and overlay only visibility/background-color. Keep visibility interpolation in both directions; remove open-state shorthand override and place reduced-duration on the actual overlay owner so open/close cannot reset it. Existing dimensions, breakpoints, palette, body state and ARIA/JS unchanged. Static regression coverage; actual site/runtime QA #523 remains.

- 2026-11-26 footer CSS owner locality: relocate existing PC/SP artwork visibility, grid placement, right-art child geometry, and desktop information/link flex bases to their matching class/variant. Preserve exact specificity, selector scope, widths, aspect ratios and 1080px breakpoint. Keep multi-owner sitemap state/cascade separate. Extend existing three-engine CSS fixture across 375/768/1079/1080/1380; no new Figma or production acceptance claimed.
