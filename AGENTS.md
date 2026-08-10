# AGENTS.md

このrepoを扱うAI agent共通の最上位規約。

詳細仕様は各canonical docを正本とし、このファイルへ同じ説明を重複させすぎない。

## Mission

既に決まっているFigmaのPC/SPデザインを、Codex / Claude Code / Cursor等で**高いFirst-pass Fidelity・低いRework・高い再現性**で実装できる工程へ改善する。

Reference designそのものはこのrepoが決めない。

## Source of truth

- 案件/ユーザー側Figmaがdesign source of truth
- reference未提示ならデザインを発明しない
- referenceを勝手にredesignしない
- design変更とagent/workflow改善を同一experimentへ混ぜない
- 重要run前にcurrent tooling/update情報を再確認する

## Production default

```text
Update Preflight
→ Reference Freeze
→ Global Reconnaissance
→ Figma Capability Profile
→ Shared Contract DRAFT
→ Section Discovery / PC-SP Mapping
→ Component + Token Resolution
→ Shared Foundation Build + Verify
→ Shared Contract FROZEN + SHA-256
→ Safe Wave Planning
→ Isolated SECTION Workers
→ Coordinator INTEGRATION
→ Visual / Breakpoint Verification
→ Targeted Repair
→ Clean Replay
→ Knowledge Promotion
```

Productionはsection-first。

Whole-page one-shotは永久禁止ではなく`PAGE_BENCHMARK`として能力変化を再検証する。

Canonical:

- `docs/workflow.md`
- `docs/section-execution.md`

## Epistemic states — never collapse them

Figma capability/profile等では:

- `UNKNOWN` — まだ十分に調査していない
- `NONE` — 調査した結果、存在しない
- `UNDETERMINED` — 調査したが現在のtool/API/client/権限では確定不能

を区別する。

FROZEN contractではNONE/UNDETERMINEDにevidenceを残す。

UNDETERMINEDは永久blockにせず、conservative strategy + future retest対象にする。

Canonical: `docs/figma-capability-profile.md`

## Inspect actual Figma before choosing implementation strategy

Components / Variables / Auto Layout / semantic naming / Code Connect / annotations / assetsを**使っていると仮定しない**。

実referenceをprofile化し、そのprofileとtarget codebaseの既存architectureを両方見て実装方法を選ぶ。

- Figma Componentがある → 必ず新規code component、ではない
- Figma Componentがない → code reuse不要、でもない
- Figma Variableがある → raw CSS variableへblind flatten、ではない
- Figma Variableがない → global tokenを大量生成、でもない
- Code Connectがない → blocker、ではない

Canonical:

- `docs/figma-capability-profile.md`
- `docs/component-resolution.md`
- `docs/token-mapping.md`

## Shared Contract is immutable for active section workers

Parallel開始前にShared Contract/Foundationをfreezeする。

Section Manifest / Run Recordは少なくとも:

- reference lineage
- section manifest lineage
- shared contract SHA-256
- verified foundation commit
- worker contract SHA-256

を保持する。

異なるcontract/foundation lineageのoutputを同条件として混ぜない。

Workerがshared変更を必要としたら`PROPOSE_SHARED_CHANGE`。

Coordinatorが採用した場合:

1. foundation更新
2. re-verify
3. Shared Contract revision/hash更新
4. affected sectionsをrebase/re-run

## Breakpoint rule

デザイナー / 会社 / design system / existing productの指定がある場合、それを**全section共通source of truth**とする。

AIが独断で慣習値やsection固有thresholdを追加しない。

必要なら`PROPOSE_BREAKPOINT_EXCEPTION`。

AIは指定境界で破綻しないかを検証する。

Canonical: `docs/responsive-breakpoint-policy.md`

## Section discovery

人間に毎回node URLを切り出させることをdefaultにしない。

Figma metadata/contextからlogical sectionを発見し、PC/SPをmulti-signalでmappingする。

- boundary confidence
- mapping confidence
- evidence
- dependencies
- integration coupling

をSection Manifestへ残す。

LOW confidenceは追加調査せずparallel groupへ載せない。

Canonical: `docs/section-discovery.md`

## Safe parallelism

最大並列数自体をKPIにしない。

`python scripts/section_planner.py <section-manifest.yaml>` のWaveをcurrent planning基準にする。

同時実行から分離する代表条件:

- dependency
- write-scope overlap
- HIGH integration coupling
- unknown write scope
- LOW boundary confidence
- LOW PC/SP mapping confidence

同じparallel groupのworkerは同じworking tree / isolation refを共有しない。

Current preferred isolation:

- separate branch/worktree
- agent isolated sandbox

新しいisolation方式はevidence付きで将来追加可能。

Canonical:

- `docs/parallel-planning.md`
- `docs/parallel-git-isolation.md`

## Styling

既存target repoのstyle architectureを最優先する。

SCSSは前提にしない。

新規React/Next/Vite系で既存規約が無い場合のcurrent candidate:

```text
CSS Modules
+ native CSS
+ CSS Custom Properties for shared tokens
+ specified shared breakpoint contract
```

これは永久standardではない。

Canonical: `docs/css-strategy.md`

## Update-aware rule

Figma / MCP / agent clients/modelsは進化する。

Significant run前に最低1回:

- Figma release notes
- current Figma MCP docs/tools
- current agent/client docs
- recent practitioner/community signals

を確認する。

古いlimitation/workaroundを自動で現在へ適用しない。

関連updateがあれば`RETEST_NOW`。

Canonical:

- `docs/update-preflight.md`
- `docs/research-radar.md`
- `docs/community-signal-registry.md`

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

Recommendationは可逆。

Canonical:

- `docs/evidence-policy.md`
- `docs/knowledge-promotion.md`

## Run scopes

- `SECTION` — production section work
- `INTEGRATION` — page-level integration work
- `PAGE_BENCHMARK` — whole-page等の能力研究

異なるscopeのscoreを直接rankingしない。

COMMON agent比較では可能な限り:

- same reference
- same section
- same capability/profile revision
- same Shared Contract hash
- same foundation commit
- same component/token resolution
- same assets/viewports/acceptance
- same context tier/repair budget

を揃える。

OPTIMIZEDはagent固有current best practiceを使ってよいがCOMMONと混ぜない。

## Mandatory evidence preservation

FIRST_PASSを消さない。

最低限:

- run scope/id
- reference + manifest hashes
- section id/node
- Shared Contract hash
- foundation commit
- isolation identity when parallel
- prompt/context version/hash
- agent/model/client version if known
- first-pass evidence/score
- final evidence/score
- failures/repairs/assumptions
- clean replay result

を残す。

Canonical:

- `docs/run-contract.md`
- `docs/visual-verification.md`
- `docs/evaluation-rubric.md`
- `docs/rework-metrics.md`
- `docs/failure-taxonomy.md`

## Do not

- reference無しでdesignを作る
- structured Figmaが読めるのにscreenshotだけで構造を決める
- UNKNOWN/UNDETERMINEDをNONE扱いする
- PC/SPを無関係な別pageとしてhardcodeする
- company/designer breakpointをAI判断で置換する
- section workerがshared files/resolution tableを勝手に変更する
- LOW-confidence sectionを無検証で並列化する
- parallel workerでworking tree/isolation refを共有する
- contract hashが違うoutputを無条件統合する
- Verify前にFIRST_PASSを上書きする
- giant promptへ全情報を詰める
- visual-only hackでstructural mismatchを隠す
- 1回の成功をbest practiceにする
- 1回の失敗を永久禁止にする
- old tool limitationをupdate確認なしで現在へ適用する

## Prefer

- metadata → relevant nodeのprogressive disclosure
- actual Capability Profile
- evidence-backed component/token resolution
- exact assets
- immutable shared foundation
- section-scoped Inspect → Implement → Verify → Repair
- safe dependency-aware Waves
- isolated workers
- exact browser viewport capture
- machine-readable evidence
- clean replay
- smallest sufficient context
- recent official + practitioner knowledge

## CI / validation

Machine-readable contractsは`.github/workflows/validate-research.yml`で検証する。

Validationは現在のtoolを永久固定するためではなく、**experiment lineageと再現条件を壊さないため**に使う。

新しいFigma/MCP/agent capabilityで正当なworkflowが増えたらschema/validatorも更新する。

## Future

必要性が実験で確認できたら:

- image-only/screenshot-to-structure
- reference/first-pass/final diff
- AI visual review
- Evidence Dashboard / Workbench

へ発展させる。

Canonical:

- `docs/future-platform.md`
- `docs/image-only-research-track.md`

## Experiment Done

- referenceを変えていない
- tooling preflightがある
- FIRST_PASSが保存されている
- lineageが追跡できる
- section + integrationのfailure/reworkが分かる
-改善理由が説明できる
- clean replayで再現確認している
- portable/project-specific lessonを分離している
- unresolved/UNDETERMINEDを明示している
