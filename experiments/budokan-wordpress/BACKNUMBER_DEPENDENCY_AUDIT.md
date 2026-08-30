# Budokan backnumber dependency audit

Status: responsive Figma/page-shell authority is current; page implementation remains fail-closed only on canonical monthly issue data ownership.

Updated: 2026-08-30

## Current-state correction

The older version of this audit said TOP lower banner PR #228 was still intentionally unmerged while waiting for the exact Figma SP background raster. That premise is no longer true.

The lower-banner gate was resolved in PR #260: the exact Figma SP background asset was materialized durably, runtime QA passed, and the replacement implementation was squash-merged. Backnumber prioritization must therefore no longer treat the TOP lower banner as an upstream blocker.

This correction changes dependency status only. It does **not** authorize guessing the Backnumber CMS/data model.

## Re-checked authority

- Git base: `so` at `364e810b6140125899d0960dc4c48ce0193a3d32` when this refresh started.
- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- Current SP frame still exists: `560:677` (`backnumber_sp`, 375 × 8082).
- Current PC frame still exists: `1634:10806` (`publications`, 1380 × 6488).
- Ordinary-page owner remains `page.php` → global page shell → `the_content()` inside the existing content/sidebar layout.
- No evidence requires a dedicated Backnumber PHP page template, CPT, or new ACF field group.
- Existing Theme Gutenberg/block styles remain the first reuse candidates.

## Responsive master / derivative picture

Backnumber is one responsive page family, not separate SP/PC components.

The repeated issue row is the family master:

`issue title + order action + cover + summary (+ detail affordance where authored)`

Observed authored geometry remains:

- PC content body: 1040px.
- PC issue header: 60px; cover 160 × 226; image/text gap 40px; item stack gap 24px; issue-to-issue gap 56px.
- SP body: 335px.
- SP issue header: compact 16px horizontal inset; cover 100 × 142; image/text gap 12px; item stack gap 24px; issue-to-issue gap 40px.

Implementation order, once content authority exists:

`existing global shell` → `existing Gutenberg primitives` → `one responsive issue primitive if still needed after block composition` → `Backnumber page composition`.

Do not build a TOP derivative first and do not fork separate SP/PC markup.

## Proven reuse before build

The index/help area does not warrant page-specific PHP/CSS from current evidence:

- outlined expandable index/help panel → existing `.wp-block-details` / `css/blocks/wp-block-details-style.css`
- PDF/download action → existing `.wp-block-buttons` / `.wp-block-button__link` / `css/blocks/wp-block-buttonLink-style.css`
- numbered instructions → existing `ol.wp-block-list` / `css/blocks/wp-block-list-style.css`
- red caution rows → existing `ul.annotation-list`
- section heading → existing heading block styles

The page shell remains owned by Header / page visual / breadcrumb-dropdown navigation / content rail-sidebar / Footer.

## Remaining blocker — narrow and explicit

The only unresolved authority that blocks a production-safe Backnumber implementation is the **monthly issue data lifecycle**.

Current inspected Figma/Theme evidence does not prove whether issue title, order URL, cover, summary, and detail destination are maintained as:

- editor-authored Gutenberg rows,
- an existing/custom repeated block,
- another external/static source,
- or a structured WordPress model not yet present in this Theme snapshot.

Do not infer a CPT or ACF repeater from visual repetition alone. Do not hard-code editorial issue data or short-lived Figma image URLs into Theme PHP.

Smallest authority needed: the canonical WordPress/editor/data source for one real Backnumber issue family, including title, order destination, durable cover ownership, summary, and detail destination.

## Safe next gate

When that authority is available:

1. Re-check current SP `560:677` first.
2. Compose mobile-first using the existing page shell and block masters.
3. Run real WordPress SP runtime + visual QA.
4. Extend only proven PC differences under `min-width: 768px` against `1634:10806`.
5. Run PC runtime + visual QA and visual diff.
6. Add page-scoped CSS or a dedicated issue primitive only where runtime diff proves existing blocks insufficient.
7. Record concrete causes/fixes, then clean Git/PR/CI and squash merge.

## Reusable lessons

- A repeated Figma row is not evidence by itself for a CPT or ACF repeater; prove the production data lifecycle first.
- A page-specific-looking panel may already be composed from Theme Gutenberg primitives; inspect block-level CSS before building a custom component.
- Dependency audits are operational inputs. When an upstream gate is later resolved, stale blocker text must be corrected or future reuse-before-build ordering becomes wrong.

No Theme PHP/CSS/JS, ACF contract, `parts.php`, Form, or Formidable work is changed by this refresh.
