# Update Radar — Latest Official Source Scan

Generated: `2026-11-14T10:30:24+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 10
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, TYPOGRAPHY_RUNTIME, VARIABLE_MODE_RUNTIME, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-grid-auto-layout-current

- Lane: `FIGMA`
- Latest title: Use the grid auto layout flow – Figma Learn - Help Center
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CSS, RESPONSIVE_LAYOUT
- RETEST: ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow

### figma-image-crop-current

- Lane: `FIGMA`
- Latest title: Crop an image – Figma Learn - Help Center
- Impacts: FIGMA_TO_CODE, IMAGES, ASSET_FIDELITY, VISUAL_FIDELITY
- RETEST: ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT
- Source: https://help.figma.com/hc/en-us/articles/360040675194-Crop-an-image

### figma-variables-dev-mode-current

- Lane: `FIGMA`
- Latest title: Variables in Dev Mode – Figma Learn - Help Center
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, TOKENS, DESIGN_SYSTEM
- RETEST: VARIABLE_MODE_RUNTIME, COLOR_GRADIENT, ACCESSIBILITY
- Source: https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode

### mcp-spec-latest

- Lane: `MCP`
- Latest title: Specification - Model Context Protocol
- Impacts: MCP, CLIENT_SERVER_COMPAT, TOOL_SEMANTICS
- RETEST: ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT
- Source: https://modelcontextprotocol.io/specification/latest

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.325
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: SCROLL, LAYOUT, FIGMA_LAYOUT_GENERATION, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.325
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: SCROLL, LAYOUT, FIGMA_LAYOUT_GENERATION, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### playwright-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v1.65.1
- Impacts: VISUAL_BROWSER_TOOLING, VISUAL_FIDELITY, RUNTIME_QA, ACCESSIBILITY, DEBUGGING
- RETEST: INPUT_CAPABILITY, ASSET_FIDELITY, ACCESSIBILITY, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/microsoft/playwright/releases?per_page=12

### storybook-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v11.0.0-beta.3
- Impacts: DESIGN_SYSTEM, COMPONENT_REUSE, VISUAL_FIDELITY, ACCESSIBILITY, QA
- RETEST: SCROLL, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/storybookjs/storybook/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: CSS_RESET, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-developer-news

- Lane: `WORDPRESS_ACF`
- Latest title: WordPress Developer Blog | A site for plugin and theme developers, freelancers, and agency developers
- Impacts: WORDPRESS, CMS, BLOCKS, FRONTEND_ARCHITECTURE
- RETEST: WORDPRESS_ACF
- Source: https://developer.wordpress.org/news/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
