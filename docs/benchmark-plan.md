# Benchmark Plan

Reference design受領後、闇雲に全組合せを回さず、**少ないrunで因果を切り分ける順序**を固定する。

## Principle

3 agents × 5 context tiers × 2 prompt styles × Code Connect on/off × multiple reruns を最初から総当たりしない。

コストが大きいだけでなく、tool/model更新が入る前に実験が終わらない。

まず最小の高情報量runを行い、差が出た変数だけ掘る。

---

## BENCH-00 — Environment snapshot

Reference実装前。

記録:

- reference revision
- code starting SHA
- agent clients
- exact model names/aliases if known
- client versions if known
- Figma MCP mode/access
- browser/capture environment
- package/runtime versions

目的:

後から「model差」なのか「環境差」なのか判別できるようにする。

---

## BENCH-01 — COMMON first-pass baseline

最初にCodex / Claude Code / Cursorを **同じcontext tier** で1回ずつ。

推奨初期tier: `C1 Structured Figma`

理由:

C0 screenshot-onlyは研究対照として有用だが、実務の初回標準にすると情報を意図的に捨てるため。

固定:

- reference
- starting SHA
- staged prompts
- context tier C1
- viewports
- repair budget = 0 for first-pass comparison

目的:

- agentごとのfailure profileを知る
- 重大な共通failureを知る
- 次にどの変数を試す価値が高いか決める

---

## BENCH-02 — Context value test

BENCH-01で代表agentを1つ選び、同じstarting SHAから比較。

### 02A
C0 visual/minimal

### 02B
C1 structured Figma

見るもの:

- First-pass Fidelity delta
- assumption count
- COMPONENT/TOKEN/RESPONSIVE failure差
- context cost

C0を全agentでやる必要はない。C0→C1差がほぼ無ければ、その理由を先に調べる。

---

## BENCH-03 — Explicit contract value

同じagent / same clean baseline:

- C1 Structured Figma
- C2 Explicit design/responsive contract

主に見るfailure:

- RESPONSIVE_INVARIANT
- BREAKPOINT_GUESS
- WRAP_ORDER
- VISIBILITY_RULE
- REFERENCE_AMBIGUITY

C2が効いた場合、どのmanifest fieldが効いたかさらに小さく切る。

---

## BENCH-04 — Staged workflow value

同じagent/context:

- ONE_SHOT
- STAGED: Inspect → Implement → Verify

見るもの:

- First-pass Fidelity
- first-pass preservation
- failure attribution quality
- repair rounds
- context usage

「stagedの方が良さそう」という思想だけで標準化せず、結果で確認する。

---

## BENCH-05 — Codebase-aware context

C2 → C3。

見るもの:

- COMPONENT_REUSE_MISS
- TOKEN_REUSE_MISS
- ROUTING_MISMATCH
- SEMANTIC_STRUCTURE
- duplicate implementation

既存design systemが小さい案件では効果が薄い可能性も記録する。

---

## BENCH-06 — Code Connect

**実reference/codebaseに有効なCode Connect mappingが存在する場合のみ実施。**

- C3 without mapping
- C4 with mapping

見るもの:

- component reuse
- correct variant/prop mapping
- duplicate component count
- rework

存在しない案件のために人工的にmappingを作ってbenchmarkしない。別experimentに分ける。

---

## BENCH-07 — Targeted repair prevention

COMMON runで複数回出たS2/S3 failureを1つ選ぶ。

1. verified failure
2. targeted repair
3. prevention hypothesis
4. clean replay

目的:

「直せる」から「最初から外さない」へ知識を変換する。

---

## BENCH-08 — Agent OPTIMIZED

COMMONとは別cohort。

各agentで現在のbest practiceを使う。

- Codex adapter/instructions
- Claude Code adapter/instructions
- Cursor adapter/rules where useful
- agent-specific MCP/tool usage

見るもの:

- practical best First-pass
- Rework Efficiency
- context efficiency
- agent-specific repeatability

agentランキングが目的ではない。

---

## BENCH-09 — Clean replay stability

有望なCandidate Ruleをfresh context + clean starting SHAで複数回。

初めてReproducibilityを採点する。

不安定ならCandidateのまま。

---

## BENCH-10 — Second reference portability

別画面、可能なら別案件でCandidate Ruleを試す。

ここで再現して初めてCROSS_PROJECT / Proven候補になる。

---

# Decision tree

```text
COMMON baseline
  ↓
共通S2/S3が多い？
  ├─ yes → context/contract改善を優先
  └─ no
       ↓
agent間差が大きい？
  ├─ yes → agent-specific diagnosis
  └─ no → verify/rework/portabilityへ

既存component再利用failureが多い？
  ├─ yes → C3 / Code Connect検証
  └─ no → mapping実験を急がない

responsive failureが多い？
  ├─ yes → C2 manifest fieldsを分解
  └─ no → responsive promptを巨大化しない
```

# Stop waste rules

- 差が出ない変数を全agentへ横展開しない
- S0/S1だけの差に大量runを使わない
- model更新直後に旧runとの細かいランキングを続けない
- reference revisionが変わったら同cohort比較を止める
- Code Connectなど該当しない機能を無理にbenchmarkしない

目的はrun数ではなく、**次の案件で使える因果関係を最短で見つけること**。
