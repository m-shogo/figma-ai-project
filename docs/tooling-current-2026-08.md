# Tooling Snapshot — 2026-08

この文書は時点付きの調査メモ。ツール仕様は変化するため、永続ルールとして扱わない。

## Figma MCP

2026-08 時点の公式資料では、Figma MCP は AI agent に structured design context を渡すだけでなく、remote MCP 経由で native Figma content を作成・更新する workflow も提供している。

研究上の意味:

- screenshot-only reproduction を baseline にしない
- variables / components / layout data を入力品質として扱う
- Figma → Code だけでなく Code → Figma も実験対象にする
- remote MCP を primary path とし、desktop MCP は必要なケースで比較する

## Code Connect

Figma公式は Code Connect を、実際の code component と Figma component を結び、agent が codebase の実コンポーネントを再利用しやすくする重要な橋として位置づけている。

仮説:

- component-rich な画面ほど Code Connect の有無が Structural Fidelity と Rework Cost に効く
- 単純LPでは効果が小さく、product UI で差が大きくなる可能性がある

これは実験で検証する。

## Codex / Claude Code / Cursor

Figma公式の MCP setup docs は Claude Code、Codex、Cursor 等を対象 client として案内している。

### Claude Code

MCP を CLI から追加可能。Figma remote MCP を project-local / user scope で利用できる。

### Cursor

公式 docs では MCP を project-local `.cursor/mcp.json` または global config で設定できる。Composer Agent から MCP tools を利用可能。

### Codex

Figma の公式 setup 対象 client に含まれるため、本repoでは同じ reference / acceptance criteria を使って comparative experiment を行う。

## Current research priority

1. Figma structured context の有無
2. screenshot併用の効果
3. Code Connect の有無
4. prompt の区切り方
5. exact viewport visual verification
6. clean re-run による再現性
7. agent-specific optimization

## Important caution

Figma公式も MCP は one-click perfect-code generator ではないと説明している。MCP は structured input と starting point を提供し、最終品質は agent、codebase context、design system、prompt clarity に依存する。

したがって、このrepoでは MCP の導入自体を成功とせず、**First-pass Score と Rework Cost が改善したか**で判断する。
