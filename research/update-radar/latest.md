# Update Radar — Latest Official Source Scan

Generated: `2026-11-06T10:57:28+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 8
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, VARIABLE_MODE_RUNTIME, VIEWPORT_SAFE_AREA, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: CSS_RESET, INPUT_CAPABILITY, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_MCP, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### mcp-spec-latest

- Lane: `MCP`
- Latest title: Specification - Model Context Protocol
- Impacts: MCP, CLIENT_SERVER_COMPAT, TOOL_SEMANTICS
- RETEST: ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT
- Source: https://modelcontextprotocol.io/specification/latest

### cursor-changelog

- Lane: `CURSOR`
- Latest title: What's New in Cursor — Latest Updates & Release Notes
- Impacts: AGENT_CAPABILITY, MCP, VISUAL_BROWSER_TOOLING, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: FIGMA_MCP, AGENT_CONTEXT
- Source: https://cursor.com/changelog

### playwright-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v1.65.0
- Impacts: VISUAL_BROWSER_TOOLING, VISUAL_FIDELITY, RUNTIME_QA, ACCESSIBILITY, DEBUGGING
- RETEST: INPUT_CAPABILITY, ASSET_FIDELITY, ACCESSIBILITY, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/microsoft/playwright/releases?per_page=12

### storybook-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v10.6.6
- Impacts: DESIGN_SYSTEM, COMPONENT_REUSE, VISUAL_FIDELITY, ACCESSIBILITY, QA
- RETEST: CSS_RESET, VIEWPORT_SAFE_AREA, SCROLL, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/storybookjs/storybook/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: CSS_RESET, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-releases

- Lane: `WORDPRESS_ACF`
- Latest title: Releases | WordPress News
- Impacts: WORDPRESS, CMS, BLOCKS, IMAGES, ACCESSIBILITY
- RETEST: LAYOUT, ACCESSIBILITY, WORDPRESS_ACF
- Source: https://wordpress.org/news/category/releases/

### wordpress-developer-news

- Lane: `WORDPRESS_ACF`
- Latest title: WordPress Developer Blog | A site for plugin and theme developers, freelancers, and agency developers
- Impacts: WORDPRESS, CMS, BLOCKS, FRONTEND_ARCHITECTURE
- RETEST: ASSET_FIDELITY, ACCESSIBILITY, WORDPRESS_ACF
- Source: https://developer.wordpress.org/news/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
