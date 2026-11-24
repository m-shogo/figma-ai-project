# Update Radar — Latest Official Source Scan

Generated: `2026-11-24T13:48:04+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 8
- First observations: 0
- Fetch errors: 1
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, VARIABLE_MODE_RUNTIME, VISUAL_QA_TOOLING, WORDPRESS_ACF

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: CSS_RESET, INPUT_CAPABILITY, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### mcp-spec-latest

- Lane: `MCP`
- Latest title: Specification - Model Context Protocol
- Impacts: MCP, CLIENT_SERVER_COMPAT, TOOL_SEMANTICS
- RETEST: ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT
- Source: https://modelcontextprotocol.io/specification/latest

### openai-codex-changelog

- Lane: `CODEX`
- Latest title: ChatGPT & Codex changelog | ChatGPT Learn
- Impacts: AGENT_CAPABILITY, GIT_WORKFLOW, CONTEXT_HANDLING
- RETEST: LAYOUT, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://help.openai.com/en/articles/11428266-codex-changelog/

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.331
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: CSS_RESET, INPUT_CAPABILITY, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.331
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: CSS_RESET, INPUT_CAPABILITY, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### storybook-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v11.0.0-rc.0
- Impacts: DESIGN_SYSTEM, COMPONENT_REUSE, VISUAL_FIDELITY, ACCESSIBILITY, QA
- RETEST: INPUT_CAPABILITY, ANIMATION, ASSET_FIDELITY, FIGMA_MCP, CSS_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/storybookjs/storybook/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: ANIMATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

### wordpress-developer-news

- Lane: `WORDPRESS_ACF`
- Latest title: WordPress Developer Blog | A site for plugin and theme developers, freelancers, and agency developers
- Impacts: WORDPRESS, CMS, BLOCKS, FRONTEND_ARCHITECTURE
- RETEST: WORDPRESS_ACF
- Source: https://developer.wordpress.org/news/

## Fetch errors

- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
