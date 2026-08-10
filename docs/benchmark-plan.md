# Benchmark Plan

Reference design受領後、闇雲に全組合せを回さず、**少ないrunで因果を切り分ける順序**を固定する。

Production defaultはsection-first。

Whole-page one-shotは現在の能力差を測るresearch benchmarkとして残す。

---

## Principle

最初から:

```text
3 agents
× every section
× 5 context tiers
× 2 prompt styles
× Code Connect on/off
× serial/parallel
× multiple reruns
```

を総当たりしない。

まず代表sectionで高情報量の比較を行い、効いた変数だけ他sectionへ展開する。

比較時は最低限:

- same frozen reference
- same section node
- same shared contract hash
- same verified foundation commit
- same assets
- same breakpoint contract
- same acceptance viewport

を揃える。

---

## BENCH-00 — Environment / contract snapshot

Reference実装前後に記録:

- reference revision
- code starting SHA
- company/designer breakpoint source
- shared contract revision/hash
- foundation commit
- section manifest revision
- agent clients
- exact model names/aliases if known
- client versions if known
- Figma MCP mode/access
- Auto Layout generation notes
- browser/capture environment
- package/runtime versions

目的:

後からmodel差、contract差、foundation差、Figma update差を混同しない。

---

## BENCH-01 — Representative SECTION COMMON baseline

最初は1つの代表sectionを選ぶ。

候補:

- MainVisual
- component + typography + image + responsiveが混在するsection
- Headerのように状態/ナビが多いsection

単純すぎるFooterだけを代表にしない。

Codex / Claude Code / Cursorを:

- same section
- same foundation
- same shared contract
- same context tier
- repair budget 0

で1回ずつ。

推奨初期tier: `C1 Structured Figma`

目的:

- agentごとのfailure profile
- 共通failure
- 次に試す価値が高いcontext/workflow変数

を最小runで知る。

---

## BENCH-02 — Context value

代表agent + same section + clean foundationで:

### 02A
C0 visual/minimal

### 02B
C1 structured Figma

見るもの:

- First-pass Fidelity
- assumption count
- COMPONENT/TOKEN/LAYOUT failure
- context cost

差が小さいなら「structured contextは不要」と即結論せず、Figma structure/context extraction自体が弱くないか調べる。

---

## BENCH-03 — Shared contract value

Same agent/section/foundationで:

- structured contextのみ
- structured context + frozen shared contract

を見る。

主な評価:

- token drift
- font drift
- container drift
- breakpoint drift
- duplicate shared component
- arbitrary value増殖

目的はshared contract自体がFirst-pass/Reworkを改善するか確認すること。

---

## BENCH-04 — Progressive disclosure / section scope

同じagent/referenceで:

- whole-page context
- section-scoped context

を比較する。

ただしimplementation targetは同じsectionに揃える。

見るもの:

- context usage
- omitted details
- typography/spacing precision
- irrelevant code edits
- time/tool-call count if available

---

## BENCH-05 — Whole-page one-shot vs section-first

これはproduction default決定のためではなく、tool/model進化を測るbenchmark。

### A
Whole-page one-shot

### B
Shared foundation + section-first + integration

比較:

- final page fidelity
- first-pass fidelity
- total rework
- context usage
- integration failures
- duplicated components/tokens
- total human intervention

Major Figma/MCP/model update後に再テストする価値がある。

一度section-firstが勝ってもwhole-pageを永久禁止しない。

---

## BENCH-06 — Serial sections vs safe parallel sections

Same frozen contract/foundationで:

### A
sections sequential

### B
independent sections parallel

比較:

- wall-clock efficiency where measurable
- merge conflict
- shared rule drift
- contract violations
- duplicate components
- integration repair

Parallelの目的は単に速さではなく、**速くしてもquality/reworkが悪化しない範囲を見つけること**。

---

## BENCH-07 — Explicit breakpoint contract

案件指定breakpointがあるreferenceで:

- exact shared breakpoint contract supplied
- breakpoint info omitted from worker context

を比較できる。

AIに別breakpointを発明させることをproduction推奨する実験ではない。

見るfailure:

- BREAKPOINT_DRIFT
- VISIBILITY_RULE
- WRAP_ORDER
- responsive section mismatch
- integration boundary failure

目的は「明示contractを渡す価値」を定量化すること。

---

## BENCH-08 — Codebase-aware context

C2 → C3。

見るもの:

- COMPONENT_REUSE_MISS
- TOKEN_REUSE_MISS
- ROUTING_MISMATCH
- SEMANTIC_STRUCTURE
- duplicate implementation

既存design systemが小さい案件では効果が薄い可能性も記録する。

---

## BENCH-09 — Code Connect

**実reference/codebaseに有効なCode Connect mappingが存在する場合のみ。**

- same section without mapping
- same section with mapping

見るもの:

- correct component reuse
- variant/prop mapping
- duplicate component count
- token/context usage
- rework

加えて可能なら:

- design component coverage
- Code Connect coverage

をmetadataに残す。

---

## BENCH-10 — Staged workflow value

Same agent/section/context:

- ONE_SHOT prompt
- STAGED Inspect → Implement → Verify

見るもの:

- First-pass Fidelity
- failure attribution quality
- assumptions
- rework
- context usage

思想だけでstagedを永久標準化せず、継続的に再検証する。

---

## BENCH-11 — Targeted repair → prevention

複数runで出たS2/S3 failureを1つ選ぶ。

1. verified failure
2. targeted repair
3. prevention hypothesis
4. clean replay

目的:

```text
直せる
↓
最初から外さない
```

へ知識を変換する。

---

## BENCH-12 — Agent OPTIMIZED

COMMONとは別cohort。

各agentのcurrent best practiceを使用:

- Codex adapter/instructions
- Claude Code adapter/instructions
- Cursor rules/skills where useful
- current MCP-specific optimizations

同じsection/shared foundationで比較する。

見るもの:

- practical best First-pass
- Rework Efficiency
- context efficiency
- repeatability

agent ranking自体を最終目的にしない。

---

## BENCH-13 — Clean replay stability

有望Candidate Ruleを:

- fresh context
- same frozen contract
- same clean foundation

で複数回。

ここで初めてReproducibilityを採点する。

不安定ならCandidateのまま。

---

## BENCH-14 — Integration portability

代表sectionだけで効いたruleを別sectionへ広げる。

例:

- MainVisualで効いたsection-scoped context rule
- Content01でも効くか
- Headerでも効くか

ここでpattern-level portabilityを見る。

---

## BENCH-15 — Second reference / cross-project

別画面、可能なら別案件でCandidate Ruleを試す。

ここで再現して初めてCROSS_PROJECT / Proven候補になる。

---

# Current decision tree

```text
Representative SECTION baseline
  ↓
共通S2/S3が多い？
  ├─ yes → context/shared-contract改善
  └─ no
       ↓
agent間差が大きい？
  ├─ yes → agent-specific diagnosis
  └─ no → parallel/integration/replayへ

shared component reuse failureが多い？
  ├─ yes → codebase-aware / Code Connect
  └─ no → mapping実験を急がない

breakpoint driftがある？
  ├─ yes → shared contract伝達/validation改善
  └─ no → breakpoint promptを巨大化しない

parallel integration failureが多い？
  ├─ yes → shared surface/allowed pathsを縮める
  └─ no → safe parallelismを拡大
```

---

# Stop waste rules

- 差が出ない変数を全section/全agentへ展開しない
- S0/S1だけの差に大量runを使わない
- reference revisionが変わったらsame cohort比較を止める
- contract hashが違うrunを同条件として比較しない
- foundation commitが違うrunを同条件として比較しない
- model update直後に古い細かいランキングへ固執しない
- 該当しないCode Connect機能を無理にbenchmarkしない

目的はrun数ではなく、**次案件で人間の戻りを減らす因果関係を最短で見つけること**。
