# Update Radar — Latest Official Source Scan

Generated: `2026-09-11T08:06:03+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 9
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, TYPOGRAPHY_RUNTIME, VARIABLE_MODE_RUNTIME, VIEWPORT_SAFE_AREA, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-code-connect-releases

- Lane: `FIGMA`
- Latest title: Code Connect 2.0.1
- Impacts: FIGMA_TO_CODE, DESIGN_SYSTEM, COMPONENT_REUSE, CONTEXT_RETRIEVAL
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, ACCESSIBILITY, FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT
- Source: https://api.github.com/repos/figma/code-connect/releases?per_page=12

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.268
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: SCROLL, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.268
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: SCROLL, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### cursor-changelog

- Lane: `CURSOR`
- Latest title: What's New in Cursor — Latest Updates & Release Notes
- Impacts: AGENT_CAPABILITY, MCP, VISUAL_BROWSER_TOOLING, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://cursor.com/changelog

### web-features-releases

- Lane: `WEB_PLATFORM`
- Latest title: v3.38.0
- Impacts: CSS, WEB_PLATFORM, BROWSER_SUPPORT, FEATURE_ADOPTION
- RETEST: SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/web-platform-dx/web-features/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: v8.1.1
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: FIGMA_MCP, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-developer-news

- Lane: `WORDPRESS_ACF`
- Latest title: WordPress Developer Blog – A site for plugin and theme developers, freelancers, and agency developers
- Impacts: WORDPRESS, CMS, BLOCKS, FRONTEND_ARCHITECTURE
- RETEST: VIEWPORT_SAFE_AREA, ACCESSIBILITY, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://developer.wordpress.org/news/

### acf-releases

- Lane: `WORDPRESS_ACF`
- Latest title: Advanced Custom Fields v6.8.10
- Impacts: ACF, WORDPRESS, CMS, BLOCKS
- RETEST: CSS_RESET, INPUT_CAPABILITY, SCROLL, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://api.github.com/repos/AdvancedCustomFields/acf/releases?per_page=12

### acf-changelog

- Lane: `WORDPRESS_ACF`
- Latest title: ACF | Changelog
- Impacts: ACF, WORDPRESS, CMS, BLOCKS, IMAGES
- RETEST: CSS_RESET, SCROLL, LAYOUT, FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://www.advancedcustomfields.com/changelog/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
