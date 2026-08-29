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

## Local Navigation — PC authority exists; SP behavior and render-owner mapping remain incomplete

The PC Figma contains a distinct `local_nav` Parts section (`1168:4574`):

- full section `1380 × 276`
- section padding `56px 110px`
- title/list gap `48px`
- title: 26px arrow rail + `20px / 500` text
- list: four columns × two rows
- each item `257 × 34`
- 5px gold dot, 12px item gap, `14px / 400` copy, light-gray bottom rule

The same `nav_local` primitive also appears in multiple real PC page instances.

A fresh read-only scan of the canonical SP page (`114:5409`) still found no Local Navigation component/frame by local/navigation naming and no `ローカルナビゲーション` text specimen, so the intended SP behavior remains unresolved. This absence is evidence that no SP visual authority is currently available; it is **not** permission to infer `display:none` or invent a mobile layout.

### Theme-owner correction

The earlier version of this audit incorrectly described `css/module/local_navigation.css` as an absolute dropdown/floating panel. Re-reading the current tracked source shows that description was wrong. The file is a minimal shared Local Navigation stylesheet whose only authored layout rule is:

```css
.local_navigation {
    .ln_links {
        & + .ln_links {
            margin-top: 48px;
        }
    }
}
```

It also contains an empty `min-width: 768px` media block and empty hover block. The `48px` rhythm is compatible with the Figma PC specimen's authored 48px separation, so this stylesheet is now a plausible shared Theme owner and should no longer be dismissed as unrelated legacy UI.

That source-level match still does **not** establish the missing PHP/WordPress markup contract for `.local_navigation` / `.ln_links`, nor does it establish SP behavior. Because the project execution contract requires SP authority first, rewriting or completing this family from PC-only geometry is still unsafe.

### Smallest missing authority

- canonical SP behavior/design, or explicit authority that this local-navigation family is intentionally absent on SP; and
- the WordPress/PHP render markup that owns `.local_navigation` and `.ln_links`, so the Figma `local_nav` component can be mapped to an actual runtime contract before CSS is extended.

## Reusable lessons from this audit

1. **Library availability is not component ownership.** A globally enqueued Swiper bundle does not justify inventing slider markup or editor data.
2. **Open the current source before classifying a Theme owner.** The first Local Navigation audit inferred behavior that was not present in `local_navigation.css`; owner classification must be based on the tracked source plus runtime/render mapping, not filename/context assumptions.
3. **Legacy code is not current visual authority.** `navigation-small` remains untouched when the canonical Figma family cannot be mapped confidently; Local Navigation likewise remains untouched until its SP and render contracts are proven.
4. **Responsive authority must be complete enough for the project execution order.** A PC-only specimen cannot be promoted into a shared responsive master while SP behavior is unknown.
5. **Specimen width is not automatically consuming-page width.** Slider image/outer dimensions should stay contextual until real WordPress ownership and container behavior are known.

These are project-local findings from the current dependency audit. They are not promoted to a higher frontend standard from this single evidence point.

## Safe continuation order

Do not stay stuck on Slider, navigation-small, or Local Navigation. While those authority gaps remain, continue with another independent page/component family only when all of the following are available:

1. canonical SP and PC Figma evidence,
2. an identifiable Theme/WordPress owner or a Human-authorized new contract,
3. a reuse-before-build path,
4. a disposable real WordPress + ACF runtime path for SP → PC verification.

The next implementation should therefore be selected from the remaining page families by master/derivative dependency, not by the visual order of the Parts or TOP pages.
