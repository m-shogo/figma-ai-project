# Evaluation Rubric

評価を「最終的に100点になったか」だけにしない。

**First-pass Fidelity / Rework / Reproducibility は別タイミングで測る。**

これにより、1回目では測れないReproducibilityを無理に採点しない。

---

# A. First-pass Fidelity — 80

Repair前の実装そのものを評価する。最重要スコア。

## 1. Visual Fidelity — 40

### Geometry / layout — 12
- frame/container sizing
- alignment
- grid
- section proportions

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

## 2. Structural Fidelity — 25

### Component reuse — 7
### Token / variable reuse — 5
### Responsive rule quality — 7
### Maintainable semantic hierarchy — 4
### State representation — 2

## 3. Robustness — 15

### Relevant intermediate widths — 5
### Long / short content where applicable — 4
### Accessibility basics — 3
### No obvious overflow / clipping — 3

## First-pass Fidelity bands

| /80 | Meaning |
|---:|---|
| 76–80 | 原本へ非常に近く、material repairがほぼ不要 |
| 72–75 | 高品質。局所差分のみ |
| 64–71 | 良い土台だが明確な修正あり |
| 56–63 | 構造/視覚に複数のmaterial mismatch |
| <56 | 原因分析を優先するfailure run |

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

必ず補助dataも残す。

- repair rounds
- S1/S2/S3 failures
- post-first-pass files/line churn if available
- rebuild count
- human intervention

---

# C. Reproducibility — 10

**clean replayを実行するまで `N/A`。**

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

**途中runに仮の100点満点を付けない。**

---

# Diagnostic metrics

Compositeには直接足さず、原因分析に使う。

## Final Fidelity /80

Repair後のvisual + structural + robustness。

## Fidelity Gain

```text
Final Fidelity - First-pass Fidelity
```

大きすぎる場合、「repairは強いがfirst-passが弱い」可能性。

理想はFinalが高いままGainが小さくなること。

## Failure Load

failure severityの分布。

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

agentがreference/codebaseから確定できず仮定した数。

特に「実は取得できたのに推測した」ものは `AGENT_ASSUMPTION` としてfailure扱い。

## Portability

- PROJECT_ONLY
- PATTERN_LEVEL
- AGENT_SPECIFIC
- CROSS_AGENT
- CROSS_PROJECT

---

# Evaluation order

数字を付ける順序:

1. FIRST_PASSをcapture
2. First-pass Fidelity /80
3. failure taxonomy
4. repair rounds
5. Final Fidelity /80
6. Rework Efficiency /10
7. clean replay
8. Reproducibility /10
9. Final Composite /100

この順序を守り、final qualityでfirst-passの弱さを隠さない。
