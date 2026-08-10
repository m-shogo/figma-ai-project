# Section Execution Gate

Section-first workflowを速くしても、前提が壊れたworkerを起動しないための**実行直前fail-closed gate**。

```text
Figma discovery
→ Shared Contract/Foundation
→ Section Manifest
→ Planner
→ Execution Gate
→ workers
```

## Command

```bash
python scripts/section_execution_gate.py path/to/section-manifest.yaml
```

Machine-readable output:

```bash
python scripts/section_execution_gate.py path/to/section-manifest.yaml --json
```

将来Dashboard/agent orchestrationから呼ぶ場合は`--json`を使う。

---

## What the gate checks

### 1. Section record / Shared Contract lineage

- Section Manifest schema
- linked Shared Contract
- Shared Contract is frozen
- verified foundation commit
- manifest Shared Contract SHA-256 matches actual file
- active worker base commit matches foundation
- worker contract SHA-256 matches manifest

### 2. Breakpoint contract

Frozen specified breakpointについて:

- source is known
- at least one breakpoint exists
- names are unique
- media query and/or numeric boundary exists
- min/max is coherent
- boundary validation viewports exist

会社/デザイナー指定をAIがローカル値で上書きしない。

### 3. Figma section discovery

READY/RUNNINGへ進むsectionは:

- boundary confidence >= MEDIUM
- claimed confidence has evidence
- PC/SP mapping confidence >= MEDIUM or NOT_APPLICABLE
- SP mapping has evidence/node when applicable

LOWのままならworkerを始めず、追加metadata/screenshot/contextで再調査する。

### 4. Dependency graph / parallel planning

- unknown dependency
- self-dependency
- dependency cycle
- dependent sections in same parallel group
- HIGH-coupling sections forced into concurrent group

を検出する。

`section_planner.py`のwaveもadvisory情報として表示する。

### 5. Write ownership

Section workerの`allowed_paths`について:

- exact root only; glob禁止
- same section内のredundant ownership禁止
- concurrent worker間overlap禁止
- root composition禁止
- explicit coordinator-only paths禁止
- global styles禁止
- token sources禁止
- shared component/design-system paths禁止
- verified foundation changed paths禁止

を確認する。

### 6. Worker isolation

Concurrent workersはGit/filesystem isolationを明示する。

Current known modes:

- `BRANCH_WORKTREE`
- `AGENT_SANDBOX`

同じparallel group内では:

- unique isolation ref
- `parallel_safe: true`

が必要。

`SERIAL_SHARED_TREE`は複数worker同時実行に使わない。

### Future isolation tools

新しいtoolを永久拒否しない。

`OTHER`として:

```yaml
isolation:
  mode: OTHER
  ref: "new-tool-worker-S01"
  parallel_safe: true
  notes:
    - "isolated filesystem + independent Git ref verified on tool version X"
```

のように**現在の安全根拠を明示**すれば採用できる。

Toolが正式対応したら専用modeへ昇格してよい。

---

## Discovery → execution flow

### A. Global discovery

CoordinatorがFigma page metadataを読み:

- Header
- MainVisual
- Content sections
- Footer

等の候補を抽出する。

人間が毎回section URL/nodeを手作業で切り出すことを最終形にしない。

### B. Confidence enrichment

AIが:

- semantic layer names
- Auto Layout boundaries
- components
- visual continuity
- PC/SP content identity
- screenshots

を使ってboundary/mapping evidenceを追加する。

LOWなら必要nodeだけ追加取得する。

### C. Shared foundation

- fonts
- tokens
- global breakpoint
- container/gutter
- shared components

を1回だけ実装/再利用してverifyする。

### D. Planner

```bash
python scripts/section_planner.py path/to/section-manifest.yaml
```

Dependency/coupling/write ownershipからsafe wave候補を作る。

### E. Isolation assignment

各wave workerへ:

- worktree / isolated branch
- agent sandbox
- future verified isolation

を割り当てる。

### F. Execution Gate

GateがPASSしたgroupだけworkerを起動する。

---

## Why not auto-fix gate failures

Gateが:

- breakpoint conflict
- stale contract
- low-confidence section mapping
- overlapping write ownership

を見つけた時、勝手に値を変更してPASSさせない。

理由:

- source of truthを壊す
- experiment条件を変える
- section consistencyを失う

ため。

AI coordinatorは原因を解消し、manifest/contractを明示的にrevisionしてから再gateする。

---

## Dashboard direction

将来のEvidence Dashboardでは各sectionを:

```text
DISCOVERED
→ NEEDS_EVIDENCE
→ FOUNDATION_READY
→ EXECUTION_READY
→ RUNNING
→ FIRST_PASS
→ VERIFIED
→ REPAIRED
→ INTEGRATED
```

のstateで表示できる。

Execution Gateは`EXECUTION_READY`判定のbackend候補になる。

表示候補:

- section/node
- discovery confidence
- Shared Contract hash
- foundation commit
- breakpoint contract
- parallel wave
- write ownership
- isolation mode/ref
- first-pass screenshot
- failures
- integration status

---

## Current philosophy

自動化のゴールは「全部勝手にやる」ではなく、**人間がFigma nodeを切り出したり同じ設定を何度も説明する作業を減らしつつ、間違った前提を高速に増殖させないこと**。

安全に自動化できる部分は増やす。

Figma/MCP/agentが進化したら:

- discovery confidence
- whole-page handling
- isolation mechanisms
- auto integration

を再評価し、Gateも更新する。
