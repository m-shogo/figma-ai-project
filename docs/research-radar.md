# Research Radar — Figma × AI Coding Agents

Last designed: **2026-08-10 JST**

目的: Figma / Codex / Claude Code / Cursor が進化しても、古い成功体験や失敗体験に固定されないよう、**最新signalを効率よく拾って実験候補へ変換する**。

## What to monitor

### Capability changes

- new Figma MCP tools
- write-to-canvas changes
- `get_design_context`
- `get_metadata`
- `get_screenshot`
- `use_figma`
- `generate_figma_design`
- Code Connect
- Skills
- component/library search
- variables/token behavior
- plan/seat/rate-limit changes

### Agent/client changes

- Codex model/client updates
- Claude Code model/client updates
- Cursor agent/rules/indexing updates
- MCP configuration changes
- context-window / compaction behavior
- visual/browser tooling changes

### Practical quality signals

- pixel fidelity
- responsive behavior
- component reuse
- design-token reuse
- font/CJK handling
- image crop/assets
- large-page context truncation
- code → Figma round-trip
- auth/connectivity
- token/cost/time
- prompt/harness patterns

## Source lanes

### Lane A — Official capability truth

Check first for feature existence/current semantics:

- Figma Developer Docs
- Figma Blog / release notes
- OpenAI Codex docs/changelog
- Anthropic Claude Code docs/changelog
- Cursor docs/changelog
- official GitHub repositories

### Lane B — Practitioner workflows

High-value discovery:

- Zenn
- Qiita
- engineering blogs
- personal technical blogs
- conference writeups
- YouTube/transcript when concrete workflow evidence exists

### Lane C — Fast social signals

Newest pain/workaround discovery:

- X / Twitter
- Figma Community Forum
- GitHub Issues/Discussions
- Reddit
- Hacker News where relevant

Single social posts are low-confidence but high-freshness.

### Lane D — Benchmarks / research

- first-party evals
- arXiv / papers
- benchmark repositories

Use to generate measurable hypotheses, not to replace own experiments.

## Search query bank

Rotate queries instead of searching one generic phrase.

### Core

```text
"Figma MCP" design to code
"Figma MCP" Cursor
"Figma MCP" "Claude Code"
"Figma MCP" Codex
"use_figma" Figma
"generate_figma_design" Figma
"Code Connect" MCP agent
```

### Quality / failure

```text
"Figma MCP" inaccurate
"Figma MCP" pixel perfect
"Figma MCP" responsive
"Figma MCP" token
"Figma MCP" component reuse
"Figma MCP" font
"Figma MCP" Japanese
"Figma MCP" bug
"Figma MCP" workaround
```

### Japanese community

```text
site:zenn.dev Figma MCP Cursor
site:zenn.dev Figma MCP Claude Code
site:zenn.dev Figma MCP Codex
site:qiita.com Figma MCP
site:zenn.dev Code Connect Figma AI
```

### Social

```text
site:x.com "Figma MCP" Cursor
site:x.com "Figma MCP" "Claude Code"
site:x.com "Figma MCP" Codex
site:reddit.com "Figma MCP"
site:forum.figma.com MCP Claude Cursor Codex
```

### Freshness terms

Add current month/year, new tool names, or known release names to avoid stale setup articles.

## Efficient scan process

### Step 1 — Fresh scan

Look first at approximately recent 30–60 days for fast-moving tooling.

### Step 2 — Counterexample scan

For every strong success claim, search failure/limitation reports.

For every strong failure claim, search newer fixes/success reports.

### Step 3 — Version check

Record:

- publish date
- update date if present
- tool/client/model/version
- remote/local MCP
- plan/seat where relevant

### Step 4 — Deduplicate

Ten articles repeating one release announcement are one capability signal, not ten independent confirmations.

Prefer independent hands-on evidence.

### Step 5 — Convert to hypothesis

Do not save generic summary only.

Each useful signal becomes:

```text
Observed claim
→ conditions
→ possible confounders
→ measurable hypothesis
→ proposed experiment
```

## Priority scoring

Use a lightweight dynamic score, not a permanent ranking.

### Impact: 0–3

- 0: cosmetic/minor
- 1: local convenience
- 2: meaningful rework/fidelity effect
- 3: could materially change default workflow

### Freshness: 0–3

- 3: ≤30 days
- 2: 31–90 days
- 1: 91–180 days
- 0: older unless newly reverified

### Corroboration: 0–3

- 0: one anecdote
- 1: multiple related reports
- 2: independent practitioner + official/benchmark support
- 3: own experiment also reproduces

### Relevance: 0–3

- 3: directly reduces Figma→Code rework
- 2: adjacent workflow improvement
- 1: niche condition
- 0: low relevance

```text
Radar Priority = Impact + Freshness + Corroboration + Relevance
```

Score is triage only. It does not promote evidence maturity.

## Retest queue

Keep a separate queue for old negative findings.

Examples:

- font limitation
- client missing tool
- MCP auth instability
- poor responsive inference
- large-frame truncation

When related tooling changes, move them back to `RETEST_NOW` instead of assuming the old failure still holds.

## Research output

Each scan should produce at most:

- 3–7 genuinely new signals
- changed/invalidated old signals
- top experiments worth running
- source dates/links

Avoid accumulating hundreds of undigested links.

## Rule

**The radar optimizes what to test next; experiments decide what we believe.**
