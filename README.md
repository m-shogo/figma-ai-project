# figma-ai-project

AI coding agents（Codex / Claude Code / Cursorなど）とFigmaを使い、**既に決まっているPC/SPデザインを高い再現性で実装し、人間の手直しを継続的に減らす**ための研究・実践リポジトリです。

## Boundary

このrepoはデザインを決める場所ではありません。

- Reference Figmaは案件/ユーザー側がsource of truth
- reference未提示ならAIはデザインを発明しない
- reference受領後も勝手なredesignをしない
- design変更とagent/workflow改善を同じexperimentへ混ぜない

現在は**reference design待ち**。デザイン自体には触れず、再現・検証・学習基盤を整備しています。

---

## Current production workflow

```text
Tooling Update Preflight
  ↓
Reference Freeze
  ↓
Global Reconnaissance
  ↓
Figma Capability Profile
  ↓
Shared Contract DRAFT
  ↓
Section Discovery + PC/SP Mapping
  ↓
Component / Token Resolution
  ↓
Shared Foundation Build + Verify
  ↓
Shared Contract FROZEN + SHA-256
  ↓
Safe Execution Wave Planning
  ↓
Isolated Parallel SECTION Runs
  ↓
Coordinator INTEGRATION Run
  ↓
PC / SP / Specified Breakpoint Verification
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
- major update → old CAUTION/limitationを再試験
- official docs + Zenn/Qiita/X/Forum/GitHub/Reddit等のfield signalを併用
- community情報はE0として仮説化し、自分たちで検証

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

- schema/semantic record validation
- Figma Capability Profile freeze gate
- component/token resolution gate
- breakpoint contract semantics
- section discovery confidence/evidence
- dependency/write-path conflicts
- parallel worker isolation
- immutable run evidence lineage
- section planner/validator unit tests

Workflow: `.github/workflows/validate-research.yml`

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

**最新情報 → 観測 → 仮説 → section実験 → integration確認 → 原因分類 → 小さな改善 → clean replay → 別reference/案件で再現 → tool更新で再評価**

を繰り返し、次の案件ほど速く、正確に、人間の戻りが少ない実装工程へ育てます。
