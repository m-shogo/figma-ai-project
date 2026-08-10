# Parallel Section Planning

Section-first実装を速くするための並列化は、**人が勘で同時実行数を決めるのではなく、Section Manifestのdependency / coupling / write scope / discovery confidenceから安全なWaveを計画する**。

目的は最大並列数ではない。

```text
安全に同時実行できる最大範囲
```

を毎回manifestから求める。

Current planner:

```bash
python scripts/section_planner.py path/to/section-manifest.yaml
```

Machine-readable:

```bash
python scripts/section_planner.py path/to/section-manifest.yaml --json
```

## Wave semantics

**1 Wave = Planner上、そのWave内のSectionを同時実行候補として扱える集合。**

ただしPlanner出力だけではexecution approvalにならない。

異なるWaveは原則順番に進める。

例:

```text
Wave 1: Header, MainVisual, Content01
Wave 2: Content02
Wave 3: Footer
```

Wave 2/3へ送られる理由はdependencyだけとは限らない。

- another sectionへのdependency
- allowed write path overlap
- write scope未確定
- HIGH integration coupling
- LOW section discovery confidence

があれば安全側へ分離する。

---

## Current scheduling flow

```text
Figma discovery
  ↓
Section Manifest DRAFT
  ↓
Discovery confidence enrichment
  ↓
Shared Foundation VERIFIED
  ↓
Shared Contract FROZEN + SHA-256
  ↓
section_planner.py
  ↓
Dependency-safe / conflict-aware Wave candidates
  ↓
Coordinator review
  ↓
worker.parallel_group
worker.contract_sha256
worker.isolation
  ↓
Section Execution Gate
  ↓
Workers start
```

Plannerはworkerを起動しない。

Execution Gateを通った`READY/RUNNING` worker/groupだけ実行する。

詳細: `docs/execution-gate.md`

---

## Inputs

`templates/section-manifest.yaml` の各Sectionから使う。

### `dependencies.section_ids`

先に完成している必要があるSection。

```yaml
dependencies:
  section_ids: [S01]
```

### `dependencies.integration_coupling`

- `LOW`: 通常は独立実装可能
- `MEDIUM`: 並列可能だがintegration時に重点確認
- `HIGH`: current defaultでは単独Wave

HIGHを永久禁止扱いしない。実験で安全性が確認できれば将来planner policyを変更できる。

### `implementation.allowed_paths`

Workerが書き込めるownership root。

```yaml
implementation:
  allowed_paths:
    - src/sections/Hero
```

同じWaveで:

```text
src/sections
src/sections/Hero
```

のように包含関係がある場合は競合するため分離する。

Globは使わない。

### Discovery confidence

Auto section discoveryは:

```yaml
figma:
  boundary_confidence: HIGH | MEDIUM | LOW
  pc_sp_mapping_confidence: HIGH | MEDIUM | LOW | NOT_APPLICABLE
```

を持つ。

LOW confidenceはPlannerで単独Waveへ分離される場合がある。

**ただし単独Waveへ出たことは実装許可ではない。**

`READY/RUNNING`へ進む前にExecution Gateが:

- boundary confidence >= MEDIUM
- PC/SP mapping confidence >= MEDIUM / NOT_APPLICABLE
- claimed confidence evidenceあり

を要求する。

LOWならAI coordinatorが必要nodeだけ追加取得してevidenceを増やす。

### `worker.parallel_group`

実際に起動する並列group名。

Planner出力の`recommended_parallel_group`を候補にできる。

ただしPlannerがmanifestを自動書換えしてsource of truthになる設計にはまだしない。

### `worker.contract_sha256`

Workerが実際に使うShared Contract hash。

```yaml
worker:
  contract_sha256: <current Shared Contract SHA-256>
```

top-level `shared_contract_sha256` と一致させる。

Shared Contract更新後、古いworker outputを新しいcontract条件として混ぜない。

### `worker.isolation`

Concurrent executionではGit/filesystem isolationも必要。

```yaml
worker:
  isolation:
    mode: BRANCH_WORKTREE
    ref: section-S01
    parallel_safe: true
    notes: []
```

Current known modes:

- `BRANCH_WORKTREE`
- `AGENT_SANDBOX`

同じparallel groupではunique `ref`を使う。

`SERIAL_SHARED_TREE`は複数worker同時実行に使わない。

---

## Dependency graph first

例:

```text
S01 Header       ─┐
S02 MainVisual   ├─ dependency layer 1
S03 Content01    ┘
        ↓
S04 Content02       dependency layer 2
```

### Planner behavior

- COMPLETE dependencyは満たされた扱い
- unknown dependencyはerror
- self dependencyはerror
- cycleはerror
- BLOCKED dependencyに依存するSectionはplanを成立させない

---

## Write ownership second

Dependencyがなくても同じfile/directoryを触るworkerは並列化しない。

### Unknown write scope

`allowed_paths: []`はparallel-safeとはみなさない。

Plannerでは単独Waveへ分ける。

Execution前にはownershipを確定する。

### Coordinator/shared protected paths

Section worker同士が競合しないだけでは不十分。

Workerは以下も所有しない。

- root page composition
- explicit coordinator-only paths
- global style paths
- token sources
- shared component paths
- design-system roots
- verified foundation changed paths

`validate_parallel_paths.py`がShared Contractからprotected rootsを自動導出し、active workerの`allowed_paths`とのoverlapを拒否する。

---

## Integration coupling third

### LOW
通常の独立content section。並列候補。

### MEDIUM
共有visual rhythm、隣接decorations、共通state等がある。

write ownershipが独立していれば並列可能だが、integration QAを強める。

### HIGH
例:

- 連続する1枚背景を2sectionで共有
- 強いcross-section overlap
- shared animation timeline
- DOM/stateが密結合

Plannerは他Sectionとの同時実行を避ける。

---

## Concurrency-safe Wave splitting

同じdependency layerでも全Sectionを1つのparallel groupへ入れるとは限らない。

Plannerは各layerをさらに:

- path overlap
- unknown write scope
- HIGH coupling
- LOW discovery confidence

で分割する。

したがって:

```text
same dependency layer
```

でも:

```text
wave-01: S01, S02
wave-02: S03
```

となり得る。

このWaveは**順番に実行するexecution wave候補**。

同じWave内だけ同時実行候補。

---

## Git / filesystem isolation

Write scopeが別でも、同じworking treeへ複数agentが同時書込みするとGit状態を壊せる。

Current default:

- isolated branch + worktree
- agent-provided isolated sandbox

を優先する。

### Future isolation tools

新しいtoolを永久拒否しない。

`OTHER`として:

```yaml
worker:
  isolation:
    mode: OTHER
    ref: new-tool-S01
    parallel_safe: true
    notes:
      - "isolated filesystem and independent Git ref verified on tool version X"
```

のように**現在の安全根拠を記録**すれば採用候補にできる。

繰り返し安全性が確認できたら専用modeへ昇格できる。

---

## Section Execution Gate

Planner outputをそのまま起動しない。

```bash
python scripts/section_execution_gate.py path/to/section-manifest.yaml
```

Machine-readable:

```bash
python scripts/section_execution_gate.py path/to/section-manifest.yaml --json
```

Gateはまとめて確認する。

- Section schema / linked Shared Contract
- Shared Contract hash
- verified foundation commit
- breakpoint contract semantics
- Figma section discovery confidence
- dependency graph
- write ownership
- coordinator/shared protected paths
- worker contract hash
- worker isolation

GateがPASSした`READY/RUNNING` groupだけ起動する。

---

## Fail-closed cases

Execution前に止める。

- dependencyが存在しないSectionを参照
- self dependency
- dependency cycle
- required dependencyがBLOCKED
- READY/RUNNINGなのにsection discovery LOW
- active workerのparallel_groupが空
- worker contract hashがstale
- same parallel group内でdependency関係あり
- same parallel group内でwrite scope overlap
- worker pathがcoordinator/shared protected pathとoverlap
- HIGH coupling Sectionを他Sectionと同groupに配置
- allowed pathにglob / absolute path / `..`
- shared working treeを複数workerが同時利用
- same isolation refを複数workerが利用
- unverified future isolation mechanism

Gate failureをAIが勝手に値変更してPASSさせない。

原因を明示的に解消してmanifest/contractをrevisionする。

---

## Conservative by design

Current plannerは少し保守的。

例えば同じdependency layer内でwrite conflictにより2Waveへ分かれた場合、次dependency layerは両方が完了してから開始する。

これは最大並列度より:

1. reproducibility
2. merge safety
3. failure attribution
4. integration consistency

を優先しているため。

実験データが貯まり、dynamic schedulerの方がIntegration Taxを増やさず速いと確認できたら改善候補にする。

---

## Parallelism is not the goal

最大同時実行数をKPIにしない。

見るもの:

- First-pass Fidelity
- Section Rework
- Integration Rework
- merge conflicts
- Shared Contract revisions
- foundation rebuild/fanout
- human coordination
- elapsed time / critical path when reliable

**速いがintegrationで大量修正になる並列化は失敗。**

`docs/rework-metrics.md` を参照。

---

## Unknowns are scheduling data

Unknownを隠して推測で埋めない。

例:

- allowed path未決定
- section boundary LOW
- PC/SP mapping LOW
- shared dependency不明
- isolation方式未確認

は永久的な「できない」ではない。

現在のrisk/confidenceとしてmanifestへ残し、追加調査またはtool update後に再評価する。

---

## Future improvement candidates

Evidenceができてから検討する。

- automatic worker.parallel_group application
- automatic isolation assignment
- dynamic scheduling after each completed Section
- estimated critical path
- agent/model-specific concurrency limits
- automatic code-path ownership extraction from target repo
- Figma section dependency inference
- integration-coupling inference from continuous backgrounds/overlap/shared interactions
- previous run historyからintegration risk prediction
- DashboardからWave可視化/launch

これらも一度の成功/失敗で固定しない。
