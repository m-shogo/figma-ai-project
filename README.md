# figma-ai-project

AI coding agents（Codex / Claude Code / Cursor など）と Figma を往復しながら、**既に決まっている PC / SP デザインを高い再現性で実装し、人間の手直し量を継続的に減らすための研究・実践リポジトリ**です。

## Important boundary

この repo はデザインそのものを決める場所ではありません。

- Reference Figma はユーザー/案件側で決定する
- AI は reference design を勝手に作り直さない
- reference が未提示の期間は、実験基盤・評価・prompt・context設計・tooling調査だけを進める
- reference が提示されたら freeze して、同じ原本を使って比較する

## Goal

目標は「一発生成できた」という偶然ではなく、**同じ条件なら同等品質を再現できる工程**を作ることです。

1. Reference Figma を構造ごと取得する
2. AI に渡す context を再現可能な package にする
3. Codex / Claude Code / Cursor などで実装する
4. 原本と exact viewport で比較する
5. 差分を定量・定性で記録する
6. 原因を分類する
7. prompt / context / Design System / Code Connect / workflow を1変数ずつ改善する
8. clean baseline から再実行する
9. 別画面・別案件でも効いた知識だけ playbook に昇格する
10. tooling更新に応じて古い知識を再検証する

## Non-static knowledge

このrepoは「2026年時点の正解」を永久保存する場所ではありません。

Figma、MCP、Codex、Claude Code、Cursor、画像理解は進化するため:

- 1回失敗しても永久禁止しない
- 1回成功してもbest practiceにしない
- EvidenceをE0→E5で段階昇格する
- CAUTION/DEFERREDもmajor update時に再試験する
- 重要run前にFigma release notesとcurrent MCP docsを確認する
- 公式だけでなくZenn/Qiita/X/Forum/GitHub/Reddit等の現場signalも拾う
- community情報は仮説として実験で検証する

詳しくは:

- `docs/evidence-policy.md`
- `docs/update-preflight.md`
- `docs/research-radar.md`
- `docs/community-signal-registry.md`

## North Star Metrics

- **First-pass Fidelity**: 初回出力でどこまで原本に近いか
- **Visual Fidelity**: geometry / spacing / typography / color / assets の一致度
- **Structural Fidelity**: component / token / responsive / semantic structure の一致度
- **Rework Efficiency**: 人間またはAIの修正回数・修正量が少ないか
- **Reproducibility**: clean rerun しても同等結果へ戻れるか
- **Context Efficiency**: 余計なcontextを増やさず精度を出せたか
- **Portability**: 別案件へそのまま持っていける知識か

## Current phase

**FOUNDATION READY — reference design待ち。デザインには触れず、再現実験の下地を構築済み。**

Reference が来るまでやらないこと:

- 架空LPを作る
- PC/SP寸法をこちらで決める
- 色・component・画面構成を仮定する
- referenceを模したダミーデザインをFigmaへ作る

Reference受領後は:

```text
Update Preflight
→ Reference Contract
→ Frozen Manifest
→ COMMON baseline
→ evidence-driven experiments
```

の順で進む。

## Research Loop

```text
Latest tooling/community scan
   ↓
Reference Figma (external source of truth)
   ↓ freeze
Reference Contract
   ↓
Context Package
   ↓
Inspect
   ↓
First-pass Implementation
   ↓ preserve
Exact Viewport Capture
   ↓
Verify (diagnosis only)
   ↓
Failure Classification
   ↓
Targeted Repair
   ↓
Clean Re-run
   ↓
Candidate → Proven Playbook
   ↓
tool/model update → retest when relevant
```

## Repository Structure

```text
.
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── docs/
│   ├── workflow.md
│   ├── update-preflight.md
│   ├── evidence-policy.md
│   ├── research-radar.md
│   ├── community-signal-registry.md
│   ├── reference-contract.md
│   ├── context-package.md
│   ├── run-contract.md
│   ├── benchmark-plan.md
│   ├── evaluation-rubric.md
│   ├── visual-verification.md
│   ├── rework-metrics.md
│   ├── failure-taxonomy.md
│   ├── knowledge-promotion.md
│   ├── portability.md
│   ├── agent-adapters.md
│   ├── source-registry.md
│   ├── future-platform.md
│   └── image-only-research-track.md
├── research/
│   └── figma-updates/
├── prompts/
│   ├── figma-to-code.md
│   ├── 01-inspect.md
│   ├── 02-implement.md
│   ├── 03-verify.md
│   └── 04-repair.md
├── templates/
│   ├── reference-manifest.yaml
│   ├── run-record.yaml
│   ├── experiment.md
│   └── failure-record.md
├── schemas/
│   ├── reference.schema.json
│   └── run.schema.json
├── scripts/
│   └── validate_records.py
├── playbook/
│   ├── candidates/
│   └── proven/
└── experiments/
    └── 0001-baseline/README.md
```

## Core Policy

- screenshotだけで済ませず、読める場合は Figma structured context を優先する
- screenshot は visual ground truth として必ず別レイヤーで使う
- design system / component / token / Code Connect を既存実装へ接続する
- PC と SP を別画面としてハードコードせず、referenceから responsive invariants を抽出する
- giant prompt に全部詰めない。Inspect → Implement → Verify → Repair を分離する
- Verifyではまず差分を固定し、勝手にrepairさせない
- 失敗したpromptやrepairも削除しない
- 一度の成功/失敗を一般則にしない
- agent/model固有のコツと、agent非依存の原則を分離する
- First-passを必ず保存し、Finalだけで評価しない
- reference designは改善対象ではなく source of truth として扱う
- old limitationはlatest update確認後に適用する

## Scoring

評価は段階式。

```text
First-pass Fidelity = Visual 40 + Structural 25 + Robustness 15 = /80
Rework Efficiency = /10
Reproducibility = /10 (clean replay後のみ)
Final Composite = /100 (すべて測定後のみ)
```

「最終的に綺麗になったが何度も作り直した」を高評価にしない。

## Current Figma update sensitivity

Figmaの機能は短期間で大きく変わる。

例として2026年7月には:

- Auto LayoutをCSSへ近づける更新
- code-backed screenをcanvasへ戻す際のvariable binding改善
- imported frameのAuto Layout改善
- AI image editの並列化

などが入っている。

そのため、古いexperimentは履歴として保持しつつ、current recommendationは最新環境で再評価する。

Dated snapshot: `research/figma-updates/2026-08-10.md`

## Design readiness gate

Reference を受け取ったら、実装開始前に `docs/reference-contract.md` の項目を満たす。

**Reference contract が未完成なら、見た目を推測して実装を始めない。**

## Future: visual workbench / dashboard

最終成果はprompt集だけに限定しない。

実験データが貯まり必要性が確認できたら:

- Figma reference
- user-uploaded images
- agent outputs
- PC/SP/intermediate screenshots
- first-pass/final
- side-by-side / overlay / diff
- AI visual review
- failure history
- prompt/context/tool versions
- update/retest radar

を1画面で扱うdashboard/workbenchへ発展させる。

詳細: `docs/future-platform.md`

## Future: image-only reproduction

Figma structured contextが無い場合でも、将来的には:

```text
image(s)
→ layout/structure hypothesis
→ editable Figma / native code
→ browser render
→ visual diff
→ AI + human correction
→ clean replay
```

を高精度化する独立研究トラックを持つ。

現時点で難しいことも、model/tool更新で再試験する。

詳細: `docs/image-only-research-track.md`

## Portable outcome

実験ログをそのまま他案件へコピーしない。

Observation → Candidate → Proven を通過したruleだけを `playbook/` に昇格し、最終的には別repoへ小さいinstruction packageとして導入できる状態を目指す。

## Research principle

このリポジトリは結論集ではありません。

**最新情報 → 仮説 → 失敗/成功 → 原因特定 → 小さな改善 → clean rerun → 再現確認 → tooling更新で再評価**を繰り返し、次の案件ほど戻りを減らすための学習システムです。
