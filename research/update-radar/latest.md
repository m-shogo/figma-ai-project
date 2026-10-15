# Update Radar — Latest Official Source Scan

Generated: `2026-10-15T08:21:27+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 8
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, VARIABLE_MODE_RUNTIME, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: INPUT_CAPABILITY, SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### figma-code-connect-releases

- Lane: `FIGMA`
- Latest title: Code Connect 2.0.2
- Impacts: FIGMA_TO_CODE, DESIGN_SYSTEM, COMPONENT_REUSE, CONTEXT_RETRIEVAL
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT
- Source: https://api.github.com/repos/figma/code-connect/releases?per_page=12

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.300
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.300
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### playwright-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v1.64.1
- Impacts: VISUAL_BROWSER_TOOLING, VISUAL_FIDELITY, RUNTIME_QA, ACCESSIBILITY, DEBUGGING
- RETEST: INPUT_CAPABILITY, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/microsoft/playwright/releases?per_page=12

### web-features-releases

- Lane: `WEB_PLATFORM`
- Latest title: web-features@next
- Impacts: CSS, WEB_PLATFORM, BROWSER_SUPPORT, FEATURE_ADOPTION
- RETEST: INPUT_CAPABILITY, SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, CSS_TOOLING
- Source: https://api.github.com/repos/web-platform-dx/web-features/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-developer-news

- Lane: `WORDPRESS_ACF`
- Latest title: WordPress Developer Blog – A site for plugin and theme developers, freelancers, and agency developers
- Impacts: WORDPRESS, CMS, BLOCKS, FRONTEND_ARCHITECTURE
- RETEST: ACCESSIBILITY, WORDPRESS_ACF
- Source: https://developer.wordpress.org/news/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
