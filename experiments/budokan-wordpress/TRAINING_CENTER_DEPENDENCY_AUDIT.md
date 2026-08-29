# Budokan Training Center dependency audit

Status: responsive Figma authority resolved; page implementation remains fail-closed on canonical WordPress block/data ownership.

## Why this audit exists

The remaining Parts items are fail-closed where their contracts are incomplete: Slider has Figma geometry but no authoritative WordPress/editor owner, `navigation-small` has no matching current Parts specimen, and Local Navigation still lacks a proven shared SP/WordPress mapping. Rather than invent those contracts or follow page order blindly, the Training Center page is evaluated as a composition of already-established Theme/Gutenberg masters.

## Re-checked authority

- Git base for this correction: `so` at `55f1faafb934c7a298e70f6e78266019b5cee958`.
- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- PC page: `0:1`.
- SP page: `114:5409`.
- Training Center PC frame: `1137:5348` (`navigation`).
- Training Center current SP counterpart: `1468:6595` (`SP_navigation`, 375px wide).
- Older alternate SP frame: `560:377` (`training_center_sp`, 375px wide); keep as historical/alternate evidence only.
- Theme ordinary-page owner: `page.php` → `_visual` → `_dropdown-navigation` → `.block-editor_wrap` → `the_content()` + existing sidebar.
- No dedicated Training Center PHP template is required by current Theme evidence.
- `patterns.json` establishes Gutenberg/pattern composition as an intended content-authoring path.

## Authority correction: `1468:6595` supersedes `560:377` for responsive implementation

The earlier audit stopped because PC contained an inline pricing section while inspected SP frame `560:377` did not. A full SP-page search by exact PC pricing copy found a second Training Center design, `1468:6595` (`SP_navigation`). This frame is the stronger responsive counterpart to PC `1137:5348` because it contains the same section family and matching pricing content:

1. page title `研修センター`
2. `日本武道館研修センター 施設のご案内`
3. facility introduction copy
4. 6-image facility gallery
5. `料金表(金額は全て税込です)`
6. `宿泊料金`
7. `2026年9月30日まで`
8. `2026年10月1日より料金改定を行います。`
9. `施設使用料`
10. `お知らせ`
11. `ご利用案内`
12. footer / breadcrumb / purpose menu

The old `560:377` frame has a different composition: it omits the inline pricing-detail section and includes older/placeholder notice content such as `2025.00.00` and the prior 令和7 pricing wording. It is therefore not used as the current responsive implementation authority.

Reusable lesson: duplicated responsive frames can coexist in the same Figma page. Do not stop at the first page-title match. When PC/SP structure conflicts, search the whole responsive page using distinctive body copy from the opposite breakpoint, then compare section order, dated copy, shell, and component ancestry before declaring an authority gap.

## Current SP authority (`1468:6595`)

Observed authored geometry and structure:

- Canvas: `375px`.
- Main content frame: `375px` wide; inner authored rail is approximately `327px` with 24px side inset in the principal content stack.
- Major page-section rhythm: `64px`.
- Facility gallery: 6 items in 2 columns.
  - gallery rail: `327px`
  - item frame: approximately `156 × 96px`
  - column/row gap authored by the gallery frame: `15px`
  - zoom affordance frame: approximately `32 × 32px`
- Inline pricing follows the gallery before News.
- `料金表(金額は全て税込です)` appears around the next major section boundary, followed by H3/list/button compositions already represented by existing Parts/Gutenberg vocabulary.
- News uses the mobile post-row treatment.
- Guide links are one-column rows using the existing arrow/navigation language.

The pricing/order blocker from the previous audit is resolved by this frame. Do not reintroduce the old assumption that mobile pricing is absent.

## PC authority (`1137:5348`)

Observed authored geometry:

- Canvas: `1380px`.
- Main content container: `962px`.
- Major section rhythm: `80px`.
- Facility gallery: 6 images, 3 columns.
  - each item: `300 × 200px`
  - authored column/row gap: `40px`
  - zoom affordance: `50 × 50px`
- Inline pricing follows facility content/gallery and precedes News.
- Pricing reuses heading + annotation/list + link/button vocabulary rather than defining a new bespoke pricing component.
- News and Guide link structures remain shared compositions.

The `962px` / `300px` values are context-owned geometry. They are not permission to hard-code those widths into global shared masters if the runtime WordPress content rail is narrower.

## Current production-site evidence and its limit

The current public Training Center page corroborates the editorial subject matter and the Training Center navigation family, including `施設概要`, `ご利用案内`, `施設案内`, `食事`, `料金表`, `武道学園（勝浦分園）`, `アクセス`, and `各種申込書`. It also exposes the current pricing-revision notice and facility introduction content.

However, current production is not treated as the redesign layout/block-tree authority: the public Training Center top page links to `料金表` rather than reproducing the Figma redesign's inline pricing-detail section. Therefore it can corroborate editorial/link authority, but it cannot substitute for the intended new Gutenberg block tree or responsive layout contract.

## Master / derivative picture

The page still does **not** justify a parallel page-specific component system. It is a composition of shared masters:

- Header → existing global Header master.
- Hero/Page Title → existing page-title visual master.
- Footer → existing global Footer master.
- H2/H3/H4 → existing Gutenberg heading styles.
- Body copy → existing Gutenberg paragraph/text rules.
- Annotation rows → existing shared list/annotation styles.
- Gallery/image geometry → existing Gutenberg gallery/image ownership; page evidence alone is not enough to promote a one-pixel SP gap or image-ratio difference into a global standard without runtime evidence.
- Large/small outlined links → existing button-link owners.
- Pricing → heading + annotation/list + button-link composition.
- Training Center shell/content → ordinary `page.php` + editor content, not a new PHP template.

Dependency remains:

`global shell` → `shared Parts/Gutenberg masters` → `Training Center content composition` → page-scoped exception only when visual/runtime diff proves one.

## WordPress ownership decision

`page.php` already renders ordinary pages through `the_content()` inside `.block-editor_wrap`. The current Theme and `patterns.json` support editor-composed pages. Therefore:

- Do not add `page-training-center.php` from current evidence.
- Do not add a Training Center ACF field group/repeater from current evidence.
- Do not hard-code editorial copy, prices, news items, URLs, or facility images in PHP.
- Do not duplicate already-established Parts masters in page-specific CSS.
- Do not change `parts.php` or form/Formidable work for this page.

## Remaining blocker / smallest missing authority

The responsive Figma pricing/order question is resolved. The remaining blocker is narrower:

**Canonical WordPress content ownership** — the repository still has no authoritative Training Center Gutenberg export/seed proving the intended production block tree, media attachment ownership, News data lifecycle, and exact link destinations for the redesigned page.

The current public site is useful editorial evidence, but it is not equivalent to the new redesign's editor block tree because its top page does not contain the same inline pricing composition.

Smallest future authority needed: the canonical WordPress page/block export (or equivalent editor content snapshot) for Training Center. With that, the next pass can seed the page from existing masters, run SP/PC runtime QA, and add only proven scoped exceptions.

## Failed approaches and causes

- **Failed:** selecting PC page candidates from plausible generic frame IDs.
  - **Cause:** Figma top-level names are not reliable page identity authority.
  - **Fix:** validate page-title/body/breadcrumb/global-shell context.
- **Failed:** treating `560:377` as the only Training Center SP authority and concluding pricing had no mobile counterpart.
  - **Cause:** duplicate/alternate SP frames coexist; the search stopped at the first matching page-title frame.
  - **Fix:** search the full SP page using distinctive PC body copy. This found `1468:6595`, which matches the PC pricing structure and current-dated content.
- **Rejected:** treating Figma gallery widths/gaps as global CSS constants without runtime proof.
  - **Cause:** page specimen geometry and shared master geometry can differ by container/context.
  - **Fix:** verify through real WordPress content rail before promoting page evidence to a shared CSS standard.
- **Rejected:** using the current public site as the canonical redesign block tree.
  - **Cause:** production editorial/navigation content aligns, but layout/content composition differs from the redesign (notably inline pricing).
  - **Fix:** use production as corroborating data evidence only; keep new editor-block ownership fail-closed.
- **Rejected:** creating a dedicated Training Center template or ACF model.
  - **Cause:** `page.php` + Gutenberg already owns ordinary content, and no production schema requires a new model.
  - **Fix:** reuse-before-build; prove the block tree/data lifecycle first.

## Safe next gate

1. Obtain/locate the canonical Training Center WordPress Gutenberg content/export.
2. Seed the redesign page using existing masters only, preserving the verified SP/PC section order.
3. Verify SP first against `1468:6595`.
4. Extend/verify PC under `min-width:768px` against `1137:5348`.
5. Compare real runtime rail/gallery/heading/button geometry before adding scoped layout rules.
6. Record concrete diff causes/fixes; only repeated evidence may promote a page exception into a shared standard.
7. Clean Git/PR/CI and squash merge before moving to another page family.

No `parts.php`, form/Formidable, ACF field contract, Theme PHP render contract, or production editorial data is changed by this audit correction.
