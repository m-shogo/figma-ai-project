# Official Source Registry

Last checked: **2026-08-10 JST**

ツール仕様は変わる。実験ルールと「2026年8月時点の製品仕様」を混ぜないため、時点付きで公式情報を記録する。

## Source priority

1. official product/developer docs
2. official changelog / release notes
3. official engineering/use-case guidance
4. official GitHub repositories
5. community reports = hypothesis discovery only

Community/SNSのノウハウは、そのままplaybookへ入れない。実験で再現してから昇格する。

---

## Figma MCP

### Introduction

Source:
https://developers.figma.com/docs/figma-mcp-server/

Checked facts:

- Figma MCP provides structured design context to agents
- it can write native Figma content back to canvas
- context can include variables/components/layout data
- Code Connect can improve reuse of actual code components
- Figma recommends Remote MCP for most users because it has the broadest feature set

### Remote server setup

Source:
https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/

Checked facts:

- supported clients include Cursor and Claude Code; supported-client catalog can change
- link-based design context is supported
- remote MCP supports write-to-canvas workflows
- Figma provides client-specific plugin/skill setup for some clients

### Tools and prompts

Source:
https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/

Important workflow facts:

- `get_design_context` is the main structured design-context tool
- `get_metadata` is useful to map a large file before fetching narrower nodes
- `get_screenshot` provides visual reference
- Code Connect mapping tools exist
- design-system/library search tools exist on supported remote workflows

### Structure Figma for better code

Source:
https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/

Current official recommendations include:

- reusable components
- Code Connect
- variables/tokens
- semantic naming
- Auto Layout
- annotations
- dev resources

Research implication:

These are candidate explanatory variables for reproduction quality, not automatic proof that each one always improves every screen.

### MCP vs agent

Source:
https://developers.figma.com/docs/figma-mcp-server/mcp-vs-agent/

Important distinction:

Figma MCP provides structured input/starting context. The coding agent still owns final implementation and must adapt it to the codebase.

### Code Connect

Sources:
https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/
https://developers.figma.com/docs/code-connect/

Research implication:

When a real component library exists, measure whether mappings reduce component duplication and structural drift.

### Rate limits / access

Source:
https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/

Do not hardcode limits into permanent rules. Re-check before high-volume experiments because plan/seat/tool limits can change.

---

## OpenAI Codex

### Figma → code use case

Source:
https://learn.chatgpt.com/use-cases/figma-designs-to-code

Current official workflow emphasizes:

- start from structured Figma design context
- retrieve the exact screenshot/variant
- reuse repo design-system components and tokens
- translate Figma output into existing repo conventions
- verify in a real browser with Playwright
- iterate against reference rather than stopping after code generation

This strongly supports this repo's Inspect → Implement → Verify loop.

### Responsive frontend use case

Source:
https://learn.chatgpt.com/use-cases/frontend-designs

Current official workflow emphasizes multiple references/states where useful and real-browser visual checking across screen sizes.

### AGENTS.md

Source:
https://learn.chatgpt.com/docs/agent-configuration/agents-md

Checked facts:

- Codex reads `AGENTS.md` before work
- instructions can be layered by directory
- project and more-local instructions can be composed

Research implication:

Keep universal reproduction rules in a stable canonical layer and avoid giant repeated task prompts.

### MCP

Source:
https://learn.chatgpt.com/docs/extend/mcp

Checked facts:

- Codex supports MCP access to external tools/context including Figma
- local Codex clients share MCP configuration on the same host
- project-scoped MCP configuration is supported in trusted projects

---

## Claude Code

### MCP

Source:
https://docs.anthropic.com/en/docs/claude-code/mcp

Related index:
https://docs.anthropic.com/en/docs/mcp

Research implication:

Record MCP scope/config in each run so a Claude run with richer tool access is not silently compared with a weaker baseline.

### CLI / reproducible execution

Source:
https://docs.anthropic.com/en/docs/claude-code/cli-usage

Useful experiment capabilities include non-interactive print mode, explicit model selection, turn limits, JSON output, and verbose output where appropriate.

### Project memory / CLAUDE.md

Source family:
https://docs.anthropic.com/en/docs/claude-code/

Claude Code supports project-level persistent instructions via `CLAUDE.md`. Keep these as thin adapters to canonical rules rather than duplicating the whole playbook.

---

## Cursor

### MCP

Source:
https://docs.cursor.com/context/model-context-protocol

Checked facts:

- project-specific MCP config can live in `.cursor/mcp.json`
- global config is also available
- agent can use MCP-returned image context

### Rules

Source:
https://docs.cursor.com/context/rules-for-ai

Checked facts:

- project rules live in `.cursor/rules`
- rules are version-controlled and can be scoped
- root `AGENTS.md` is supported as a simpler project-instruction mechanism in current docs
- legacy `.cursorrules` should not be the new default

Research implication:

Do not duplicate universal rules into multiple Cursor files unless scoping is actually needed.

---

## Refresh policy

Re-check this registry when:

- a major agent/client version changes
- Figma MCP tool list changes
- an experiment behaves differently without project changes
- a previously unavailable tool becomes available
- rate/permission behavior changes
- at least 30 days have passed before a major new benchmark round

When a fact changes, update this snapshot with date and preserve experiment metadata from older runs. Do not reinterpret old experiments as if they ran under the new tool version.
