# Agent Run Contract

Codex / Claude Code / Cursor の比較で「agent差」と「条件差」を混同しないための契約。

## Run classes

### COMMON

agent間比較用。

固定する:

- same frozen reference
- same starting code commit
- same context tier
- same common prompt version
- same target viewport(s)
- same acceptance criteria
- same max repair rounds
- same dependency policy

agent固有の裏技・追加rules・前runの学びは入れない。

### OPTIMIZED

実務上の最高品質を測るrun。

許可する:

- agent固有instructions
- agent固有skills/plugins
- agentに適したprompt segmentation
- client固有MCP workflow

COMMONとOPTIMIZEDを同じランキングに混ぜない。

### REPLAY

学習したruleの再現性確認。

- clean starting commit
- fresh session/context
- promoted candidate ruleだけ追加
- previous generated codeは参照しない

## Run phases

### P0 — Preflight

- reference ready
- starting SHA clean
- required MCP/tools connected
- exact model/client version recorded if known
- target route runnable

### P1 — Inspect

コード変更禁止。

agentは:

- Figma structure
- responsive behavior
- assets
- design-system mapping
- codebase reuse targets
- unknowns

をまとめる。

### P2 — Implement

Inspect結果とfrozen contextだけを使ってfirst passを作る。

**この時点を必ず保存する。**

### P3 — Verify

- exact reference viewport(s)
- relevant intermediate widths
- visual comparison
- structural checks
- overflow/wrapping/state checks

### P4 — Repair

failure class単位で修正する。

max repair roundsを超えない。

### P5 — Record

- scores
- failures
- repairs
- assumptions
- reusable lessons

### P6 — Replay when warranted

Candidate improvementをclean baselineから再実行する。

## First-pass preservation

最重要ルール:

agentが自己修正を何度もしてから「完成しました」と言った状態だけ残さない。

可能なら:

- first-pass commit
- first-pass screenshot
- first-pass score
- first-pass failure list

を保存する。

First-passを失うと「戻りが減ったか」を測れない。

## Fairness rules

比較runでは次を禁止する。

- Claudeだけにhuman repair hintを与える
- Cursorだけ前agentのdiffを見る
- CodexだけCode Connectを有効にする
- agentごとにstarting commitが違う
- viewport条件が違う
- repair round上限が違う

違いを入れる場合は、新しいexperiment variableとして明示する。

## One-variable principle

改善実験では原則1つだけ変える。

例:

- context C1 → C2
- one-shot → staged prompt
- Code Connect off → on
- annotation absent → present

model更新など不可避の変化はrun metadataへ記録する。

## Stop conditions

repairを止める条件:

- acceptanceに到達
- max repair rounds到達
- reference ambiguityでこれ以上評価不能
- environment/tool blocker
- repairが別failure classを悪化させ続ける

止めた理由もdata。

## Result interpretation

「Agent A 93点、B 90点」で即優劣を決めない。

見る順序:

1. First-pass
2. failure profile
3. Rework Cost
4. clean replay stability
5. context cost
6. portability

1回の最高点より、再現性のある工程を優先する。
