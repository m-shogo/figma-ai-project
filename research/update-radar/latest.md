# Update Radar — Latest Official Source Scan

Generated: `2026-09-23T08:37:46+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 10
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, TYPOGRAPHY_RUNTIME, WORDPRESS_ACF

## Changed sources

### figma-auto-layout-current

- Lane: `FIGMA`
- Latest title: Guide to auto layout – Figma Learn - Help Center
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CSS, RESPONSIVE_LAYOUT
- RETEST: INPUT_CAPABILITY, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ACCESSIBILITY
- Source: https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout

### figma-auto-layout-flexbox-generation

- Lane: `FIGMA`
- Latest title: Use auto layout with CSS Flexbox in mind – Figma Learn - Help Center
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CSS, RESPONSIVE_LAYOUT
- RETEST: ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY
- Source: https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind

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

### mcp-spec-latest

- Lane: `MCP`
- Latest title: Specification - Model Context Protocol
- Impacts: MCP, CLIENT_SERVER_COMPAT, TOOL_SEMANTICS
- RETEST: FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT
- Source: https://modelcontextprotocol.io/specification/latest

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.280
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: INPUT_CAPABILITY, SCROLL, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.280
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: INPUT_CAPABILITY, SCROLL, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### web-features-releases

- Lane: `WEB_PLATFORM`
- Latest title: web-features@next
- Impacts: CSS, WEB_PLATFORM, BROWSER_SUPPORT, FEATURE_ADOPTION
- RETEST: SCROLL, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/web-platform-dx/web-features/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: SCROLL, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-releases

- Lane: `WORDPRESS_ACF`
- Latest title: Releases – WordPress News
- Impacts: WORDPRESS, CMS, BLOCKS, IMAGES, ACCESSIBILITY
- RETEST: LAYOUT, ACCESSIBILITY, WORDPRESS_ACF
- Source: https://wordpress.org/news/category/releases/

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
