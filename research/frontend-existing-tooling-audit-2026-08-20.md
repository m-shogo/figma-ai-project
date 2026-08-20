# Frontend Existing Tooling Audit — 2026-08-20

Status: research evidence / not an authority override

Purpose: verify which parts of the Frontend Standard should reuse maintained official capabilities or existing OSS/SaaS instead of growing `figma-ai-project`-specific infrastructure, and identify custom responsibilities that should remain only as thin project-specific glue.

## Decision summary

The target is not “more dependencies”. It is **less duplicated responsibility**.

```text
Existing Project / native browser
→ official Figma / Playwright / WordPress capability when applicable
→ existing Design System / Storybook / browser-target/lint stack
→ mature OSS/SaaS where project/privacy/cost fit
→ smallest figma-ai-project adapter only for missing Figma/project-specific glue
```

Concrete adoption/retirement statuses are tracked in `docs/frontend-external-integration-matrix.md`.

A custom file is not automatically reinvention. If it only wires a mature upstream library into Figma-specific provenance, thresholds, or project evidence, keeping that thin adapter may be simpler than forcing a different platform to own a problem it was not designed for.

## Current real probes

### Figma exact asset retrieval — PASS

On 2026-08-20, Remote Figma MCP `download_assets` was executed against REF-001 Student Voice node `21378:7766` in file `ZYTdtw4wCgkcBy2cVnhxVI`.

Returned in one upstream call:

- rendered node PNG export
- 8 original JPEG image fills
- 5 exact SVG assets
- no raw-image or SVG truncation for this node

Implication:

- the historical custom/multi-hop asset bridge is no longer the correct **default** for clients where `download_assets` is available
- durable provenance/hash/storage glue is still legitimate
- the old bridge remains a fallback until private-file/client/plan scenarios are replayed

Status: `RETIRE_AS_DEFAULT`, not delete-now.

### Figma Code Connect suggestions — BLOCKED BY PLAN/SEAT

`get_code_connect_suggestions` was executed against the same REF-001 file/node. Figma returned that Code Connect requires a Dev or Full seat on Organization or Enterprise.

Implication:

- Code Connect remains the preferred upstream component mapping path when available
- current project cannot assume availability
- **do not build a Code Connect clone** to bypass the product/plan boundary
- keep `docs/component-resolution.md` as a thin fallback based on Figma identity + design-system/repo search

Status: `CONDITIONAL`.

### Figma design-system search — AVAILABLE, NO MATCH IN THIS REF

Figma design-system search was executed for button/CTA/card concepts with Code Connect disabled. No components, variables, or styles were returned for this reference file/context.

Implication:

- the capability exists and should be used when libraries exist
- absence in REF-001 does not justify inventing a design system

Status: `USE_WHEN_PRESENT`.

## Responsibility audit

| Existing/custom responsibility | Upstream capability | Current decision | Reason |
| --- | --- | --- | --- |
| Multi-hop Figma asset transport as default | Figma Remote MCP `download_assets` | `RETIRE_AS_DEFAULT` | Upstream now returns render/raw image/exact SVG bytes; keep transport only as capability fallback |
| Browser capture/runtime | Playwright | `USE_NOW` | Do not build another browser/screenshot runner |
| Playwright-managed browser baseline regression | Playwright Test snapshots | `USE_NOW` | Native expected/actual/diff and threshold support |
| Arbitrary Figma PNG ↔ runtime PNG comparison | `pixelmatch` + `pngjs` thin wrapper already in repo | `KEEP_SMALL_GLUE` | This is already reuse, not a custom diff algorithm; external Figma truth need not be copied into Playwright baseline conventions |
| Browser-side Figma/Web perceptual hotspot analysis in Human Review Dashboard | no single upstream tool covers current Figma section/provenance/hotspot workflow | `KEEP_SMALL_GLUE` | External visual services overlap with storage/review, not all Figma-specific reasoning |
| Bespoke generic WordPress+DB base | official `@wordpress/env` | `CLEAN_REPLAY_CANDIDATE` | Evaluate as generic base; preserve worktree/ACF PRO/seed/theme requirements |
| Custom ACF import/export behavior | ACF 6.8+ `wp acf json` | `RETIRE_AS_DEFAULT` where versions support | Keep structure/stable-key/evidence validation only |
| Independent browser target lists | Browserslist when target toolchain uses it | `RETIRE_AS_DEFAULT` | One target source should feed compatible ecosystem tools |
| Regex-based CSS source parsing/lint | Stylelint/PostCSS ecosystem | `CLEAN_REPLAY_CANDIDATE` where Node/CSS stack exists | Prefer parsed CSS ecosystem when it expresses the invariant accurately |
| New custom shared-component preview harness | Existing Storybook/registry | `DO_NOT_BUILD_WHEN_PRESENT` | Reuse target project surface |
| Generic hosted visual-review platform | Chromatic/Argos/project existing service | `CONDITIONAL` | Privacy/cost/workflow/project fit must be resolved; does not automatically replace Figma-specific dashboard |
| Custom SVG minifier | SVGO/existing optimizer | `DO_NOT_BUILD` | Use established optimizer + project visual verification |
| Custom synthetic performance engine | Lighthouse/Lighthouse CI/project RUM | `DO_NOT_BUILD` | Keep only project assertions/budgets/config |

## 1. Figma Remote MCP

Current official capability covers more than screenshot/context:

- `get_design_context`
- `get_screenshot`
- `download_assets`
- variables/styles/library search
- Code Connect map/suggestions/context when entitlement allows

Project decision:

- treat Remote MCP as the first external integration surface for Figma evidence and assets
- generated code remains reference evidence, not production code to paste
- use `download_assets` for durable/export/raw asset needs before custom transport
- keep custom code only for provenance/hash/storage/project adaptation

Official source:

- https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/

## 2. Figma Code Connect

Current evidence:

- Code Connect connects Figma components to production code components and improves MCP component reuse context
- newer template-file flow avoids new investment in old framework-specific parsers
- Code Connect UI requires Dev/Full seat on Organization/Enterprise and a published component library

Project decision:

- use upstream mapping when available
- do not force it onto standalone LPs or files without a library/component system
- do not create a proprietary equivalent when entitlement is unavailable
- fallback = `docs/component-resolution.md`, deliberately thin and retireable

Official sources:

- https://developers.figma.com/docs/code-connect/
- https://developers.figma.com/docs/code-connect/code-connect-ui-setup/
- https://developers.figma.com/docs/code-connect/templates-migration-guide/

## 3. Visual comparison: Playwright and image-diff library own different layers

Playwright Test already provides browser screenshot snapshots, threshold/max-diff configuration, deterministic browser execution, and diff artifacts for Playwright-owned baselines.

The repo also has:

`experiments/wordpress-acf-pro-standalone-lp/tests/visual-diff.mjs`

Inspection shows that this file does **not** reimplement image comparison. It is a small adapter over mature packages `pixelmatch` + `pngjs`:

```text
VISUAL_DIFF_REFERENCE = externally acquired Figma PNG
VISUAL_DIFF_ACTUAL = runtime capture
→ decode both files
→ pixelmatch
→ diff PNG + ratio
→ optional project/reference threshold
```

Corrected project decision:

- Playwright owns browser/runtime/capture and normal Playwright baseline regression
- `pixelmatch`/equivalent mature image library may own arbitrary external-image-pair comparison
- `figma-ai-project` owns only reference provenance/path, dimension guard, project threshold, alignment and root-cause interpretation
- do **not** migrate this thin wrapper merely for tool uniformity if doing so adds baseline-copy/naming glue
- re-evaluate only if Playwright or another maintained tool later handles arbitrary external Figma truth more cleanly

Official Playwright source:

- https://playwright.dev/docs/test-snapshots

## 4. Human Review Dashboard vs hosted visual services

`review-dashboard/app/visual-diff.js` was inspected. It contains project-specific Figma/Web comparison behavior including:

- direct Figma/Web capture pairing
- section geometry
- device-chrome offset handling
- selectable sensitivity profiles
- perceptual-distance analysis
- hotspot extraction/focus

Chromatic/Argos can overlap with generic CI baseline storage, PR review and approvals, but that does not prove replacement of the Figma-specific layer.

Project decision:

```text
external visual service candidate
= generic screenshot storage / PR review / approval when project fit is good

figma-ai-project
= Figma truth linkage / section provenance / Figma-specific geometry / repair-learning metadata
```

Do not rebuild generic visual-test cloud features. Do not delete Figma-specific review behavior until an external service cleanly composes with or replaces it without increasing Human Correction Cost.

Sources:

- https://storybook.js.org/docs/writing-tests/visual-testing
- https://www.chromatic.com/playwright
- https://github.com/argos-ci/argos

## 5. Playwright Trace / ARIA

Playwright already owns failure trace and semantic snapshot primitives.

Project decision:

- use Trace before blind rerun for runtime/interaction failures
- use ARIA snapshots selectively for shared/interactive semantics
- keep only project-specific root-cause taxonomy and repair ownership
- do not build a trace viewer or accessibility-tree snapshot engine

Official sources:

- https://playwright.dev/docs/trace-viewer-intro
- https://playwright.dev/docs/aria-snapshots

## 6. Accessibility detector ecosystem

Existing maintained path:

- axe-core
- `@axe-core/playwright`
- Storybook a11y when Storybook exists

Project decision:

- reuse the existing project detector
- keep human keyboard/manual review because automated rules are intentionally incomplete
- do not author a universal custom WCAG rules engine

Sources:

- https://github.com/dequelabs/axe-core
- https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
- https://storybook.js.org/docs/writing-tests/accessibility-testing

## 7. Browser targets + CSS lint

Browserslist is already a shared target-browser configuration consumed by tools such as Autoprefixer, Babel and browser-support lint plugins.

Stylelint provides a large built-in rule set and a plugin/custom-rule ecosystem built on parsed CSS/PostCSS structures.

Project decision:

- when a target repo has this toolchain, resolve Effective Environment Contract → existing Browserslist instead of maintaining duplicate target lists
- prefer Stylelint/PostCSS source analysis over new regex CSS parsers
- project-specific custom lint is allowed only for a missing invariant
- browser-support lint should normally be warning/evidence because it cannot always infer whether a fallback exists
- do not add Node/CSS tooling solely to a simple project that has no such build/lint environment unless measured benefit justifies it

Sources:

- https://github.com/browserslist/browserslist
- https://stylelint.io/user-guide/rules/
- https://stylelint.io/user-guide/customize/
- https://github.com/RJWadley/stylelint-no-unsupported-browser-features

## 8. WordPress runtime: `@wordpress/env`

Official `@wordpress/env` sets up WordPress development/test environments over Docker with minimal configuration.

Current repo already has a bespoke WordPress + DB + WP-CLI + ACF PRO fixture with additional requirements:

- worktree/parallel isolation
- supplied theme/drop-in contract
- ACF PRO license gating
- deterministic fixture/seed behavior
- Playwright runtime QA

Project decision:

- do not immediately replace the working fixture
- clean replay `wp-env` as a potential generic base
- retain only missing adapters if it reduces maintenance without losing the above constraints

Official source:

- https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/

## 9. ACF JSON official CLI

ACF 6.8+ with WP-CLI 2.0+ provides:

- `wp acf json status`
- `wp acf json sync`
- `wp acf json import`
- `wp acf json export`

Project decision:

- official CLI owns import/export/sync when available
- current `validate_acf_export.py` remains useful only for portable structure/evidence and stable-key checks
- do not expand it into an ACF behavior clone

Official source:

- https://www.advancedcustomfields.com/resources/wp-acf-json/

## 10. WordPress responsive images

`wp_get_attachment_image()` already covers registered image sizes plus `srcset`, `sizes`, `loading`, `decoding`, and `fetchpriority` behavior.

Project decision:

- native media API first
- custom `<picture>`/source logic only for real art direction or source differences

Official source:

- https://developer.wordpress.org/reference/functions/wp_get_attachment_image/

## 11. Design tokens

Design Tokens Format Module 2025.10 is a stable Community Group specification for interoperability, not a W3C Recommendation. Style Dictionary has current support for DTCG 2025.10 changes.

Project decision:

- use existing token pipeline and interoperable format when the project actually has one
- no universal figma-ai-project token schema
- no token infrastructure for one-off LP solely to satisfy a theoretical best practice

Sources:

- https://www.designtokens.org/TR/2025.10/format/
- https://github.com/style-dictionary/style-dictionary

## 12. SVG

SVGO remains a maintained optimizer. v4 disabled `removeViewBox` and `removeTitle` by default because those removals commonly harm scalability/accessibility.

Project decision:

- exact production/Figma source before optimization
- use established optimizer rather than custom minifier
- preserve Visual QA for viewBox/mask/clip/defs/IDs/stroke/appearance/accessibility

Source:

- https://github.com/svg/svgo/releases

## 13. Performance

Lighthouse CI already provides PR reports, assertions, resource budgets, repeated runs and historical comparison.

Project decision:

- existing project RUM/field metrics first when present
- Lighthouse/Lighthouse CI for relevant synthetic CI
- project-specific assertions/budgets rather than a universal score gate
- no custom performance engine

Source:

- https://github.com/GoogleChrome/lighthouse-ci

## 14. Figma↔browser structured diff OSS

Tools such as uiMatch demonstrate useful architecture around Figma render + browser render + machine-readable visual evidence. Maturity and project fit must be verified before production adoption.

Project decision:

- do not duplicate mature upstream work if a maintained solution becomes suitable
- current project-specific value remains Figma/project authority interpretation and repair/learning glue
- periodically re-evaluate rather than freezing a proprietary engine forever

## 15. What legitimately remains `figma-ai-project`-specific

Existing tools do not fully solve:

- resolving Company / Existing / Project authority before implementation
- interpreting Figma structure without mechanically copying rendered coordinates into Web constraints
- choosing CSS vs CSS+SVG vs SVG vs raster vs exact export
- choosing section boundaries and implementation order
- reconciling PC/SP art direction with intermediate responsive runtime
- mapping visual parity gaps to root-cause categories and canonical code owners
- preserving Human Repairability while closing visual gaps
- learning from repeated feedback across projects
- promoting/retiring implementation patterns based on actual rework and Human Correction Cost

These are the project's legitimate **judgement + glue + learning layer**.

## 16. Adoption rule

Before adding a tool or custom subsystem:

```text
What existing capability was checked?
Is it maintained?
Does it fit the target project rather than only the demo?
What plan/license/privacy/browser constraints apply?
What exact gap remains?
Can that gap be solved by a small adapter?
How will Human Correction Cost / rework change?
How can the adapter be retired if upstream solves it?
```

No adoption solely because a tool is fashionable. No custom build solely because it feels easier than checking upstream first.