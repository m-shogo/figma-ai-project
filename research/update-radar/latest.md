# Update Radar — Latest Official Source Scan

Generated: `2026-10-08T10:38:53+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 5
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, VISUAL_QA_TOOLING

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: INPUT_CAPABILITY, SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.294
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: FIGMA_LAYOUT_GENERATION, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.294
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: FIGMA_LAYOUT_GENERATION, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### playwright-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v1.64.0
- Impacts: VISUAL_BROWSER_TOOLING, VISUAL_FIDELITY, RUNTIME_QA, ACCESSIBILITY, DEBUGGING
- RETEST: INPUT_CAPABILITY, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/microsoft/playwright/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: SCROLL, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
