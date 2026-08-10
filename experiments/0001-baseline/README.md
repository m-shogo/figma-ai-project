# EXP-0001 — Frozen Reference Agent Baseline

Status: **WAITING_FOR_REFERENCE**

## Purpose

最初の実験は、ユーザーが既に決めている Figma の PC / SP reference を使う。

このrepo側では画面構成・色・寸法・contentを発明しない。

Reference が届くまでは run を開始せず、比較基盤だけ準備する。

## Before reference arrives

- [x] project mission / boundary
- [x] common agent rules
- [ ] reference contract
- [ ] context package format
- [ ] run contract
- [ ] staged prompts
- [ ] failure taxonomy
- [ ] knowledge promotion criteria
- [ ] official source registry
- [ ] run record template

## Reference intake gate

Reference受領後に以下を固定する。

- Figma file URL
- target node(s)
- PC frame(s)
- SP frame(s)
- exact viewport sizes
- relevant states / variants
- source assets
- component/library relationships
- design variables/tokens if present
- annotations / behavior notes if present
- reference screenshot(s)
- capture timestamp

詳細は `docs/reference-contract.md`。

## Phase A — Common baseline

Codex / Claude Code / Cursor に同じ frozen reference、同じcode baseline、同じcontext tier、同じacceptance criteriaを渡す。

目的:

- agentそのものの差
- reference/contextの読み落とし傾向
- first-passで発生するfailure class

保存する:

- inspect output
- first-pass code commit
- exact viewport screenshots
- first-pass score
- assumptions
- failure categories

## Phase B — Context experiments

同じ clean baseline から、contextだけを1段ずつ増やす。

候補:

1. screenshot + minimal brief
2. structured Figma context
3. components / variables / Auto Layout details
4. annotations / responsive invariants
5. Code Connect / actual code component mappings

一度に複数条件を変えない。

## Phase C — Prompt segmentation

同じ context で比較する。

- one-shot prompt
- Inspect → Implement → Verify
- Inspect → Implement → Verify → targeted Repair

見る指標:

- First-pass Fidelity
- Rework Cost
- assumption count
- repair rounds
- context usage

## Phase D — Agent-optimized run

COMMON実験とは分けて、各agentに合ったinstruction storage / MCP / workflowを使用する。

目的はランキングではなく、実務でのbest achievable qualityを測ること。

## Phase E — Clean rerun

効果があった改善は必ず clean baseline から再実行する。

修正済みコードの上で良くなっただけなら、prompt/contextの学習としては未証明。

## Initial hypotheses

Design-specific hypothesis は reference を見てから追加する。

先に検証できる一般仮説:

- H1: screenshot only より structured context の方が structural drift を減らす
- H2: exact screenshot verification は visual mismatch 発見に効く
- H3: staged workflow は giant prompt より failure attribution がしやすい
- H4: Code Connect が存在する案件では duplicate component 実装を減らせる可能性がある
- H5: clean rerun を通らない改善は playbook に昇格させない方がよい

## Completion condition

EXP-0001 は以下が揃うまで完了しない。

- frozen reference contract
- 3 agent common baseline、または実行不能理由
- PC + SP + 必要な中間幅のcapture
- first-pass scoring
- failure classification
- 少なくとも1つのisolated improvement
- clean rerun
- reusable / agent-specific / project-only lessonsの分離
