# Budokan backnumber dependency audit

Status: current PC Figma authority is available; production-safe Backnumber implementation remains fail-closed on page-template ownership, canonical monthly issue data ownership, and a current dedicated SP counterpart.

Updated: 2026-09-06

## Current-state correction

The current implementation authority is the Human-selected Figma file `jqYoPtusYfTeDqRegMCsx3`, as defined by `CURRENT_AUTHORITY.md`. Older file keys including `FKQaJDu5TZXHoCzPsfP92E`, `fKYDn9ikpJk1nW7IWFtaUx`, `w7SGVY63FuW6JpaQVKjxm2`, and `RfAQQ28V1HGaeIcpgRmQq1` are historical lineage only and must not be used as current implementation authority.

A live re-scan confirms:

- current PC frame: `1634:10806` (`publications`, 1380 × 6307)
- current SP page: `114:5409`
- the old `560:677` (`backnumber_sp`) node does **not** resolve as current authority
- no dedicated Backnumber / Publications SP full-page frame is present among the current SP page top-level frames

The current map resolves `1634:10806` as the Publications PC full-page authority. Its current main container is `1687:6221`: x=170, width=1040, vertical layout, padding-top 64, padding-bottom 100. The previously recorded 6488px height and older main-container node references are stale and must not be used as current visual-QA targets.

Therefore, any older note that calls `560:677` the current SP authority is stale. It may describe historical design evidence, but it must not be used for implementation or pixel-parity claims.

The earlier TOP lower-banner blocker is also already resolved by PR #260. It is not an upstream dependency for Backnumber.

## 2026-09-06 page-shell ownership correction

Current DIRECTORY_MAP runtime ownership and LIVE Figma now expose a concrete conflict that must stay fail-closed instead of being papered over by a visual guess.

`seed-budokan-stub-pages-and-menus.php` classifies `publications/budo/back` as `kind=page`. Its upsert contract assigns `kind=page` to the default WordPress template (`_wp_page_template` is an empty string), so the current disposable runtime resolves the Backnumber page through `page.php`.

Current Theme `page.php` renders `.global_inner._column` with both `.gc_main` and `.gc_sub` sidebar. LIVE Figma `1634:10806`, however, shows a one-column 1040px main container (`1687:6221`) with no sidebar surface and 64px/100px top/bottom padding.

Existing `templates/template-oneColumnWide.php` is structurally closer to the 1040px one-column Figma shell, but that resemblance is **not** WordPress ownership authority. Do not reassign the page template from Figma appearance alone.

Accordingly:

- default `page.php` is the current disposable-runtime assignment
- current Figma proves that this default two-column shell is not a visual match for the Backnumber page shell
- `template-oneColumnWide.php` is a reuse candidate, not an authorized owner
- page-template ownership is `UNRESOLVED` until canonical WordPress/Human ownership confirms the intended assignment
- no route-specific template override or CSS compensation should be introduced to hide this ownership conflict

## Current authority

- Figma file: `jqYoPtusYfTeDqRegMCsx3`.
- Current PC full-page authority: `1634:10806` (`publications`).
- Current SP page: `114:5409`; dedicated Backnumber counterpart: **UNDETERMINED / absent from current top-level frames**.
- Current disposable DIRECTORY_MAP runtime assigns `publications/budo/back` to default `page.php`.
- Current Figma page shell is one-column 1040px with no sidebar, so the intended production template owner is **UNDETERMINED**.
- No current evidence authorizes a dedicated Backnumber PHP template, route-specific override, CPT, or new ACF field group.
- Existing Theme Gutenberg/block styles remain the first reuse candidates after page-shell ownership is resolved.

## Current PC composition evidence

The current PC `publications` frame is still a composition of shared masters rather than evidence for a new page-specific data system:

- gold page title
- body texture
- shared heading hierarchy
- standard buttons / PDF-style actions
- details/help panel
- ordered and unordered lists
- repeated issue row: issue title + order action + cover + summary (+ detail affordance where authored)
- breadcrumb / global footer

Observed current PC geometry includes:

- one-column content body: 1040px
- main top / bottom padding: 64px / 100px
- issue header: 60px
- cover: 160 × 226
- image/text gap: 40px
- issue item stack gap: 24px
- issue-to-issue gap: about 56px

Do not convert these visual repetitions into a CPT or ACF repeater without proving the real editorial data lifecycle.

## Shared list master vs Publications contextual variant

A 2026-09-02 live Figma re-check exposed an important component-family distinction that had been collapsed by PR #342:

- shared SP list master `1399:18770` uses **17px / line-height 1.6** body text and **bare numeric markers** (`1`, `10`) at 16px
- shared unordered master remains 17px / 1.6 (`1399:18762`, PC `1157:8221`)
- Publications PC `1767:9543` is a **contextual variant**: 16px / line-height 1.5 body and punctuation markers (`1.`, `2.` ...)

PR #342 had promoted the Publications punctuation into the global `ol.wp-block-list` rule. That made one page sample closer while silently moving the shared SP master away from its current Figma authority. The shared list CSS is now restored to the shared master.

Do **not** reintroduce the Publications `1.` / 16px treatment globally. The remaining Publications-specific list styling is fail-closed until its real WordPress markup/data owner is known. If the page eventually needs a contextual modifier or a block-style variant, add it at the smallest proven semantic owner rather than changing the generic list master.

This is also a QA rule: when a page contains a visually different instance of a shared family, compare that instance against the canonical shared master before editing the shared owner.

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
- numbered instructions → existing `ol.wp-block-list` family, but Publications PC styling is a contextual variant and must not redefine the global master
- red caution rows → existing `ul.annotation-list`
- section heading → existing heading block styles

These are primitive-level reuse decisions only. The page shell itself is not currently closed because the runtime default-template assignment and the one-column Figma shell disagree.

## Remaining blocker 1 — page template ownership

Smallest authority needed: the canonical WordPress/Human assignment for `/publications/budo/back/`.

The current disposable DIRECTORY_MAP runtime says default `page.php`; the current Figma says 1040px one-column/no-sidebar. Until the intended production assignment is confirmed, do not:

- switch the page to `template-oneColumnWide.php` merely because its geometry looks closer
- add pathname conditionals to `page.php`
- hide `.gc_sub` only for this route
- add arbitrary width/padding compensation to make the default shell resemble Figma

## Remaining blocker 2 — monthly issue data lifecycle

The current inspected Figma/Theme evidence does not prove whether issue title, order URL, cover, summary, and detail destination are maintained as:

- editor-authored Gutenberg rows,
- an existing/custom repeated block,
- another external/static source,
- or a structured WordPress model not yet present in this Theme snapshot.

Do not infer a CPT or ACF repeater from visual repetition alone. Do not hard-code editorial issue data or short-lived Figma image URLs into Theme PHP.

Smallest authority needed: the canonical WordPress/editor/data source for one real Backnumber issue family, including title, order destination, durable cover ownership, summary, and detail destination.

## Remaining blocker 3 — current SP counterpart

For exact responsive Figma closure, the current file needs either:

1. a dedicated SP Backnumber/Publications full-page authority, or
2. an explicit Human decision that existing shared SP masters define the responsive result for this page family.

Until then, PC can be audited against current Figma, while SP remains fail-closed for pixel-perfect claims.

## Safe next gate

When page-template and data ownership are known:

1. Re-read `CURRENT_AUTHORITY.md` and re-scan the current Figma PC/SP pages.
2. Confirm the canonical WordPress page-template assignment before changing the page shell.
3. Confirm the WordPress/editor source for one real issue row before changing Theme data structures.
4. Compose from the existing global shell candidate and Gutenberg/block masters first.
5. Run real WordPress runtime QA for the page.
6. Compare PC against current `1634:10806` / main `1687:6221`.
7. For SP, use only a newly confirmed current counterpart or an explicit shared-master Human decision; otherwise keep SP parity UNDETERMINED.
8. Add page-scoped CSS or a dedicated issue primitive only where runtime diff proves existing blocks insufficient.
9. Record concrete causes/fixes, then clean Git/PR/CI and squash merge.

## Reusable lessons

- A repeated Figma row is not evidence by itself for a CPT or ACF repeater; prove the production data lifecycle first.
- A page-specific-looking panel may already be composed from Theme Gutenberg primitives; inspect block-level CSS before building a custom component.
- A node ID that existed in an older Figma lineage is not current authority merely because an audit once called it current.
- Current page-level re-scan must win over stale node maps when the Human changes the canonical Figma file.
- A contextual instance must not redefine a shared component master merely because it was the latest instance inspected; inspect the shared family across PC/SP before changing a global selector.
- A fixture/runtime template assignment and a Figma visual shell are different authority dimensions. When they disagree, record the ownership conflict instead of choosing whichever implementation is visually convenient.
- Dependency audits are operational inputs. Stale blockers, stale Figma nodes, stale geometry, or an unproven page-shell owner can actively send later agents down the wrong implementation/QA path, so they must be corrected as soon as current authority disproves them.

No new Theme PHP/JS, ACF contract, `parts.php`, Form, Formidable, Slider, Search result UI, or Calendar work is introduced by this audit correction.
