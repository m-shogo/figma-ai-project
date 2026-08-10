# EXP-XXXX — <single variable under test>

## Status

PLANNED / WAITING_FOR_REFERENCE / RUNNING / COMPLETE / INVALID

## Question

このexperimentで何を1つ切り分けるか。

例:

- C1 structured context → C2 explicit responsive contract でFirst-pass Fidelityは改善するか
- one-shot → staged workflow でrepair roundsは減るか

## Hypothesis

期待する変化と、効くと予想するmetric/failure classを書く。

## Frozen Reference

- Reference ID:
- Manifest:
- Figma file/node(s):
- Starting code commit:

Design固有の寸法・色・構造をここで新しく決めない。Reference manifestを参照する。

## Independent variable

今回変えるものを1つ。

## Controlled variables

変えないもの:

- reference
- starting commit
- viewport(s)
- assets
- acceptance criteria
- agent/model if same-agent A/B
- context tier except the tested dimension
- repair budget

## Runs

| Run ID | Class | Agent | Model | Context | Workflow | Result |
|---|---|---|---|---|---|---|
| | | | | | | |

各run詳細は `templates/run-record.yaml` 形式で保存する。

## First-pass comparison

- Visual Fidelity /40:
- Structural Fidelity /25:
- Robustness /15:
- **First-pass Fidelity /80:**

### Failure profile

| Failure | Severity | Primary category | Root cause confidence |
|---|---|---|---|
| | | | |

## Repair outcome

- Final Fidelity /80:
- Fidelity Gain:
- Rework Efficiency /10:
- Repair rounds:
- Post-first-pass churn:
- Human intervention:

## Clean replay

- Replay run:
- Reproduced: yes / no / not-run
- Reproducibility /10: N/A until replay

## Final Composite

Only when First-pass Fidelity + Rework Efficiency + Reproducibility are all available:

- **Final Composite /100:**

## Result

Hypothesis: supported / not-supported / inconclusive

根拠:

## Lessons

### Observation

- 

### Candidate rule

- 

### Agent-specific

- 

### Project-only

- 

## Next smallest experiment

次に切り分ける不確実性を1つだけ書く。
