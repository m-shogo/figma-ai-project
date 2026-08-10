# Workflow — Company → Existing → Figma → Section Execution

このworkflowは、既に決まっているFigma referenceを**会社ルールと既存codebaseに適合させながら高精度に実装する工程**。

Visual/design source of truthはFigma。

Technical implementation precedenceは:

```text
COMPANY POLICY
→ EXISTING CODEBASE / DESIGN SYSTEM
→ FIGMA IMPLEMENTATION EVIDENCE
→ AGENT INFERENCE
```

Company PolicyとFigma visual/behaviorが衝突した場合は勝手にredesignせず`CONFLICT`として扱う。

Production defaultはsection-first。Whole-page one-shotは`PAGE_BENCHMARK`として別cohort。

Canonical related docs:

- `docs/company-policy-contract.md`
- `docs/reference-contract.md`
- `docs/figma-capability-profile.md`
- `docs/figma-structure-profiling.md`
- `docs/figma-instruction-evidence.md`
- `docs/component-resolution.md`
- `docs/token-mapping.md`
- `docs/web-interaction-policy.md`
- `docs/wordpress-acf-policy.md`
- `docs/image-gradient-visual-tolerance.md`
- `docs/section-execution.md`
- `docs/section-integration-ladder.md`
- `docs/responsive-breakpoint-policy.md`
- `docs/context-package.md`
- `docs/visual-verification.md`

---

## 0. Tooling / policy update preflight

Significant run前にcurrent stateを確認する。

Minimum:

1. ACTIVE Company Policy / browser support
2. current Figma release notes / MCP docs
3. current agent/client docs
4. current browser/platform support relevant to Company targets
5. WordPress/ACF/library official docs when applicable
6. recent practitioner/community signals

古いlimitation/workaroundを自動で現在へ適用しない。

---

## 1. Activate and pin Company Policy

`templates/company-policy.yaml`

Company Policyで最低限決める/確認する:

- browser support / QA matrix
- framework/CMS
- CSS/reset
- breakpoints
- folder/section-unit conventions
- approved libraries
- smooth scroll
- hover/focus
- hamburger/menu
- carousel/autoplay
- animation/reduced motion
- comments/annotations handling
- ACF/WordPress architecture
- images/SVG
- gradients
- visual tolerance
- integration capture policy
- update/retest cadence

Policyを`ACTIVE`にし、SHA-256をShared Contract/Runへpinする。

---

## 2. Freeze external reference

`templates/reference-manifest.yaml`

固定する:

- Figma file / nodes
- PC/SP/other frames
- exact acceptance viewport/state
- assets/crops
- interaction states
- responsive evidence
- codebase starting commit
- material UNKNOWNs/conflicts

Referenceをrepo側から発明しない。

---

## 3. Existing Codebase Reconnaissance — before Figma translation

まず既存projectを読む。

Examples:

- framework/runtime
- package manager/build
- browserslist
- reset/base CSS
- styling architecture
- tokens/design system
- component library
- breakpoint definitions
- JS interaction utilities
- carousel/motion libraries
- image helpers/CDN
- PHP/template parts
- WordPress/ACF architecture
- folder/naming/lint rules

目的はFigmaから既存機構を重複生成しないこと。

---

## 4. Global Figma Reconnaissance / Capability Profile

全体をinspection-onlyで読む。

- metadata/hierarchy
- section boundary candidates
- Components/Variants
- Variables/Modes
- Auto Layout/Grid/Sizing
- semantic naming
- Code Connect
- annotations
- prototype interactions
- assets
- comments access when available
- PC/SP relationship

`UNKNOWN / NONE / UNDETERMINED`を区別する。

---

## 5. Shared Contract DRAFT

Company + Existing + Global Figma evidenceをnormalizeする。

含む:

- Company Policy path/hash/id
- browser/breakpoint contract
- styling/reset
- fonts/tokens
- container/gutter/layout
- shared components
- interaction defaults
- asset/image rules
- CMS/folder conventions
- accessibility
- coordinator-only paths
- conflicts/unknowns

---

## 6. Section Discovery + PC/SP Mapping

Figma metadata/contextからlogical sectionsを抽出する。

Example:

```text
S01 Header
S02 Hero
S03 Content01
S04 Content02
S05 Footer
```

記録:

- exact nodes
- boundary confidence/evidence
- PC/SP mapping confidence/evidence
- dependencies
- integration coupling
- allowed paths

人間に毎回node URLを手で切り出させることをdefaultにしない。

---

## 7. Per-section Figma Structure Profile

SectionごとにFigmaの内部品質/構造を読む。

Translation mode:

- STRUCTURE_FIRST
- HYBRID
- VISUAL_FIRST
- CODEBASE_FIRST

同じページ内でmodeが違ってよい。

Section Profile path/hashをSection Manifest/Runへpinする。

---

## 8. Resolve components / tokens / interactions / instructions

Before implementation:

### Components

`REUSE_EXISTING / REUSE_CODE_CONNECT / EXTEND_EXISTING / CREATE_SHARED / IMPLEMENT_SECTION_LOCAL`

### Tokens

`REUSE_EXISTING_TOKEN / MAP_VARIABLE_TO_EXISTING / CREATE_SHARED_TOKEN / KEEP_SECTION_LOCAL / PRESERVE_MODE_MAPPING`

### Interactions

- Figma prototype
- component state/variant
- annotation
- relevant comment
- Company defaults

からhover/menu/slider/animation等を解決する。

### Comments

Commentsを:

- GLOBAL
- SECTION
- BOUNDARY
- UNKNOWN

へmappingする。

Boundary commentをSection localへ押し込まない。

---

## 9. Build shared foundation — serial/coordinated

Parallel workerより先に:

1. reset/base if needed
2. fonts
3. tokens/theme
4. company/browser breakpoint binding
5. container/gutter/layout primitives
6. shared components
7. shared interaction utilities
8. image/assets helpers
9. CMS/common helpers

を実装/reuseする。

既存projectの正本を最優先。

---

## 10. Verify foundation / freeze Shared Contract

確認:

- build/type/lint
- browser-target build output when applicable
- reset/base impact
- font loading
- token/component resolution
- global container/breakpoints
- shared interaction baseline
- image helper behavior
- Company Policy compliance

成功後:

```text
foundation.status = VERIFIED
shared contract = FROZEN
company_policy = BOUND
```

Actual SHA-256をSection Manifest/Runへpinする。

---

## 11. Safe Wave Planning / worker activation

Safe Waveは:

- dependency
- allowed write paths
- integration coupling
- boundary confidence
- PC/SP mapping confidence

で決める。

Concurrent workersは別branch/worktree/sandbox等で隔離する。

Singleton/serial executionを必要以上に禁止しない。

---

## 12. Section Inspect — no code edits

Worker input:

- ACTIVE Company Policy
- frozen Reference
- frozen Shared Contract
- Section Manifest entry
- Section Structure Profile
- verified foundation commit
- section-mapped comments/annotations/interactions
- exact Figma nodes/screenshots

Company → Existing → Figmaのprecedenceを再確認する。

---

## 13. Section FIRST_PASS implementation

Section Implementation Unitはstackへ合わせる。

Examples:

### React

```text
sections/Hero/Hero.tsx
sections/Hero/Hero.module.css
```

### WordPress classic

```text
template-parts/sections/hero.php
assets/css/sections/hero.css
assets/js/sections/hero.js
```

### ACF/native block

```text
blocks/hero/block.json
blocks/hero/render.php
blocks/hero/style.css
```

Workerはallowed pathsだけ変更する。

Shared changeは`PROPOSE_SHARED_CHANGE`。

FIRST_PASSを保存し、visual tuning前にstopする。

---

## 14. SECTION capture / verify

Exact reference viewport/stateでSectionをcaptureする。

Sectionは可能な限り実page shell/context内でrenderする。

Check:

- geometry/spacing
- typography/wrap
- colors/gradients/effects
- image crop
- local responsive behavior
- hover/focus/menu/slider/animation state
- CMS-generated markup when applicable
- Company Policy compliance

Universal `2pxまでOK`を使わずcategory-awareに評価する。

---

## 15. BOUNDARY capture — required by default

Adjacent sections:

```text
B01 = S01 ↔ S02
B02 = S02 ↔ S03
B03 = S03 ↔ S04
```

Check:

- bottom/top spacing
- margin collapse/box model
- background continuity
- container/full-bleed transition
- decorative overlap
- z-index
- sticky/fixed interaction
- typography rhythm
- anchor offset/smooth scroll

Section単体PASS + Boundary FAILを区別する。

---

## 16. High-coupling CLUSTER capture

必要な場合のみ:

- Header + drawer + Hero
- Hero + floating CTA + next content
- sticky story sections
- slider + external caption/pagination
- cross-section animation

HIGH couplingを独立Section完成扱いしない。

---

## 17. Cumulative prefix capture — conditional

User-facing pattern:

```text
S01
S01+S02
S01+S02+S03
...
```

Default必須にはしない。

Use when:

- vertical rhythm accumulates
- sticky position depends on upstream height
- scroll progress depends on page length
- cumulative geometry error matters

---

## 18. Coordinator integration / Full Page capture

Coordinator owns root composition/include order。

Full page PC/SP + specified breakpoint boundaryを必ずcaptureする。

Check:

- section order
- accumulated spacing
- global container
- backgrounds
- typography hierarchy
- fixed/sticky/z-index
- overflow
- anchor navigation
- smooth scroll offset
- page-level animation
- responsive continuity
- Company Policy/browser behavior

---

## 19. Failure classification / Targeted Repair

First inspect root cause before adding magic numbers。

For 1–2px drift inspect:

1. font
2. reset/box-sizing
3. container/gutter
4. line-height
5. image aspect/crop
6. Figma sizing semantics
7. token resolution
8. browser/DPR rendering

Shared causeならSection local hackではなくFoundation/Contractへ戻す。

---

## 20. Replay / Knowledge Promotion

Promising improvement:

- fresh context
- clean foundation
- same Company Policy revision
- same reference
- same Structure Profile/Contract

でreplayする。

Knowledge:

```text
Observation
→ Candidate Rule
→ Proven Playbook
```

Tool/browser/Figma/WordPress/library updateで再評価可能にする。

---

## Evidence tree

```text
Company Policy
└ Page
  ├ S01
  ├ B01 S01↔S02
  ├ S02
  ├ B02 S02↔S03
  ├ S03
  ├ Cluster when needed
  └ Full Page
```

Dashboardは将来このtreeをそのまま可視化する。

---

## Experiment completion

- ACTIVE Company Policyがpinされている
- referenceを変えていない
- tooling update preflightがある
- FIRST_PASSを保存
- Section evidenceがある
- Boundary/Cluster evidenceがある where applicable
- Full Page evidenceがある
- lineageが追跡可能
- failures/reworkのscopeが分かる
- clean replayできる
- portable/project-specific knowledgeが分離される
