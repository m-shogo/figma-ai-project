# First Pass → Final → Clean Replay Protocol

実Figmaを使うproduction experimentでは、**納品物を100点へ近づける工程**と、**figma-ai-project自体が改善したか測る工程**を分離する。

同じ実装を何度も修正して最終的に高品質になっても、それだけでは次回のFirst Passが改善した証拠にならない。

Canonical measurementは次の三点を保存する。

```text
RUN A FIRST PASS
→ TARGETED REPAIR
→ RUN A FINAL
→ ROOT CAUSE / KNOWLEDGE UPDATE
→ RUN B CLEAN REPLAY FIRST PASS
```

---

## 1. Three mandatory checkpoints

### A. RUN A — FIRST PASS

今回固定したproduction flowを、基盤versionを途中変更せず最後まで実行する。

```text
Company Policy
+ Update Radar snapshot
+ Existing Codebase
+ Frozen Figma Reference
+ Environment Contract
+ Shared Contract / Foundation
+ Section execution plan
        ↓
SECTION workers
        ↓
BOUNDARY / CLUSTER
        ↓
INTEGRATION / FULL PAGE
        ↓
FIRST PASS FREEZE
```

FIRST PASS freeze時点では、material mismatchを直すためのTargeted Repairをまだ行わない。

必ず保存するもの:

- exact foundation/base commit
- figma-ai-project / policy / contract lineage
- agent/model/tool versions
- Section FIRST_PASS captures
- Boundary/Cluster evidence where applicable
- Full Page FIRST_PASS evidence
- Required Environment evidence
- First-pass Fidelity
- failure taxonomy
- assumptions / conflicts

FIRST PASSのcommit/captureを後のrepairで上書きしない。

### B. RUN A — FINAL

FIRST PASSを保存した後、同じ実装をTargeted Repairして納品品質へ近づける。

目標は原則として**referenceとCompany Policyが許す範囲で98–100点相当のFinal quality**。

Repair対象の例:

- typography / text wrapping
- image crop / asset mismatch
- hard geometry
- Section local spacing
- Boundary spacing / background / z-index
- Required Environment固有のsafe-area / viewport / input behavior
- interaction / accessibility mismatch

Repairは原因単位で行い、magic numberを積み重ねてfailure原因を隠さない。

保存するもの:

- repair rounds by scope
- code churn after FIRST PASS
- rebuilt components/sections
- integration-only repairs
- environment-specific repairs
- shared/foundation revisions
- human intervention
- Final Fidelity

### C. RUN B — CLEAN REPLAY

RUN Aの失敗を分析し、再利用可能な改善をfigma-ai-project / policy / playbook / toolingへ反映した後、**別のclean isolationからゼロ実装する**。

RUN BはRUN Aの完成コードをコピー・参照してはいけない。

推奨isolation:

- fresh worktree from the original clean baseline
- fresh clone when stronger isolation is useful
- agent-provided fresh isolated sandbox

RUN Bが利用してよいもの:

```text
Original target repository baseline
Original Frozen Figma Reference
Company Policy
Current Update Radar
Improved figma-ai-project rules/tooling
Approved project evidence/contracts regenerated from source evidence
```

原則利用禁止:

- RUN A FINAL implementation code
- RUN A repair diff as implementation template
- memorized pixel offsets from RUN A
- project-specific magic values promoted without evidence

RUN BもまずFIRST PASSをfreezeして採点する。

---

## 2. What proves the system improved

最重要比較はFinal vs Finalではない。

```text
RUN A FIRST PASS
vs
RUN B CLEAN REPLAY FIRST PASS
```

例:

```text
RUN A First Pass    84
RUN A Final         99
RUN B First Pass    94
RUN B Final         99
```

この場合、Final qualityだけでなくFirst Passが `84 → 94` に改善しているため、workflow/knowledge改善が次回へ移植できた可能性が高い。

逆に:

```text
RUN A First Pass    84
RUN A Final         99
RUN B First Pass    85
```

なら、RUN Aの99点は個別repair能力の成果であり、基盤自体の改善はまだ弱い。

---

## 3. First Pass target and Final target

固定された永久thresholdではなく、current operational targetとして以下を使う。

### First Pass Production target

- initial practical target: **80–90+ quality range**
- next maturity target: **90+**
- mature target candidate: **95+ with low rework**

First Passで100点を要求して、内部で無制限repairしてからFIRST_PASSと呼ぶことは禁止。

### Final target

- **98–100相当**を目標
- unresolved Figma ambiguity / Company Policy conflict / browser raster difference等は明示的に残す
- unsupported claimsを100点扱いしない

Finalが高くてもReworkが大きければ、figma-ai-projectのFirst Pass性能が高いとは判定しない。

---

## 4. Baseline version freeze during RUN A

RUN AのFIRST PASS計測中に、figma-ai-projectのルールやgeneratorを逐次変更しない。

悪い例:

```text
S01 failure
→ core playbookを変更
→ S02は新ルールで実装
→ 同じFIRST PASSとして集計
```

これでは条件が混ざる。

基本:

```text
RUN A start
→ baseline tooling/rules freeze
→ all planned Sections / Integration
→ FIRST PASS freeze
→ Repair / RCA
→ knowledge/tooling update
→ RUN B clean replay
```

重大なS4 invalid conditionが発覚した場合は、runをinvalidとして停止・再計画する。

---

## 5. Repair is production work; Replay is research proof

Targeted Repairは必要であり、悪ではない。

目的は:

- 実案件を納品品質へ持っていく
- どこで外れたか観測する
- root causeを分類する

一方Clean Replayの目的は:

- repair履歴を知らない状態でも改善が再現するか
- 次の案件でFirst Pass Reworkが減るか
- project-specific overfitではないか

を確かめること。

この二つを同じmetricへ混ぜない。

---

## 6. Failure → knowledge promotion boundary

RUN Aで見つかった全修正をgeneric ruleへ昇格させない。

例:

```text
"このHeroだけ margin-top: 37px"
→ PROJECT_ONLY
```

一方:

```text
GLOBAL Figma annotationがSection worker contextから欠落し、複数Sectionで同種failure
→ workflow/tooling improvement candidate
```

Root causeは少なくとも次へ分類する。

- AGENT_EXECUTION
- CONTEXT_DELIVERY
- SHARED_CONTRACT
- FOUNDATION
- SECTION_BOUNDARY
- FIGMA_AMBIGUITY
- COMPANY_POLICY_CONFLICT
- ENVIRONMENT_ADAPTATION
- TOOL_CAPABILITY
- PROJECT_ONLY

Promotionは既存Evidence Maturityに従う。

```text
Observation
→ local experiment
→ clean replay
→ cross-run/reference evidence
→ promotion
```

---

## 7. Required comparison metrics

RUN A / RUN B比較では最低限:

| Metric | RUN A | RUN B |
|---|---:|---:|
| First-pass Fidelity | record | record |
| Final Fidelity | record | record when repaired |
| Section repair rounds | record | record |
| Boundary/Integration repair rounds | record | record |
| Environment repair rounds | record | record |
| Shared/Foundation revisions | record | record |
| Rebuild count | record | record |
| Human intervention | record | record |
| S1/S2/S3/S4 | record | record |
| Post-first-pass churn | record | record |

Useful derived diagnostics:

```text
First Pass Improvement
= RUN B First-pass Fidelity - RUN A First-pass Fidelity

Repair Reduction
= RUN A Total Repair Load - RUN B Total Repair Load
```

Score improvementだけでなく、repair/rebuild/human interventionが減っていることを重視する。

---

## 8. Avoid false improvement

以下を改善と誤認しない。

- RUN A FINALをRUN Bへコピーした
- RUN B agent contextへRUN Aの完成コードを含めた
- hidden/manual repairをFIRST PASS前に行った
- First Pass captureをFinalで上書きした
- Reference revisionがRUN A/Bで変わった
- Company Policy / Required Environment条件が変わったのに同条件比較した
- project-specific fixesをgeneric ruleとして過学習した
- Final scoreだけ比較した

条件が変わった場合はpaired A/Bではなく別experimentとして扱う。

---

## 9. Cross-reference validation

1つのReferenceでRUN Bが改善してもportable improvementとは限らない。

将来的には複数Referenceで確認する。

```text
Reference A: 84 → 95
Reference B: 87 → 94
Reference C: 82 → 93
```

なら汎用改善の信頼度が高まる。

```text
A: 84 → 98
B: 86 → 86
C: 83 → 82
```

ならReference Aへのoverfitを疑う。

Company-wide ruleへのpromotionにはcross-reference evidenceを優先する。

---

## 10. Definition of success

figma-ai-projectの成功は:

```text
Final screenshotを100点へ近づけられる
```

だけではない。

目標は:

```text
高いFinal quality
+
高いClean Replay First Pass
+
少ないRepair
+
少ないRebuild
+
少ないHuman Intervention
+
Required Environmentで再現可能
```

つまり、**今回100点へ直せる工程から、次回は最初から外しにくい工程へ進化すること**を測る。

Related canonical docs:

- `docs/evaluation-rubric.md`
- `docs/rework-metrics.md`
- `docs/evidence-policy.md`
- `docs/knowledge-promotion.md`
- `docs/run-contract.md`
