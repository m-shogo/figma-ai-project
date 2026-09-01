# Frontend Learning Promotion Policy

Status: ACTIVE

目的は、失敗・発見・レビュー指摘を記録するだけで終わらせず、**再利用可能な知識を適切な時点で昇格・保留・降格・廃止まで処理する**こと。

この文書は `docs/frontend-visual-repair-learning-loop.md` の Learning lifecycle を具体化する。Evidence の正本は `research/frontend-learning-evidence*.yaml`、portable rule は `playbook/candidates/` / `playbook/proven/`、全体の lifecycle state は `config/frontend-implementation-policy.yaml` を正本とする。

## 1. 原則

- 記録しただけでは学習完了ではない。
- 時間だけで昇格しない。**evidence gate + review trigger** の両方を満たす。
- 自動昇格はしない。CI は「レビューすべき時期」を強制するが、ACTIVE / CORE への変更は evidence を読んだ明示的な変更として行う。
- 矛盾 evidence は削除せず、scope 変更・demotion・retire の判断材料として保持する。
- PROJECT_ONLY と portable knowledge を混同しない。

## 2. Lifecycle と昇格 gate

```text
Observation
  ↓ reproduce / root-cause evidence
CANDIDATE
  ↓ independent evidence
ACTIVE / playbook/proven
  ↓ repeated successful reuse
CORE

PROJECT_ONLY / DEPRECATED / RETIRED は横方向の明示状態
```

### Observation → CANDIDATE

次をすべて満たした時点で、その実装runまたはclean replayの終了時に評価する。

- target failure / improvement が明確
- 原因と修正ownerが特定できる
- before/after、run record、または同等の evidence がある
- clean replay を最低1回通す、または同じ保守的 decision boundary が独立に再現する
- scope / known limits / retest trigger が書ける

**タイミング:** 条件を満たしたrunの終了PRで評価する。次案件まで放置しない。

### CANDIDATE → PROJECT_ONLY

同一案件内で2つ以上の独立section/contextに効いたが、会社Theme・案件固有CMS・そのFigma lineageなどへの依存が強くportableと言えない場合。

**タイミング:** 2つ目の独立sectionで再現した時、またはproject closeの早い方。

### CANDIDATE → ACTIVE / `playbook/proven`

原則として次をすべて満たす。

- supporting evidence が2つ以上の distinct reference/context からある
- 2つ目のreference/contextにも、単なる同意ではなく実装・clean replay・runtime QA・Human correction cost等の**結果 evidence**が最低1つある
- target failure が減った、または保守的decision boundaryが実害なく成立したことを説明できる
- unresolved contradiction がない。矛盾がある場合は contradiction review でscopeを解決済み
- known limits / exclusions がportableな形で記述されている

**タイミング:** 2つ目の独立 evidence が入ったrun/PRでpromotion reviewを開始し、原則2日以内に `PROMOTE / KEEP_CANDIDATE / DEMOTE / RETIRE` を明示する。

2つ目のreferenceが「intakeで同じ判断をしただけ」の場合はACTIVEにしない。実装結果が未取得なら `RETEST_REQUIRED` とし、次の具体的evidenceを指定する。

### ACTIVE → CORE

強いdefaultとして常用できるrule。原則として次を満たす。

- ACTIVE化後、3つ目のdistinct reference/contextで再利用され成功
- 少なくとも2つの異なるprojectまたはimplementation familyで成立
- measurable outcomeまたは明確なrework削減 evidence が2件以上
- current tooling / browser / CMS / agent条件で再確認済み
- unresolved contradiction がない

**タイミング:** 3つ目の成功 evidence が入った時、またはそのproject closeの早い方。原則7日以内にreviewする。

## 3. Review triggers — いつ見直すか

候補は次のどれかが起きたら、予定日を待たずreviewする。

1. **同じ失敗を再度踏んだ** — candidateが効かなかった可能性。即review。
2. **別sectionで同じruleが効いた** — PROJECT_ONLY / scope expansion候補。同じPR/runでreview。
3. **別reference/project evidenceが入った** — ACTIVE候補。2日以内。
4. **contradiction / exception が出た** — 同じPR/runでdemotion/scope review。
5. **major tooling / Figma / browser / CMS / model change** — retest triggerに一致した時。
6. **project close / clean replay完了** — そのprojectが触れたcandidateを全件review。
7. **定期review日** — evidence eventが無くても最大14日ごと。

## 4. Anti-stagnation SLA

`playbook/candidates/*.yaml` は `promotion_review` を必須とする。

```yaml
promotion_review:
  last_reviewed_at: "2026-09-02"
  next_review_at: "2026-09-16"
  status: RETEST_REQUIRED
  reason: "Second-reference implementation outcome is still missing."
  trigger: "Review immediately when the next independent clean replay lands."
  evidence_needed:
    - "Measured second-reference implementation outcome"
```

Rules:

- `next_review_at` は通常 `last_reviewed_at` から最大14日。
- `READY_FOR_PROVEN` は最大7日以内に明示的なpromotion decisionへ進める。
- contradiction signalは定期日を待たない。
- 期限超過candidateをCIでFAILにする。
- 期限を延ばすだけの更新は禁止。`reason / trigger / evidence_needed` を具体化する。
- evidenceが来ないcandidateは永遠にCANDIDATEにしない。reviewで `KEEP_CANDIDATE / PROJECT_ONLY / DEMOTE / RETIRE` を選ぶ。

## 5. Promotion review outcome

許可するreview status:

- `KEEP_CANDIDATE` — evidenceは有効だが独立性が不足
- `RETEST_REQUIRED` — 次の検証条件が具体的に決まっている
- `READY_FOR_PROVEN` — ACTIVE/proven gateを満たす見込み。7日以内に昇格判断
- `DEMOTE` — scopeをPROJECT_ONLY等へ狭めるべき
- `RETIRE` — current条件では使わない

Review statusはlifecycle stateそのものではない。たとえば `READY_FOR_PROVEN` と書いただけでACTIVEにはならない。

## 6. CI / scheduled review

`python scripts/audit_frontend_learning_promotion.py` が次を検査する。

- candidateにpromotion review metadataがある
- review日付の整合性
- 14日SLA / 7日READY_FOR_PROVEN SLA
- overdue candidate
- duplicate rule id
- candidateがfrontend learning evidence indexに存在する

PRの `Validate research records` で常時実行し、さらに軽量scheduled workflowで週1回実行する。

Scheduled checkは自動昇格しない。**期限切れを見えないまま蓄積させないためのalarm**である。

## 7. Project-local learningとの接続

案件固有 `IMPLEMENTATION_LEARNINGS.md` 等は生ログとして価値があるが、portable候補はそこで止めない。

```text
project learning
→ run lessons / evidence index
→ CANDIDATE
→ timed review
→ PROJECT_ONLY or ACTIVE/proven or RETIRE
```

同じ学びが複数sectionで再現したら、project documentに追記するだけでなくpromotion reviewを起動する。

## 8. 成功条件

学習システムのKPIは「candidate件数が増えること」ではない。

- 同じHuman指摘の再発が減る
- first-passでreuse/authority/data-owner判断を外す回数が減る
- candidate backlogに期限切れがない
- PROJECT_ONLY / ACTIVE / CORE / RETIREDへ実際に流れる
- 次案件のContext Packageで該当ruleが再利用され、結果が戻ってくる

候補が減ること、retireされることも正常な学習である。
