# Translation Mode Experiments

Per-section Figma Structure Profileの`recommended_translation_mode`は、agentごとに気分で変える設定ではない。

Current modes:

- `STRUCTURE_FIRST`
- `HYBRID`
- `VISUAL_FIRST`
- `CODEBASE_FIRST`

## Production default

Global Capability Profile + exact Section evidenceから、CoordinatorがSection Profileを作り、**1つのrecommended modeをprofile revisionとして固定**する。

Section Manifest / Run Recordは同じProfile SHA-256を参照する。

Codex / Claude Code / Cursorが各自「自分はVISUAL_FIRSTが好き」と勝手に変更しない。

## COMMON comparison

Agent差を比較する場合は固定:

- same frozen reference
- same Section node IDs
- same Shared Contract SHA-256
- same Section Manifest SHA-256
- same Figma Structure Profile SHA-256
- same recommended translation mode
- same foundation commit
- same component/token resolution
- same viewports/breakpoints
- same context tier
- same repair budget

Agent固有のretrieval trick/skill/prompt adaptationはCOMMONへ混ぜない。

## OPTIMIZED comparison

Agent/client固有のcurrent best practiceを使ってよい。

ただしTranslation Mode自体を変える場合は:

- why mode changed
- evidence
- old/new profile revision
- profile SHA-256

を明示する。

`COMMON HYBRID`と`OPTIMIZED STRUCTURE_FIRST`を同じ条件のagent rankingとして扱わない。

## Mode itself as experiment variable

Translation Modeの価値を研究する場合、**agent/model/referenceを固定しModeだけ変える**。

Example:

```text
EXP-TM-01A: Section S03 / HYBRID
EXP-TM-01B: Section S03 / STRUCTURE_FIRST
```

Profileの観測signalは同じままにし、Mode recommendationだけ別experiment revisionとして作る。

Measure:

- First-pass Visual Fidelity
- Structural Fidelity
- Rework
- context/tool calls
- incorrect assumptions
- overfitting
- existing component/token reuse

## Avoid circular scoring

「STRUCTURE_FIRSTでうまくいったからFigma structureは信頼できる」と後付けしない。

先にProfile evidenceを固定し、その後Modeを実験する。

Mode結果でProfileの**capability fact**を改変しない。

結果から更新できるのは主に:

- strategy decision
- mode recommendation
- known limitations

Capability evidenceそのものがtool再調査で変わった場合は新Profile revisionを作る。

## Update-aware

Model/MCPの進化で最適Modeは変わりうる。

例:

- visionが改善 → VISUAL_FIRSTのFirst-pass向上
- structured context改善 → STRUCTURE_FIRSTが有利
- Code Connect拡大 → CODEBASE_FIRSTが有利
- code→canvas/diff改善 → HYBRID repair cost低下

古いMode rankingを永久ruleにしない。

Major update後は、代表Sectionでsmall rerunしてからcurrent recommendationを更新する。
