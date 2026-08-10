# Tooling Snapshot — 2026-08

Last reviewed: **2026-08-10 JST**

この文書は「現在の研究上の解釈」を短く残すsnapshotです。

**公式仕様・URL・確認日は `docs/source-registry.md` を正本とする。**

製品仕様をこのファイルへ重複して大量記載しない。仕様変更時に2箇所が食い違うのを防ぐ。

## Current research interpretation

### Figma context

研究では screenshot-only を実務上の標準にしない。

比較変数として以下を段階化する。

- C0: visual/minimal
- C1: structured Figma context
- C2: explicit reference/responsive contract
- C3: codebase-aware context
- C4: connected design system / Code Connect

詳細: `docs/context-package.md`

### Figma structure

components / variables / layout semantics / annotations / assets / mapping information が取得できる場合、それぞれを「AIへ渡す入力品質」の変数として扱う。

ただし「情報量が多いほど必ず良い」とは仮定しない。First-pass Fidelity と Context Efficiency で検証する。

### Coding agents

Codex / Claude Code / Cursor は、COMMON と OPTIMIZED を分ける。

- COMMON: 同一reference・同一context tier・同一acceptanceで比較
- OPTIMIZED: client固有instructions / skills / MCP workflowを許可

agentごとの最高点だけで優劣を決めず、failure profile / rework / replay stability を見る。

詳細: `docs/run-contract.md`, `docs/agent-adapters.md`

### Prompt architecture

現在の標準候補:

1. Inspect
2. Implement
3. Verify — diagnosis only
4. Repair — selected root cause only

これはまだ「永続の正解」ではない。one-shotとの比較実験で効果を検証する。

### Verification

Visual comparison は exact viewport + deterministic state + first-pass preservation を基本とする。

pixel diffだけで合否を決めず、structural evidenceと組み合わせる。

詳細: `docs/visual-verification.md`

## Current research priority

Reference受領後の優先順:

1. COMMON baselineを保存
2. C0 → C1 structured context差
3. C1 → C2 explicit responsive/reference contract差
4. staged vs one-shot
5. existing component/token reuseの失敗傾向
6. Code Connectが実在する場合の差
7. agent-specific OPTIMIZED run
8. clean replay
9. 別referenceでportability確認

## Important caution

このsnapshotの内容もCandidateです。

ツールが機能を提供していることと、その機能が今回のFirst-pass/Reworkを改善することは別。

**実験で測れたものだけplaybookへ昇格する。**

## Source maintenance

現在の公式情報は `docs/source-registry.md` を参照。

major client/model/MCP change、予期しない挙動差、または次の大きなbenchmark前にはregistryを再確認する。
