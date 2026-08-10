# Production Execution Gate

Production section workerを起動する直前の**current canonical preflight**。

Section safetyだけでなく、実際のFigma内部構造に合ったtranslation strategyまで確認する。

## Command

```bash
python scripts/production_execution_gate.py \
  path/to/section-manifest.yaml \
  path/to/figma-structure-profile.yaml
```

Machine-readable:

```bash
python scripts/production_execution_gate.py \
  path/to/section-manifest.yaml \
  path/to/figma-structure-profile.yaml \
  --json
```

---

## Combined checks

### Figma structure

- Structure Profile schema/semantic validation
- active section has matching profile entry
- actual Figma node mapping exists
- translation mode is resolved
- STRUCTURE_FIRST has sufficient structured evidence
- VISUAL_FIRST records weak/missing structure
- CODEBASE_FIRST records production reuse priorities

### Shared implementation contract

- frozen Shared Contract
- actual Shared Contract SHA-256
- verified foundation commit
- breakpoint contract semantics

### Section discovery

- boundary confidence
- PC/SP mapping confidence
- evidence for claimed confidence

### Parallel safety

- dependency graph
- coupling
- write ownership
- coordinator/shared protected paths
- worker contract hash
- branch/worktree/sandbox isolation

### Planner

Planner wave candidates are returned as advisory data.

---

## Output example concept

```json
{
  "ok": true,
  "reference_id": "REF-0001",
  "section_manifest_sha256": "...",
  "structure_profile_sha256": "...",
  "executable_groups": {
    "wave-01": ["S01", "S02"]
  },
  "translation_strategies": [
    {
      "section_id": "S01",
      "confirmed_mode": "CODEBASE_FIRST",
      "advisory_suggestion": {
        "suggested_mode": "CODEBASE_FIRST",
        "advisory_only": true
      }
    }
  ],
  "errors": []
}
```

Dashboard/agent orchestratorは`ok=true`のgroupだけ起動する。

---

## Why profile and section manifest are separate for now

現時点ではStructure ProfileをSection Manifestへ直接埋め込まない。

理由:

- Figma/MCP capabilitiesが変化する
- profile schema/metricsはまだ成長段階
- section ownership/dependency manifestを頻繁なprofile変更で汚したくない
- 実run前に本当にprofile hash常設が必要か検証したい

Production Gateは両fileのSHA-256を出すので、run evidenceとして同条件を保存できる。

実験で価値が確認できたら:

```text
structure_profile_path
structure_profile_sha256
```

をSection Manifest/Run Recordへ昇格する候補にする。

---

## Translation mode mismatch

Confirmed modeとadvisory suggestionが違っても自動failしない。

```text
confirmed: HYBRID
advisory: STRUCTURE_FIRST
```

の場合は、現在のheuristicより人間/agentの証拠判断が正しい可能性もある。

重要なのは:

- confirmed modeにevidenceがある
- profileが保存される
- first-pass結果と比較できる

こと。

Mismatch率/結果が貯まったらselector heuristicを改善する。

---

## Future dashboard

このJSONは将来のDashboardで:

- section
- Figma node
- structure confidence
- translation mode
- breakpoint contract
- foundation commit
- execution wave
- isolation
- readiness

を1画面表示するbackend候補。

その後:

```text
Run
→ FIRST_PASS screenshot
→ Verify
→ Diff
→ Repair
→ Integration
```

まで同じworkbenchへつなげる。

---

## Update-aware rule

Production Gate自体も永久仕様ではない。

Figma/MCP/modelが進化し:

- whole-page context精度が上がる
- Auto Layout/Variables抽出が改善
- screenshot→structure能力が改善
- worker sandboxがnativeに安全化

したら必要なgate/heuristicを再評価する。

古い制約を理由なく残さない。
