# Context Package

AIへの入力を「その時の会話の勢い」ではなく、runごとに再現できる package として扱う。

## Why

同じFigmaでも結果が変わる原因には、model差だけでなく以下が混ざる。

- screenshotしか渡していない
- structured contextを一部しか読んでいない
- component/token情報を読んだagentと読まないagentがいる
- codebaseの既存component探索量が違う
- promptが長すぎて重要条件が埋もれる

比較可能にするため、何を渡したかを tier で固定する。

## Context tiers

### C0 — Visual only

研究用の最小baseline。

- reference screenshot(s)
- short task statement
- target repo/route

実務推奨ではない。structured contextとの差を測るために使う。

### C1 — Structured Figma

C0 +

- get_design_context equivalent
- metadata when needed
- components / variants visible in returned context
- variables/tokens visible in returned context
- layout/sizing information
- exact assets available from Figma

### C2 — Explicit design contract

C1 +

- reference manifest
- explicit PC/SP invariants
- relevant states
- annotations / behavior notes
- known unknowns
- component/variable inventory

### C3 — Codebase-aware

C2 +

- starting commit
- design-system paths
- existing component inventory relevant to target
- token/theme paths
- routing/state/data-fetch constraints
- known implementation conventions

### C4 — Connected design system

C3 +

- Code Connect mappings where available
- source component mapping
- prop/variant mapping
- direct implementation examples when the connection supplies them

## Do not confuse tier with quality

C4が常に必要とは限らない。

目的は「contextを最大化すること」ではなく、**最小の十分なcontextでFirst-passとRework Costを改善すること**。

## Context manifest

各runで記録する。

```yaml
context:
  tier: C2
  figma:
    design_context: true
    metadata: true
    screenshots: true
    components: true
    variables: true
    annotations: true
    code_connect: false
  codebase:
    starting_sha: "..."
    files_read:
      - "src/..."
    design_system_paths:
      - "src/components/..."
  prompt:
    version: "..."
    hash: "..."
```

## Retrieval discipline

### Inspect broad → fetch narrow

大きいFigma fileを最初から全部contextへ入れない。

1. target URL/nodeを特定
2. target contextを取得
3. truncated/largeならmetadataで構造を把握
4. 必要nodeだけ追加取得
5. component/token/source mappingを必要範囲だけ読む

### Repo side

1. target route entrypoint
2. nearby components
3. design system/tokens
4. relevant shared layout
5. only then broader search

## Context contamination

agent比較時に以下を混ぜない。

- 前runのrepair案
- 他agentの結果
- human評価コメント
- final answer

COMMON first-passでは新しいsession/clean contextを使う。

## Information priority

矛盾時の優先順位:

1. frozen reference
2. explicit owner notes tied to reference
3. Figma structured context
4. existing codebase contract that must be preserved
5. screenshots
6. agent inference

Designとcodebaseが本当に矛盾する場合は、勝手に片方を隠さず run record に conflict を残す。

## Context efficiency metric

可能なら以下を補助指標として残す。

- MCP calls
- Figma nodes inspected
- screenshots fetched
- repo files read
- prompt bytes/tokens if available
- total turns before first implementation

精度が同等なら、小さいcontext packageを優先する。
