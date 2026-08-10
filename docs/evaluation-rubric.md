# Evaluation Rubric

評価を「最終的に100点になったか」だけにしない。

**First-pass Fidelity / Rework / Reproducibilityは別タイミングで測る。**

また、run scopeを混ぜない。

- `SECTION`
- `INTEGRATION`
- `PAGE_BENCHMARK`

同じ80点でも意味が違うため、**scopeをまたいでagent rankingしない。**

---

# A. First-pass Fidelity — 80

Repair前の実装そのものを評価する。最重要スコア。

## 1. Visual Fidelity — 40

### Geometry / layout — 12
- sizing
- alignment
- grid/flex intent
- proportions

### Spacing — 8
- padding
- gap
- margin/rhythm

### Typography — 8
- family
- weight
- size
- line height
- letter spacing
- wrapping

### Color / border / effects — 6

### Assets / crop / layering — 6

---

## 2. Structural Fidelity — 25

### Component reuse — 6

- existing shared component reuse
- correct variant/prop usage
- no duplicate primitive

### Token / variable reuse — 4

- existing/project token reuse
- no unnecessary raw-value duplication

### Responsive / breakpoint contract — 6

- company/designer/shared breakpoint compliance
- correct min/max/query semantics
- section behavior at the specified breakpoint
- no unapproved local threshold

**AIが独自に良いbreakpointを見つけたか、では評価しない。**

### Maintainable semantic hierarchy — 4

### Shared-contract / section isolation — 3

- shared files remain read-only for section worker
- allowed paths respected
- same contract hash/foundation used

### State representation — 2

Total: 25

---

## 3. Robustness — 15

### Required breakpoint boundary behavior — 4

指定breakpointの境界で:

- visibility
- reorder
- wrapping
- gap
- overflow

が破綻しない。

### Relevant intermediate widths — 3

### Long / short content where applicable — 3

### Accessibility basics — 2

### No obvious overflow / clipping — 3

Total: 15

---

# Scope interpretation

## SECTION

担当sectionだけを評価する。

見るもの:

- section reference一致
- shared component/token/breakpoint準拠
- section-local responsive behavior
- allowed path isolation

**cross-section spacingはSECTION scoreへ混ぜない。**

## INTEGRATION

複数sectionを統合したページの整合性を評価する。

Visual項目では特に:

- section order
- cross-section spacing
- container alignment
- background continuity
- page-wide hierarchy
- z-index overlap

Structural項目では:

- shared component consistency
- breakpoint consistency
- contract hash/foundation consistency
- root composition

Robustnessでは:

- full-page overflow
- breakpoint boundary
- section transition continuity

を見る。

## PAGE_BENCHMARK

Whole-page one-shotなど研究用。

Full referenceを評価するが、SECTION/INTEGRATION runと同じランキング表へ直接混ぜない。

---

# First-pass Fidelity bands

| /80 | Meaning |
|---:|---|
| 76–80 | scope内でreferenceへ非常に近くmaterial repairほぼ不要 |
| 72–75 | 高品質。局所差分のみ |
| 64–71 | 良い土台だが明確な修正あり |
| 56–63 | 構造/視覚に複数のmaterial mismatch |
| <56 | 原因分析を優先するfailure run |

Score bandも同scope内で比較する。

---

# B. Rework Efficiency — 10

First-pass後、acceptance到達またはstop conditionまでの戻りを評価する。

詳細指標は `docs/rework-metrics.md`。

### 10
- material repairほぼなし
- manual editなし

### 8–9
- 1–2 targeted repair
- rebuildなし

### 6–7
- 複数local repair
- 一部作り直し

### 3–5
- section/component rebuild
- repeated regression/human hints

### 0–2
- large reimplementation
- first-passを土台として使いにくい

補助data:

- repair rounds
- S1/S2/S3 failures
- post-first-pass files/line churn if available
- rebuild count
- human intervention
- shared contract revisions required

### Parallel experiment note

Parallel implementationではintegration repairを別途記録する。

「各sectionのReworkは少ないがintegrationで大量修正」は成功扱いしない。

---

# C. Reproducibility — 10

**clean replayを実行するまで `N/A`。**

Replay条件:

- same reference revision
- same run scope
- same section if SECTION
- same shared contract hash
- same clean foundation commit
- fresh agent context

### 9–10
ほぼ同じ構造・品質へ安定して収束。

### 6–8
多少差はあるが主要構造とqualityは安定。

### 3–5
重要箇所で結果が揺れる。

### 0–2
同条件rerunの品質差が大きくworkflowとして信頼しにくい。

---

# D. Final Composite — 100

ReworkとReplayまで揃ったexperimentのみ:

```text
Final Composite
= First-pass Fidelity /80
+ Rework Efficiency /10
+ Reproducibility /10
```

途中runに仮の100点満点を付けない。

Compositeも同scope同士で比較する。

---

# Diagnostic metrics

Compositeには直接足さず原因分析に使う。

## Final Fidelity /80

Repair後のvisual + structural + robustness。

## Fidelity Gain

```text
Final Fidelity - First-pass Fidelity
```

Gainが大きすぎる場合、「repairは強いがfirst-passが弱い」可能性。

理想はFinalが高いままGainが小さくなること。

## Contract Compliance

- shared contract hash match
- foundation commit match
- unapproved breakpoint count
- shared-file mutation count
- duplicate shared primitive count
- allowed-path violations

原則zeroを目標とする。

## Integration Load

- cross-section failures
- integration-only repair rounds
- conflicts
- background/container/z-index fixes

Parallel strategy評価に使う。

## Failure Load

- S1
- S2
- S3
- S4 invalid run

## Context Efficiency

- context tier
- MCP calls if known
- nodes inspected
- repo files read
- prompt size if measurable
- pre-implementation turns

同品質なら小さいcontextを優先する。

## Assumption Count

agentがreference/codebase/company rulesから確定できず仮定した数。

取得できたのに推測したものは `AGENT_ASSUMPTION`。

## Portability

- PROJECT_ONLY
- PATTERN_LEVEL
- AGENT_SPECIFIC
- CROSS_AGENT
- CROSS_PROJECT

---

# Evaluation order

1. run scope確定
2. FIRST_PASS capture
3. First-pass Fidelity /80
4. failure taxonomy
5. repair rounds
6. Final Fidelity /80
7. Rework Efficiency /10
8. integration run when applicable
9. clean replay
10. Reproducibility /10
11. Final Composite /100

この順序を守り、final qualityでfirst-passやintegrationの弱さを隠さない。
