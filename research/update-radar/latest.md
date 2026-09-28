# Update Radar — Latest Official Source Scan

Generated: `2026-09-28T09:50:54+00:00`

Active lanes: ACCESSIBILITY, CLAUDE_CODE, CODEX, CURSOR, DESIGN_SYSTEMS, FIGMA, FRONTEND_TOOLING, MCP, WEB_PLATFORM, WORDPRESS_ACF

## Summary

- Sources checked: 37
- Changed since previous snapshot: 2
- First observations: 0
- Fetch errors: 3
- RETEST candidates: ACCESSIBILITY, ANIMATION, ASSET_FIDELITY, CSS_TOOLING, FIGMA_LAYOUT_GENERATION, FIGMA_MCP, SCROLL

## Changed sources

### browserslist-releases

- Lane: `FRONTEND_TOOLING`
- Latest title: 4.29.2
- Impacts: BROWSER_SUPPORT, CSS, JS, ENVIRONMENT_CONTRACT
- RETEST: ACCESSIBILITY, CSS_TOOLING
- Source: https://api.github.com/repos/browserslist/browserslist/releases?per_page=12

### mdn-browser-compat-data-releases

- Lane: `WEB_PLATFORM`
- Latest title: @mdn/browser-compat-data@next
- Impacts: CSS, BROWSER_SUPPORT, FEATURE_DETECTION
- RETEST: SCROLL, ANIMATION, FIGMA_LAYOUT_GENERATION, ASSET_FIDELITY, ACCESSIBILITY, FIGMA_MCP
- Source: https://api.github.com/repos/mdn/browser-compat-data/releases?per_page=12

## Fetch errors

- `openai-product-release-notes` — HTTPError: HTTP Error 403: Forbidden
- `openai-codex-changelog` — HTTPError: HTTP Error 403: Forbidden
- `chrome-status-features` — JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## Promotion rule

A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.
Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.
