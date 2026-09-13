# Update Radar — Latest Official Source Scan

Generated: `2026-09-13T08:21:12+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 3
- First observations: 1
- Fetch errors: 2
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, FIGMA_MCP, LAYOUT, PARALLEL_EXECUTION, SCROLL, VARIABLE_MODE_RUNTIME, VISUAL_QA_TOOLING

## Changed sources

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.270
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: SCROLL, LAYOUT, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.270
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: SCROLL, LAYOUT, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: FIGMA_MCP, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

## Fetch errors

- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
