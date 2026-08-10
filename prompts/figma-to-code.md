# Figma → Code Prompt Architecture

このファイルは巨大な完成promptではなく、runを再現可能にする**入口**。

原則として以下を順番に使う。

1. `01-inspect.md`
2. `02-implement.md`
3. `03-verify.md`
4. `04-repair.md` — 必要なfailure classだけ

## Why staged

one-shotで「読んで・作って・比較して・直して」を全部やらせると:

- first-passが消える
- agentが何を誤読したか追えない
- repairの効果が分からない
- 同じ失敗を次回防ぐruleへ変換しにくい

このrepoでは **First-pass preservation と failure attribution** を優先する。

## Common inputs

```text
EXPERIMENT_ID=
RUN_ID=
REFERENCE_MANIFEST=
FIGMA_URL=
TARGET_NODE_IDS=
CONTEXT_TIER=
TARGET_REPOSITORY=
STARTING_COMMIT=
TARGET_ROUTE=
FRAMEWORK=
ACCEPTANCE_VIEWPORTS=
MAX_REPAIR_ROUNDS=
```

値はreference manifest/run recordから埋める。prompt内に案件固有情報を永久保存しない。

## COMMON vs OPTIMIZED

### COMMON

Codex / Claude Code / Cursor へ同じstage prompt、同じcontext tierを使用。

### OPTIMIZED

この4段構造は維持しつつ、agent固有skills/rules/commandへ最適化してよい。

結果はCOMMONと別cohortとして記録する。

## One-shot baseline

staged workflow自体の効果を検証する場合のみ、比較用にone-shotを実行してよい。

その場合も:

- first-passを保存可能にする
- reference/context tierを同一にする
- one-shotであることをrun metadataへ記録する

## Rule

**Design factをprompt architectureへ埋め込まない。**

デザイン固有の値はreference manifest、実装固有の値はrun record、汎用workflowだけをpromptsへ置く。
