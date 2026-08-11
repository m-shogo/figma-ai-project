# Implementation Target Profile

The first implementation decision is **where the Figma is being implemented**. Do not start Figma section code generation while this is still implicit.

The selector is intentionally small:

```text
◉ Existing Project / Auto Detect
○ Static Web
○ PHP Template
○ WordPress
○ JS Framework
○ Other
```

Then only show conditional radio/check fields relevant to that family.

Canonical machine-readable selector/checklist registry:

- `config/implementation-targets.yaml`
- `templates/implementation-profile.yaml`
- `schemas/implementation-profile.schema.json`

## Resolution order

The initial radio choice is intent, not permission to ignore the repository.

```text
Initial target selection / Auto Detect
→ Company Policy
→ Existing repository evidence
→ detect conflicts
→ resolve effective implementation target
→ platform-specific checklist
→ Implementation Profile FROZEN
→ bind to Shared Contract DRAFT
→ build/verify foundation
→ Shared Contract FROZEN
→ Section execution
```

Technical precedence remains:

```text
COMPANY POLICY
→ EXISTING CODEBASE / DESIGN SYSTEM
→ FIGMA IMPLEMENTATION EVIDENCE
→ AGENT INFERENCE
```

If a user selects WordPress but repository evidence proves a Next.js frontend, do not silently choose either one. Record and resolve the conflict before freeze.

## Common checks for every target

The profile must resolve at least:

- repository + starting commit
- target route/template
- language/runtime
- package manager/build tool decision
- styling architecture
- component/design-system reuse
- routing
- data source/CMS
- image/asset pipeline
- forms
- i18n decision, including explicit `none`
- test/visual harness
- Required Environment matrix
- accessibility baseline

`none` or `not used` is a valid resolved decision. `UNKNOWN` is not.

## Static Web

Additional checks:

- semantic HTML strategy
- CSS vs SCSS
- vanilla JS vs TypeScript
- partial/include strategy
- static asset paths
- build/output contract

Example effective target:

```text
STATIC_WEB
HTML + SCSS + vanilla TypeScript
Vite
semantic partials
static assets
```

## PHP Template

Second radio:

```text
○ Plain PHP
○ Blade
○ Twig
○ Other
```

Additional checks:

- server framework/custom runtime
- context-aware escaping
- route/controller → template data contract
- include/component strategy
- asset pipeline

Do not treat every PHP project as WordPress.

## WordPress

Second radio:

```text
◉ Auto Existing
○ Classic
○ Block
○ Hybrid
```

Resolve:

- WordPress version/support contract
- PHP version
- Classic / Block / Hybrid
- page/template/template-part/block implementation unit
- editor model
- `wp_enqueue_*` / existing asset pipeline
- WordPress image helper strategy
- output escaping
- `theme.json` use
- `block.json` use
- CPT/taxonomy ownership
- ACF use

### WordPress + ACF

If ACF is enabled, also resolve:

- ACF version and Free/PRO capability
- Template Fields / Repeater / Flexible Content / ACF Blocks / Hybrid / existing architecture
- field-group ownership
- stable ACF group/field keys
- image return format
- Local JSON policy
- importable JSON delivery
- import/sync smoke method

**ACF-enabled production work requires an importable `acf-export.json` deliverable.**

The preferred delivery package is:

```text
target repo
├─ implementation source
├─ acf-export.json           # portable ACF Tools / supported CLI import bundle
└─ acf-json/                 # when Local JSON is required by the project
   ├─ group_....json
   └─ ...

figma-ai-project experiment evidence
└─ artifacts/acf-export.json # immutable/auditable copy used by completion validation
```

The final run cannot be marked complete until the export JSON passes `scripts/validate_acf_export.py` and the configured import/sync smoke succeeds.

## JS Framework

Second radio:

```text
◉ Auto Existing
○ React
○ Next
○ Vue
○ Nuxt
○ Svelte
○ SvelteKit
○ Astro
○ Other
```

Resolve:

- framework/version
- router
- rendering mode: CSR / SSR / SSG / ISR / hybrid as applicable
- server/client boundary
- existing component library/design system
- state management
- data fetching/cache/revalidation
- framework image pipeline
- hydration/islands when applicable

### Next-specific

Also decide:

- repository's router architecture
- server/client component boundary
- rendering/cache/revalidation policy
- image component policy

Do not rewrite an existing routing/rendering architecture solely to match Figma structure.

### Nuxt / SvelteKit / Astro

Only ask their extra questions when selected. Examples:

- Nuxt rendering/data/image policy
- SvelteKit load/actions and rendering
- Astro output mode and island hydration

## Why not one giant radio list?

A giant first screen makes users answer questions that do not apply to their project. The design is progressive disclosure:

```text
6 family choices
→ one small conditional choice
→ auto-detected repository facts
→ only relevant checklist
```

This follows the same section-first principle used for Figma context.

## Commands

Typical preparation:

```bash
# 1. create/fill a profile from templates/implementation-profile.yaml
python scripts/validate_implementation_profile.py

# 2. after the profile is FROZEN, bind it before Shared Contract freeze
python scripts/bind_implementation_profile.py \
  contracts/<project>/shared-contract.yaml \
  implementation-profiles/<project>.yaml \
  --apply

# 3. create the section run normally, then pin the bound profile
python scripts/pin_implementation_profile.py experiments/<exp>/<run>/run.yaml --apply

# 4. normal automated preflight/start
python scripts/apply_radar_preflight.py experiments/<exp>/<run>/run.yaml --apply
python scripts/start_section_run.py experiments/<exp>/<run>/run.yaml --apply
```

`start_section_run.py` fails closed if the profile path/hash/id is absent, stale, not FROZEN, or differs from the Shared Contract binding.

## Final rule

**Choose implementation intent early, but freeze the effective target only after Company Policy and the real repository have been inspected.**
