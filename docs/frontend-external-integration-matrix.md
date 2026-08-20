# Frontend External Integration Matrix

Status: ACTIVE integration decision aid

Purpose: connect `figma-ai-project` to maintained external capabilities before growing project-specific infrastructure. This document does not make every tool mandatory. It defines **what upstream capability should be checked first, what remains custom glue, and when old custom infrastructure may be retired**.

Canonical authority remains:

```text
Company hard constraints
→ Existing Codebase / Design System baseline
↔ Explicit authorized Project/Owner override
→ Effective Project Contract

Visual truth = Figma reference
Frontend Standard = fallback decision framework
Agent inference = last
```

External popularity never overrides the Effective Project Contract.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `USE_NOW` | Capability is available and directly removes custom work in the current workflow. |
| `USE_WHEN_PRESENT` | Reuse when the target project already has the tool/system; do not introduce it only to satisfy this Standard. |
| `CONDITIONAL` | Useful but gated by plan, seat, account, browser matrix, license, privacy, or project architecture. |
| `CLEAN_REPLAY_CANDIDATE` | Existing custom implementation appears replaceable, but prove equivalence on a disposable/clean replay before retirement. |
| `KEEP_SMALL_GLUE` | Upstream solves the heavy mechanism; keep only project-specific evidence/adaptation glue. |
| `RETIRE_AS_DEFAULT` | Do not choose the old custom mechanism first for new work; retain only as a documented fallback until safely removable. |

## Integration matrix

| Problem | Existing capability to check first | Current project posture | Custom work that remains legitimate |
| --- | --- | --- | --- |
| Figma structured design context | Figma Remote MCP `get_design_context`, variables/styles/library search | `USE_NOW` when available | Interpret evidence against Company/Existing/Project contract; section strategy |
| Figma exact asset retrieval | Figma Remote MCP `download_assets` | `USE_NOW` | Durable storage/provenance/hash and fallback transport only |
| Figma asset visibility for reasoning | Figma `get_screenshot` | `USE_NOW` | Section comparison orchestration only |
| Figma component → production component | Code Connect map/suggestions + repo/design-system search | `CONDITIONAL` | Thin `component-resolution` fallback when Code Connect is unavailable |
| Design-system discovery | Figma `search_design_system`, existing Storybook/component registry, repo search | `USE_WHEN_PRESENT` | Resolve semantic/API compatibility and document decision |
| Design tokens | Existing Figma Variables/token pipeline; DTCG-compatible tooling such as Style Dictionary/Tokens Studio when already appropriate | `USE_WHEN_PRESENT` | Project-specific mapping only; no new universal token schema |
| Browser screenshot capture | Playwright | `USE_NOW` where browser QA exists | Figma/reference selection and capture manifest |
| Normal browser baseline regression | Playwright Test `toHaveScreenshot` / `toMatchSnapshot` | `USE_NOW` when Playwright Test owns the baseline | Figma-specific alignment/mask/region metadata only |
| Arbitrary Figma PNG ↔ runtime PNG file comparison | mature image diff lib (`pixelmatch` + PNG decoder currently used) | `KEEP_SMALL_GLUE` | Paths, dimension guard, project threshold, diff artifact, provenance |
| Hosted Figma-design ↔ implementation review | BrowserStack Percy Figma + Playwright integration | `CONDITIONAL`, high-value trial candidate | Project authority, Figma provenance, section-learning data that Percy does not own |
| CI failure forensics | Playwright Trace Viewer | `USE_NOW` | Root-cause classification and learning record |
| Semantic snapshot regression | Playwright ARIA snapshots | `USE_WHEN_PRESENT` for relevant interactive/shared UI | Scope selection; manual keyboard/a11y QA remains |
| Automated accessibility detector | axe-core / `@axe-core/playwright`; Storybook a11y when Storybook exists | `USE_WHEN_PRESENT` | Human/manual checks and project-specific remediation decisions |
| Shared-component visual review | Existing Storybook + Chromatic/other established visual service | `USE_WHEN_PRESENT` / `CONDITIONAL` | Figma parity reasoning not provided by the service |
| Generic page-level hosted visual review | Percy / Chromatic Playwright / Argos when account/privacy/cost fit | `CONDITIONAL` | Figma reference linkage and Human Repairability evidence |
| CSS syntax/convention lint | Existing Stylelint/PostCSS stack | `USE_WHEN_PRESENT` | Only rules that encode real project-specific invariants |
| Browser target sharing | Existing Browserslist config | `USE_WHEN_PRESENT` | Resolve targets from Effective Environment Contract; do not invent global browser list |
| Browser feature warning | Stylelint/doiuse or equivalent using Browserslist | `CONDITIONAL` | Fallback review; warnings cannot prove a fallback is absent |
| WordPress local runtime | Existing project environment; otherwise evaluate official `@wordpress/env` before bespoke Docker | `CLEAN_REPLAY_CANDIDATE` for generic fixture base | ACF PRO licensing, worktree isolation, project theme/drop-in, special seed/mutation glue |
| ACF JSON import/export/sync | ACF 6.8+ `wp acf json` + WP-CLI 2.0+ | `USE_NOW` when version contract permits | Structural validation/evidence capture only |
| WordPress responsive media | `wp_get_attachment_image()`, registered sizes, native loading optimization | `USE_NOW` in applicable WP projects | Real art direction / separate PC-SP source selection |
| SVG optimization | SVGO or existing production optimizer | `USE_WHEN_PRESENT` | Figma/source provenance and post-optimization visual verification |
| Performance regression | Existing RUM/project metrics; Lighthouse/Lighthouse CI for synthetic CI where useful | `USE_WHEN_PRESENT` | Choose project-relevant assertions; no universal score gate |
| Dependency update automation | Existing Renovate/Dependabot/project mechanism | `USE_WHEN_PRESENT` | Update Radar still tracks docs/capability changes that dependency bots cannot see |
| External capability/release discovery | Existing `config/update-sources.yaml` + Update Radar | `KEEP_SMALL_GLUE` | Curated authority/impact mapping and retest triggers |
| Figma↔browser root-cause diagnosis | Percy can cover part of DOM/CSS/position RCA; no upstream currently owns full project authority + Figma semantics + repairability | `KEEP_SMALL_GLUE` | Figma-specific geometry/style/text evidence + root-cause classification |
| Cross-project success/failure learning | No upstream tool owns project-specific evidence promotion | `KEEP_SMALL_GLUE` | Run Record, playbook evidence lifecycle, Human Correction Cost |

## 1. Figma asset acquisition: official path first

For a Figma node, prefer:

```text
get_design_context
+ get_screenshot when visual inspection is needed
+ download_assets when durable bytes are needed
↓
exact export / raw source image / exact SVG
↓
store durable bytes + provenance/hash
```

Do not route through a custom binary bridge merely because an older client once could not expose the bytes.

If the active Figma MCP/client cannot provide durable asset bytes, record that capability gap and only then use the existing fallback bridge/transport.

### Retirement implication

The historical multi-hop Figma asset transport is `RETIRE_AS_DEFAULT` for clients where `download_assets` works. It remains a fallback until all required client/plan/private-file scenarios are replayed.

Do **not** delete the fallback based on one successful call.

## 2. Code Connect: use upstream, do not clone upstream

Preferred path when the target Figma plan/library supports it:

```text
Figma component
→ existing Code Connect map
→ Code Connect suggestions/context if mapping work is needed
→ production component path
→ verify semantic/API/variant compatibility
```

If Code Connect is unavailable because of plan/seat/library constraints:

```text
Figma component identity
+ design-system search
+ repository component search
→ docs/component-resolution.md
```

The fallback is intentionally thin. Do not build a proprietary Code Connect clone, parser, component browser, or template language.

## 3. Visual comparison: separate two different jobs

### A. Browser baseline regression

For ordinary browser regression, Playwright Test owns:

- browser launch/runtime
- locator/page screenshot capture
- deterministic snapshot naming/path conventions
- expected/actual/diff comparison
- pixel threshold/max-diff settings
- Trace on failure/retry

Do not wrap Playwright with a second browser screenshot engine for the same baseline job.

### B. Figma reference file ↔ runtime file comparison

This is a different responsibility. The Figma PNG may be an externally acquired truth artifact, not a Playwright-managed snapshot baseline.

`experiments/wordpress-acf-pro-standalone-lp/tests/visual-diff.mjs` currently does **not** implement a new pixel-diff algorithm. It is a thin adapter over mature external packages `pixelmatch` + `pngjs`:

```text
arbitrary Figma PNG path
+ arbitrary runtime PNG path
→ decode
→ pixelmatch
→ diff artifact + ratio
→ optional project threshold
```

Status: `KEEP_SMALL_GLUE`.

Do not replace this solely for the sake of saying “Playwright is used”. A Playwright snapshot migration is justified only if it removes responsibility without forcing the external Figma reference through extra baseline-copy/naming ceremony.

The desired separation is:

```text
Playwright = browser/runtime/capture/baseline regression
pixelmatch or equivalent mature lib = arbitrary image-pair comparison when needed
figma-ai-project = Figma provenance/path/alignment/threshold/root-cause
```

If another maintained library/tool later handles arbitrary Figma reference pairing better, compare it through clean replay.

## 4. Percy Figma integration: strongest external replacement candidate for generic review

BrowserStack Percy already supports a workflow that is unusually close to this project's review problem:

```text
Figma design/frame
→ Percy Figma import
→ map design to implementation snapshot/test case
→ implementation build from Playwright/CI
→ side-by-side design comparison
→ visual review / approvals
```

It can also ingest existing Playwright `toHaveScreenshot()` tests through a Percy drop-in path, shifting baseline storage/review to Percy without rewriting each test.

This makes Percy the highest-priority external trial for the **generic** parts of the Human Review Dashboard:

- hosted snapshot/baseline storage
- PR-oriented visual review
- design-to-snapshot mapping
- approvals/change requests
- cross-browser rendering
- generic diff navigation

Percy also has DOM/CSS/position Root Cause Analysis for supported implementation snapshots. However, current Percy documentation notes RCA limitations for Figma builds/uploaded images, so it does not eliminate the need for our Figma-specific diagnosis/learning layer.

### Hard adoption constraints

Percy Figma integration is not `USE_NOW` because it introduces external access boundaries:

- a Figma file may need to be public, or the Percy Figma service account must be granted access
- stricter Figma rate limits can require Dev/Full access for reliable critical builds
- screenshots/DOM/assets are processed by an external hosted service
- screenshot quota/cost scales with browser/width combinations
- private/company projects must explicitly approve this trust boundary

No BrowserStack/Percy connector/plugin is currently available in this ChatGPT workspace, so an authenticated Percy trial cannot be executed autonomously here without account/project credentials and the required Figma sharing decision.

### Trial acceptance criteria

Before replacing dashboard responsibility, run a real disposable/approved project trial and compare:

```text
Figma PC/SP mapping quality
section-level review usability
private-file access model
Playwright integration effort
browser/width coverage
false-positive/noise cost
approval workflow
RCA usefulness
Figma provenance visibility
Human Correction minutes
monthly screenshot usage/cost
```

If Percy wins, retire only the generic duplicated parts. Keep Figma authority/provenance/learning glue unless Percy demonstrably covers it better.

## 5. Other hosted visual review is optional

When a project already uses Storybook/Chromatic, reuse it rather than maintaining a second shared-component review surface.

Chromatic Playwright and Argos remain valid generic visual review candidates. Percy ranks higher for this project's Figma comparison use case because it has a documented direct Figma-design comparison workflow.

Do not introduce multiple hosted visual-review services for the same responsibility.

## 6. CSS/browser compatibility: shared ecosystem config first

When the target project already uses a Node/CSS toolchain:

```text
Effective Environment Contract
→ existing Browserslist
→ Autoprefixer / Babel / Stylelint / compatible tools
```

Do not maintain independent browser target lists in each validator.

For CSS AST/static checks, prefer the existing Stylelint/PostCSS parser ecosystem over new regular-expression CSS parsers. Keep Python/YAML validators for policy semantics that are not source-code linting problems.

Browser-support lint is a warning/evidence source, not proof of a defect: tools cannot always know whether a valid fallback exists.

## 7. WordPress + ACF: official runtime and CLI first

Environment resolution order:

```text
existing company/project WordPress environment
→ official @wordpress/env candidate
→ smallest missing Docker/runtime adapter
```

`@wordpress/env` should be clean-replayed against the current standalone fixture before changing the fixture architecture. Required comparisons include:

- WordPress/database/WP-CLI startup
- supplied theme/drop-in behavior
- worktree/parallel isolation
- ACF PRO license injection without committing private plugin bytes
- deterministic seed/mutation workflow
- Playwright runtime URL

For ACF 6.8+ with WP-CLI 2.0+, use official `wp acf json status/sync/import/export` before adding custom import/export commands.

The project's validator can still verify evidence structure and stable field/group keys; it should not duplicate ACF's import/export engine.

## 8. What must remain project-specific

External tools still do not own the key decisions that differentiate this project:

- Company / Existing / Project authority resolution
- section decomposition and implementation order
- Figma evidence interpretation without coordinate-copying
- CSS vs CSS+SVG vs SVG vs raster/exact-export strategy
- responsive/art-direction interpretation across PC/SP and intermediate widths
- matching parity failures to canonical code owners
- deciding whether a change is implementation failure, input ambiguity, tool limitation, or project contract issue
- Human Repairability QA
- repeated-feedback learning and rule promotion/demotion

These are `KEEP_SMALL_GLUE`, not an excuse to rebuild browsers, asset exporters, linters, visual-test clouds, component catalogs, token transformers, WordPress CLIs, SVG optimizers, or image-diff algorithms.

## 9. New custom capability admission

Before new infrastructure is accepted, record:

```text
upstream_checked:
upstream_version_or_date:
why_upstream_is_insufficient:
smallest_missing_glue:
ownership:
verification:
retirement_trigger:
human_rework_expected_delta:
```

If `why_upstream_is_insufficient` is vague, stop implementation and research again.

## 10. Adoption lifecycle

```text
external capability discovered
→ capability/plan/project fit verified
→ disposable or real-project trial
→ compare Human Correction Cost / rework / maintenance
→ adopt upstream + smallest glue
→ mark replaced custom path RETIRE_AS_DEFAULT
→ delete old path only after replay/coverage proves safe
```

The objective is not maximum dependency count. It is **minimum duplicated responsibility**.