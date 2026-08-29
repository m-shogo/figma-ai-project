# Budokan Training Center dependency audit

Status: authority mapping complete; page implementation is intentionally not started from this note.

## Why this audit exists

The remaining Parts items are currently fail-closed: Slider has Figma geometry but no authoritative WordPress/editor contract, `navigation-small` has no matching current Figma specimen, and Local Navigation still lacks a proven SP/WordPress owner mapping. Rather than invent those contracts or follow page order blindly, this audit selects the next safe page family by dependency and verifies whether it can be composed from existing Theme masters.

The Training Center page is the strongest next candidate because most of its visible UI is already owned by shared Header/Footer/Page Title/Gutenberg/Theme primitives. The purpose here is to prove that ownership before adding page-specific code.

## Re-checked authority

- Git base: `so` at `d9107db726a06675c41716d7b2fe51bd4a6f5153`.
- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- PC page: `0:1`.
- SP page: `114:5409`.
- Training Center PC frame: `1137:5348` (Figma layer name is `navigation`, but the page content/hero identifies it as the Training Center screen).
- Training Center SP frame: `560:377` (`training_center_sp`, 375px wide).
- Theme ordinary-page owner: `page.php` → `_visual` → `_dropdown-navigation` → `.block-editor_wrap` → `the_content()` + existing sidebar.
- No dedicated Training Center PHP template is required by the current Theme evidence.
- `patterns.json` establishes Gutenberg/pattern composition as an intended content-authoring path.

## Important discovery: identify pages by content authority, not generic layer names

Two plausible PC frames were inspected first and rejected:

- `1203:4865` is **地域社会武道指導者研修会**.
- `1206:5446` is **武道とは**.

The actual Training Center screen is `1137:5348`, despite its generic/misleading Figma name `navigation`.

Reusable lesson: when top-level Figma names are generic, duplicated, or stale, do not infer page identity from the layer name alone. Confirm with page-title text, body content, breadcrumb, and common-shell context before deriving implementation ownership.

## Master / derivative picture

The page does **not** justify a parallel page-specific component system. It is a composition of shared masters:

- Header → existing global Header master.
- Hero/Page Title → existing page-title visual master.
- Footer → existing global Footer master.
- H2/H3/H4 → existing Gutenberg heading styles.
- Body copy → existing Gutenberg paragraph/text rules.
- Annotation rows → existing shared list/annotation styles.
- Gallery/image geometry → existing Gutenberg gallery/image ownership; do not fork a Training Center gallery without runtime evidence.
- Large outlined links → existing `button_L` / Gutenberg button-link ownership.
- Smaller arrow links → existing button/arrow primitives.
- Pricing sub-sections → heading + annotation + link composition, not a bespoke pricing component from current evidence.
- Training Center page shell/content → ordinary `page.php` + editor content, not a new PHP template.

This keeps the dependency order:

`global shell` → `shared Parts/Gutenberg masters` → `Training Center content composition` → page-specific exception only if visual/runtime diff proves one.

## SP authority (`560:377`)

Observed authored geometry:

- Canvas: 375px.
- Main content rail: approximately 335px (`20px` side insets).
- Major section rhythm: approximately `64px`.
- H2: shared marker + heading treatment, approximately `22px` on SP.
- Main copy: approximately `16px`, line-height `1.8`.
- Facility gallery: 6 images, 2 columns, approximately `160 × 107px`; row rhythm is visibly larger than the column gap; zoom affordance is approximately `24 × 24px`.
- News rows: mobile-stacked date / category / underlined title treatment.
- Guide links: one-column full-width outlined buttons using the existing arrow/button language.

Visible SP composition order in the current frame is not identical to PC. The frame clearly exposes News, facility/about content + gallery, and Guide links. The pricing section visible on PC is not clearly represented in the inspected SP authority. Do **not** invent a mobile pricing placement or hide/show rule until an authoritative SP counterpart or production content requirement proves it.

## PC authority (`1137:5348`)

Observed authored geometry:

- Canvas: 1380px.
- Main authored content specimen: approximately 962px wide.
- Major section rhythm: approximately `80px`.
- H2: 26px Zen Old Mincho Medium.
- Main copy: 17px / 1.6, with 24px paragraph grouping in the facility introduction.
- Facility gallery: 6 images, 3 columns, each approximately `300 × 200px`; 40px row rhythm; zoom affordance approximately `50 × 50px`.
- Pricing: existing H2/H3/H4, annotation and arrow-link vocabulary.
- News: three 960 × 90px rows with 14px date, 80px category label and 16px underlined title.
- Guide links: 3-column grid; 300 × 60px `button_L` instances; 24px row gap; 9 links.

The 962px/300px Figma specimen widths are **context-owned geometry**. They are not permission to hard-code those widths into shared masters if the runtime WordPress content rail is narrower. Shared CSS must remain responsive; runtime container measurements decide whether a page-specific layout exception is needed.

## WordPress ownership decision

`page.php` already renders ordinary pages through `the_content()` inside `.block-editor_wrap`. The current Theme and `patterns.json` support an editor-composed page model. Therefore:

- Do not add `page-training-center.php` from current evidence.
- Do not add a Training Center ACF field group/repeater from current evidence.
- Do not hard-code editorial copy, prices, news items, URLs, or facility images in PHP.
- Do not duplicate already-established Parts masters in page-specific CSS.

The next implementation step should be a **content-composition/runtime pass**, not a new component pass: seed a representative Training Center Gutenberg page from existing blocks only, verify SP and PC runtime geometry, and add the smallest scoped CSS exception only if the diff proves an actual missing rule.

## Current blocker / smallest missing authority

A full page implementation cannot be responsibly merged yet because two content-authority questions are unresolved by the current snapshot:

1. **SP pricing presence/order** — PC clearly contains the pricing section, while the inspected SP frame does not provide equivalent authority.
2. **Production page content ownership** — the repository contains reusable patterns and ordinary `the_content()` routing, but no canonical Training Center page export/seed proving the production block tree and media/news data.

Smallest future authority needed: either the canonical WordPress page/block export for Training Center, or a current Figma/production source that proves the SP pricing placement and intended editor block tree. Until then, visual primitives may be tested independently, but the page must not be hard-coded or structurally guessed.

## Failed approaches and causes

- **Failed:** selecting PC page candidates from plausible-looking generic frame IDs.
  - **Cause:** Figma top-level names are not reliable page identity authority.
  - **Fix:** search by page-title/body text and validate breadcrumb/global-shell context.
- **Rejected:** treating Figma 300px gallery cards / 962px rail as global CSS constants.
  - **Cause:** those values belong to the page specimen context; shared runtime rails may differ.
  - **Fix:** keep shared masters responsive and only scope exact widths after runtime evidence.
- **Rejected:** creating a dedicated Training Center template or ACF model.
  - **Cause:** `page.php` + Gutenberg already owns ordinary content, and no production schema requires a new model.
  - **Fix:** reuse-before-build; prove the block tree/data lifecycle first.

## Safe next gate

1. Obtain/locate canonical Training Center WordPress block content or equivalent current authority.
2. Seed the page using existing masters only.
3. Verify SP first at the runtime viewport and resolve pricing/order authority.
4. Extend/verify PC under `min-width:768px`.
5. Compare the runtime content rail against the Figma specimen before adding scoped layout rules.
6. Record concrete diff causes/fixes; do not promote one page exception into a shared standard without repeated evidence.

No `parts.php`, form/Formidable, ACF field contract, Theme PHP render contract, or production editorial data is changed by this audit.
