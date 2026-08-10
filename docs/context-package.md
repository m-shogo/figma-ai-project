# Context Package

AIへの入力を「その時の会話の勢い」ではなく、runごとに再現できるpackageとして扱う。

## Key distinction

Production-oriented section runでは、**Coordination Envelope** と **Context Tier** を分ける。

```text
Coordination Envelope — identity / shared rules / lineage
+
Context Tier C0–C4 — how much design/code detail is supplied
```

Context Tierを下げても、production runのshared contractやfoundation lineageを消さない。

---

# 1. Coordination Envelope

SECTION / INTEGRATION runで原則必須。

- frozen reference manifest
- run scope
- section ID when applicable
- frozen shared contract path
- shared contract SHA-256
- section manifest/path
- verified foundation commit
- target repository/route
- company/designer/project guidance references
- exact acceptance viewports

これはagent比較のidentity/guardrailであり、C0–C4の研究変数とは別。

### Why

例えばC1 Structured Figmaを試すためにShared Contractまで外すと:

- breakpointが抜ける
- font/token/container基準が抜ける
- section workerのwrite isolationが消える

ため、「structured context量」と「coordination品質」を同時に変えてしまう。

Shared Contract自体の価値を測りたい場合だけ、明示的なcontract-ablation experimentとして外す。

---

# 2. Context tiers

## C0 — Visual/minimal

研究用の最小design payload。

Coordination Envelope +

- section reference screenshot(s)
- short task statement

Structured Figma contextを意図的に省く対照群。

Production recommendationではない。

## C1 — Structured Figma

C0 +

- `get_design_context` equivalent for the assigned section
- metadata when needed
- components/variants visible in returned context
- variables/tokens visible in returned context
- layout/sizing information
- exact assets available from Figma

現在のproduction baseline候補。

## C2 — Explicit section contract

C1 +

- section-specific PC/SP behavior
- relevant states
- annotations/intent
- known unknowns
- section dependency inventory
- explicit asset/crop rules

Shared breakpoint値はCoordination EnvelopeのShared Contractから取得し、section contextへ必要なbehaviorだけ展開する。

## C3 — Codebase-aware

C2 +

- existing components relevant to the section
- token/theme utility paths
- existing styling conventions
- routing/state/data constraints
- nearby implementation patterns

Shared foundationを再発明するためではなく、既存code reuse精度を上げるために使う。

## C4 — Connected design system

C3 +

- Code Connect mappings where available
- source component mapping
- prop/variant mapping
- implementation examples/instructions supplied by Code Connect

Code Connect coverageも可能なら記録する。

---

# 3. Do not confuse tier with quality

C4が常に必要とは限らない。

目的はcontext最大化ではなく、**最小の十分なcontextでFirst-passとReworkを改善すること**。

同時に、Coordination Envelopeをcontext optimization対象として不用意に削らない。

---

# 4. Section-scoped retrieval discipline

## Global coordinator

Production準備時:

1. codebase/company/design-system rules
2. breakpoint source
3. top-level Figma metadata
4. shared components/variables/fonts
5. section boundary candidates

を読む。

## Section worker

1. exact section node
2. section structured context
3. relevant child nodes if large
4. only required shared component/Code Connect info
5. only relevant code files

**他sectionを念のため全部読む、をdefaultにしない。**

---

# 5. Progressive disclosure

Large Figma pageの場合:

```text
page metadata
→ section node IDs
→ assigned section design context
→ difficult child/component only
```

へ狭める。

Section自体が重ければさらにcomponent/local groupへ分割して読む。

実装work unitを細かくしすぎる必要はない。**context retrieval単位とcode ownership単位は別にできる。**

例:

- MainVisual worker 1人
- Figma contextはvisual / copy / CTA / decorationを必要に応じて分割取得

---

# 6. Context manifest

各runで記録する。

```yaml
coordination:
  scope: SECTION
  section_id: S02
  shared_contract_path: "..."
  shared_contract_sha256: "..."
  section_manifest_path: "..."
  foundation_commit: "..."

context:
  tier: C2
  figma_design_context: true
  figma_metadata: true
  figma_screenshots: true
  figma_components: true
  figma_variables: true
  figma_annotations: true
  code_connect: false
  files_read: []
  figma_nodes_inspected: []
```

---

# 7. Breakpoint context

Production runではShared Contractのbreakpointがsource of truth。

Section workerには必要な情報だけを渡す:

- exact shared breakpoint/query
- sectionでその境界に何が起こるか
- relevant PC/SP evidence

AIに「良いbreakpointを考えて」と依頼しない。

会社/デザイナー指定が変わった場合はShared Contract revisionを更新する。

---

# 8. Context contamination

COMMON比較時に混ぜない:

- 前runのrepair案
- 他agentの結果
- human評価コメント
- final generated code
-別contract revisionのsection output

Fresh session/contextを使う。

---

# 9. Information priority

Section implementation時:

1. frozen reference + owner/company requirements
2. frozen Shared Contract
3. section manifest
4. Figma structured context
5. existing repository architecture/components
6. reference screenshots
7. agent inference for non-material unknowns only

Design/code/shared contractに矛盾が見つかったら隠さずconflictを返す。

Section workerがShared Contractを勝手に再解釈/変更しない。

---

# 10. Context efficiency metrics

可能なら:

- MCP calls
- Figma nodes inspected
- screenshots fetched
- repo files read
- prompt bytes/tokens if available
- total turns before first implementation
- repeated context fetches

を残す。

同品質なら小さいcontextを優先する。

ただしShared Contract/Foundationのlineage metadataは削減対象外。

---

# 11. Contract-ablation research

Shared Contract自体の効果を研究したい場合:

```text
A: same section + C1 + coordination without shared design contract
B: same section + C1 + frozen shared contract
```

のように**実験変数として明示**する。

このAをproduction defaultへ混ぜない。
