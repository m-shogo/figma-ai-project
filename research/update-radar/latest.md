# Update Radar — Latest Official Source Scan

Generated: `2026-10-16T08:13:57+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 7
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, VARIABLE_MODE_RUNTIME, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-mcp-docs

- Lane: `FIGMA`
- Latest title: Introduction | Developer Docs
- Impacts: MCP, FIGMA_TO_CODE, CODE_TO_FIGMA, CONTEXT_RETRIEVAL
- RETEST: LAYOUT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://developers.figma.com/docs/figma-mcp-server/

### figma-mcp-tools

- Lane: `FIGMA`
- Latest title: Tools and prompts | Developer Docs
- Impacts: MCP, FIGMA_TO_CODE, CODE_TO_FIGMA, CONTEXT_RETRIEVAL, ASSET_FIDELITY, COMPONENT_REUSE
- RETEST: ANIMATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT
- Source: https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.301
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: CSS_RESET, ANIMATION, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.301
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: CSS_RESET, ANIMATION, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### web-features-releases

- Lane: `WEB_PLATFORM`
- Latest title: v3.43.0
- Impacts: CSS, WEB_PLATFORM, BROWSER_SUPPORT, FEATURE_ADOPTION
- RETEST: INPUT_CAPABILITY, SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, CSS_TOOLING
- Source: https://api.github.com/repos/web-platform-dx/web-features/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: v8.1.6
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-wp-env

- Lane: `WORDPRESS_ACF`
- Latest title: Get started with wp-env – Block Editor Handbook | Developer.WordPress.org
- Impacts: WORDPRESS, CMS, RUNTIME_QA, DEVELOPMENT_ENVIRONMENT
- RETEST: CSS_RESET, AGENT_CONTEXT, WORDPRESS_ACF
- Source: https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
