# Update Radar — Latest Official Source Scan

Generated: `2026-08-29T10:08:17+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 3
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ASSET_FIDELITY, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, PARALLEL_EXECUTION, TYPOGRAPHY_RUNTIME, VARIABLE_MODE_RUNTIME

## Changed sources

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.251
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.251
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: INPUT_CAPABILITY, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
