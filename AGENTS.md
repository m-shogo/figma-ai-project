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

Company Policyはbrowser support、reset、breakpoints、approved libraries、folder/CMS/ACF、interaction、images、visual tolerance等の最上位technical constraint。

Company PolicyとFigma visual/behaviorが衝突したら、勝手にredesignせず`CONFLICT`として記録する。

Reference未提示ならdesignを発明しない。

Canonical: `docs/company-policy-contract.md`

## Production default

```text
Update Preflight
→ Company Policy ACTIVE + SHA-256
→ Reference Freeze
→ Existing Codebase Reconnaissance
→ Global Figma Capability Profile
→ Shared Contract DRAFT
→ Section Discovery / PC-SP Mapping
→ Per-section Figma Structure Profile
→ Component / Token / Interaction Resolution
→ Shared Foundation Build + Verify
→ Shared Contract FROZEN + Company Policy SHA-256
→ Safe Wave Planning
→ Isolated SECTION Workers
→ SECTION Capture
→ BOUNDARY / CLUSTER Capture
→ Coordinator INTEGRATION
→ Full Page Visual / Breakpoint Verification
→ Targeted Repair
→ Clean Replay
→ Knowledge Promotion
```

Productionはsection-first。Whole-page one-shotは永久禁止ではなく`PAGE_BENCHMARK`として能力変化を再検証する。

Canonical:

- `docs/workflow.md`
- `docs/section-execution.md`
- `docs/section-integration-ladder.md`

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

## Shared Contract

Parallel開始前にShared Contract/Foundationをfreezeする。

FROZEN Shared ContractはACTIVE Company Policyのpath + SHA-256をbindする。

Workerがshared変更を必要としたら`PROPOSE_SHARED_CHANGE`。

異なるCompany Policy/Contract/Foundation lineageのoutputを同条件として混ぜない。

## Breakpoints / browser support

Company/browser matrix/design system/existing productの指定を最優先する。

AIが慣習値やsection固有thresholdを勝手に追加しない。

必要なら`PROPOSE_BREAKPOINT_EXCEPTION`。

Browser supportは可能なら:

- Browserslist/query
- explicit minimums / exceptional WebViews
- real QA browser/device matrix

の3層で記録する。

## Web interaction defaults

Company/Existingに指定が無い場合のみcurrent candidateを使う。

- anchor smooth scroll: native CSS first + reduced motion + fixed-header offset
- hover: hover-capability gate + keyboard focus equivalent + touch fallback
- hamburger: site navigationはDisclosure patternがdefault
- carousel simple: CSS Scroll Snap candidate
- carousel complex: existing/approved specialist library
- autoplay: default off;必要時はpause/focus/hover/reduced-motion/keyboard対応
- simple animation: CSS
- framework motion: existing layer first
- complex scroll choreography: approved specialist library
- reset CSS: existing/company browser matrixから選択

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

Canonical: `docs/image-gradient-visual-tolerance.md`

## Section discovery / integration

人間に毎回node URLを切り出させることをdefaultにしない。

Figma metadata/contextからlogical sectionを発見し、PC/SPをmulti-signal mappingする。

Section単体完成だけでPASSにしない。

Evidence ladder:

```text
SECTION
→ adjacent BOUNDARY
→ high-coupling CLUSTER when needed
→ FULL PAGE
```

Cumulative `S01+S02+...` captureはsticky/vertical rhythm/scroll dependency等で価値がある場合に追加する。

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

Singleton/serial executionは必要以上に禁止しない。

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

- Company Policy / browser matrix
- Figma release notes / MCP docs
- current agent/client docs
- MDN/platform compatibility relevant to company targets
- WordPress/ACF/library official docs when applicable
- recent practitioner/community signals

を確認する。

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

COMMON比較では可能な限りsame Company Policy / reference / section / Structure Profile / Shared Contract / foundation / assets / viewport / context / repair budgetを揃える。

## Mandatory evidence

FIRST_PASSを消さない。

最低限:

- Company Policy / Reference / Contract lineage
- section id/node
- Structure Profile revision
- foundation commit
- isolation identity
- prompt/context/tool/model version
- SECTION capture
- BOUNDARY/CLUSTER capture where required
- Full Page evidence
- failures/repairs/assumptions
- clean replay result

## Do not

- reference無しでdesignを作る
- Company PolicyをFigma/AI inferenceで上書きする
- Company/Figma conflictを黙って解決する
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

Validationはtoolを永久固定するためではなく、**Company Policy・experiment lineage・再現条件を壊さないため**に使う。

## Future

実験で必要性が確認できたらDashboard/Workbenchへ:

- Company Policy editor
- Effective Rule / Conflict view
- Section → Boundary → Page Evidence Tree
- visual diff
- AI visual review
- update/retest radar

を実装する。

Dashboard UIは実runのpainが3–5件程度見えてから作る。Company Policy contract自体はproduction前提なので先に整備してよい。
