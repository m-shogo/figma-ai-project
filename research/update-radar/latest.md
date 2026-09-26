# Update Radar — Latest Official Source Scan

Generated: `2026-09-26T08:38:36+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 6
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, TYPOGRAPHY_RUNTIME, VARIABLE_MODE_RUNTIME

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: INPUT_CAPABILITY, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### figma-auto-layout-current

- Lane: `FIGMA`
- Latest title: Guide to auto layout – Figma Learn - Help Center
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CSS, RESPONSIVE_LAYOUT
- RETEST: INPUT_CAPABILITY, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ACCESSIBILITY
- Source: https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.283
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: SCROLL, TYPOGRAPHY_RUNTIME, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.283
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: SCROLL, TYPOGRAPHY_RUNTIME, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: SCROLL, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### w3c-wai-news

- Lane: `ACCESSIBILITY`
- Latest title: News | Web Accessibility Initiative (WAI) | W3C
- Impacts: ACCESSIBILITY, INTERACTION, SEMANTICS, QA
- RETEST: COLOR_GRADIENT, ACCESSIBILITY
- Source: https://www.w3.org/WAI/news/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
