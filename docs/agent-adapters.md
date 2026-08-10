# Agent Adapters — Codex / Claude Code / Cursor

Last reviewed: 2026-08-10

目的はagentごとに別の思想を作ることではない。

**共通ルールを1か所に置き、client固有の読み込み方法だけadapterとして薄くする。**

## Canonical layer

`AGENTS.md` を本repoの共通研究ルールとする。

ここに置くもの:

- source-of-truth boundary
- experiment discipline
- evaluation rules
- failure recording
- clean replay policy

置かないもの:

- 特定referenceの色や寸法
- agentだけに効くprompt hack
- client固有command

## Codex

現在の公式Codex docsでは、Codexは作業開始前に `AGENTS.md` を読み、global → project root → current directoryへinstruction chainを構築する。

研究上の使い方:

- repo root `AGENTS.md` = common contract
- 必要になった場合のみ対象directoryへ小さいnested `AGENTS.md` / overrideを追加
- runごとに「どのinstruction sourceを読んだか」を記録
- instructionを増やしすぎない

MCPはCodex hostのconfigから利用でき、project-scoped configも可能。

COMMON runでは、他agentと同等のFigma access/context tierに揃える。

## Claude Code

Claude Codeではproject instructionsを `CLAUDE.md` で共有でき、MCP serverを接続できる。

本repoでは `CLAUDE.md` を将来追加する場合も、canonical ruleのコピーを大量に持たせない。

推奨adapter:

```text
# CLAUDE.md
@AGENTS.md

Agent-specific operational notes only go below this line.
```

これによりcommon contractとClaude固有メモを分離する。

COMMON runでClaudeだけ追加memoryを持たせない。

## Cursor

CursorのProject Rulesは `.cursor/rules` にversion-controlledで保存できる。公式docsではroot `AGENTS.md` もsimple project instructionとして利用可能。

本repoの初期方針:

- common rulesは `AGENTS.md`
- `.cursor/rules` は本当にscopeが必要になった時だけ追加
- `.cursorrules` legacyへ新規投資しない

Cursor固有ruleを作る場合は:

- focused
- actionable
- scoped
- common contractを丸ごと複製しない

## Figma MCP common principle

Figma公式はRemote MCPを多くの利用ケースで推奨しているため、比較条件として特別な理由がなければremoteを第一候補にする。

ただし client / seat / feature availability が異なる場合は、run metadataに必ず記録する。

比較上重要なのは「全員remoteであること」ではなく、**agent間で取得できたreference情報のtierを揃えること**。

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
- prompt本文

の4箇所に同じruleをコピーし、少しずつ内容がズレる。

原則:

1. universal rule → `AGENTS.md` / docs
2. experiment prompt → `prompts/`
3. agent-specific adapter → agent note/rule
4. reference-specific fact → experiment/reference manifest

この分離を守る。
