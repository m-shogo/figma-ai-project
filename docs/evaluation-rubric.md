# Evaluation Rubric

各実験を 100 点満点で評価する。数値は「AIが良い/悪い」を決めるためではなく、改善がどこに効いたか追跡するために使う。

## 1. Visual Fidelity — 40

### Geometry / layout — 12
- frame sizing
- alignment
- grid
- section proportions

### Spacing — 8
- padding
- gap
- rhythm

### Typography — 8
- family
- weight
- size
- line height
- wrapping

### Color / border / effects — 6

### Assets / crop — 6

## 2. Structural Fidelity — 25

### Component reuse — 7
### Token / variable reuse — 5
### Responsive rule quality — 7
### Maintainable hierarchy — 4
### State representation — 2

## 3. Robustness — 15

### Intermediate widths — 5
### Long / short content — 4
### Accessibility basics — 3
### No obvious overflow / clipping — 3

## 4. Rework Cost — 10

10 = human correction almost unnecessary

8 = several local tweaks

5 = one or more sections need rebuilding

2 = extensive manual correction

0 = output is not a useful starting point

記録時は点数だけでなく、可能なら以下も残す。

- repair rounds
- manually edited files
- approximate changed lines/nodes
- human intervention notes

## 5. Reproducibility — 10

同じ条件で複数回実行した結果を比較する。

### 9–10
ほぼ同じ構造・品質へ収束する。

### 6–8
多少差はあるが、主要構造と品質は安定。

### 3–5
重要な箇所で結果が揺れる。

### 0–2
再実行結果が大きく異なり、手順として信頼できない。

---

# Auxiliary metrics

100点には含めないが記録する。

## First-pass Score

repair 前の総合点。

最重要指標の1つ。最終点だけ高くても、repair が多ければ目標達成ではない。

## Final Score

許可された repair round 後の点数。

## Repair Gain

`Final Score - First-pass Score`

repair prompt / diagnostic quality の評価に使う。

## Context Efficiency

必要以上のコンテキストを渡さず精度を得られたか。

- prompt size
- files read
- Figma nodes inspected
- screenshots used

可能なら記録する。

## Portability

今回の改善が別画面・別案件でも使えるか。

- PROJECT_ONLY
- PATTERN_LEVEL
- CROSS_PROJECT

# Acceptance bands

| Score | Meaning |
|---:|---|
| 95–100 | reference と非常に近く、手直し極小 |
| 90–94 | production-ready に近い |
| 80–89 | 良い下地だが明確な修正あり |
| 70–79 | 構造または視覚に複数のズレ |
| <70 | experiment failure。原因分析対象 |

**目標は最終点だけでなく、First-pass Score を継続的に引き上げること。**
