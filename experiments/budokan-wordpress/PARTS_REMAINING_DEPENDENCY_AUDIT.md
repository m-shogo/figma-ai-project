# Budokan — Remaining Parts Dependency Audit

Date: 2026-08-30

This audit re-checks the current canonical Figma, tracked `nipponbudokan` Theme, WordPress/ACF ownership, and merged implementation history before selecting more work. It is intentionally evidence-only: no missing CMS contract or responsive behavior is invented merely to finish the Parts catalog.

## Current authority

- Canonical Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- PC page: `0:1`
- SP page: `114:5409`
- Theme owner: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/`
- Responsive contract: SP base, PC extension from `min-width: 768px`
- `parts.php`: read-only reference; unchanged by this audit
- Forms / Formidable: Human-owned; out of scope

## Re-audited Parts completion

The explicit current SP Parts inventory is:

1. Table
2. Accordion
3. Navigation
4. Button / link
5. Slider
6. Tab

Merged work already covers the reusable masters/derivatives represented by Table, Accordion, Navigation large, Button/link families, and Tab. The broader Parts pass also already closed the shared heading, gallery/lightbox, separator, list, quote, page-link, columns, background-column, and Media & Text dependencies.

The only explicit current SP Parts section that still lacks a safe implementation owner is **Slider**.

## Slider — visual authority exists, WordPress owner does not

### Figma SP

Representative inner slider: `1399:18943`

Observed geometry:

- outer: `327 × 255.333`
- media/caption stack gap: `20px`
- media frame: `327 × 191.333`
- image: `287 × 191.333`, inset `20px` on each side, exact `3:2`
- caption: starts after the 20px gap; `14px / 500 / 160% / 5% tracking`
- previous/next controls: `40 × 40`, red tile, white arrow
- section heading → slider gap: `28px`

### Figma PC

Representative inner slider: `1157:8380`

Observed geometry:

- outer: `765 × 476`, centered in the 960px Parts specimen
- media/caption stack gap: `24px`
- media frame: `765 × 430`
- image: `645 × 430`, inset `60px` on each side, exact `3:2`
- same caption typography
- previous/next controls: `40 × 40`
- section heading → slider gap: `32px`

The 287px / 645px image widths and 327px / 765px outer widths are specimen geometry, not yet justified as global fixed Theme dimensions.

### Theme / WordPress dependency check

The Theme already loads Swiper globally through `inc/front.php`, including the Swiper JS and CSS bundle. That proves library availability only; it does **not** establish the Parts Slider component contract.

The audit did not find an authoritative reusable Slider owner in:

- current ACF block renderers
- current module CSS inventory
- native Gutenberg gallery ownership
- `common.js`
- `home.js`
- searches for reusable `Swiper(...)`, `swiper-container`, `swiper-slide`, or a dedicated slider module

The existing native Gutenberg gallery is a static gallery master and must not be silently converted into a slider merely because Swiper is available.

### Smallest missing authority

Before implementation, one of these must become explicit:

- the intended existing WordPress block/markup/class that owns the Parts Slider, **or**
- confirmation that a new editor-facing block/component is desired, together with its minimum content/editing contract (for example images, captions, ordering, link behavior, and item cardinality).

Until then, creating markup/ACF fields/JS initialization would fabricate a CMS contract.

## Navigation small — legacy contract exists, current Figma authority does not

PR #253 resolved the current Figma Navigation specimen to the existing `acf/navigation-large` → `.module_navigation.--large` master. It deliberately preserved `navigation-small` as a separate legacy square-thumbnail contract.

A fresh re-inspection of the complete current SP and PC Navigation Parts sections found only the large-card family:

- SP `1399:18870`: three 327px cards stacked with 24px gaps
- PC `1157:8339`: three 293px cards in a row with 40px gaps

No current Figma Parts specimen was found for the legacy square-thumbnail `navigation-small` family. Therefore its existing Theme/ACF contract is preserved unchanged rather than being restyled from unrelated evidence.

## Local Navigation — responsive Figma + WordPress owner now resolved; runtime hierarchy remains

A later full-page/render-path re-audit resolved the owner ambiguity that this document previously carried. See `LOCAL_NAV_DEPENDENCY_AUDIT.md` for the complete evidence.

### PC authority

The PC Figma contains a distinct `local_nav` (`1216:6311`) on the real Regional Training page:

- full section `1380 × 222`
- after the 960px body content and before breadcrumb/footer
- section padding `56px 110px`
- title/list gap `48px`
- title: 26px arrow rail + `20px / 500` text
- list: four columns
- each item uses a 5px gold dot, 12px item gap, `14px` copy and bottom rule
- current item uses a gold bottom rule / medium copy

### SP authority

The same Regional Training page (`560:537`) contains its responsive Local Navigation counterpart at `560:632`:

- full-width `375 × 176`
- after body content and immediately before `footer_sp`
- light-gray background, `40px 20px` padding
- title `武道 振興・普及事業`
- `335 × 50px` selector-style control
- placeholder `選択してください`
- dark `50 × 50px` right control with white down-chevron

This placement matters: the selector-style appearance does **not** make `_dropdown-navigation.php` the owner. `_dropdown-navigation.php` renders before content, while this Figma counterpart is after content.

### Proven Theme / WordPress owner

The render path is:

`page.php` → `get_sidebar()` → `sidebar.php` → `sidebar-nav` → `Custom_Sidebar_Walker_Nav_Menu`.

`sidebar.php` explicitly owns `.local_navigation` and `.ln_links`. The walker emits both `lnl_*` and `mm_*` classes, so existing `module_menu.css` and `common.js` `moduleNavToggle()` are the reuse-before-build interaction baseline.

`css/module/local_navigation.css` remains the correct component-specific CSS extension point.

### Remaining implementation gate

The repository does not contain an authoritative seeded `sidebar-nav` menu hierarchy. Figma exposes different hierarchy levels between SP and PC (`武道 振興・普及事業` vs `指導者研修・指導法研究` + four child pages), so CSS must not guess which `lnl_*` depth owns each label.

Smallest missing runtime authority:

- a disposable WordPress `sidebar-nav` fixture matching intended production hierarchy, or Human confirmation of that hierarchy.

Once present, Local Navigation can proceed through SP CSS/runtime QA → PC extension/runtime QA → visual diff/fixes without inventing a new renderer or data contract.

## Reusable lessons from this audit

1. **Library availability is not component ownership.** A globally enqueued Swiper bundle does not justify inventing slider markup or editor data.
2. **Open the current source before classifying a Theme owner.** `local_navigation.css` alone was insufficient; the decisive proof came from `page.php` → `get_sidebar()` → `sidebar.php` plus the walker.
3. **Full-page placement beats visual resemblance for owner mapping.** The SP Local Navigation looks selector-like, but its after-content placement proves it is not automatically the before-content `dropdown-nav` renderer.
4. **Legacy code is not current visual authority.** `navigation-small` remains untouched when the canonical Figma family cannot be mapped confidently.
5. **Responsive authority includes hierarchy/data shape.** SP/PC visuals and PHP owner can be known while implementation still correctly waits for the actual menu hierarchy used at runtime.
6. **Specimen width is not automatically consuming-page width.** Slider image/outer dimensions should stay contextual until real WordPress ownership and container behavior are known.

These are project-local findings from the current dependency audit. They are not promoted to a higher frontend standard from this evidence alone.

## Safe continuation order

Do not stay stuck on Slider, navigation-small, or the Local Navigation menu hierarchy. While those authority gaps remain, continue with another independent page/component family only when all of the following are available:

1. canonical SP and PC Figma evidence,
2. an identifiable Theme/WordPress owner or a Human-authorized new contract,
3. a reuse-before-build path,
4. a disposable real WordPress + ACF runtime path for SP → PC verification.

For Local Navigation specifically, once a disposable `sidebar-nav` hierarchy can be seeded from verified authority, its owner/render dependency no longer blocks implementation.
