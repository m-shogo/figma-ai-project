# Workflow — Figma ↔ AI Reproduction Lab

このworkflowは **reference designを作る工程ではなく、既に決まったreferenceを再現する工程**。

Production defaultはsection-first。Whole-page one-shotはbenchmarkとして別扱い。

関連契約:

- Reference: `docs/reference-contract.md`
- Breakpoints: `docs/responsive-breakpoint-policy.md`
- Section execution: `docs/section-execution.md`
- CSS: `docs/css-strategy.md`
- Context: `docs/context-package.md`
- Run fairness: `docs/run-contract.md`
- Verification: `docs/visual-verification.md`
- Failures: `docs/failure-taxonomy.md`
- Evaluation: `docs/evaluation-rubric.md`
- Knowledge: `docs/knowledge-promotion.md`

---

## 0. Tooling update preflight

重要run前に:

- Figma release notes
- current Figma MCP docs/tools
- current agent/client docs
- recent practitioner/community signals

を確認する。

過去のfailure/workaroundを現在も正しいと自動仮定しない。

---

## 1. Freeze the external reference

`templates/reference-manifest.yaml` を作成する。

固定する:

- Figma file / target node(s)
- actual PC/SP/other reference frames
- exact acceptance viewport(s)
- states / variants
- assets
- component / variable / layout information
- responsive behavior
- breakpoint evidence/source
- target codebase starting commit
- material UNKNOWNs

repo側から1440/390/768などを発明しない。

途中で原本が変わったらreference revisionを分ける。

---

## 2. Global reconnaissance — no implementation

Coordinatorがページ全体を調査する。

順序:

1. codebase/style/design-system rules
2. company/designer breakpoint specification
3. Figma top-level metadata/hierarchy
4. section boundaries
5. components/variants/Code Connect
6. variables/tokens/modes
7. fonts/typography
8. Auto Layout/Grid/sizing
9. PC/SP behavior
10. assets/states/annotations

大frameはmetadata等で狭めてからsection nodeを深く読む。

---

## 3. Build Shared Contract DRAFT

`templates/shared-contract.yaml`

全sectionで共通化する:

- styling architecture
- fonts
- tokens
- container/gutter
- breakpoint source + exact values/query
- shared components
- assets
- accessibility baseline
- coordinator-only paths

breakpointは案件指定を優先する。

---

## 4. Build Section Manifest DRAFT

`templates/section-manifest.yaml`

例:

```text
S01 Header
S02 MainVisual
S03 Content01
S04 Content02
S05 Footer
```

各sectionへ:

- exact Figma node
- PC/SP evidence
- relevant context
- dependencies
- responsive behavior at shared breakpoint
- allowed code paths

を割り当てる。

---

## 5. Implement shared foundation — serial

section並列より先に:

1. fonts
2. tokens
3. global breakpoint binding
4. container/gutter/layout primitives
5. shared components
6. shared asset helpers

を実装/確認する。

既存projectに正本があれば再利用する。

---

## 6. Verify foundation and freeze contract

Foundationで:

- build/type/lint
- font loading
- token resolution
- shared component rendering
- global container
- specified breakpoint consistency

を確認する。

成功後:

```text
foundation.status = VERIFIED
foundation.commit = <commit>
shared contract status = FROZEN
freeze.ready = true
```

Shared contract SHA-256をSection Manifestへ保存する。

ここがparallel開始gate。

---

## 7. Section-scoped Inspect

各workerは担当sectionだけを深く読む。

Input:

- frozen shared contract + hash
- verified foundation commit
- section manifest entry
- exact Figma node(s)
- screenshot evidence
- relevant structured context

このphaseではコードを変更しない。

記録:

- shared component reuse
- local layout
- assets
- section behavior at shared breakpoint
- UNKNOWNs

---

## 8. Section FIRST_PASS implementation

Workerはallowed paths内だけ変更する。

変更禁止/提案のみ:

- shared tokens
- fonts
- root composition
- global breakpoints
- shared components
- other sections

必要なら:

- `PROPOSE_SHARED_CHANGE`
- `PROPOSE_BREAKPOINT_EXCEPTION`

を返す。

FIRST_PASS commit/stateを保存する。

---

## 9. Section evidence capture

Reference exact viewport/stateでcaptureする。

- stable content
- webfont loaded
- deterministic data
- animation policy fixed

PC/SPと必要な状態を保存する。

---

## 10. Section Verify — diagnosis only

原則コードを直さず比較する。

### Visual

- geometry
- spacing
- typography/wrapping
- color/effects
- asset/crop
- layer order

### Structural

- component reuse
- token reuse
- shared breakpoint compliance
- semantic hierarchy
- accessibility
- allowed-path isolation

Mismatchをfailure record化する。

---

## 11. Parallel section execution

Foundation freeze後、独立sectionは並列実装してよい。

安全条件:

- same shared contract hash
- same foundation commit
- disjoint allowed paths
- shared files read-only
- no independent breakpoint changes

満たせないsectionはserial/coordinatedへ戻す。

---

## 12. Coordinator integration

Section outputを統合する。

確認:

- section order
- cross-section spacing/rhythm
- background continuity
- container alignment
- typography consistency
- shared component consistency
- breakpoint consistency
- z-index/layer overlap
- global overflow
- responsive continuity

Section単体の一致だけで完成扱いしない。

---

## 13. Global capture / Verify

統合後のページをPC/SPおよび指定breakpoint境界でcaptureする。

目的:

- section間のズレ
- breakpoint boundary failure
- accumulated spacing error
- full-page overflow
- shared rule drift

を見つける。

---

## 14. Score FIRST_PASS

`docs/evaluation-rubric.md`

```text
First-pass Fidelity /80
= Visual /40
+ Structural /25
+ Robustness /15
```

section runとintegration runのscopeを混ぜず記録する。

この時点ではReproducibilityを採点しない。

---

## 15. Classify root causes

`docs/failure-taxonomy.md`

- severity
- primary/secondary category
- evidence
- root cause
- confidence
- repair scope

を記録する。

「なんとなく違う」で終わらせない。

---

## 16. Targeted Repair

同じroot causeを共有するfailureだけまとめる。

Repair後:

- affected section/viewportを再capture
- regression確認
- integrationへの影響確認

Shared contract変更が必要ならworker内で直さずcoordinatorへ戻す。

---

## 17. Shared contract change handling

Parallel開始後にshared changeが承認された場合:

1. new workers開始停止
2. shared change実装
3. foundation再verify
4. new foundation commit
5. contract revision/new hash
6. affected section特定
7. affected outputだけ更新/re-run

異なるcontract hashを無条件で統合しない。

---

## 18. Final Fidelity / Rework

Acceptance到達またはstop時に:

- Final Fidelity /80
- Rework Efficiency /10
- repair rounds
- post-first-pass churn
- human intervention
- remaining failures

を保存する。

---

## 19. Clean Replay

有望な改善はfresh context + clean foundationから再実行する。

既に修理済みcodeを見せない。

Replay後にReproducibility /10を評価する。

---

## 20. Promote knowledge

```text
Observation
  ↓
Candidate Rule
  ↓
Proven Playbook
```

別案件へ持ち出せるものだけ昇格する。

Tool/model更新で再評価可能。

---

## Run scopes

### SECTION

通常のproduction comparison。

同じsection / contract hash / foundation commitでagentやcontextを比較する。

### INTEGRATION

複数sectionを統合したページ全体の整合性を評価する。

### PAGE_BENCHMARK

Whole-page one-shot等を研究するための例外scope。

Production defaultと混ぜない。

---

## Comparison cohorts

### COMMON

同一reference / section / foundation / shared contract / context / prompt / viewport / repair budget。

### OPTIMIZED

agent固有rules/skills/MCP workflowを使用可。

### REPLAY

Candidate ruleの再現性確認。

---

## Definition of a useful experiment

- tooling preflightがある
- referenceがfreezeされている
- shared contract/foundationが追跡可能
- run scopeが明確
- first-pass evidenceがある
- integration evidenceがある
- failure root causeが追える
- clean replayできる
- project-specificとportable knowledgeが分かれている
