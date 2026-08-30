# Budokan — Remaining Parts Dependency Audit

Date: 2026-08-30

This audit re-checks the current canonical Figma, tracked `nipponbudokan` Theme, WordPress/ACF ownership, and merged implementation history before selecting more work. It is evidence-only: no missing CMS contract or responsive behavior is invented merely to finish the Parts catalog.

## Current authority

- Canonical Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- PC page: `0:1`
- SP page: `114:5409`
- Theme owner: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/`
- Responsive contract: SP base, PC extension from `min-width: 768px`
- `parts.php`: read-only reference; unchanged
- Forms / Formidable: Human-owned; out of scope

## Re-audited Parts completion

The explicit current SP Parts inventory is:

1. Table
2. Accordion
3. Navigation
4. Button / link
5. Slider
6. Tab

Merged work covers the reusable masters/derivatives represented by Table, Accordion, Navigation large, Button/link families, and Tab. The broader Parts pass also closed the shared heading, gallery/lightbox, separator, list, quote, page-link, columns, background-column, and Media & Text dependencies.

Local Navigation was a page-level/shared-navigation dependency rather than one of the six explicit SP Parts inventory items. Its SP closed-state + PC structural/runtime/browser implementation is now separately closed against the disposable WordPress fixture; see `LOCAL_NAV_DEPENDENCY_AUDIT.md` and `LOCAL_NAV_VISUAL_IMPLEMENTATION_2026-08-30.md`.

The only explicit current SP Parts section that still lacks a safe implementation owner is **Slider**.

## Slider — visual authority exists, WordPress owner does not

### Figma SP

Representative inner slider: `1399:18943`

Observed geometry:

- outer: `327 × 255.333`
- media/caption stack gap: `20px`
- media frame: `327 × 191.333`
- image: `287 × 191.333`, inset `20px` each side, exact `3:2`
- caption: `14px / 500 / 160% / 5% tracking`
- previous/next controls: `40 × 40`, red tile, white arrow
- section heading → slider gap: `28px`

### Figma PC

Representative inner slider: `1157:8380`

Observed geometry:

- outer: `765 × 476`, centered in the 960px Parts specimen
- media/caption stack gap: `24px`
- media frame: `765 × 430`
- image: `645 × 430`, inset `60px` each side, exact `3:2`
- same caption typography
- previous/next controls: `40 × 40`
- section heading → slider gap: `32px`

The specimen widths are context-owned geometry, not permission to hard-code them as global Theme dimensions.

### Theme / WordPress dependency check

The Theme already loads Swiper globally through `inc/front.php`, including Swiper JS/CSS. This proves **library availability only**; it does not establish the editor/component owner for the Parts Slider.

No authoritative reusable Slider owner is currently proven in:

- current ACF block renderers
- current module CSS inventory
- native Gutenberg gallery ownership
- `common.js`
- `home.js`
- reusable `Swiper(...)` / `swiper-container` / `swiper-slide` component contracts

The existing native Gutenberg gallery is a static gallery master and must not be silently converted into a slider merely because Swiper is available.

### Smallest missing authority

Before implementation, one of these must become explicit:

- intended existing WordPress block/markup/class that owns Parts Slider, or
- confirmation that a new editor-facing block/component is desired, together with its minimum content/editing contract such as images, captions, ordering, links, and cardinality.

Until then, creating markup/ACF fields/JS initialization would fabricate a CMS contract.

## Navigation small — legacy contract exists, current Figma authority does not

PR #253 resolved the current Figma Navigation specimen to the existing `acf/navigation-large` → `.module_navigation.--large` master. It deliberately preserved `navigation-small` as a separate legacy square-thumbnail contract.

Current Figma Parts evidence contains only the large-card family:

- SP `1399:18870`: three 327px cards stacked with 24px gaps
- PC `1157:8339`: three 293px cards in a row with 40px gaps

No current Figma Parts specimen is proven for the legacy square-thumbnail `navigation-small` family. Preserve its existing Theme/ACF contract unchanged rather than restyling it from unrelated evidence.

## Local Navigation — no longer a remaining structural implementation gate

The previous version of this audit still described the runtime hierarchy as missing. That is stale after the merged Local Navigation fixture/CSS/browser work.

Current proven reuse chain:

`template-oneColumnLocalNav.php` → `get_sidebar()` → `sidebar.php` → `sidebar-nav` → `Custom_Sidebar_Walker_Nav_Menu` → shared `moduleNavToggle()` + `local_navigation.css`.

Disposable real WordPress proved:

`lnl_item-02` broad family → `lnl_item-03` subgroup → four `lnl_item-04` child links.

Hosted Chromium then passed the currently authored responsive states:

- SP 375px closed state: broad-family heading, 50px selector, collapsed wrapper, authored gray background.
- PC 1380px: depth-03 subgroup heading, four depth-04 columns, WordPress current state on Regional Training.

Therefore Local Navigation does not belong in the “waiting for a runtime hierarchy fixture” queue anymore.

Remaining Local Navigation authority is production-only:

- real page template assignment
- production `sidebar-nav` tree/menu IDs/URLs
- final fourth destination
- unauthored SP open-state visual/content behavior

Those gates prevent claiming **production data/visual PASS**, but they do not invalidate the structural implementation or justify another renderer.

## Reusable lessons from this audit

1. **Library availability is not component ownership.** A globally enqueued Swiper bundle does not justify inventing slider markup or editor data.
2. **Open the current source before classifying a Theme owner.** Component names/styles alone are insufficient; follow template → data owner → emitted runtime classes.
3. **Full-page placement beats visual resemblance for owner mapping.** The SP Local Navigation looks selector-like but is not the before-content `dropdown-nav` renderer.
4. **Legacy code is not current visual authority.** `navigation-small` remains untouched without canonical Figma mapping.
5. **Runtime hierarchy should be executable evidence.** Local Navigation moved from ambiguity to safe structural CSS only after real WordPress proved walker depths/current classes.
6. **Specimen width is not automatically consuming-page width.** Slider dimensions stay contextual until editor ownership and runtime container behavior are known.
7. **Harness fidelity belongs in the harness.** Missing environment/plugin dependencies found by Local Navigation QA were repaired without weakening production Theme contracts.

These remain project-local findings. Do not promote them automatically to higher frontend policy from one family.

## Safe continuation order

The explicit Parts catalog should not be forced forward while Slider lacks an editor/data owner. Continue with an independent page/component family only when all are available:

1. canonical SP and PC Figma evidence,
2. identifiable Theme/WordPress owner or Human-authorized new contract,
3. reuse-before-build path,
4. disposable real WordPress runtime path for SP → PC verification.

Do not spend time trying to invent the Slider contract or a current `navigation-small` design. Local Navigation is structurally implemented; future work there should wait for production assignment/data or a newly authored SP open state.
