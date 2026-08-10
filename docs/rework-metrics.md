# Rework Metrics

このプロジェクトの本当の目標は、Final screenshotを綺麗にするだけではなく、**そこへ到達するまでの戻りを減らすこと**。

主観的な「楽だった」を補うため、repair量を記録する。

## Core signals

### Repair rounds

Verify → Repair の実行回数。

少ないほどよいが、1回の巨大repairで全部直すことを良しとしない。

### Post-first-pass code churn

可能なら計測:

- files changed after first-pass
- lines added/deleted after first-pass
- components rebuilt after first-pass

`Final - FirstPass` のdiffをreworkとして見る。

### Failure count

- S1 count
- S2 count
- S3 count
- S4 invalid-run count

特に S2/S3 の減少を重視する。

### Rebuild count

局所修正ではなくsection/componentを作り直した回数。

### Human intervention

- none
- clarification only
- targeted hint
- manual code edit
- manual visual adjustment

COMMON first-passでは human intervention を原則 `none` にする。

### Agent interaction turns

可能な範囲で:

- pre-implementation turns
- repair turns
- total turns

ただしclientによってturnの意味が違うため補助指標。

## Rework Cost score /10

### 10
- material repairほぼなし
- S2/S3なし
- manual editなし

### 8–9
- 1–2 targeted repairs
- section rebuildなし
- manual editなし/ごく軽微

### 6–7
- 複数局所repair
- S2が複数
- componentの一部作り直し

### 3–5
- section rebuild
- repeated regression
- human guidanceがかなり必要

### 0–2
- first-passを土台として使いにくい
- 大規模作り直し
- referenceを読み直して再実装が必要

## Better metric than elapsed minutes

時間は環境・network・model speedで揺れる。

そのため主要比較では:

1. repair rounds
2. severity-weighted failures
3. post-first-pass churn
4. human intervention

を優先する。

経過時間は補助情報としてのみ保存してよい。

## Severity-weighted failure load

将来自動集計する場合の候補:

```text
FailureLoad = S1*1 + S2*3 + S3*8 + S4*20
```

これはまだCandidate metric。実験データが貯まるまで固定KPIにしない。

## Target trend

理想的な改善:

- Final Scoreは高いまま
- First-pass Scoreが上がる
- Repair Gainが小さくなる
- Repair roundsが減る
- post-first-pass churnが減る
- S2/S3が減る

つまり「修正能力が高いAI」から、**最初から外しにくい工程**へ移行する。
