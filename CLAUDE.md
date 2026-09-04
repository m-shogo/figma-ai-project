# CLAUDE.md

@AGENTS.md

## Claude Code adapter

`AGENTS.md` をこのrepositoryの共通研究契約として扱う。

共通の実行・ownership・speed・escalation policyは `docs/agent-execution-policy.md` を必ず読む。

このファイルにはClaude Code固有で、かつ実験で必要性が確認されたinstructionだけを追加する。

### Current rules

- COMMON runではClaude固有の追加prompt hackや前runのmemoryを混ぜない。
- Figma/reference固有のdesign factをこのファイルへ保存しない。
- portable な Human-approved contract はこのファイルへ置かない。Git の `AGENTS.md` / canonical docs / `experiments/<case>/` へ上げる。
- Agent-specific optimizationはCOMMONとは別のOPTIMIZED runとして記録する。
- 新しいClaude固有ruleは、少なくともclean replayで有効性を確認するまで `AGENTS.md` へ昇格しない。

### Implementation ownership

Claude Codeはlocal repositoryへアクセスできる場合、implementation laneの第一候補として扱う。

優先担当:

- repository file editing / refactor / implementation
- git / branch / commit / `gh`
- lint / test / build / Playwright
- PHP / JS / CSS / WordPress runtime
- CI fix
- PR preparation / merge前Git cleanup

ただし、同じwrite scopeを別のCode系Agent / Claude Code / Codexが既にbranch・commit・PRで所有している場合は、その実装を別branchで作り直さない。current ownerの成果を引き継ぎ、latestとの差分だけを処理する。

ChatGPT / Claude等が既にFigma比較、Visual Authority、root cause、Human feedback、architecture decisionを証拠付きで確定している場合、Agentが変わっただけで同じ調査を最初から再実行しない。実装に必要な差分確認だけ行う。

### Speed / escalation

- 現行Authorityと矛盾するstale test / validator / old breakpoint / legacy fixtureは、`docs/agent-execution-policy.md` に従ってactive contractから退役させる。
- Scope外CI failureは、今回の変更が原因でないことを1回確認したら追跡を打ち切る。
- Human-approved Visualは`VISUAL_FROZEN`として扱い、integrationのために勝手にredesignしない。
- 既存QAで十分なら、新しいvalidator / workflow / evidence infrastructureを増やさない。
- 同じ原因で2回詰まったら同じ方法を繰り返さずrouteを変える。
- ユーザーのMaster Authority 1つでcompatibility調査やlegacy維持を大幅に省ける場合、遠回りを始める前に短くHumanへescalateする。
- 自分でrepoを読めば解決するroutine implementation decisionはHumanへ丸投げしない。
