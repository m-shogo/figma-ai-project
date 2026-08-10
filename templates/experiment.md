# EXP-XXXX — <single variable under test>

## Status

PLANNED / WAITING_FOR_REFERENCE / RUNNING / COMPLETE / INVALID

## Question

このexperimentで何を1つ切り分けるか。

例:

- C1 structured context → C2 explicit responsive contract でFirst-passは改善するか
- one-shot → staged workflow でrepair roundsは減るか

## Hypothesis

期待する変化と、効くと予想するmetric/failure classを書く。

## Frozen Reference

- Reference ID:
- Manifest: `references/.../reference.yaml`
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

### Metrics

- Visual Fidelity:
- Structural Fidelity:
- Robustness:
- Rework Cost:
- First-pass total:

### Failure profile

| Failure | Severity | Primary category | Root cause confidence |
|---|---|---|---|
| | | | |

## Repair / replay

改善を試した場合:

- isolated change:
- affected failure class:
- before:
- after:
- clean replay run:
- reproduced: yes / no

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
