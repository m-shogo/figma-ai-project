# Budokan backnumber dependency audit

Status: current PC Figma/page-shell authority is available; production-safe Backnumber implementation remains fail-closed on both canonical monthly issue data ownership and a current dedicated SP counterpart.

Updated: 2026-09-01

## Current-state correction

The current implementation authority is the Human-selected Figma file `fKYDn9ikpJk1nW7IWFtaUx`, not the older `w7SGVY63FuW6JpaQVKjxm2` / `RfAQQ28V1HGaeIcpgRmQq1` lineage.

A live re-scan on 2026-09-01 confirms:

- current PC frame: `1634:10806` (`publications`, 1380 × 6488)
- current SP page: `114:5409`
- the old `560:677` (`backnumber_sp`) node does **not** resolve in the current file
- no dedicated Backnumber / Publications SP full-page frame is present among the current SP page top-level frames

Therefore, any older note that calls `560:677` the current SP authority is stale. It may describe historical design evidence, but it must not be used for implementation or pixel-parity claims.

The earlier TOP lower-banner blocker is also already resolved by PR #260. It is not an upstream dependency for Backnumber.

## Current authority

- Git base checked from `so` after PR #335: `42164c69ae2e1742687accbb56d4e34364e0bc9b`.
- Figma file: `fKYDn9ikpJk1nW7IWFtaUx`.
- Current PC full-page authority: `1634:10806` (`publications`).
- Current SP page: `114:5409`; dedicated Backnumber counterpart: **UNDETERMINED / absent from current top-level frames**.
- Ordinary-page owner remains `page.php` → global page shell → `the_content()` inside the existing content/sidebar layout unless WordPress assignment proves otherwise.
- No current evidence requires a dedicated Backnumber PHP template, CPT, or new ACF field group.
- Existing Theme Gutenberg/block styles remain the first reuse candidates.

## Current PC composition evidence

The current PC `publications` frame is still a composition of shared masters rather than evidence for a new page-specific system:

- gold page title
- body texture
- shared heading hierarchy
- standard buttons / PDF-style actions
- details/help panel
- ordered and unordered lists
- repeated issue row: issue title + order action + cover + summary (+ detail affordance where authored)
- breadcrumb / global footer

Observed current PC geometry includes:

- content body: about 1040px
- issue header: 60px
- cover: 160 × 226
- image/text gap: 40px
- issue item stack gap: 24px
- issue-to-issue gap: about 56px

Do not convert these visual repetitions into a CPT or ACF repeater without proving the real editorial data lifecycle.

## SP authority rule

There is currently no dedicated SP Backnumber frame in the Human-selected Figma file.

Consequences:

- do not resurrect `560:677` from an older file lineage
- do not reuse News SP or another page's SP frame as a substitute
- do not invent a new SP design to claim Figma parity
- shared Theme responsive behavior may continue to work where already owned by global/block masters, but it must be described as Theme behavior, not current Backnumber Figma parity
- exact SP visual closure waits for current SP authority or an explicit Human decision that the shared responsive masters are the intended owner

## Proven reuse before build

The index/help area still does not warrant page-specific PHP/CSS from current evidence:

- outlined expandable index/help panel → existing `.wp-block-details` / `css/blocks/wp-block-details-style.css`
- PDF/download action → existing `.wp-block-buttons` / `.wp-block-button__link` / `css/blocks/wp-block-buttonLink-style.css`
- numbered instructions → existing `ol.wp-block-list` / `css/blocks/wp-block-list-style.css`
- red caution rows → existing `ul.annotation-list`
- section heading → existing heading block styles

The page shell remains owned by Header / page visual / breadcrumb-navigation / content rail / Footer according to the assigned WordPress template.

## Remaining blocker 1 — monthly issue data lifecycle

The current inspected Figma/Theme evidence does not prove whether issue title, order URL, cover, summary, and detail destination are maintained as:

- editor-authored Gutenberg rows,
- an existing/custom repeated block,
- another external/static source,
- or a structured WordPress model not yet present in this Theme snapshot.

Do not infer a CPT or ACF repeater from visual repetition alone. Do not hard-code editorial issue data or short-lived Figma image URLs into Theme PHP.

Smallest authority needed: the canonical WordPress/editor/data source for one real Backnumber issue family, including title, order destination, durable cover ownership, summary, and detail destination.

## Remaining blocker 2 — current SP counterpart

For exact responsive Figma closure, the current file needs either:

1. a dedicated SP Backnumber/Publications full-page authority, or
2. an explicit Human decision that existing shared SP masters define the responsive result for this page family.

Until then, PC can be audited against current Figma, while SP remains fail-closed for pixel-perfect claims.

## Safe next gate

When the data owner is known:

1. Re-read `CURRENT_AUTHORITY.md` and re-scan the current Figma PC/SP pages.
2. Confirm the WordPress/editor source for one real issue row before changing Theme data structures.
3. Compose from the existing global shell and Gutenberg/block masters first.
4. Run real WordPress runtime QA for the page.
5. Compare PC against current `1634:10806`.
6. For SP, use only a newly confirmed current counterpart or an explicit shared-master Human decision; otherwise keep SP parity UNDETERMINED.
7. Add page-scoped CSS or a dedicated issue primitive only where runtime diff proves existing blocks insufficient.
8. Record concrete causes/fixes, then clean Git/PR/CI and squash merge.

## Reusable lessons

- A repeated Figma row is not evidence by itself for a CPT or ACF repeater; prove the production data lifecycle first.
- A page-specific-looking panel may already be composed from Theme Gutenberg primitives; inspect block-level CSS before building a custom component.
- A node ID that existed in an older Figma lineage is not current authority merely because an audit once called it current.
- Current page-level re-scan must win over stale node maps when the Human changes the canonical Figma file.
- Dependency audits are operational inputs. Stale blockers or stale Figma nodes can actively send later agents down the wrong implementation path, so they must be corrected as soon as disproved.

No Theme PHP/CSS/JS, ACF contract, `parts.php`, Form, Formidable, Slider, Search result UI, or Calendar work is changed by this audit refresh.
