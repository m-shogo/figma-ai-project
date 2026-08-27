# Update Radar — Latest Official Source Scan

Generated: `2026-08-27T14:15:12+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 7
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, AGENT_CONTEXT, ANIMATION, ASSET_FIDELITY, COLOR_GRADIENT, CSS_RESET, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, INPUT_CAPABILITY, LAYOUT, PARALLEL_EXECUTION, SCROLL, TYPOGRAPHY_RUNTIME, VARIABLE_MODE_RUNTIME, VISUAL_QA_TOOLING

## Changed sources

### figma-release-notes

- Lane: `FIGMA`
- Latest title: Figma product news and release notes
- Impacts: FIGMA_STRUCTURE, FIGMA_TO_CODE, CODE_TO_FIGMA, DESIGN_HANDOFF, VISUAL_FIDELITY
- RETEST: INPUT_CAPABILITY, ANIMATION, LAYOUT, FIGMA_LAYOUT_GENERATION, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, COLOR_GRADIENT, FIGMA_MCP, AGENT_CONTEXT
- Source: https://www.figma.com/release-notes/

### claude-code-releases

- Lane: `CLAUDE_CODE`
- Latest title: v2.1.247
- Impacts: AGENT_CAPABILITY, MCP, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: CSS_RESET, INPUT_CAPABILITY, SCROLL, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/anthropics/claude-code/releases?per_page=12

### claude-code-feed

- Lane: `CLAUDE_CODE`
- Latest title: Claude Code v2.1.247
- Impacts: AGENT_CAPABILITY, MCP, CONTEXT_HANDLING
- RETEST: SCROLL, LAYOUT, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, COLOR_GRADIENT, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://raw.githubusercontent.com/anthropics/claude-code/main/feed.xml

### cursor-changelog

- Lane: `CURSOR`
- Latest title: What's New in Cursor — Latest Updates & Release Notes
- Impacts: AGENT_CAPABILITY, MCP, VISUAL_BROWSER_TOOLING, PARALLEL_EXECUTION, CONTEXT_HANDLING
- RETEST: VARIABLE_MODE_RUNTIME, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://cursor.com/changelog

### storybook-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: v10.6.0-beta.0
- Impacts: DESIGN_SYSTEM, COMPONENT_REUSE, VISUAL_FIDELITY, ACCESSIBILITY, QA
- RETEST: ASSET_FIDELITY, VARIABLE_MODE_RUNTIME, COLOR_GRADIENT, FIGMA_MCP, VISUAL_QA_TOOLING, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/storybookjs/storybook/releases?per_page=12

### web-features-releases

- Lane: `WEB_PLATFORM`
- Latest title: web-features@next
- Impacts: CSS, WEB_PLATFORM, BROWSER_SUPPORT, FEATURE_ADOPTION
- RETEST: CSS_RESET, SCROLL, LAYOUT, ASSET_FIDELITY, COLOR_GRADIENT, ACCESSIBILITY, AGENT_CONTEXT, PARALLEL_EXECUTION
- Source: https://api.github.com/repos/web-platform-dx/web-features/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: v8.0.13
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: INPUT_CAPABILITY, TYPOGRAPHY_RUNTIME, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP, AGENT_CONTEXT
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
