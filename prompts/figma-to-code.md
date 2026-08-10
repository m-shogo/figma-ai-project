# Figma → Code Prompt Architecture

このファイルは巨大な完成promptではなく、**section-first production workflowの入口**。

Reference design自体はこのrepoで作らない。

---

## Production flow

### Coordinator preparation

1. `00-global-reconnaissance.md`
   - page全体は実装せず調査
   - codebase/company rules
   - breakpoint source
   - Figma hierarchy
   - shared components/variables/fonts
   - section boundaries

2. `00-shared-foundation.md`
   - fonts/tokens/breakpoints/container/shared componentsを実装/再利用
   - foundationをverify
   - Shared Contractをfreeze/hash

### Section workers

3. `01-inspect.md`
   - assigned sectionだけ深掘り
   - shared contract/foundation lineage確認

4. `02-implement.md`
   - allowed pathsだけでFIRST_PASS
   - shared files/breakpointsはread-only

5. `03-verify.md`
   - codeを直さずsection mismatch/contract violationを診断

6. `04-repair.md`
   - selected root causeだけtargeted repair

### Coordinator integration

7. `05-integrate.md`
   - same contract hash/foundationのsectionだけ統合
   - cross-section spacing/container/background/z-index/breakpoint continuityを検証

---

## Why role-separated

1agentに:

```text
全Figmaを理解
→ shared systemを作る
→ 全sectionを実装
→ visual comparison
→ repair
```

まで一度に任せると:

- contextが膨らむ
- first-passが消える
- sectionごとのfailure attributionが弱い
- shared ruleを途中で再発明しやすい
- parallel化しにくい
- integration reworkが見えにくい

ため、**Coordinator / Shared Foundation / Section Worker / Integration**へ責務を分ける。

Whole-page one-shotは`PAGE_BENCHMARK`として比較研究には残す。

---

## Coordination Envelope

Production SECTION runでは、prompt本文より先に以下を固定する。

```text
EXPERIMENT_ID=
RUN_ID=
RUN_SCOPE=SECTION
REFERENCE_MANIFEST=
SECTION_ID=
SECTION_MANIFEST=
SHARED_CONTRACT=
SHARED_CONTRACT_SHA256=
FOUNDATION_COMMIT=
TARGET_REPOSITORY=
TARGET_ROUTE=
ACCEPTANCE_VIEWPORTS=
MAX_REPAIR_ROUNDS=
```

Section workerが自由に変えないもの:

- Reference revision
- Shared Contract
- foundation commit
- company/designer breakpoint contract
- section ownership/allowed paths

---

## Context Tier

Coordination Envelopeとは別に、design/code context量をC0–C4で比較する。

```text
C0 visual/minimal
C1 structured Figma
C2 explicit section contract
C3 codebase-aware
C4 Code Connect/design-system connected
```

Context tierを下げるためにShared Contract/Foundation lineageまで消さない。

Shared Contract自体の効果を測る場合のみ専用ablation experimentへ分ける。

---

## Breakpoint rule

Production defaultでは:

- owner/company/design-system/existing-product指定をsource of truth
- page/プロジェクト共通contractとして全sectionへ適用
- section workerはその境界で起きるbehaviorだけ実装
- local thresholdを勝手に追加しない

必要なら:

```text
PROPOSE_BREAKPOINT_EXCEPTION
```

を返す。

AIが「壊れる幅」を探索することはdiagnostic researchとして可能だが、明示指定を置換しない。

---

## Parallel execution

Section parallelismはShared Contract/Foundation freeze後のみ。

同時実行条件:

- same contract hash
- same foundation commit
- dependency-free in the same group
- non-overlapping allowed paths
- shared files read-only
- HIGH integration-coupling sectionを無理に同groupへ入れない

Section Manifest/CIで可能な範囲を検証する。

---

## COMMON vs OPTIMIZED

### COMMON

Codex / Claude Code / Cursorで:

- same section
- same contract hash
- same foundation
- same breakpoint
- same context tier
- same stage prompt version

を使う。

### OPTIMIZED

role/contract境界は維持しつつ:

- agent固有skills
- client固有MCP usage
- prompt segmentation
- tool orchestration

を最適化してよい。

COMMONと別cohortで評価する。

---

## PAGE_BENCHMARK / one-shot

Tool/model進化を観測するためWhole-page one-shotを残す。

比較時は:

- same frozen reference
- same project rules
- same assets
- comparable acceptance conditions

を揃える。

一度失敗しても永久禁止にしない。

Major Figma/MCP/model update後に`RETEST_NOW`へ戻せる。

---

## First-pass rule

Section / Integrationとも、repair前の状態を残す。

- commit/state
- screenshots
- score
- failure list
- contract hash/foundation

Finalだけ保存しない。

---

## Design facts vs workflow

**Design factをprompt architectureへ埋め込まない。**

- 原本/案件指定 → Reference Manifest
- 実装共通正本 → Shared Contract
- section ownership/dependency → Section Manifest
- experiment/run条件 → Run Record
- 汎用procedure → prompts/docs

に分離する。

これにより別案件へworkflowを持ち出しても、前案件のdesign値を引きずらない。
