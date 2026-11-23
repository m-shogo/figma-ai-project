# Update Radar — Latest Official Source Scan

Generated: `2026-11-23T12:52:20+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 4
- First observations: 0
- Fetch errors: 1
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, LAYOUT, PARALLEL_EXECUTION, VISUAL_QA_TOOLING

## Changed sources

### figma-code-connect-releases

- Lane: `FIGMA`
- Latest title: Code Connect 2.1.1
- Impacts: FIGMA_TO_CODE, DESIGN_SYSTEM, COMPONENT_REUSE, CONTEXT_RETRIEVAL
- RETEST: LAYOUT, FIGMA_LAYOUT_GENERATION, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT
- Source: https://api.github.com/repos/figma/code-connect/releases?per_page=12

### mcp-spec-latest

- Lane: `MCP`
- Latest title: Specification - Model Context Protocol
- Impacts: MCP, CLIENT_SERVER_COMPAT, TOOL_SEMANTICS
- RETEST: ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT
- Source: https://modelcontextprotocol.io/specification/latest

### storybook-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v11.0.0-beta.4
- Impacts: DESIGN_SYSTEM, COMPONENT_REUSE, VISUAL_FIDELITY, ACCESSIBILITY, QA
- RETEST: ANIMATION, ASSET_FIDELITY, FIGMA_MCP, VISUAL_QA_TOOLING, CSS_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/storybookjs/storybook/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: ANIMATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

## Fetch errors

- `chrome-status-features` — TimeoutError: The read operation timed out

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
