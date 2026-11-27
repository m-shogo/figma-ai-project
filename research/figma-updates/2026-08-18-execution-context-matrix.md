# Figma / AI Execution Context Matrix — 2026-08-18

Evidence maturity: **E1 operational rule**

A workflow that succeeds in one AI client/runtime must **not** be assumed to work identically in another.

This repository uses multiple execution contexts, including:

- ChatGPT conversation runtime
- Codex
- Claude Code
- Cursor

They can expose different combinations of:

- Figma MCP tools and tool versions
- Plugin API wrappers / supported discriminators
- local shell access
- outbound network access
- filesystem access
- connector-to-connector file handoff
- GitHub / Google Drive connectors
- OAuth scopes and authenticated seats/plans
- environment variables / secrets
- browser / Playwright availability
- local repository checkout and worktree access
- token / payload / binary-size limits

## Core rule

> Capability claims are scoped to the execution context where they were actually verified.

Examples:

- `use_figma` + `exportAsync()` working in the ChatGPT Figma connector does not prove the same transport exists in Codex, Claude Code, or Cursor.
- A local CLI agent may have shell + filesystem + `curl`, making short-lived Figma URLs easy to materialize even when the ChatGPT sandbox cannot resolve them.
- ChatGPT may have first-class GitHub / Drive connector actions that are not available to a local coding agent.
- Claude Code / Cursor / Codex may be able to use a locally configured MCP server or repository credentials that are different from this chat's connector identity.

## Required evidence label

When recording a newly discovered capability or failure, include the execution context when it materially affects reproducibility, for example:

- `chatgpt-figma-mcp`
- `codex-local`
- `claude-code-local`
- `cursor-local`

Do not record a generic statement such as `Figma cannot download assets` when the evidence only proves `chatgpt runtime could not fetch this short-lived URL`.

Likewise, do not record `Figma → Git direct works everywhere` when it was only verified through a ChatGPT connector path.

## Portability policy

Prefer **capability-based routing**, not client-name branching, in permanent implementation logic.

Probe for the capabilities actually needed:

1. Can the runtime read Figma structure?
2. Can it export exact rendered/vector bytes?
3. Can it receive those bytes as a local/reusable file?
4. Does it have outbound HTTP access?
5. Can it write to the target Git repository directly?
6. Can it upload a file reference to Drive?
7. Does it have a local checkout / shell?
8. Which browser/QA runtimes are available?

Then choose the shortest verified route.

Example asset routing:

```text
exact Figma asset needed
  -> direct bytes + Git write available: Figma -> Git
  -> reusable file + Drive available: Figma -> Drive bridge -> Git
  -> shell/network available: temporary URL -> local file -> SHA -> Git/Drive
  -> inline bytes only: use small-asset fallback; do not force huge payloads
```

## Learning rule

Cross-client differences are useful evidence, not noise.

When ChatGPT, Codex, Claude Code, and Cursor solve the same Figma task differently, record:

- which capability made one path faster
- which limitation caused the fallback
- whether the output/fidelity differed
- whether the difference is client-specific or a general workflow lesson

Promote only the **portable lesson** to common project rules. Keep client-specific transport details in the execution-context matrix.

## Current ChatGPT-specific findings

Verified in the current ChatGPT conversation runtime:

- connected Figma tool exposes `use_figma`
- `exportAsync()` can return PNG/JPG bytes and SVG text for tested nodes
- `figma.io.write()` works as a response-output path
- GitHub connector can materialize blobs/commits without a local checkout
- Google Drive connector exists, but cross-connector reuse of a `figma.io.write()` result as a Drive `file_uri` is not yet proven
- this session's local container could not rely on outbound DNS for the Figma short-lived URL path

These are **ChatGPT-runtime observations**, not universal statements about Codex / Claude Code / Cursor.

## Operational consequence

Before a significant Figma task in a different client, perform a small capability preflight instead of copying the ChatGPT transport path verbatim.

The shared goal remains the same:

`Figma truth -> implementation -> Visual QA -> learning`

The transport and tooling used to reach that goal may differ by execution context.
