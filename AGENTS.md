# AGENTS.md

このrepoを扱うAI agent共通の最上位規約。

詳細仕様はcanonical docsを正本とし、このファイルへ同じ説明を重複させすぎない。

## Mission

既に決まっているFigmaのPC/SPデザインを、Codex / Claude Code / Cursor等で**高いFirst-pass Fidelity・低いRework・高い再現性**で実装できる工程へ改善する。

Reference designそのものはこのrepoが決めない。

## Source of truth / precedence

Visual/design source of truth:

```text
FIGMA REFERENCE
```

Technical implementation precedence:

```text
COMPANY POLICY
→ EXISTING CODEBASE / DESIGN SYSTEM
→ FIGMA IMPLEMENTATION EVIDENCE
→ AGENT INFERENCE
```

Company Policyはbrowser/device support、reset/base/environment CSS、breakpoints、approved libraries、folder/CMS/ACF、interaction、images、visual tolerance等の最上位technical constraint。

Company PolicyとFigma visual/behaviorが衝突したら、勝手にredesignせず`CONFLICT`として記録する。

Reference未提示ならdesignを発明しない。

Canonical:

- `docs/company-policy-contract.md`
- `docs/device-environment-policy.md`

## Production default

```text
Update Preflight
→ Company Policy ACTIVE + Required Environment Profiles
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
→ Isolated SECTION Workers
→ SECTION Capture in canonical + material-difference environments
→ BOUNDARY / CLUSTER Capture
→ Coordinator INTEGRATION
→ FULL PAGE capture for ALL REQUIRED environments
→ Relevant interaction QA for ALL relevant REQUIRED environments
→ Targeted Repair
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
- hover: hover/pointer capability gate + keyboard focus equivalent + touch fallback
- hamburger: site navigationはDisclosure patternがdefault
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

Canonical: `docs/wordpress-acf-policy.md`

## Images / gradients / visual tolerance

- exact source assetを優先
- responsive imageとart directionを分ける
- Figma gradientはstructured paint/stops/handles/opacity/blendを先に読む
- screenshot目測gradientはlast resort
- universal `2pxまでOK` ruleを使わない
- hard geometryは厳しく、typography/raster/effectはcategory-awareに評価
- repeated 1–2px driftはsystemic failure signal
- browser/OS/DPRが違うraw screenshot同士を同一pixel-perfect基準でrankingしない

Canonical: `docs/image-gradient-visual-tolerance.md`

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

既存target repoのstyle architectureを最優先する。SCSSは前提にしない。

新規React/Next/Vite系で既存規約が無い場合のcurrent candidate:

```text
CSS Modules
+ native CSS
+ CSS Custom Properties
```

これは永久standardではない。

## Update-aware rule

Significant run前に:

- Company Policy / Required Environment Matrix
- Figma release notes / MCP docs
- current agent/client docs
- MDN/platform compatibility relevant to company targets
- WordPress/ACF/library official docs when applicable
- recent practitioner/community signals

を確認する。

Required browser major / OS major / relevant web-platform changeもRETEST trigger。

古いlimitation/workaroundを自動で現在へ適用しない。関連updateがあれば`RETEST_NOW`。

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
- complex carouselを毎回hand-rollする
- all animationを1libraryへ寄せる
- ACF fieldへdesign tokens/layout valuesを無条件に移す
- exact image sourceがあるのにAI再生成する
- 1–2px magic numberでroot causeを隠す
- 1回成功をbest practiceにする
- 1回失敗を永久禁止にする

## CI

Machine-readable contractsは`.github/workflows/validate-research.yml`で検証する。

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
