# Section Execution Automation

Reference受領後のproduction executionで、人間/AIが同じhash・foundation・Wave・isolation情報を何度も手転記しないためのCLI flow。

## Goal

```text
Frozen contracts
  ↓
Prepare lineage automatically
  ↓
Activate one worker safely
  ↓
Generate pinned Run Record
  ↓
Preflight / execute
```

手作業は「design判断」「本当に必要な例外判断」「evidence review」に寄せ、機械的転記はscriptへ移す。

---

## 1. Prepare Section execution

```bash
python scripts/prepare_section_execution.py \
  experiments/EXP-0001/section-manifest.yaml
```

Defaultはdry-run。

確認:

- Shared ContractがFROZEN
- foundationがVERIFIED
- reference IDs一致
- actual Shared Contract SHA-256
- actual Figma Structure Profile SHA-256
- foundation commit
- planner Waves

Apply:

```bash
python scripts/prepare_section_execution.py \
  experiments/EXP-0001/section-manifest.yaml \
  --apply
```

自動pin:

- `shared_contract_sha256`
- `figma_structure_profile_sha256`
- `foundation_commit`
- planned worker `contract_sha256`
- planned worker `base_commit`
- safe `parallel_group`

Active/completed workerを新Contract/Foundationへsilent repinしない。

---

## 2. Activate a Section worker

Parallel worker:

```bash
python scripts/activate_section_worker.py \
  experiments/EXP-0001/section-manifest.yaml \
  --section-id S02 \
  --isolation-mode BRANCH_WORKTREE \
  --isolation-ref worktree-S02 \
  --agent codex \
  --model <model> 
```

Defaultはdry-run。

Apply:

```bash
... --apply
```

Activation checks:

- Section exists exactly once
- current planner Wave
- isolation ref present
- same active Waveでref重複なし
- READY/RUNNING/COMPLETE identityをsilent rewriteしない

### Serial shared tree

`SERIAL_SHARED_TREE`は永久禁止ではない。

Current rule:

- planner Waveが1 Sectionだけ → activation可
- same Waveに複数Section → concurrent shared-tree executionは拒否

これは「shared treeが悪い」のではなく、**concurrent mutationが危険**という境界。

New agent/runtimeが安全なisolated workspaceを提供した場合は`AGENT_SANDBOX`またはevidence付き`OTHER`で追加できる。

---

## 3. Create pinned SECTION Run Record

Isolated production workerでは:

```bash
python scripts/create_section_run.py \
  --section-manifest experiments/EXP-0001/section-manifest.yaml \
  --reference-manifest references/REF-0001/reference.yaml \
  --experiment-id EXP-0001 \
  --run-id RUN-CODEX-S02-001 \
  --section-id S02 \
  --agent codex \
  --model <model> \
  --output experiments/EXP-0001/runs/RUN-CODEX-S02-001/run.yaml
```

Generated record pins:

- Reference Manifest path/hash
- Shared Contract path/hash
- Section Manifest path/hash
- Figma Structure Profile path/hash
- verified foundation commit
- Section node IDs
- parallel group
- isolation identity
- agent/context/run defaults

### Current compatibility note

The first `create_section_run.py` implementation is intentionally conservative and currently expects an isolated production worker mode.

A singleton `SERIAL_SHARED_TREE` activation is valid policy, but run-record automation for that mode should use the same singleton-wave proof before becoming the canonical path. Do not reinterpret this temporary generator limitation as a permanent workflow prohibition.

This is a **tooling gap / RETEST target**, not negative knowledge about serial execution.

---

## 4. Tooling Update Preflight

Before RUNNING:

- Figma release notes
- Figma MCP current docs/tools
- current agent/client docs
- recent practitioner/community signals

Update the Run Record preflight fields.

`PLANNED → RUNNING` should happen only after:

- required preflight complete
- pinned artifacts still match
- target worker workspace exists
- target route/build is usable

---

## 5. Execute Section stages

```text
01 Section Inspect
→ 02 Section Implement
→ FIRST_PASS capture
→ 03 Verify
→ 04 targeted Repair
```

The worker reads:

- Shared Contract
- exact Section Manifest entry
- exact Section Structure Profile entry
- component/token resolution
- translation mode
- foundation

but does not mutate shared artifacts.

---

## 6. Integration remains coordinator-owned

Section worker completion does not mean page completion.

Coordinator integrates completed outputs and runs:

```text
INTEGRATION
→ cross-section verification
→ breakpoint verification
→ shared/foundation repair if necessary
```

If a shared change is accepted:

```text
new Foundation revision
→ verify
→ new Shared Contract hash
→ re-prepare affected Section execution
```

Do not silently rewrite historical run lineage.

---

## Desired future command

As real runs reveal stable behavior, these steps may later collapse into one orchestrator:

```bash
figma-ai execute-section S02
```

Internally it would still preserve the same gates:

```text
update check
→ lineage check
→ safe Wave/isolation
→ run record
→ inspect
→ implement
→ capture
→ verify
```

Do not build the large orchestrator before real EXP-0001 evidence shows which manual seams actually remain painful.
