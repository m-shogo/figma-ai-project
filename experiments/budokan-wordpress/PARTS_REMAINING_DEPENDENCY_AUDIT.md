# Budokan — Remaining Parts Dependency Audit

Updated: 2026-09-02

This audit re-checks the current Human-selected Figma, tracked `nipponbudokan` Theme, WordPress/ACF ownership, and merged implementation history before selecting more work. It is evidence-only: no missing CMS contract or responsive behavior is invented merely to finish the Parts catalog.

## Current authority

- Canonical Figma file: `fKYDn9ikpJk1nW7IWFtaUx`
- PC page: `0:1`
- SP page: `114:5409`
- Parts PC frame: `1163:4245` (`parts`)
- Parts SP frame: `1399:19144` (`SP_parts`)
- Theme owner: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/`
- Responsive contract: SP base, PC extension from `min-width: 768px`
- `parts.php`: read-only reference; unchanged
- Forms / Formidable: Human-owned; out of scope

The former canonical key `w7SGVY63FuW6JpaQVKjxm2` is historical lineage only. It must not be used to recover missing nodes, geometry, or responsive behavior. `CURRENT_AUTHORITY.md` and a live re-scan of the Human-selected file win over older audit text.

## Re-audited Parts completion

The explicit current SP Parts inventory is:

1. Table
2. Accordion
3. Navigation
4. Button / link
5. Slider
6. Tab

Merged work covers the reusable masters/derivatives represented by Table, Accordion, Navigation large, Button/link families, and Tab. The broader Parts pass also closed the shared heading, gallery/lightbox, separator, list, quote, page-link, columns, background-column, and Media & Text dependencies.

Local Navigation is a page-level/shared-navigation dependency rather than one of the six explicit SP Parts inventory items. Its reusable WordPress renderer/hierarchy and current PC visual authority are separately documented in `LOCAL_NAV_DEPENDENCY_AUDIT.md`. Its dedicated current SP Figma authority is **UNDETERMINED**, so older SP specimen geometry must not be re-promoted as current visual truth.

The only explicit current SP Parts section that still lacks a safe implementation owner is **Slider**.

## Slider — current visual authority exists, WordPress owner does not

The Slider nodes below were live-retrieved again from current Figma `fKYDn9ikpJk1nW7IWFtaUx` on 2026-09-02. This confirms the visual specimen survived the Figma authority change; it does **not** resolve its WordPress/editor ownership.

### Figma SP — current

Representative inner slider: `1399:18943`

Observed current geometry:

- outer: `327 × 255.333`
- media/caption stack gap: `20px`
- media frame: `327 × 191.333`
- image: `287 × 191.333`, inset `20px` each side, exact `3:2`
- caption: `14px / 500 / 160% / 5% tracking`
- previous/next controls: `40 × 40`, red octagonal tile, white arrow

### Figma PC — current

Representative inner slider: `1157:8380`

Observed current geometry:

- outer: `765 × 476`
- media/caption stack gap: `24px`
- media row: previous control + `645 × 430` image + next control
- previous/next controls: `40 × 40`, red octagonal tile, white arrow
- same `14px / 500 / 160% / 5%` caption typography

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

Until then, creating markup/ACF fields/JS initialization would fabricate a CMS contract. Slider therefore remains fail-closed despite current PC/SP visual authority being available.

## Navigation small — legacy contract exists, current Figma authority does not

PR #253 resolved the current Figma Navigation specimen to the existing `acf/navigation-large` → `.module_navigation.--large` master. It deliberately preserved `navigation-small` as a separate legacy square-thumbnail contract.

Current Figma Parts evidence contains only the large-card family:

- SP `1399:18870`: three 327px cards stacked with 24px gaps
- PC `1157:8339`: three 293px cards in a row with 40px gaps

No current Figma Parts specimen is proven for the legacy square-thumbnail `navigation-small` family. Preserve its existing Theme/ACF contract unchanged rather than restyling it from unrelated evidence.

## Local Navigation — structural reuse is closed; current SP visual authority is not

The reusable production chain is already known:

`template-oneColumnLocalNav.php` → `get_sidebar()` → `sidebar.php` → `sidebar-nav` → `Custom_Sidebar_Walker_Nav_Menu` → shared `moduleNavToggle()` + `local_navigation.css`.

Disposable real WordPress proved the hierarchy:

`lnl_item-02` broad family → `lnl_item-03` subgroup → four `lnl_item-04` child links.

Current PC Figma `1216:6311` and runtime evidence support reuse of that chain. However, the old dedicated SP Local Navigation specimen (`560:632` / related `560:*` lineage) is not present as current top-level authority in `fKYDn9ikpJk1nW7IWFtaUx`.

Therefore:

- existing SP runtime behavior may remain as shared Theme behavior
- old SP browser captures remain regression/history evidence only
- do not call the old closed/open presentation current Figma parity
- do not redesign SP Local Navigation until a current dedicated counterpart or explicit Human shared-master authority exists

Remaining Local Navigation production gates:

- real page template assignment
- production `sidebar-nav` tree/menu IDs/URLs
- final fourth destination
- current SP dedicated visual/open-state authority or explicit Human shared-master decision

These gates do not justify another renderer or a page-specific Local Nav CSS fork.

## Reusable lessons from this audit

1. **Library availability is not component ownership.** A globally enqueued Swiper bundle does not justify inventing slider markup or editor data.
2. **Open the current source before classifying a Theme owner.** Component names/styles alone are insufficient; follow template → data owner → emitted runtime classes.
3. **Full-page placement beats visual resemblance for owner mapping.** Local Navigation and dropdown navigation remain separate owners.
4. **Legacy code or an old Figma node is not current visual authority.** `navigation-small` and old `560:*` Local Nav evidence stay untouched without current mapping.
5. **Runtime hierarchy should be executable evidence.** Local Navigation became structurally reusable only after real WordPress proved walker depths/current classes.
6. **Specimen width is not automatically consuming-page width.** Slider dimensions stay contextual until editor ownership and runtime container behavior are known.
7. **Dependency audits are operational inputs.** A stale canonical file key or stale parity claim can cause later agents to implement against superseded evidence, so authority drift must be corrected when discovered.

These findings are already represented by the repository's authority/reuse learning direction; do not create a duplicate portable candidate solely for this audit refresh.

## Safe continuation order

The explicit Parts catalog should not be forced forward while Slider lacks an editor/data owner. Continue with an independent page/component family only when all are available:

1. current SP and PC Figma evidence,
2. identifiable Theme/WordPress owner or Human-authorized new contract,
3. reuse-before-build path,
4. disposable real WordPress runtime path for SP → PC verification where the design authority exists.

Do not invent the Slider contract or a current `navigation-small` design. Local Navigation is structurally implemented; future visual work there waits for production assignment/data or newly confirmed current SP authority.

No Theme PHP/CSS/JS, ACF/CPT model, Form/Formidable, `parts.php`, Search, Calendar, or Slider implementation is changed by this authority refresh.