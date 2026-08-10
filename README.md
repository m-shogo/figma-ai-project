# figma-ai-project

AI coding agents（Codex / Claude Code / Cursor など）と Figma を往復しながら、**既に決まっている PC / SP デザインを高い再現性で実装し、人間の手直し量を継続的に減らすための研究・実践リポジトリ**です。

## Important boundary

このrepoはデザインそのものを決める場所ではありません。

- Reference Figmaはユーザー/案件側で決定する
- AIはreference designを勝手に作り直さない
- reference未提示時はtooling / workflow / evaluation / prompt / research基盤だけ進める
- reference受領後は証拠をfreezeしてから実装準備へ進む
- design変更とagent/workflow改善を同じexperimentへ混ぜない

---

## Current production direction

現時点の本命は**section-first + shared foundation + safe parallel implementation**。

ページ全体を1agentへ丸ごと実装させるのではなく:

```text
Figma reference
  ↓
Tooling update preflight
  ↓
Reference freeze
  ↓
Global reconnaissance
  ↓
Shared Contract DRAFT
  ↓
Section Manifest
  ↓
Shared Foundation build / verify
  ↓
Shared Contract FROZEN + SHA-256
  ↓
Header / MainVisual / Content01 / ... / Footer
  ↓ safe parallel
Section workers
  ↓
Coordinator integration
  ↓
PC / SP / specified breakpoint verification
  ↓
Targeted repair
  ↓
Clean replay / knowledge promotion
```

Whole-page one-shotは永久禁止しない。Figma/MCP/modelが進化した時に再検証する`PAGE_BENCHMARK`として残す。

---

## Breakpoint policy

実務ではデザイナー/会社/design system/既存productの指定がsource of truthになることが多い。

Production default:

```text
GLOBAL_SPECIFIED
```

全sectionが同じbreakpoint contractを使用する。

AIは:

- breakpoint sourceを特定
- exact value / media-query semanticsを記録
- 指定境界で各sectionのbehaviorを実装
- boundaryで破綻しないか検証

する。

AIが独断で「ここで壊れるから768px」などのthresholdを追加しない。

必要に見える場合は`PROPOSE_BREAKPOINT_EXCEPTION`として提案に留める。

詳細: `docs/responsive-breakpoint-policy.md`

---

## Shared Contract / Foundation

並列section workerが別々のdesign ruleを作らないため、共通情報をmachine-readableなShared Contractに集約する。

含むもの:

- styling architecture
- fonts
- colors / spacing / radius / effects等のtokens
- global breakpoint source/value
- container / gutter / layout primitives
- shared components / Code Connect mappings
- asset policy
- accessibility baseline
- coordinator-only paths
- verified foundation commit

Foundation verification後にcontractをfreezeし、SHA-256をSection Manifest/Run Recordへ保存する。

**異なるcontract hash / foundation commitのsection outputを同条件として混ぜない。**

---

## Goal

目標は「一発生成できた」という偶然ではなく、**同じ条件なら同等品質へ戻れる工程**を作ること。

1. Reference Figmaと案件ルールを証拠としてfreeze
2. 全体構造/components/variables/fonts/breakpointsを調査
3. Shared Contract + Shared Foundationを固定
4. Figma pageを論理sectionへ切り分け
5. sectionごとに必要contextだけ渡して実装
6. 安全なsectionは並列化
7. coordinatorが全体整合性を検証
8. exact viewport/breakpointで原本と比較
9. failureを原因分類
10. prompt/context/tool/workflowを1変数ずつ改善
11. clean baselineから再実行
12. 別section/別案件でも効いた知識だけplaybookへ昇格
13. tool更新後に古い知識を再検証

---

## Non-static knowledge

このrepoは「2026年時点の正解」を永久保存する場所ではない。

Figma、MCP、Codex、Claude Code、Cursor、vision/model/browser capabilitiesは進化する。

- 1回失敗しても永久禁止しない
- 1回成功してもbest practiceにしない
- EvidenceをE0→E5で段階昇格
- CAUTION/DEFERREDもmajor update時に再試験
- 重要run前にFigma release notes/current MCP docsを最低1回確認
- Zenn/Qiita/X/Forum/GitHub/Reddit等のfield signalも収集
- community情報は仮説として自分たちで検証

詳しくは:

- `docs/evidence-policy.md`
- `docs/update-preflight.md`
- `docs/research-radar.md`
- `docs/community-signal-registry.md`

---

## North Star Metrics

- **First-pass Fidelity** — 初回出力でどこまで原本に近いか
- **Visual Fidelity** — geometry / spacing / typography / color / assets
- **Structural Fidelity** — components / tokens / breakpoint contract / semantic structure
- **Rework Efficiency** — section・integration・shared foundationの戻りが少ないか
- **Integration Load** — 並列sectionを統合するための追加修正量
- **Contract Compliance** — shared rule/breakpoint/foundationから逸脱していないか
- **Reproducibility** — clean rerunしても同等結果へ戻れるか
- **Context Efficiency** — 必要以上のFigma/code contextを渡していないか
- **Portability** — 別section/案件でも使える知識か

---

## Current phase

**FOUNDATION READY — reference design待ち。デザイン自体には触れず、再現実験基盤を整備中。**

Reference受領前にやらないこと:

- 架空LPを作る
- PC/SP寸法をこちらで決める
- 色/component/画面構成を仮定する
- breakpointを勝手に決める
- referenceを模したダミーデザインをFigmaへ作る

Reference受領後の入口:

```text
Update Preflight
→ Reference Manifest
→ Global Reconnaissance
→ Shared Contract DRAFT
→ Section Manifest
→ Shared Foundation
→ Contract Freeze
→ SECTION runs
→ INTEGRATION run
```

---

## Three run scopes

### SECTION

Header / MainVisual / Content等のproduction work unit。

比較条件:

- same reference
- same section node
- same Shared Contract hash
- same foundation commit
- same breakpoint contract

### INTEGRATION

複数sectionを1pageにした時の:

- cross-section spacing
- container alignment
- background continuity
- typography hierarchy
- z-index
- breakpoint continuity
- overflow

を評価する。

### PAGE_BENCHMARK

Whole-page one-shot等の能力研究。

SECTION/INTEGRATIONのproduction scoreと混ぜない。

---

## Context architecture

Production SECTION runでは、入力を2層に分ける。

### Coordination Envelope — 必須土台

- frozen reference
- section ID/node
- Shared Contract path/hash
- Section Manifest
- verified foundation commit
- project/designer/company guidance
- acceptance viewport

### Context Tier C0–C4 — 実験変数

- C0: visual/minimal
- C1: structured Figma
- C2: explicit section contract
- C3: codebase-aware
- C4: Code Connect/design-system-connected

Context量を比較するためにShared Contractまで消さない。Shared Contractの有無を測る場合は専用ablation experimentとして行う。

---

## CSS direction

SCSSを前提にしない。

既存projectのstyle architectureを最優先。

新規React/Next/Vite系のcurrent default候補:

```text
CSS Modules
+ native CSS
+ CSS Custom Properties for tokens
+ project-wide specified breakpoint contract
+ section-scoped files
```

Breakpointの数値管理は既存project utility/PostCSS/custom-media等を優先し、section workerが各自でmedia-query値を決めない。

詳細: `docs/css-strategy.md`

---

## Repository Structure

```text
.
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── docs/
│   ├── workflow.md
│   ├── section-execution.md
│   ├── responsive-breakpoint-policy.md
│   ├── css-strategy.md
│   ├── reference-contract.md
│   ├── context-package.md
│   ├── run-contract.md
│   ├── benchmark-plan.md
│   ├── evaluation-rubric.md
│   ├── visual-verification.md
│   ├── rework-metrics.md
│   ├── failure-taxonomy.md
│   ├── evidence-policy.md
│   ├── update-preflight.md
│   ├── research-radar.md
│   ├── community-signal-registry.md
│   ├── knowledge-promotion.md
│   ├── portability.md
│   ├── agent-adapters.md
│   ├── source-registry.md
│   ├── figma-update-adoption-2025-2026.md
│   ├── future-platform.md
│   └── image-only-research-track.md
├── research/
│   └── figma-updates/
├── prompts/
│   ├── 00-global-reconnaissance.md
│   ├── 00-shared-foundation.md
│   ├── 01-inspect.md
│   ├── 02-implement.md
│   ├── 03-verify.md
│   ├── 04-repair.md
│   ├── 05-integrate.md
│   └── figma-to-code.md
├── templates/
│   ├── reference-manifest.yaml
│   ├── shared-contract.yaml
│   ├── section-manifest.yaml
│   ├── run-record.yaml
│   ├── experiment.md
│   └── failure-record.md
├── schemas/
│   ├── reference.schema.json
│   ├── shared-contract.schema.json
│   ├── section.schema.json
│   └── run.schema.json
├── scripts/
│   └── validate_records.py
├── playbook/
│   ├── candidates/
│   └── proven/
└── experiments/
    └── 0001-baseline/README.md
```

---

## Core Policy

- screenshotだけで済ませず、読める場合はstructured Figma contextを使う
- 大pageはmetadata→section→必要childのprogressive disclosure
- screenshotはvisual ground truthとして別レイヤーで使う
- components/variables/Auto Layout/Grid/semantic naming/Code Connectの有無を実際に調べて実装方法を変える
- company/designer指定breakpointを全sectionの共通契約にする
- shared foundationを先にfreezeしてからsection並列
- section workerはshared filesをread-onlyにする
- Verifyではまず差分を固定し、修正と混ぜない
- First-passを必ず保存
- Integration Reworkを隠さない
- 一度の成功/失敗を一般則にしない
- old limitationはlatest update確認後に適用

---

## Scoring

```text
First-pass Fidelity = Visual 40 + Structural 25 + Robustness 15 = /80
Rework Efficiency = /10
Reproducibility = /10 (clean replay後のみ)
Final Composite = /100
```

ただし`SECTION / INTEGRATION / PAGE_BENCHMARK`は別cohort。同じ点数を直接rankingしない。

Finalが高くてもsection/integration/shared foundationの修正量が多ければ高評価にしない。

---

## Current Figma update sensitivity

Figmaの機能は短期間で変わる。

Recent examples recorded in this repo include:

- remote MCP / design-context workflows
- Code Connect improvements
- code → editable Figma roundtrip
- asset download workflows
- reusable agent skills
- code-backed screen variable binding
- updated Auto Layout closer to CSS
- legacy/new Auto Layout coexistence

古いexperimentは履歴として保持し、current recommendationは重要run前に再評価する。

詳しくは `docs/figma-update-adoption-2025-2026.md`。

---

## Future: visual workbench / dashboard

Prompt集だけを最終成果に限定しない。

実験データが貯まり必要性が確認できたら:

- Figma reference
- user-uploaded images
- section manifests
- agent outputs
- PC/SP/breakpoint screenshots
- first-pass/final
- side-by-side / overlay / diff
- AI visual review
- failure history
- contract hash/tool/model versions
- update/retest radar

を同じEvidence Bundleとして扱うworkbenchへ発展させる。

詳細: `docs/future-platform.md`

---

## Future: image-only reproduction

Structured Figma contextが無い場合も、将来的には:

```text
image(s)
→ layout/section/component hypothesis
→ editable Figma / native code
→ browser render
→ visual diff
→ AI + human correction
→ clean replay
```

を高精度化する独立研究トラックを持つ。

現時点で難しくてもmodel/tool更新で再試験する。

詳細: `docs/image-only-research-track.md`

---

## Research principle

このrepoは結論集ではない。

**最新情報 → 仮説 → section単位で試す → integrationまで確認 → failure原因特定 → 小さな改善 → clean replay → 別section/案件で再現 → tooling更新で再評価**

を繰り返し、次の案件ほど人間の戻りを減らす学習システムを目指す。
