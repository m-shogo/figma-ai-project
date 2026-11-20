# Update Radar — Latest Official Source Scan

Generated: `2026-11-20T11:44:58+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 11
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, TYPOGRAPHY_RUNTIME, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: CSS_RESET, INPUT_CAPABILITY, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### mcp-spec-latest

- Lane: `MCP`
- Latest title: Specification - Model Context Protocol
- Impacts: MCP, CLIENT_SERVER_COMPAT, TOOL_SEMANTICS
- RETEST: ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT
- Source: https://modelcontextprotocol.io/specification/latest

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.329
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: CSS_RESET, INPUT_CAPABILITY, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.329
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: CSS_RESET, INPUT_CAPABILITY, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### storybook-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v10.6.8
- Impacts: DESIGN_SYSTEM, COMPONENT_REUSE, VISUAL_FIDELITY, ACCESSIBILITY, QA
- RETEST: SCROLL, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/storybookjs/storybook/releases?per_page=12

### stylelint-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: 18.1.0
- Impacts: CSS, STATIC_QA, MAINTAINABILITY
- RETEST: LAYOUT, COLOR_GRADIENT, CSS_TOOLING, AGENT_CONTEXT
- Source: https://api.github.com/repos/stylelint/stylelint/releases?per_page=12

### web-features-releases

- Lane: `WEB_PLATFORM`
- Latest title: web-features@next
- Impacts: CSS, WEB_PLATFORM, BROWSER_SUPPORT, FEATURE_ADOPTION
- RETEST: SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/web-platform-dx/web-features/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: v8.1.10
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: ANIMATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-developer-news

- Lane: `WORDPRESS_ACF`
- Latest title: WordPress Developer Blog | A site for plugin and theme developers, freelancers, and agency developers
- Impacts: WORDPRESS, CMS, BLOCKS, FRONTEND_ARCHITECTURE
- RETEST: WORDPRESS_ACF
- Source: https://developer.wordpress.org/news/

### acf-releases

- Lane: `WORDPRESS_ACF`
- Latest title: Advanced Custom Fields v6.8.12
- Impacts: ACF, WORDPRESS, CMS, BLOCKS
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, FIGMA_MCP, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://api.github.com/repos/AdvancedCustomFields/acf/releases?per_page=12

### acf-changelog

- Lane: `WORDPRESS_ACF`
- Latest title: ACF | Changelog
- Impacts: ACF, WORDPRESS, CMS, BLOCKS, IMAGES
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://www.advancedcustomfields.com/changelog/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
