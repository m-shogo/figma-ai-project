# AGENTS.md

このrepoを扱うAI agent共通の最上位規約。

詳細仕様はcanonical docsを正本とし、このファイルへ同じ説明を重複させすぎない。

## Mission

既に決まっているFigmaのPC/SPデザインを、Codex / Claude Code / Cursor等で**高いFirst-pass Fidelity・低いRework・高い再現性**で実装できる工程へ改善する。

Reference designそのものはこのrepoが決めない。Figma/AIの新機能は、その3つを上げるものだけ RETEST する。Figma製品の全部を追わない。

## Knowledge placement / standing memory

Human Authority 2026-09-04 以降、**この Git repository が全 AI の standing memory** である。Cursor / Claude Code / Codex / Copilot のどれで作業しても、同じ正本を読む。

portable な Human-approved contract の置き場所:

```text
共通の短い契約 → AGENTS.md
詳細 → canonical docs
案件固有 Current Authority → projects/<slug>/docs/（研究 run は experiments/<case>/）
機械可読 invariant → config/*.yaml + tests
```

Human が「これが正本」と決めた**確定仕様・運用契約**は、その scope の Git へすぐ書く。案件固有なら `projects/<slug>/docs/`（研究 run は `experiments/<case>/`）。全案件に直ちに適用することを明示した確定契約なら `AGENTS.md` の短い routing と canonical doc。**「次案件にも活かしたい」という改善仮説は確定した全案件ルールではない**ため、まず証拠と検証候補として案件側へ記録し、知識昇格手順を経る。client adapter へ複製しない。

案件（納品物）は 1 案件 1 フォルダ `projects/<slug>/`（`theme/` `qa/` `docs/` `runtime.env` `LEARNINGS.md`）。共通の Docker 実行環境は `runtime/wordpress/` で、案件ファイルを置かない。起動は `.\wp.ps1 up <slug>`。構成と案件の閉じ方は `projects/README.md`。`projects/` の変更は `scripts/project-guard.mjs`（commit-msg hook / 作業終了 hook / CI）が機械的に検査する。Human の例外はコミットの `Human-Approved:` で明示し、guard を `--no-verify` で飛ばさない。

Agent の観察・1回の成功/失敗は、いきなり `AGENTS.md` / Company Policy へ上げない。

```text
project learning log
→ research/frontend-learning-evidence*.yaml
→ CANDIDATE
→ 期限付き review（自動昇格しない）
→ ACTIVE / PROJECT_ONLY / DEPRECATED / RETIRED
```

`auto_promotion` は false。レビューが due でも canonical を書き換えない。正本は `docs/knowledge-promotion.md` と `docs/frontend-learning-promotion-cadence.md`。

Canonical: `docs/agent-adapters.md`

### Common vs project-specific learnings（開始時とFB発生時）

- **共通 `docs/`**: 案件が変わっても有効な「調査→設計→実装→検証」「毎時の起動と稼働時間の区別」「複数の小さな変更を継続」などの**手順と判断基準**。移植可能な範囲・例外・初回チェックを明記する。
- **案件 `projects/<slug>/docs/` / `LEARNINGS.md`**: Figma fileKey/node、具体的なカラー・フォント/素材、Theme/ACF/URL、Humanの個別指示、実行時刻/問題の再現・コミット・PR。別案件へ値や禁止事項を自動コピーしない。
- **確立済みの基礎知識は最初から共通default（Human 2026-11-25）**。Web標準・長年の設計実務に裏付けられたHTML/CSS/JS、アクセシビリティ、デザイン基礎（視覚的整列、階層、近接、余白、タイポグラフィ等）は、独自の複数案件実験を待たず適用する。未確立の技法、特定案件の値・例外、AI独自手順の効果主張だけは学習昇格の検証対象。基礎知識の採用と、その案件の実装が正しいかのQAは別。
- 新しい失敗はまず案件で「原因→対策→QA証拠」を蓄積する。「次案件でも使えそう」「次に活かして」というHumanの意向は**横断検証の優先希望**であって、それだけで実証済み共通ルールにはならない。複数run・別画面・別案件での再現性、例外、既存ルールとの重複、運用上の効果を調べ、`docs/knowledge-promotion.md` の根拠とレビューを満たしたものだけ適用範囲付きで昇格する。Humanが今すぐの全案件適用を**明確に確定した運用契約**はこの経験則の昇格とは区別する。

Canonical: `docs/agent-recurring-work-preflight.md` / `docs/frontend-foundation-preflight.md`

## Scheduled / recurring implementation — 新チャット・新案件の開始時チェック

毎時/定期的な実装を依頼・引き継ぐ場合、**作業を始める前に** `docs/agent-recurring-work-preflight.md` を読み、Userの期待と実行環境・直近の実績が一致するか確認する。「毎時」=起動頻度であり50分稼働の保証ではない。「1単位」=小さな安全な変更/コミットの粒度であり、1時間の上限ではない。**1回に複数単位進めてよい**。誤解や実行時間と成果の乖離があればHumanが指摘する前、初回preflight時にこちらから説明・改善する。GitHubの正本/前回の成果・open PR・並行ownerを確認し、検証済み作業を繰り返さない。案件固有の仕様・予定は再確認してから扱う。

Canonical: `docs/agent-recurring-work-preflight.md`

**FigmaからWebの新案件を始めるとき**は、個別パーツの実装前にカラー・フォント・画像・SVG・アイコン・余白・breakpoint・共通部品を既存コードと照合し、不足するFoundationを先に導入・検証する（既存FoundationがVERIFIEDなら再作成しない）。案件ごとのデザイン値を他案件に流用しない。詳細: `docs/frontend-foundation-preflight.md`。

## Execution speed / agent ownership

複数Agent運用では、同じwrite scopeを二重実装・二重調査しない。

作業開始時にlatest base / current branch / open PR / active ownerを確認し、既にClaude Code / Codex / Code系Agentが実装を所有している場合は、その成果を引き継いでlatestとの差分だけを処理する。

ユーザーが明示的に「これが正本」「消していい」「これで完成」「それ以外修正なし」「マスター権限で廃止してよい」と決定したproject-local contractは、security / Company Policy hard constraint / protected scopeに反しない限り、staleなactive test・validator・CI・fixture・legacy implementationより上位のCurrent Authorityとして扱う。

- Current Authorityと矛盾する旧contractを守るためにproduction codeを複雑化しない。
- Scope外failureは、今回の変更が原因でないことを1回確認したら追跡を打ち切る。
- Human-approved Visualは`VISUAL_FROZEN`として扱い、integrationを理由に勝手にredesignしない。
- 既存QAで証明できることのために新しい恒久validator / workflowを増やさない。
- 同じ原因で2回詰まったら同じ方法を繰り返さずrouteを変える。
- HumanのMaster Authority 1つで互換調査・legacy維持を大幅に省けるなら、遠回りを始める前に短くHumanへescalateする。
- repoを読めば解決するroutine implementation decisionはHumanへ丸投げしない。
- Human がよく指摘する欠落（閉じ状態だけ、hover/open 未操作、暗幕の穴、family の取りこぼし）は **言われる前に** `docs/agent-human-fb-weak-spots.md` を自分で回す。静止画1枚で完了と言わない。

Canonical: `docs/agent-execution-policy.md` / `docs/agent-human-fb-weak-spots.md`

## Source of truth / authority

Visual/design source of truth:

```text
FIGMA REFERENCE
```

Technical authorityは単純な1本順位表へ押し込まない。

```text
Company hard constraints
↓
Existing Codebase / Design System = baseline
↔ Explicit authorized Project/Owner override
↓
Effective Project Contract

Implementation evidence = actual Figma structure / annotation / interaction
Frontend Standard = fallback decision framework
Agent inference = last
```

Company Policyはbrowser/device support、reset/base/environment CSS、breakpoints、approved libraries、folder/CMS/ACF、interaction、images、visual tolerance等の最上位technical hard constraint。

Existing Codebase / Design Systemは必ず先に読むbaseline。ただしCompany/security/protected scopeに反しない明示Project/Owner decisionは、対象scopeのstale Existing implementation/test/validator/fixtureを更新・廃止できる。

Company PolicyまたはEffective Project ContractとFigma visual/behaviorが衝突したら、勝手にredesignせず`CONFLICT`として記録する。

Reference未提示ならdesignを発明しない。

**デザイン実装の基礎原則は全案件でHumanの指摘を待たず適用する（Human 2026-11-25）。** 視覚的整列、タイポグラフィ、階層、余白、色、形、素材、操作状態等の意図をFigmaから読み、実描画で照合する。`docs/frontend-quick-contract.md` §3.1 と `docs/frontend-implementation-standard.md` §3.1 を着手・受入時に読む。具体値・補正量は案件ごとに決め、Figmaを勝手にredesignしない。静的PASSだけでは視覚PASSではない。

Frontendの保守性・layout decisionについてEffective Project Contract/Figma evidenceで未確定な部分は、`docs/frontend-quick-contract.md`を短い共通defaultとして読む。詳細は`docs/frontend-implementation-standard.md`へ進む。Frontend StandardはCompany hard constraint、Effective Project Contract、Figma visual truthを上書きしない。

Canonical:

- `docs/frontend-authority-model.md`
- `docs/company-policy-contract.md`
- `docs/device-environment-policy.md`
- `docs/frontend-quick-contract.md`
- `docs/frontend-implementation-standard.md`

## Production default

```text
Scheduled Official Update Radar
→ Company Policy ACTIVE + SHA-256
→ Required Environment Profiles
→ Reference Freeze
→ Existing Codebase / Compatibility Reconnaissance
→ Effective Environment Contract DRAFT
→ Global Figma Capability Profile
→ Shared Contract DRAFT
→ Section Discovery / PC-SP Mapping
→ Per-section Figma Structure Profile
→ Component / Token / Interaction Resolution
→ Shared Foundation Build + Verify
→ Environment Contract RESOLVED
→ Shared Contract FROZEN + Company Policy SHA-256
→ Safe Wave Planning
→ Isolated / singleton serial-safe SECTION Workers
→ SECTION Capture in canonical + material-difference environments
→ BOUNDARY / CLUSTER Capture
→ Coordinator INTEGRATION
→ FULL PAGE capture for ALL REQUIRED environments
→ Relevant interaction QA for ALL relevant REQUIRED environments
→ Targeted Repair
→ Targeted Frontend Maintainability QA where relevant
→ Clean Replay
→ Knowledge Promotion
```

Productionはsection-first。Whole-page one-shotは永久禁止ではなく`PAGE_BENCHMARK`として能力変化を再検証する。

Canonical:

- `docs/workflow.md`
- `docs/section-execution.md`
- `docs/section-integration-ladder.md`

## Device / browser environment rule

`PC / SP`やviewport widthだけでdevice behaviorを決めない。

Company Policyの`browser_support.environment_profiles`で対応対象を定義し、Shared Contractの`environment_contract`で今回案件のeffective ruleへ解決する。

Profile identityは必要に応じて:

- OS/browser/engine/WebView
- CSS viewport/DPR
- primary/any hover/pointer
- touch
- safe-area
- dynamic viewport
- virtual keyboard
- user preference state
- output capability
- real-device/emulation QA policy

を含む。

Runtimeは原則:

```text
capability / feature detection
→ Required Environment QA
→ proven browser-specific fix
```

Widthだけでhover/touchを推測しない。UA sniffingはCompany Policyで許可されたcompatibility fix等に限定する。

Canonical: `docs/device-environment-policy.md`

## CSS foundation / reset

Deviceごとにreset.css全文を複製することをdefaultにしない。

Logical foundation:

```text
reset
→ base
→ environment adaptation
→ tokens / shared primitives
```

Existing/company foundationを最優先する。

Environment adaptationには必要に応じて:

- hover/pointer
- reduced motion
- safe area
- `svh/lvh/dvh`
- visual viewport / software keyboard
- touch gesture policy
- scroll lock
- forced colors/contrast
- browser-specific proven fixes

を置く。

Shared foundationはSection workerが勝手に変更しない。

## Frontend implementation / human maintainability

Frontend実装では、特定propertyを使わないこと自体を目的にしない。

- `absolute` / fixed dimensions / `min-*`等は禁止ではない。Intentとownershipで判断する。
- Figmaのrendered座標/section寸法を、その理由だけでWeb constraintへ直写ししない。
- 通常contentはFlow/Flex/Grid等content changeへ追従できるlayoutを先に検討し、Hero artwork等のart directionではabsoluteを普通に使える。
- 状態変化で箱をずらさない。hover/focus で初めて `border-width` / padding / 寸法を足さない。rest から同じ太さを確保し、状態では色・塗り・`transform` を変える。
- interactive に transition が無ければ Existing duration、無ければ `0.3s`。`::before` / `::after` も含む。
- `l- / c- / p- / is-` + BEM系のowner/searchabilityを、Company/Existing命名が無い場合のstable contractとして扱う。
- **Human確定 2026-11-26（全案件）:** BEM selectorはflatをdefaultにし、SP/base・PC/TBの`@media`・hover/focus/state・疑似要素を該当する最小のowner selector blockへ同居させる。親block末尾やファイル末尾に子classのbreakpoint bucketを作らない。既存CSSも対象scopeで整理し、カスケード・詳細度・条件・見た目を維持。外部/vendor CSSと環境非対応の例外は `docs/frontend-quick-contract.md` §7 に従う。
- 1 Block/Elementにはauthoritative base ownerを持たせ、末尾`final-fix`を積み上げない。Media/container/supports等の正当なcontextual ruleまで単純duplicate扱いしない。
- 同じformatのcontentは将来repeatable/data-drivenになる可能性を確認するが、CMS化自体を強制しない。
- Sectionのcontent risk factors / repeatability / interaction / performance riskから必要なMutation QAだけ選ぶ。全Fuzzを毎PR強制しない。
- Visual FidelityだけでなくFindability、Content/Responsive resilience、Interaction/A11y、Performance/LoadingをRelevant scopeでFINAL条件にする。

Canonical:

- `docs/frontend-quick-contract.md`
- `docs/frontend-implementation-standard.md`
- `docs/frontend-repeatable-content.md`
- `docs/frontend-maintainability-qa.md`
- `docs/frontend-resilience-stress-qa.md`
- `docs/frontend-pattern-library.md`
- `config/frontend-implementation-policy.yaml`

## Epistemic states

- `UNKNOWN` — まだ十分に調査していない
- `NONE` — 調査した結果、存在しない
- `UNDETERMINED` — 調査したが現在のtool/API/client/権限では確定不能

UNDETERMINEDをNONE扱いしない。永久blockにせずconservative strategy + future retest対象にする。

## Actual Figma first, generic best practice second

Components / Variables / Auto Layout / semantic naming / Code Connect / annotations / assets / prototype interactionsを使っていると仮定しない。

実referenceをprofile化し、Company Policyとtarget codebaseを先に読んだうえで実装方法を選ぶ。

Canonical:

- `docs/figma-capability-profile.md`
- `docs/figma-structure-profiling.md`
- `docs/component-resolution.md`
- `docs/token-mapping.md`
- `docs/figma-instruction-evidence.md`

## Figma instructions / comments / interactions

- Dev Mode annotationsをimplementation evidenceとして読む
- prototype interactions/reactionsからhover/click/state/transitionを読む
- comments accessがある場合はcomment pin/locationも読む
- commentsは`SECTION / BOUNDARY / GLOBAL / UNKNOWN`へmappingする
- boundary/global commentをlocal Sectionへ押し込まない
- resolved/stale commentを自動で現仕様化しない

## Shared / Environment Contract

Parallel開始前にShared Contract/Foundationをfreezeする。

FROZEN Shared Contractは:

- ACTIVE Company Policy path + SHA-256
- RESOLVED Environment Contract
- exact REQUIRED environment ids
- canonical environment id
- effective per-profile overrides

を持つ。

Workerがshared/environment変更を必要としたら`PROPOSE_SHARED_CHANGE` / environment exception proposalとしてCoordinatorへ返す。

異なるCompany Policy/Environment Contract/Shared Contract/Foundation lineageのoutputを同条件として混ぜない。

## Breakpoints / input capabilities

Company/browser matrix/design system/existing productのbreakpoint指定を最優先する。

AIが慣習値やSection固有thresholdを勝手に追加しない。

Breakpointはlayout boundary。Hover/touch/pointer availabilityとは別軸。

必要なら`PROPOSE_BREAKPOINT_EXCEPTION`。

Browser supportは:

- Browserslist/query
- explicit minimums / exceptional WebViews
- REQUIRED Environment Profiles
- real QA browser/device matrix

で管理する。

## Web interaction defaults

Company/Existingに指定が無い場合のみcurrent candidateを使う。

- anchor smooth scroll: native CSS first + reduced motion + fixed-header offset
- cinematic/controlled scroll: native smooth scrollと別契約
- hover: hover/pointer capability gate + keyboard focus equivalent + touch fallback。状態で border-width を新設して箱をずらさない。ネガポジは塗りと文字、rest 枠は残す。テキストリンク当たりは文字幅。disabled に enabled 箱を出さない
- hamburger: site navigationはDisclosure patternがdefault。Figma が暗幕+パネルなら暗幕は viewport 全体・パネルはその上・ヘッダーは消さず覆う。閉じは開いた形のまま transform。詳細は `docs/frontend-quick-contract.md` 節4
- carousel simple: CSS Scroll Snap candidate
- carousel complex: existing/approved specialist library
- autoplay: default off;必要時はpause/focus/hover/reduced-motion/keyboard対応
- simple animation: CSS
- framework motion: existing layer first
- complex scroll choreography: approved specialist library
- browser touch gesturesをdefaultで保持
- `touch-action:none`はevidence必須
- `overscroll-behavior`を万能scroll-lock扱いしない

Canonical: `docs/web-interaction-policy.md`

## WordPress / ACF

「Figmaを全部ACF化」しない。

Editor-owned content/configのみCMS dataへする。

ArchitectureはClassic / Block / Hybridと既存projectを先に判定する。

Section Implementation Unitはstackへ合わせる:

- React component
- WordPress template part/include
- ACF Block/native block
- existing equivalent

提供Themeがある案件では、Themeを観測するまでtheme-relativeな構造を確定しない。

案件の Current Authority / Theme rules / Directory map は `projects/<slug>/docs/` の Git 正本を読む。Budokan WordPress なら:

- `projects/nipponbudokan/docs/CURRENT_AUTHORITY.md`
- `projects/nipponbudokan/docs/THEME_RULES.md`
- `projects/nipponbudokan/docs/DIRECTORY_MAP.md`

Local WP runtime は php.ini デフォルト 2M のまま起動しない。正本は `runtime/wordpress/README.md` と `php/conf.d/99-local-limits.ini`。

既存フィールド契約に無い ACF / CPT / スラッグを発明しない。契約に無い開催日・募集ステータス等は fail-closed。

流用しうる template part は `body.home` 等のページ身元で出さず、呼び出し側の明示パラメーターにする。ページ専用で変動しないものだけ `is_front_page()` / `is_home()` でよい。

Canonical:

- `docs/wordpress-acf-policy.md`
- `docs/wordpress-theme-intake.md`
- `runtime/wordpress/README.md`

## Images / gradients / visual tolerance

- exact source assetを優先
- Theme / LP / HTML を問わず、Figma からの納品形式は **写真・ラスター fill → WebP**、**logo / icon（ベクター）→ 文字・stroke を path にした SVG**
- 短命 Figma URL は直貼りしない。ラスターしか無い logo は SVG をトレースしない（そのときは WebP）
- responsive imageとart directionを分ける
- Figma gradientはstructured paint/stops/handles/opacity/blendを先に読む
- screenshot目測gradientはlast resort
- universal `2pxまでOK` ruleを使わない
- hard geometryは厳しく、typography/raster/effectはcategory-awareに評価
- repeated 1–2px driftはsystemic failure signal
- browser/OS/DPRが違うraw screenshot同士を同一pixel-perfect基準でrankingしない

Canonical:

- `docs/image-gradient-visual-tolerance.md`
- `config/frontend-raster-asset-export-policy.yaml`

## Section discovery / integration

人間に毎回node URLを切り出させることをdefaultにしない。

Figma metadata/contextからlogical Sectionを発見し、PC/SPをmulti-signal mappingする。

Section単体完成だけでPASSにしない。

Evidence ladder:

```text
SECTION
→ adjacent BOUNDARY
→ high-coupling CLUSTER when needed
→ FULL PAGE
```

Environment QA:

- canonical profile: detailed Section/Boundary/Cluster/Full Page
- other REQUIRED profile: material differenceがあるSection/Boundary/Clusterだけ追加
- ALL REQUIRED profiles: Full Page
- ALL relevant REQUIRED profiles: relevant interactions

Cumulative `S01+S02+...` captureはsticky/vertical rhythm/scroll dependency等で価値がある場合に追加する。

## Capture identity

Screenshot evidenceはviewportだけで識別しない。

最低限:

- environment profile id
- actual browser/version
- OS/version
- engine/WebView
- CSS viewport
- DPR
- zoom/text scale
- input state
- preference states
- scope/target id

をRun Recordへ保存する。

同じ390pxでもiPhone Safari / Android Chrome / desktop browser emulationを同一Evidenceとして扱わない。

## Safe parallelism

最大並列数をKPIにしない。

分離条件:

- dependency
- write-scope overlap
- HIGH integration coupling
- unknown write scope
- LOW boundary confidence
- LOW PC/SP mapping confidence

同時workerは同じworking tree/isolation refを共有しない。

`SERIAL_SHARED_TREE`はsingleton execution waveのみ許可可能。複数Sectionの同時実行には使わない。

## Styling

既存target repoのstyle architectureを最優先する。SCSSは前提にしない。全案件のCSS品質・互換性・保守性は `docs/css-strategy.md` の CSS quality gate を着手/差分review時に確認する。Project GuardのCSS警告は理由を確認し、Stylelintは既存toolchain優先で導入・検証する（vendor/generated、Company固有契約を尊重）。

新規React/Next/Vite系で既存規約が無い場合のcurrent candidate:

```text
CSS Modules
+ native CSS
+ CSS Custom Properties
```

これは永久standardではない。

## Update-aware rule

Significant production runで、人間またはagentが毎回release notesを手動検索することをdefaultにしない。

通常経路:

```text
Scheduled Official Update Radar
→ validate_update_sources.py
→ daily official-source snapshot
→ apply_radar_preflight.py
→ start_section_run.py
```

Preflightは少なくとも:

- Radar freshness / SHA-256
- Figma release source
- Figma MCP source
- MCP
- Web Platform
- Accessibility
- actual agent lane
- Company Policy Required Environmentに対応するbrowser-specific lane

を自動確認する。

Current freshness defaultは36 hours。Required official lane取得不能はfail-closed。

Global snapshot全体をそのままRETESTへ流さず、`changes_relevant_to_run → rules_to_retest`でrunごとに絞る。

Community/practitioner searchはoptional discoveryでありproduction start gateではない。Community signalは仮説化し、local experiment / clean replayなしでCompany Policyへ昇格させない。

Required browser major / OS major / relevant web-platform changeはRETEST候補になりうる。

古いlimitation/workaroundを自動で現在へ適用しない。関連upstream changeがあれば`RETEST_CANDIDATE`として再試験する。

Canonical:

- `docs/update-preflight.md`
- `docs/research-radar.md`

## Evidence maturity

1回の成功/失敗を永久truthにしない。

```text
E0 External Signal
→ E1 Local Observation
→ E2 Clean Replay
→ E3 Cross-run / Agent
→ E4 Cross-reference
→ E5 Portable Proven
```

## Run scopes

- `SECTION`
- `INTEGRATION`
- `PAGE_BENCHMARK`

COMMON比較では可能な限りsame Company Policy / Required Environment IDs / reference / section / Structure Profile / Shared Contract / foundation / assets / viewport / context / repair budgetを揃える。

## Mandatory evidence

FIRST_PASSを消さない。

最低限:

- Company Policy / Environment Contract / Reference / Contract lineage
- Section id/node
- Structure Profile revision
- foundation commit
- isolation identity
- prompt/context/tool/model version
- Capture environment runtime fingerprint
- SECTION capture
- BOUNDARY/CLUSTER capture where required
- Full Page evidence for ALL REQUIRED environments at Integration completion
- failures/repairs/assumptions
- clean replay result

## Do not

- reference無しでdesignを作る
- Figma製品の新機能を、First-pass Fidelity / Rework / 再現性に効かないのに追う
- Company PolicyをFigma/AI inferenceで上書きする
- Company/Figma conflictを黙って解決する
- viewport widthだけでdevice/input capabilityを決める
- deviceごとにreset全文を無根拠複製する
- Required Environment Profileを勝手に省く
- captureのbrowser/OS/DPR identityを省略する
- structured Figmaが読めるのにscreenshotだけで決める
- UNKNOWN/UNDETERMINEDをNONE扱いする
- company breakpoint/browser ruleをAI判断で置換する
- comments/annotations/interactionsを読めるのに無視する
- section workerがshared filesを勝手に変更する
- LOW-confidence sectionを無検証で並列化する
- Verify前にFIRST_PASSを上書きする
- hoverだけに重要情報を置く
- hover で初めて border を足して箱をずらす
- 閉じ状態・静止画だけで UI 完了と言う。現行 Figma の hover / open / overlay を Human 待ちする
- Human が繰り返す欠落種類を、言われるまで実装チェックから外す
- complex carouselを毎回hand-rollする
- all animationを1libraryへ寄せる
- ACF fieldへdesign tokens/layout valuesを無条件に移す
- exact image sourceがあるのにAI再生成する
- Figma の写真・ラスター fill を JPEG / PNG のまま納品する
- ベクター logo / icon をアウトライン化せずに残す、またはラスター logo をトレースして偽 SVG にする
- 短命 Figma URL を実装へ直貼りする
- portable な Human-approved contract を `.cursor/rules` / chat memory だけに置く
- 1–2px magic numberでroot causeを隠す
- 1回成功をbest practiceにする
- 1回失敗を永久禁止にする
- upstream newsだけでCompany Policy/Playbookを書き換える
- production開始前の手動community scanを必須化する

## CI

Machine-readable contractsは`.github/workflows/validate-research.yml`で検証する。

ValidationにはUpdate Radar source registry、Company Policy、Environment Contract、capture environment lineage等を含める。

Repository-level entrypoint:

```text
python scripts/check_repository_readiness.py
```

Validationはtoolを永久固定するためではなく、**Company Policy・Environment Contract・experiment lineage・再現条件を壊さないため**に使う。

## Future

実験で必要性が確認できたらDashboard/Workbenchへ:

- Company Policy editor
- Environment Profile / device-browser matrix editor
- Effective Rule / Conflict view
- Section → Boundary → Page Evidence Tree
- per-environment capture matrix
- visual diff
- AI visual review
- update/retest radar

を実装する。

Dashboard UIは実runのpainが3–5件程度見えてから作る。Company Policy / Environment Contract自体はproduction前提なので先に整備してよい。
