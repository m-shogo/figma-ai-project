# Workflow — Figma ↔ AI Reproduction Lab

このworkflowは **reference designを作る工程ではなく、既に決まったreferenceを再現する工程**。

詳細契約:

- Reference: `docs/reference-contract.md`
- Context: `docs/context-package.md`
- Run fairness: `docs/run-contract.md`
- Verification: `docs/visual-verification.md`
- Failures: `docs/failure-taxonomy.md`
- Evaluation: `docs/evaluation-rubric.md`
- Knowledge: `docs/knowledge-promotion.md`

## 0. Freeze the external reference

Referenceを受け取ったら `templates/reference-manifest.yaml` を複製し、実際のFigma値を記録する。

固定する:

- Figma file / target node(s)
- actual PC/SP/other reference frames
- exact acceptance viewport(s)
- states / variants
- assets
- component / variable / layout information
- responsive invariants / material UNKNOWNs
- target codebase starting commit

**repo側から1440/390などの値を発明しない。**

途中で原本が変わったらreference revisionを分ける。

## 1. Select experiment variable

一度に変える研究変数を原則1つ決める。

例:

- C0 → C1 structured context
- C1 → C2 explicit design contract
- one-shot → staged workflow
- Code Connect off → on
- common → agent-specific optimization

model/client更新など制御不能な差はmetadataへ残す。

## 2. Create run record

`templates/run-record.yaml` をrunごとに作る。

固定する:

- reference id
- agent/client/model
- starting commit
- context tier
- prompt version
- viewport(s)
- max repair rounds
- instruction sources
- MCP mode/access

COMMON比較では条件を揃える。

## 3. Inspect — no code changes

`prompts/01-inspect.md`

agentはまず:

- exact Figma structured context
- components / variants
- variables / tokens
- Auto Layout / sizing
- exact assets
- annotations / states
- responsive invariants
- existing repo components/tokens

を調べ、implementation briefを作る。

大きいfileは broad metadata → relevant child node の順で狭く読む。

解決不能なものだけ `UNKNOWN` とする。

## 4. Implement — preserve FIRST_PASS

`prompts/02-implement.md`

Inspect briefから1回目のcoherent implementationを作る。

このphaseではvisual tuningを繰り返さない。

保存する:

- first-pass commit/state
- files changed
- reused components/tokens
- assumptions
- basic build/type/lint result

**FIRST_PASSを失わない。**

## 5. Capture deterministic evidence

Reference manifestのexact viewport/stateで実ブラウザcaptureを行う。

- stable content
- webfont loaded
- deterministic data
- stable scroll/state
- animation policy fixed

Repair前captureを `first-pass/` として保存する。

中間幅が必要な場合はrun条件として先に固定する。

## 6. Verify — diagnosis only

`prompts/03-verify.md`

このphaseでは原則コードを直さない。

比較:

### Visual

- geometry
- spacing
- typography / wrapping
- color / opacity
- border / radius / effects
- assets / crop
- layer order
- responsive ordering/visibility

### Structural

- component reuse
- token reuse
- responsive rules
- semantic hierarchy
- accessibility
- existing project architecture

Material mismatchごとにfailure record候補を作る。

## 7. Score FIRST_PASS

`docs/evaluation-rubric.md`

```text
First-pass Fidelity /80
= Visual /40
+ Structural /25
+ Robustness /15
```

この時点ではReproducibilityを採点しない。

## 8. Classify root causes

`docs/failure-taxonomy.md`

記録する:

- severity S0-S4
- primary category
- secondary category
- evidence
- suspected root cause
- confidence HIGH/MEDIUM/LOW
- smallest repair scope

「なんとなく違う」で終わらせない。

## 9. Targeted Repair

`prompts/04-repair.md`

同じroot causeを共有するfailureだけまとめてよい。

Repair後:

- affected viewportを再capture
- targeted failure改善を確認
- neighboring matched areaのregression確認
- repair roundを保存

別failure classへ勝手に広げない。

## 10. Stop / Final Fidelity / Rework

acceptance到達またはstop condition時に:

- Final Fidelity /80
- Rework Efficiency /10
- repair rounds
- post-first-pass churn
- human intervention
- remaining failures

を記録する。

Finalが高くても戻りが多ければ成功扱いしない。

## 11. Clean Replay

有望なprompt/context/workflow改善は、同じstarting commit + fresh contextからやり直す。

既に修正されたcodeは見せない。

Replay後に初めて `Reproducibility /10` を評価する。

## 12. Promote knowledge

```text
Observation
  ↓ isolated improvement + clean replay
Candidate Rule
  ↓ different reference/contextでも再現
Proven Playbook
```

別案件へ持ち出せるruleだけ `playbook/` へ昇格する。

## Comparison cohorts

### COMMON

同一reference / code baseline / context tier / prompt / viewport / repair budget。

Codex / Claude Code / Cursor のfailure傾向を比較する。

### OPTIMIZED

agent固有rules/skills/MCP workflowを使ってよい。

COMMONと混ぜず、実務上のbest achievable workflowとして測る。

### REPLAY

candidate ruleの再現性確認。

## Definition of a useful experiment

「完成した」だけでは不十分。

- first-pass evidenceがある
- failure root causeが追える
- change variableが明確
- repair前後が残っている
- clean replayできる
- project-specificとportable knowledgeが分かれている

この状態なら、失敗も価値あるデータになる。
