# REF-002 Block Editor Intake

Status: PARTIALLY RESOLVED
Updated: 2026-08-23

## Confirmed

REF-002 is a WordPress project whose page content is edited with the WordPress Block Editor.

This confirms the editor model only. It does **not** prove that the supplied base Theme is a Block Theme. The Theme may still be Classic, Hybrid, or Block and must be observed before production paths, registration, asset pipelines, or template ownership are frozen.

## Output priority

For every Figma part or page section, resolve implementation in this order:

1. existing target Theme component/block/style/pattern
2. WordPress Core Block
3. Core Block + Theme style variation
4. Pattern / locked pattern / content-only pattern
5. existing project or plugin block
6. existing ACF Block
7. new ACF Block only when editor capability or dynamic rendering requires it
8. new native custom block only when the previous options are insufficient

A Figma Component is design evidence, not automatic evidence that a new WordPress Block must exist. Visual repetition is not automatic evidence for ACF Repeater/Flexible Content.

## Modern custom-block boundary

When a new block is actually required:

- use `block.json` as block metadata authority
- register on the server as required by the target WordPress version
- follow the target Theme's `theme.json`, block styles, namespaces, build pipeline, and enqueue conventions
- keep front-end behavior in front-end view assets only when behavior exists
- preserve semantic HTML and `get_block_wrapper_attributes()` semantics on the front end
- for ACF Blocks, avoid duplicating wrapper attributes in editor preview
- keep design/layout tokens out of ACF fields unless editors genuinely own them
- keep stable ACF keys and deliver portable ACF JSON when ACF fields are used

## Editor QA is part of completion

A block/section is not complete just because the public page looks correct. Relevant sections must prove:

- insert in editor
- preview in editor
- edit content
- save
- reload
- front-end render
- editor/front-end intent parity
- long-text and optional-content mutation
- SP then PC visual/runtime QA
- keyboard/focus/touch behavior for interactive blocks

## Current unresolved target facts

Before production code is frozen, observe the actual base Theme for:

- Classic / Hybrid / Block Theme family
- WordPress and ACF PRO versions
- `theme.json`
- existing `block.json` registrations and namespaces
- existing patterns and block styles
- existing ACF Blocks and Local JSON policy
- CSS/SCSS build pipeline
- JS/enqueue conventions
- existing slider, tabs, accordion, calendar libraries
- Header/Footer/template ownership

The old REF-002 implementation remains a read-only Baseline/comparison artifact. It is not production architecture authority for the new replay.
