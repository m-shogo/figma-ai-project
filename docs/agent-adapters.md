# Agent Adapters — Codex / Claude Code / Cursor / compatible agents

Last reviewed: 2026-08-20

目的はagentごとに別の思想を作ることではない。

**共通ルールを1か所に置き、client固有の読み込み方法・利用可能tool差だけadapterとして薄くする。**

## Canonical layer

`AGENTS.md` を本repoの共通研究ルールとする。

ここに置くもの:

- source-of-truth boundary
- experiment discipline
- evaluation rules
- failure recording
- clean replay policy
- canonical docs / skills への短いrouting

置かないもの:

- 特定referenceの色や寸法
- agentだけに効くprompt hack
- client固有command
- 1つの作業でしか使わない長いprocedure
- machineで確実に検査できる大量のlint条件

## Instruction placement principle

2026年のCodex / Claude Code / GitHub Copilot等の外部guidanceを踏まえ、instructionを役割で分ける。

```text
stable cross-agent contract
→ AGENTS.md

long-lived human/agent knowledge
→ canonical docs

task-specific repeatable procedure
→ Skill / prompt workflow

path-specific rule
→ nested/scoped instruction only when needed

client-only behavior
→ thin adapter

deterministic invariant
→ CI / hook / test / validator

reference/project-specific fact
→ run/reference/section record
```

重要なのは「Markdownを増やすこと」ではなく、**always-on contextを小さくし、必要な知識だけ必要な時に読むこと**。

同じruleを `AGENTS.md` / `CLAUDE.md` / Cursor rule / Copilot rule / promptへ全文複製しない。

## Codex

現在の公式Codex architectureでは、CodexはglobalからGit/project root、作業directoryへinstruction chainを構築する。

研究上の使い方:

- repo root `AGENTS.md` = common contract / router
- 必要になった場合のみ対象directoryへ小さいnested `AGENTS.md` / overrideを追加
- runごとに「どのinstruction sourceを読んだか」を記録
- instructionを増やしすぎない
- task-specific procedureはroot AGENTSへ全文追加せずSkill/docへ逃がす

MCPはCodex hostのconfigから利用でき、project-scoped configも可能。

COMMON runでは、他agentと同等のFigma access/context tierに揃える。

## Claude Code

Claude Codeではproject instructionsを `CLAUDE.md` で共有でき、Rules / Skills / Hooks / Subagents等を役割別に使える。

本repoでは `CLAUDE.md` にcanonical ruleのコピーを大量に持たせない。

推奨adapter:

```text
# CLAUDE.md
@AGENTS.md

Agent-specific operational notes only go below this line.
```

役割:

- `CLAUDE.md` = common contractへのbridge + Claude固有の最小note
- Rules = 本当にscopeが限定される時
- Skills = 反復する手順/tool sequence
- Hooks = deterministicに止めたい/記録したい処理
- Subagents = context分離や専門並列が本当に有効な時だけ

「全部CLAUDE.mdへ書く」を避ける。

COMMON runでClaudeだけ追加memoryを持たせない。

## Cursor

CursorのProject Rulesは `.cursor/rules` にversion-controlledで保存できる。root `AGENTS.md` もsimple project instructionとして利用可能な場合は共通contractとして使う。

本repoの初期方針:

- common rulesは `AGENTS.md`
- `.cursor/rules` は本当にscopeが必要になった時だけ追加
- `.cursorrules` legacyへ新規投資しない

Cursor固有ruleを作る場合は:

- focused
- actionable
- scoped
- common contractを丸ごと複製しない

## GitHub Copilot compatibility

GitHub Copilotのcurrent agent/code-review docsでも `AGENTS.md` はcross-agent standing instructionとして利用される。

Copilotを正式なexecution laneへ追加する場合も、最初からfrontend standard全体を `.github/copilot-instructions.md` へコピーしない。

候補:

```text
AGENTS.md
→ shared cross-agent contract

.github/copilot-instructions.md
→ Copilotにだけ必要なrepo-wide差分が実在する時だけ

.github/instructions/*.instructions.md
→ path-specific ruleが必要な時だけ
```

Copilot supportが存在するだけで新しいinstruction familyを作らない。

## Figma MCP common principle

Figma Remote MCPが利用可能なら、clientごとの独自Figma helperを増やす前にupstream toolを使う。

Design-to-codeで優先するcapability:

```text
get_design_context
→ get_screenshot when visual inspection is needed
→ download_assets when durable/export/raw bytes are needed
→ search_design_system when project/library reuse is relevant
→ Code Connect map/suggestions when plan + library support it
```

重要:

- `get_design_context`のreference codeはtarget codebaseへ適応するためのevidenceであり、そのままproductionへ貼るfinal codeではない
- exact image/SVGが必要なら`download_assets`をcustom binary bridgeより先に試す
- `get_screenshot`をasset delivery代わりに使わない
- Code Connectが使えない時に独自Code Connect cloneを作らない

2026-08-20 REF-001 probeではRemote MCP `download_assets`からnode export、original JPEG fills、exact SVG assetsを取得できた。一方Code Connect suggestionは現在のFigma plan/seat条件で利用不可だった。このような**client/account capability差をrun metadataへ残し、同じfallbackを全clientへ固定しない**。

比較上重要なのは「全員同じtool名を使うこと」ではなく、agent間で取得できたreference情報tierとasset provenanceを記録すること。

## Figma context sizing

Figmaのcurrent first-party MCP guidanceも、大きなselectionを一括で処理するよりcomponent / logical chunkへ分けることを推奨している。

本repoでは既存のSection-first方針と統合して扱う。

```text
whole reference orientation
→ semantic section/component boundary
→ focused design context
→ implement
→ section verify
→ integration verify
```

ただし「小さければ小さいほど良い」とはしない。

- shared dependencyを切断しない
- responsive relationを失わない
- component contextが必要ならcomponent単位で取得する
- section境界はFigma layer数ではなくimplementation/review responsibilityで選ぶ

外部のfirst-party confirmationは `research/external-practice-learning-2026-08-20.md` に記録する。

## Code Connect adapter

利用可能ならupstream順序を守る。

```text
existing map
→ suggestions/context
→ production repo component verification
→ mapping
```

Code Connect write/mappingを自動で増殖させない。mappingは実production ownerとvariant/property対応が確認できた時だけ保存する。

利用不可の場合は `docs/component-resolution.md` をfallbackとする。fallbackが保持するのはdecision/evidenceだけであり、Figma側Code Connect platform自体を再実装しない。

## Agent-specific optimization rule

agent-specific best practiceは価値があるが、COMMON runに混ぜない。

保存場所の例:

```text
docs/agent-notes/
  codex.md
  claude-code.md
  cursor.md
```

昇格条件:

- そのagentでclean replayした
- common ruleではなくagent/client差である根拠がある
- model/client versionを記録している

## Avoid duplication

悪い状態:

- AGENTS.md
- CLAUDE.md
- .cursor/rules/foo.mdc
- .github/copilot-instructions.md
- prompt本文
- client専用custom Figma bridge

の複数箇所に同じrule/capabilityをコピーし、少しずつ内容がズレる。

原則:

1. universal rule → `AGENTS.md` / docs
2. repeatable procedure → Skill / prompt workflow
3. agent-specific adapter → agent note/rule
4. reference-specific fact → experiment/reference manifest
5. deterministic invariant → CI/test/hook/validator
6. upstream tool already solves mechanism → use upstream; adapter contains only missing glue

外部integrationの採用・fallback・退役判断は `docs/frontend-external-integration-matrix.md` を参照する。
