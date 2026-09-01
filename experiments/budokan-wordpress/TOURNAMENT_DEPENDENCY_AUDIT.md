# Tournament Page Dependency Audit

Updated: 2026-09-02

This audit records the current implementation decision for the three remaining tournament/event information pages. It is a dependency/authority record, not permission to invent page-specific CMS structure or styling.

Canonical authority remains `CURRENT_AUTHORITY.md` and current Figma file `fKYDn9ikpJk1nW7IWFtaUx`.

## Current Figma authority

Current PC full-page frames were re-read live on 2026-09-02:

- `2108:10725` — 全日本少年少女武道錬成大会
- `2108:10871` — 鏡開き式・武道始め
- `2108:10952` — 日本古武道演武大会

No dedicated current SP full-page counterpart for these three pages is proven in the current Figma map. Therefore page-specific SP pixel parity remains `UNDETERMINED`. Existing shared responsive behavior may still be reused because it is already owned by the Theme; it must not be described as a newly proven page-specific SP contract.

## Production owner

The current WordPress owner is the ordinary editable page path:

```text
page.php
→ _visual.php
→ _dropdown-navigation.php
→ global_inner._column
→ .gc_main .block-editor_wrap
→ the_content()
→ existing sidebar / Local Nav
→ breadcrumb
→ footer
```

Current evidence does not authorize a dedicated tournament template, CPT, ACF Repeater/Flexible Content model, or page-specific CSS file.

## Shared component resolution

The live PC pages are predominantly compositions of shared Theme/Gutenberg owners already matched to current Figma.

| Figma surface | Current Theme owner | Resolution |
| --- | --- | --- |
| Gold page title | `_visual.php` + shared main-visual CSS | `REUSE_EXISTING` |
| Intro/body copy | Gutenberg paragraph shared owner | `REUSE_EXISTING` |
| Large authored images | core image/media content | `REUSE_EXISTING`; source bytes remain editor/content authority |
| h3 gray band | `wp-block-heading-style.css` | `REUSE_EXISTING` |
| h4 red rail | `wp-block-heading-style.css` | `REUSE_EXISTING`; shared vertical-inset repair merged in PR #344 |
| Overview tables | `wp-block-table-style.css` | `REUSE_EXISTING`; authored cell widths/alignment/content remain content-level evidence |
| Bullet list | `wp-block-list-style.css` | `REUSE_EXISTING` |
| Annotation list | `wp-block-list-style.css` `.annotation-list` | `REUSE_EXISTING` |
| 270×60 normal button | `wp-block-buttonLink-style.css` | `REUSE_EXISTING` |
| PDF/file/blank-link icon | existing link suffix/target behavior | `REUSE_EXISTING` |
| 32px detail button | shared `.wp-block-buttons.small` | `REUSE_EXISTING` |
| Local navigation | existing sidebar/local-nav walker + CSS | `REUSE_EXISTING` |
| Breadcrumb / Footer | existing shared template parts | `REUSE_EXISTING` |

## Important current observations

### Tournament tables are authored variants, not a new global table master

The generic current table master (`1157:8286`, `1157:8291`) uses the shared 15px table contract. Tournament pages reuse that geometry but contain authored differences such as 200px left label cells, left-aligned body copy, variable row heights, and in some cases Medium label text.

Do **not** change the generic table master globally merely because one tournament table uses a stronger label or a content-specific column width. Prefer WordPress table content/alignment/width evidence first. Only add a shared table variant if runtime evidence proves the current editor markup cannot express a pattern that repeats across pages.

### Do not flatten tournament content into static markup

Dates, descriptions, PDF links, captions, and event wording shown in Figma are design/reference content. They are not authority to hard-code production records into PHP or to create a new ACF/CPT model. The ordinary Gutenberg content surface is currently the safest human-editable owner.

### Large media does not justify a new gallery system

The pages contain wide event photos, posters, and promotional imagery with different authored dimensions. Use the existing image/media blocks and actual production/editor assets. Do not persist temporary Figma MCP asset URLs and do not create a tournament-only media abstraction unless production content proves one is needed.

## Safe implementation gate

Before adding tournament-specific production code, one of the following must be true:

1. actual WordPress runtime content demonstrates a repeatable visual defect that the existing shared block cannot express; or
2. Human/current project authority supplies a distinct editor/data requirement; or
3. a current Figma SP counterpart proves a structural variant that cannot be represented by existing responsive owners.

If none is true, the correct implementation decision is reuse, not a new page layer.

## Runtime / QA status

The current repository does not contain an authoritative seeded production record for these three real pages. Creating fixture content by copying the Figma wording would manufacture a content/data contract, so a page-specific runtime screenshot is not claimed here.

Shared owners continue to be covered by their existing audits/CI. PR #344 additionally re-read current PC/SP h4 masters and fixed the shared h4 geometry instead of introducing tournament CSS.

When real/editor-authoritative page content is available in the runtime, QA should compare:

- page title and content rail
- h3/h4 geometry
- table widths/alignment/variable row height
- file-link icons
- wide image scaling
- Local Nav current item
- breadcrumb/footer boundary
- SP behavior only against current SP evidence if/when such evidence is proven

## Decision

Current status for all three tournament pages:

```text
SHELL: REUSE_EXISTING
SHARED BLOCKS: REUSE_EXISTING
NEW PAGE TEMPLATE: NOT AUTHORIZED
NEW PAGE CSS: NOT JUSTIFIED WITHOUT RUNTIME DIFF
NEW ACF/CPT: NOT AUTHORIZED
PAGE-SPECIFIC SP PARITY: UNDETERMINED
```

This closes the architectural question without pretending the real production page content has been seeded or visually proven. Future work should target a concrete runtime/Figma delta, not create a parallel tournament implementation preemptively.
