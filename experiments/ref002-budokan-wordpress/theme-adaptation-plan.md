# REF-002 Theme Adaptation Plan

## Goal

REF-002 must prove that a Figma implementation can adapt to a project-specific WordPress Theme without turning that Theme into a universal template.

The reusable capability is the decision process:

`observe Theme -> resolve ownership -> reuse existing capability -> add smallest missing glue -> Block Editor QA -> SP -> PC -> Human Editability`

The reusable capability is **not** a fixed folder structure, CSS architecture, block namespace, breakpoint set, or Header/Footer implementation.

## Work that can be completed before the Theme arrives

- Figma PC/SP observation and section mapping
- Figma Parts and token inventory
- source/interaction/responsive Observation Coverage
- editor ownership candidates
- Core Block / Pattern / Dynamic / Custom candidate resolution
- exact asset/source inventory
- runtime and editor QA scenarios
- old REF-002 Baseline comparison model
- unsupported assumptions kept as `UNDETERMINED`

These tasks are independent of the production Theme and reduce later implementation reversal.

## Theme-arrival reconnaissance

Before writing production markup/CSS/JS, inspect the supplied Theme for:

1. Theme family: Classic, Hybrid, or Block
2. WordPress/PHP/ACF PRO versions
3. `theme.json` and editor settings/styles
4. existing blocks and `block.json` namespaces
5. existing patterns, template parts, block styles, variations, and locked/content-only editing conventions
6. Header/Footer/Breadcrumb/Page Title ownership
7. existing `functions.php`/include/bootstrap structure
8. CSS/SCSS/PostCSS/build pipeline and naming conventions
9. JS/enqueue/build conventions
10. breakpoints/container/gutter primitives
11. image helpers/sizes/srcset pipeline
12. registered post types/taxonomies and existing queries
13. ACF Local JSON, field naming, stable keys, image return format, ACF Blocks
14. existing slider/tab/accordion/calendar/form libraries
15. existing test/visual QA harness

Unknown project facts remain unknown. Do not replace them with framework conventions merely to start coding.

## Resolution rule for every Figma part

Resolve in this order:

1. existing Theme implementation
2. WordPress Core Block/API
3. existing Theme block style/variation
4. Pattern / locked Pattern / content-only structure
5. existing project/plugin custom block
6. existing ACF Block
7. new ACF Block
8. new native custom block

A lower item is selected only when higher items cannot satisfy the semantic, editorial, responsive, accessibility, or runtime contract cleanly.

## Block Editor output quality

The code generator must think about both editor markup and public markup.

### Core/Pattern route

Prefer Core Blocks for ordinary semantic content such as headings, paragraphs, images, lists, quotes, tables, buttons, separators, groups, columns, and query output when the required design can be expressed through the target Theme's styles.

Use Patterns to encode useful authored compositions without inventing a new data model. Lock structure only when editors should change content but not destroy layout semantics.

### Custom/ACF Block route

When a custom block is genuinely required:

- use `block.json` metadata unless the observed legacy target requires another compatible convention
- register server-side so WordPress block supports and server features remain available
- follow the supplied Theme/plugin namespace and build system
- use the target WordPress version to choose registration optimizations; do not require modern metadata collections on unsupported versions
- follow the installed ACF PRO version before selecting ACF Blocks v2/v3 or inline-editing features
- keep ACF fields limited to editor-owned content/configuration
- preserve stable ACF keys and the target Local JSON policy
- escape output by context
- keep semantic HTML readable outside the editor
- do not use third-party library private DOM as the QA contract

## Editor acceptance

A production section is not complete when only the browser screenshot matches Figma.

When relevant, acceptance must cover:

1. insert/open in Block Editor
2. correct editor preview
3. mutate ordinary text/image/link content
4. long-text and optional-field mutation
5. save/update
6. reload editor without invalid-block warnings
7. front-end render
8. editor/front-end ownership and semantic parity
9. SP visual/runtime acceptance
10. PC visual/runtime acceptance
11. intermediate-width safety
12. keyboard/focus/touch behavior for interactive UI
13. CMS mutation without unrelated Theme regressions
14. Human Editability drill: another developer can locate and change the owner quickly

## Old REF-002 baseline

PR #142 is preserved as historical comparison evidence. It contains useful asset/runtime/interaction lessons but is not a production architecture source for the new implementation.

Comparison should measure at minimum:

- First Pass fidelity
- Observation misses
- invented behavior/data architecture
- existing Theme/Core reuse
- unnecessary custom Block/ACF count
- repair rounds
- post-First-Pass files/lines changed
- Human Correction Cost
- Human Editability
- SP regression caused by PC repair

The purpose of the new replay is not merely to finish the same screen. It is to demonstrate that the current process produces a more accurate, more native, and easier-to-maintain WordPress implementation across changing project Themes.
