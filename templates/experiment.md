# EXP-XXXX — <single variable under test>

## Status

PLANNED / WAITING_FOR_REFERENCE / RUNNING / COMPLETE / INVALID

## Question

このexperimentで何を1つ切り分けるか。

例:

- same sectionでC1 → C2にするとFirst-pass Fidelityは改善するか
- frozen Shared Contractを渡すとbreakpoint/token driftは減るか
- serial section execution → safe parallel groupsでIntegration Loadを増やさず効率化できるか
- whole-page context → section progressive disclosureでcontext cost/reworkは改善するか

## Hypothesis

期待する変化と、効くと予想するmetric/failure classを書く。

---

## Frozen Reference / Coordination

- Reference ID:
- Reference Manifest:
- Run Scope: SECTION / INTEGRATION / PAGE_BENCHMARK
- Section ID if applicable:
- Exact Figma node(s):
- Shared Contract path:
- Shared Contract SHA-256:
- Verified Foundation commit:
- Section Manifest:
- Breakpoint source/contract:
- Target route:

Design固有の寸法・色・構造/breakpointをここで新しく決めない。Reference/Shared Contractを参照する。

---

## Independent variable

今回変えるものを1つ。

例:

```text
context tier
prompt procedure
Code Connect availability
section vs whole-page context
serial vs parallel execution
```

Shared Contractの有無を変える場合は専用ablation experimentとして明示する。

---

## Controlled variables

変えないもの:

- run scope
- reference revision
- section ID/node if SECTION
- Shared Contract hash unless that is the independent variable
- verified foundation commit
- breakpoint contract
- assets
- viewport/state
- acceptance criteria
- agent/model if same-agent A/B
- context tier except tested dimension
- repair budget

COMMON agent comparisonではagent以外を可能な限り同一にする。

---

## Runs

| Run ID | Scope | Section | Class | Agent | Model | Contract hash | Foundation | Context | Workflow | Result |
|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | |

各run詳細は`templates/run-record.yaml`形式で保存する。

---

## First-pass comparison

同scope/cohort内で比較する。

- Visual Fidelity /40:
- Structural Fidelity /25:
- Robustness /15:
- **First-pass Fidelity /80:**

### Contract Compliance

- contract hash match:
- foundation match:
- unapproved breakpoint count:
- shared-file mutation count:
- allowed-path violations:
- duplicate shared primitive count:

### Failure profile

| Failure | Severity | Primary category | Surface/Section | Root cause confidence |
|---|---|---|---|---|
| | | | | |

---

## Repair outcome

- Final Fidelity /80:
- Fidelity Gain:
- Rework Efficiency /10:
- Repair rounds:
- Post-first-pass churn:
- Human intervention:

### Section-first diagnostics

- Integration-only failures:
- Merge conflicts:
- Shared Contract revisions:
- Foundation rebuilds:
- Affected section count:
- Integration repair rounds:

SECTION experimentだけの場合、未実施のIntegration値を無理に0成功として解釈しない。

---

## Clean replay

- Replay run:
- Same scope/reference/section:
- Same Shared Contract hash:
- Same clean foundation:
- Reproduced: yes / no / not-run
- Reproducibility /10: N/A until replay

---

## Final Composite

First-pass Fidelity + Rework Efficiency + Reproducibilityが揃った同scope runのみ:

- **Final Composite /100:**

SECTION / INTEGRATION / PAGE_BENCHMARKを直接rankingしない。

---

## Result

Hypothesis: supported / not-supported / inconclusive

根拠:

### Confounders

- tool/model update:
- contract/reference changes:
- environment differences:
- unresolved ambiguity:

Confounderが大きければ無理に結論を出さない。

---

## Lessons

### Observation

- 

### Candidate rule

- 

### Agent-specific

- 

### Project-only

- 

### Retest triggers

- Figma/MCP/model update:
- new evidence:

---

## Next smallest experiment

次に切り分ける不確実性を1つだけ書く。
