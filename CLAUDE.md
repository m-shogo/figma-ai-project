# CLAUDE.md

@AGENTS.md

## Claude Code adapter

`AGENTS.md` をこのrepositoryの共通研究契約として扱う。

このファイルにはClaude Code固有で、かつ実験で必要性が確認されたinstructionだけを追加する。

### Current rules

- COMMON runではClaude固有の追加prompt hackや前runのmemoryを混ぜない。
- Figma/reference固有のdesign factをこのファイルへ保存しない。
- Agent-specific optimizationはCOMMONとは別のOPTIMIZED runとして記録する。
- 新しいClaude固有ruleは、少なくともclean replayで有効性を確認するまで `AGENTS.md` へ昇格しない。

現時点では追加のClaude固有playbook ruleはありません。
