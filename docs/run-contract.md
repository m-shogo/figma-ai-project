# Agent Run Contract

Codex / Claude Code / Cursorの比較で「agent差」と「条件差」を混同しないための契約。

Production-oriented比較の最小単位は、原則として**同じsection + 同じShared Contract + 同じverified foundation**。

---

## Run scopes

### SECTION

通常のproduction implementation/比較単位。

固定する:

- same frozen reference revision
- same section ID / exact Figma node(s)
- same Shared Contract SHA-256
- same verified foundation commit
- same breakpoint contract
- same assets
- same acceptance viewport/state

### INTEGRATION

複数sectionを統合したページ全体の整合性を見る。

SECTION scoreと直接rankingしない。

固定する:

- same reference revision
- same section output set/cohort
- same Shared Contract hash
- same foundation lineage
- same integration acceptance conditions

### PAGE_BENCHMARK

Whole-page one-shotなど、現在のproduction default以外を研究するscope。

section-firstと比較できるが、SECTION runのagent rankingへ混ぜない。

Tool/model/MCPが進化したら再テスト可能。

---

## Run classes

### COMMON

agent間比較用。

SECTIONの場合、最低限固定する:

- same run scope
- same frozen reference
- same section ID/node
- same Shared Contract hash
- same verified foundation commit
- same context tier
- same common prompt version/hash
- same target viewport/state
- same acceptance criteria
- same max repair rounds
- same dependency policy
- same breakpoint source/value

agent固有の裏技・追加rules・前runの学びは入れない。

### OPTIMIZED

実務上の最高品質を測るrun。

許可する:

- agent固有instructions
- skills/plugins
- prompt segmentation
- client固有MCP workflow
- agent向けtool-use optimization

ただし:

- reference
- section
- Shared Contract
- foundation
- company/designer breakpoint

は勝手に変えない。

COMMONとOPTIMIZEDを同じrankingに混ぜない。

### REPLAY

学習したruleの再現性確認。

SECTION Replayでは:

- same reference revision
- same section
- same frozen Shared Contract
- same clean verified foundation
- fresh session/context
- candidate ruleだけ追加
- previous generated/repair codeは参照しない

を守る。

---

## Production preparation phases

SECTION run開始前にcoordinatorが完了していること:

### G0 — Tooling Preflight

- current Figma release/MCP docs確認
- agent/client current docs確認
- recent community signal確認

### G1 — Reference Freeze

- reference ready
- external breakpoint evidence/source記録
- code baseline固定

### G2 — Global Reconnaissance

- codebase/design system
- company/designer responsive rules
- top-level Figma structure
- components/variables/fonts/assets
- section boundaries

を調査する。

### G3 — Shared Contract DRAFT

- styling
- fonts
- tokens
- global breakpoint
- container/gutter
- shared components
- asset policy

を正規化する。

### G4 — Shared Foundation

共通実装を作成/再利用しverifyする。

### G5 — Contract Freeze

```text
foundation.status = VERIFIED
Shared Contract = FROZEN
contract hash fixed
section manifest binds hash + foundation commit
```

ここまでがSECTION parallel開始gate。

---

## SECTION run phases

### P0 — Section Preflight

確認:

- section manifest entry exists
- Shared Contract hash matches
- foundation commit matches
- code starts from foundation commit
- allowed paths known
- shared paths read-only
- exact section Figma node available

### P1 — Inspect

コード変更禁止。

担当sectionだけを中心に:

- structured Figma context
- relevant components/variants
- relevant variables/tokens
- local Auto Layout/Grid/sizing
- assets/crop
- states
- behavior at shared breakpoint
- code reuse targets

をまとめる。

必要contextはprogressive disclosureで取得し、他sectionを念のため全部読まない。

### P2 — Implement

Inspect結果とfrozen contractを使ってfirst-passを作る。

Workerは:

- allowed pathのみ変更
- shared files変更禁止
- global breakpoint追加/変更禁止
- shared component重複作成禁止

を守る。

**FIRST_PASSを必ず保存する。**

### P3 — Verify

- exact reference viewport(s)
- specified breakpoint boundary
- visual comparison
- structural checks
- contract compliance
- overflow/wrapping/state checks

コードは原則直さない。

### P4 — Repair

failure class/root cause単位で修正。

shared変更が必要ならworker内で直接直さず:

- `PROPOSE_SHARED_CHANGE`
- `PROPOSE_BREAKPOINT_EXCEPTION`

へ戻す。

### P5 — Record

- scores
- failures
- repairs
- assumptions
- context use
- contract compliance
- reusable lessons

### P6 — Replay when warranted

Candidate improvementをsame clean foundationから再実行する。

---

## INTEGRATION run phases

Coordinatorが:

1. section output lineage検証
2. same contract hash確認
3. same foundation確認
4. root composition
5. full-page capture
6. cross-section failure診断
7. integration repair

を行う。

Section単体の成功がintegration reworkへ押し付けられていないか別記録する。

---

## First-pass preservation

最重要ルール。

保存:

- first-pass commit/state
- first-pass screenshot
- first-pass score
- first-pass failure list
- run scope
- section ID
- contract hash
- foundation commit

Finalだけ残すと「戻りが減ったか」を測れない。

---

## Fairness rules

COMMON比較では禁止:

- Claudeだけhuman repair hintあり
- Cursorだけ前agentのdiffを見る
- CodexだけCode Connect有効
- agentごとにsection nodeが違う
- Shared Contract hashが違う
- foundation commitが違う
- breakpoint contractが違う
- viewport/stateが違う
- repair budgetが違う

違いを入れる場合はexperiment variableとして明示する。

---

## One-variable principle

改善実験では原則1つだけ変える。

例:

- C1 → C2
- whole-page context → section progressive disclosure
- no Shared Contract → frozen Shared Contract
- serial → safe parallel
- Code Connect off → on
- staged procedure off → on

model/client/Figma updateなど制御不能な差はmetadataへ記録する。

---

## Contract changes during runs

Shared Contract/Foundationが変わったら同一条件runではなくなる。

Parallel実装中に変更承認された場合:

1. new worker start停止
2. coordinatorがshared change
3. foundation再verify
4. new foundation commit
5. new contract revision/hash
6. affected section特定
7. affected sectionだけ更新/re-run

旧hashのrunを新hash cohortへ混ぜない。

---

## Stop conditions

Repair停止条件:

- acceptance到達
- max repair rounds到達
- reference/shared-rule ambiguityで評価不能
- environment/tool blocker
- repairが別failure classを悪化させ続ける
- shared changeが必要でsection worker scopeを超える

止めた理由もdata。

---

## Result interpretation

「Agent A 76/80、B 73/80」で即優劣を決めない。

見る順序:

1. same scope/cohortか
2. First-pass Fidelity
3. failure profile
4. contract compliance
5. Rework Efficiency
6. integration load
7. clean replay stability
8. context cost
9. portability

**1回の最高点より、同じcontractで再現する工程を優先する。**
