# figma-ai-project

AI coding agents（Codex / Claude Code / Cursorなど）とFigmaを使い、**既に決まっているPC/SPデザインを高い再現性で実装し、人間の手直しを継続的に減らす**ための研究・実践リポジトリです。

## Boundary

このrepoはデザインを決める場所ではありません。

- Reference Figmaは案件/ユーザー側がsource of truth
- reference未提示ならAIはデザインを発明しない
- reference受領後も勝手なredesignをしない
- design変更とagent/workflow改善を同じexperimentへ混ぜない

## Current project state

現在は**実referenceを使った学習・検証段階**です。

REF-001（千葉経済大学sample）では、FigmaのPC/SP referenceを使ったWordPress + ACF learning fixtureについて、HeaderからFooterまでのfull-page visual/runtime実装とQAまで到達しています。

現在確認済みの主要contract:

- exact visual acceptance: PC `1380px` / SP `375px`
- owner-resolved production breakpoint: `768px`
  - mobile `<= 767px`
  - desktop `>= 768px`
- latest validated full-page geometry delta: PC/SPとも`0`
- page-level horizontal overflow / readable-text clipping等のruntime safety gate: PASS
- ACF learning artifact: main baseline + Coursesを1ファイルでimportできるbundleを生成・drift検証可能

一方で、**production実装が完成したという意味ではありません**。

- 実案件のtarget WordPress theme repository / branch / starting commitは未接続
- Header / Footer / global CTA等のproduction ownershipはtarget repo確認前なのでfreezeしない
- Student Voiceのinteraction、Messages 2–4やcarousel behavior等はevidence不足のまま`UNDETERMINED`
- 現在の修復済みfixtureはformal FIRST PASS保存前に改善を重ねたため、後付けでFIRST PASS扱いしない
- Clean Replayはまだ`NOT RUN`。reproducibilityを実証済みとは扱わない

Canonical current evidence:

- `references/chiba-keizai-sample.reference.yaml`
- `experiments/ref001-wordpress-acf/README.md`
- `experiments/ref001-wordpress-acf/artifacts/README.md`

---

## Current production workflow

```text
Scheduled Official Update Radar
  ↓
Company Policy ACTIVE + SHA-256
  ↓
Required Device / Browser Environment Profiles
  ↓
Reference Freeze
  ↓
Existing Codebase Reconnaissance
  ↓
Effective Environment Contract
  ↓
Global Figma Capability Profile
  ↓
Shared Contract DRAFT
  ↓
Section Discovery + PC/SP Mapping
  ↓
Per-section Figma Structure Profile
  ↓
Component / Token / Interaction Resolution
  ↓
Shared Foundation Build + Verify
  ↓
Shared Contract FROZEN
  ↓
Safe Execution Wave Planning
  ↓
Isolated / serial-safe SECTION workers
  ↓
SECTION → BOUNDARY → CLUSTER when needed
  ↓
Coordinator INTEGRATION
  ↓
Full Page verification across ALL REQUIRED environments
  ↓
Targeted Repair
  ↓
Clean Replay
  ↓
Knowledge Promotion
```

Production defaultは**section-first**です。

例:

- Header
- MainVisual
- Content01
- Content02
- Footer

ページ全体を1agentへ丸投げする方式は永久禁止ではなく、将来のmodel/MCP進化を測る`PAGE_BENCHMARK`として残します。

### Automated Update Radar

通常のproduction runで人間がrelease notesを手動検索することをdefaultにしません。

```text
config/update-sources.yaml
→ .github/workflows/update-radar.yml  # daily 12:17 JST
→ research/update-radar/latest.json
→ python scripts/apply_radar_preflight.py <run.yaml> --apply
→ python scripts/start_section_run.py <run.yaml> --apply
```

Registryは`python scripts/validate_update_sources.py`でnetworkアクセス前に検証します。

Current freshness defaultは**36 hours**。Required official laneが取得不能ならfail-closedです。Community/practitioner scanは仮説探索には使えますがproduction start gateではありません。

Canonical:

- `docs/update-preflight.md`
- `docs/research-radar.md`

---

## Inspect actual Figma before deciding how to implement it

「Figma best practiceではこうだから」で実装方法を先に固定しません。

Target Figmaが実際に使っている:

- Components / variants
- Variables / modes / aliases
- Auto Layout / Grid
- semantic naming
- Code Connect
- annotations/dev intent
- exact asset access

を先にprofile化します。

### Knowledge state

- `UNKNOWN` — まだ十分に調査していない
- `NONE` — 調査した結果、存在しない
- `UNDETERMINED` — 調査したが現在のMCP/API/client/権限では確定できない

`NONE`と`UNDETERMINED`にはevidenceを残します。

`UNDETERMINED`は作業を永久停止させる値ではなく、保守的strategyを選び、tool update時に`RETEST_NOW`へ戻すための状態です。

Canonical: `docs/figma-capability-profile.md`

---

## Shared consistency before parallelism

Sectionを並列化する前に、全worker共通のShared Contract/Foundationを固定します。

Shared Contractには最低限:

- Figma Capability Profile + evidence
- profile由来のstrategy decisions
- component resolution
- token/variable resolution
- fonts
- styling architecture
- company/designer指定breakpoint
- container/gutter/layout primitives
- shared components
- asset policy
- accessibility baseline
- coordinator-only/shared paths
- verified foundation commit

を持たせます。

Section Manifest/Run Recordはcontract hash・foundation commit・manifest hash等のlineageを保持します。

**違うcontract revisionから作られたSectionを同条件として混ぜません。**

Canonical:

- `templates/shared-contract.yaml`
- `docs/component-resolution.md`
- `docs/token-mapping.md`

---

## Section discovery without manual URL collection

毎回人間がFigmaからHeader/MV/Content/Footerのnode URLを拾うことをdefaultにしません。

AI/MCPはまずsparse metadataからsection候補を発見し、PC/SPを以下のようなmulti-signalで対応付けます。

- component identity
- semantic name/role
- text anchors
- assets
- page order
- child structure
- screenshot evidence

各sectionに:

- boundary confidence
- PC/SP mapping confidence
- evidence
- dependency
- integration coupling

を持たせます。

LOW confidenceは永久禁止ではありませんが、追加調査なしで他Sectionとの同時実行waveには載せません。

Canonical: `docs/section-discovery.md`

---

## Safe parallel execution

並列数を最大化すること自体はKPIではありません。

`python scripts/section_planner.py <section-manifest.yaml>`

で、dependency / write scope / coupling / discovery confidenceからsafe Waveを計画します。

**1 Wave = Wave内のSectionを同時に実行して安全と判定した集合。**

同時実行から外す主な条件:

- section dependency
- write scope overlap
- HIGH integration coupling
- write scope未確定
- LOW section boundary confidence
- LOW PC/SP mapping confidence

さらに、同じparallel groupのworkerは同じworking treeを共有しません。

Current preferred isolation:

- separate branch/worktree
- agent-provided isolated sandbox

`SERIAL_SHARED_TREE`はplannerがsingleton Waveであることを証明した場合のみ許可します。

新しいisolation方式も永久禁止せず、parallel-safe evidence付きで将来対応できます。

Canonical:

- `docs/parallel-planning.md`
- `docs/parallel-git-isolation.md`

---

## Breakpoints

実務ではデザイナー/会社/design system/既存productの指定を**ページ全体の共通contract**として扱います。

AIは独断で「ここで壊れるから768px」等の新thresholdを追加しません。

AIの仕事は:

1. breakpoint source/value/query semanticsを特定
2. Shared Contractへ固定
3. 各Sectionでその境界のbehaviorを実装
4. 境界前後で破綻しないか検証

です。

例外が必要に見える場合は`PROPOSE_BREAKPOINT_EXCEPTION`として証拠付き提案に留めます。

Canonical: `docs/responsive-breakpoint-policy.md`

---

## CSS direction

SCSSを前提にしません。

最優先はtarget repoの既存style architectureです。

新規React / Next / Vite系で既存規約がない場合のcurrent default候補:

```text
CSS Modules
+ native CSS
+ CSS Custom Properties for shared tokens
+ project-wide specified breakpoint contract
+ section-scoped files
```

これは永久標準ではありません。browser/CSS/framework/Figma toolingの進化と実験結果で再評価します。

Canonical: `docs/css-strategy.md`

---

## Three run scopes

### SECTION

Header / MainVisual / Contentなどのproduction work unit。

### INTEGRATION

複数Sectionを接続した後の:

- cross-section spacing
- container alignment
- typography hierarchy
- background/z-index continuity
- global overflow
- breakpoint continuity

を評価します。

### PAGE_BENCHMARK

Whole-page one-shot等の能力研究。

SECTION/INTEGRATIONと直接rankingしません。

---

## Evidence and scoring

```text
First-pass Fidelity = Visual 40 + Structural 25 + Robustness 15 = /80
Rework Efficiency = /10
Reproducibility = /10  # clean replay後
Final Composite = /100
```

Final screenshotだけ綺麗でも、Section/Integration/Foundationの戻りが多ければ高評価にしません。

特に並列実装では:

```text
Total Rework
= Section Rework
+ Integration Rework
+ Shared/Foundation Rework
+ Human Coordination Cost
```

を見ます。

Canonical:

- `docs/evaluation-rubric.md`
- `docs/rework-metrics.md`
- `docs/failure-taxonomy.md`

---

## Knowledge never becomes permanently true from one run

Figma / MCP / Codex / Claude Code / Cursor / vision modelは進化します。

```text
E0 External Signal
→ E1 Local Observation
→ E2 Clean Replay
→ E3 Cross-run / Agent
→ E4 Cross-reference
→ E5 Portable Proven
```

- 1回失敗 → 永久禁止にしない
- 1回成功 → best practiceにしない
- official upstream change → `RETEST_CANDIDATE`、自動rule変更ではない
- Scheduled Official Update Radarを通常の更新検知入口にする
- community情報はoptionalなE0仮説探索として扱い、自分たちで検証する

Canonical:

- `docs/evidence-policy.md`
- `docs/update-preflight.md`
- `docs/research-radar.md`
- `docs/community-signal-registry.md`
- `docs/knowledge-promotion.md`

---

## Validation layer

Machine-readable recordsはCIで検証します。

Current validation includes:

- Update Radar source registry validation
- schema/semantic record validation
- Company Policy / Required Environment Contract validation
- Figma Capability Profile freeze gate
- component/token resolution gate
- breakpoint contract semantics
- section discovery confidence/evidence
- dependency/write-path conflicts
- parallel worker isolation
- immutable run evidence lineage
- ACF export validation + deterministic REF-001 import-bundle drift gate
- immutable FIRST PASS evidence validation when evidence exists
- Clean Replay pair comparability validation when a pair exists
- capture environment lineage / required coverage
- section planner/validator unit tests

Workflow: `.github/workflows/validate-research.yml`

Local/readiness entrypoint:

```text
python scripts/check_repository_readiness.py
```

Readiness output is tri-state:

- `PASS` — applicable gate passed
- `SKIP` — evidence/pair does not exist yet; successful but **not proof that the stage was executed**
- `FAIL` — applicable gate failed

CIは研究を硬直化するためではなく、**同じexperiment条件を後から再現できるようにするため**のものです。

新しいtool capabilityが出たらschema/validatorも更新します。

---

## Key docs

### Production workflow

- `docs/workflow.md`
- `docs/section-execution.md`
- `docs/section-discovery.md`
- `docs/figma-capability-profile.md`
- `docs/component-resolution.md`
- `docs/token-mapping.md`
- `docs/responsive-breakpoint-policy.md`
- `docs/css-strategy.md`
- `docs/parallel-planning.md`
- `docs/parallel-git-isolation.md`

### Experiment / evidence

- `docs/reference-contract.md`
- `docs/context-package.md`
- `docs/run-contract.md`
- `docs/visual-verification.md`
- `docs/evaluation-rubric.md`
- `docs/rework-metrics.md`
- `docs/failure-taxonomy.md`

### Continuous learning

- `docs/update-preflight.md`
- `docs/evidence-policy.md`
- `docs/research-radar.md`
- `docs/community-signal-registry.md`
- `docs/figma-update-adoption-2025-2026.md`
- `docs/knowledge-promotion.md`

---

## Future direction

Prompt集だけを最終成果に限定しません。

実験データが増えたら:

```text
Figma Reference
+ uploaded images
+ Section Manifest
+ generated implementation
+ PC/SP/breakpoint screenshots
+ overlay/diff
+ run/contract/tool/model metadata
        ↓
Evidence Dashboard / Visual Workbench
        ↓
AI + human review
```

へ発展できる構造にしています。

また、structured Figmaが無い場合の**image-only / screenshot-to-structure**も独立研究トラックとして残しています。

- `docs/future-platform.md`
- `docs/image-only-research-track.md`

---

## Research principle

このrepoは結論集ではありません。

**Scheduled official updates → 観測 → RETEST仮説 → section実験 → integration確認 → 原因分類 → 小さな改善 → clean replay → 別reference/案件で再現 → tool更新で再評価**

を繰り返し、次の案件ほど速く、正確に、人間の戻りが少ない実装工程へ育てます。
