# Rework Metrics

このプロジェクトの本当の目標は、Final screenshotを綺麗にするだけではなく、**そこへ到達するまでの戻りを減らすこと**。

Section-first / parallel executionでは特に、section workerの修正量だけを見ない。

```text
Total Rework
= Section Rework
+ Integration Rework
+ Shared/Foundation Rework
+ Human Coordination Cost
```

Sectionが速く完成してもIntegrationへ大量修正を押し付けたら改善ではない。

---

## 1. Scope-separated rework

### Section Rework

担当sectionのFIRST_PASS後に必要だった修正。

記録:

- repair rounds
- files/lines changed
- local component rebuild
- visual failures
- contract violations
- human hints

### Integration Rework

section統合後に初めて発生した修正。

記録:

- integration repair rounds
- cross-section spacing fixes
- container alignment fixes
- background continuity fixes
- z-index/overlap fixes
- breakpoint continuity fixes
- root composition changes
- integration regressions

### Shared/Foundation Rework

Parallel開始後にshared foundationを変更する必要が出た場合。

記録:

- Shared Contract revisions
- foundation rebuild/reverify count
- shared components added/changed
- token/font/container/breakpoint changes
- affected section count
- re-run section count

この値が大きい場合、Global Reconnaissance / Shared Contract準備が不足していた可能性が高い。

---

## 2. Core signals

### Repair rounds

Verify → Repair回数。

`SECTION` と `INTEGRATION` を別に数える。

```yaml
section_repair_rounds: 1
integration_repair_rounds: 2
```

少ないほどよいが、1回の巨大repairへまとめることは評価しない。

### Post-first-pass code churn

可能なら:

- files changed after section first-pass
- lines added/deleted
- components rebuilt
- integration-only changed files/lines
- shared foundation changed files/lines

を分離する。

### Failure count

- S1
- S2
- S3
- S4

加えてcategory別:

- local visual
- shared contract
- breakpoint
- section isolation
- integration

を集計すると改善箇所が分かりやすい。

### Rebuild count

分ける:

- local component rebuild
- section rebuild
- shared component rebuild
- foundation rebuild

### Human intervention

例:

- none
- clarification only
- targeted hint
- coordinator decision
- manual code edit
- manual visual adjustment
- manual merge/conflict resolution

COMMON section first-passでは原則`none`。

### Contract revision count

Parallel開始後にShared Contract revisionが何回変わったか。

理想:

```text
0
```

変更自体を禁止しない。必要な修正は正しい。

ただし頻発するならpreflight/foundation不足のsignal。

### Affected-section fanout

1つのshared changeにより何sectionの更新が必要になったか。

```text
Fanout = affected sections / total sections
```

Shared changeのコストを見る補助指標。

### Parallel merge conflicts

- conflict count
- manually resolved files
- duplicate implementation discovered

を記録する。

### Agent interaction turns

可能な範囲で:

- reconnaissance turns
- foundation turns
- section pre-implementation turns
- section repair turns
- integration turns

Client間で意味が違うため補助指標。

---

## 3. Rework Efficiency /10

Scoreは**run scope内**で採点する。

### SECTION /10

#### 10
- material local repairほぼなし
- S2/S3なし
- contract violationなし
- manual editなし

#### 8–9
- 1–2 targeted local repairs
- rebuildなし
- shared change不要

#### 6–7
- 複数local repair
- component一部作り直し
- targeted human hint

#### 3–5
- section/component rebuild
- repeated regression
- shared changeが必要

#### 0–2
- first-passをsection土台として使いにくい
- 大規模再実装
- wrong contract/foundationでinvalidに近い

### INTEGRATION /10

#### 10
- sectionsをほぼそのままcompose
- material integration repairなし

#### 8–9
- 1–2 cross-section local fix
- shared foundation変更なし

#### 6–7
- 複数integration fix
- container/rhythm等の調整あり

#### 3–5
- several sectionsへ修正fanout
- shared rule revisionが必要
- repeated integration regression

#### 0–2
- section outputを大幅に作り直す
- parallel strategyが実質的に失敗
- incompatible contract outputsが混在

SECTION scoreとINTEGRATION scoreを直接平均してagent rankingしない。

---

## 4. Total delivery diagnostics

実務速度/手戻りを見るため、experiment全体では以下を別集計する。

### Total Repair Rounds

```text
Σ section repair rounds
+ integration repair rounds
+ shared/foundation revision rounds
```

Parallelの場合、単純合計だけでなく`critical path`も将来計測候補。

### Integration Tax

並列化により発生した追加負担の候補metric。

```text
IntegrationTax
= integration-only material failures
+ merge conflicts
+ shared-rule drift
+ post-parallel shared revisions
```

まだ固定KPIではない。

### Parallel Benefit

時間を正確に取得できる場合:

- serial wall-clock estimate
- parallel wall-clock
- integration overhead

を比較する。

ただしmodel/network speed差が大きいため、quality/reworkを犠牲にした高速化は成功扱いしない。

---

## 5. Better metric than elapsed minutes

時間は環境/network/model speedで揺れる。

主要比較では:

1. First-pass Fidelity
2. repair rounds by scope
3. severity-weighted failures
4. contract violations
5. integration load
6. post-first-pass churn
7. human intervention
8. contract/foundation revisions

を優先する。

Elapsed timeは補助。

---

## 6. Severity-weighted failure load

将来自動集計する候補:

```text
FailureLoad = S1*1 + S2*3 + S3*8 + S4*20
```

まだCandidate metric。

SectionとIntegrationを分けて計算する。

---

## 7. Coordination quality signals

Shared Contract preparationの精度を見る。

良い傾向:

- parallel開始後contract revisionが少ない
- breakpoint exception proposalが少ない
- duplicate shared primitiveが少ない
- worker allowed-path violationが0
- foundation mismatchが0
- integration-only S2/S3が少ない

悪い傾向:

- workerごとにshared change提案が頻発
- 同じshared primitiveを複数sectionが必要とする
- integrationでcontainer/font/breakpointを全面修正

この場合、section worker能力よりGlobal Reconnaissance/Shared Foundationを改善する。

---

## 8. Target trend

理想:

- Final Fidelityは高い
- Section First-passが上がる
- Section Repairが減る
- Integration Repairも減る
- contract revisionが減る
- foundation fanoutが減る
- S2/S3が減る
- human manual editが減る
- safe parallelismを増やしてもIntegration Taxが増えない

つまり「修正能力が高いAI」ではなく、**並列化しても最初から外しにくい工程**へ移行する。
