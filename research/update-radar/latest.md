# Update Radar — Latest Official Source Scan

Generated: `2026-11-03T10:56:40+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 11
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, PERFORMANCE_TOOLING, SCROLL, VARIABLE_MODE_RUNTIME, VIEWPORT_SAFE_AREA, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: CSS_RESET, INPUT_CAPABILITY, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_MCP, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### figma-grid-auto-layout-current

- Lane: `FIGMA`
- Latest title: Use the grid auto layout flow – Figma Learn - Help Center
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CSS, RESPONSIVE_LAYOUT
- RETEST: ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow

### mcp-spec-latest

- Lane: `MCP`
- Latest title: Specification - Model Context Protocol
- Impacts: MCP, CLIENT_SERVER_COMPAT, TOOL_SEMANTICS
- RETEST: ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT
- Source: https://modelcontextprotocol.io/specification/latest

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.317
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.317
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### storybook-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v11.0.0-alpha.9
- Impacts: DESIGN_SYSTEM, COMPONENT_REUSE, VISUAL_FIDELITY, ACCESSIBILITY, QA
- RETEST: CSS_RESET, VIEWPORT_SAFE_AREA, SCROLL, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/storybookjs/storybook/releases?per_page=12

### lighthouse-ci-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v0.16.0
- Impacts: PERFORMANCE, QA, CI
- RETEST: CSS_RESET, ACCESSIBILITY, VISUAL_QA_TOOLING, PERFORMANCE_TOOLING, AGENT_CONTEXT
- Source: https://api.github.com/repos/GoogleChrome/lighthouse-ci/releases?per_page=12

### web-features-releases

- Lane: `WEB_PLATFORM`
- Latest title: v3.45.0
- Impacts: CSS, WEB_PLATFORM, BROWSER_SUPPORT, FEATURE_ADOPTION
- RETEST: INPUT_CAPABILITY, SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/web-platform-dx/web-features/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: v8.1.8
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: CSS_RESET, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### acf-releases

- Lane: `WORDPRESS_ACF`
- Latest title: Advanced Custom Fields v6.8.11
- Impacts: ACF, WORDPRESS, CMS, BLOCKS
- RETEST: CSS_RESET, SCROLL, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://api.github.com/repos/AdvancedCustomFields/acf/releases?per_page=12

### acf-changelog

- Lane: `WORDPRESS_ACF`
- Latest title: ACF | Changelog
- Impacts: ACF, WORDPRESS, CMS, BLOCKS, IMAGES
- RETEST: CSS_RESET, SCROLL, LAYOUT, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://www.advancedcustomfields.com/changelog/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
