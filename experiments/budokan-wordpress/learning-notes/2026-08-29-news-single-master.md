# Budokan News single master — 2026-08-29

## Authority

- Figma SP: `1451:5197` (`SP_post`)
- Figma PC: `1235:6361` (`post`)
- Shared Theme surface: `single.php` + `_visual.php` + `_label-category.php` + `module_titleSingle.css` + Gutenberg content + `module_pager-02`

## Concrete findings

1. The existing WordPress featured-image contract was valid, but its presentation responsibility was wrong: `single.php` rendered the thumbnail *inside* `.module_titleSingle` before the date/category/title. Both Figma authorities place date/category/title in a full-width title band and the lead image after that band. The fix reused the same featured-image data instead of creating another ACF field/component.
2. The shared `_visual.php` correctly owns the archive-family page visual (`お知らせ`) for both archive and single. Its unconditional breadcrumb placement did not match the single-post authority, where the breadcrumb is after the article/pager. Single now defers that shared breadcrumb renderer to the article end; non-single surfaces keep the previous placement.
3. The authored title-band contract differs by breakpoint but not by component identity:
   - SP: 32px vertical padding, 311px inner width at authored 375px, 22px Zen Kaku Gothic New Medium title.
   - PC: 48px vertical padding, 960px inner width at authored 1380px, 32px Zen Old Mincho Bold title.
   - Category label remains the existing `_label-category.php` output and measures 80×23px in runtime.
4. The lead image remains the WordPress featured image. Runtime confirms 335px at the Theme's SP content boundary and 800px on PC; the existing attachment caption supplies the authored caption surface.

## Mistakes / failed approaches and causes

### Wrong taxonomy in the first runtime fixture

The first QA seed treated `_cat` as a literal registered taxonomy. That failed before browser QA. `_label-category.php` shows that `_cat` is a renderer convention for normal posts and intentionally resolves to core `category`. The fixture was corrected to create/assign a normal WordPress category. This was a fixture-contract error, not a Theme error.

### False width failure from viewport-vs-authored-canvas mismatch

The next QA used browser viewport widths 375/1380 directly. This runner reserves 15px for the vertical scrollbar, so the CSS canvas became 360/1365 and a correct full-width section falsely failed. The existing Budokan runtime pattern already solved this by using viewport 390 → authored content 375 and viewport 1395 → authored content 1380. Reusing that contract produced exact full-width runtime geometry.

### Full-bleed compensation was unnecessary after responsibility was fixed

An initial implementation tried `100vw` plus `calc(50% - 50vw)` while the title module still lived inside `.global_inner`. Runtime exposed a -7.5px offset. The correct fix was structural: move the title band outside the constrained content container, then use natural `width:100%`. Do not compensate for a wrong DOM responsibility boundary with viewport math when Figma establishes a full-width sibling section.

## Successful runtime evidence

Real WordPress + ACF PRO + Budokan Theme runtime QA passed for both authored canvases:

- HTTP 200, no page errors, no horizontal overflow.
- SP: title band 375px wide at x=0; inner 311px; 32px vertical padding; title 22px/500; category label 80×23; breadcrumb occurs after article content.
- PC: title band 1380px wide at x=0; inner 960px; 48px vertical padding; title 32px/700; category label 80×23; featured image 800px; breadcrumb occurs after article content.

The QA fixture uses an existing Theme image only to exercise the WordPress featured-image contract; it is not claimed as the production article asset.

## Reusable lesson

When a Figma/WordPress mismatch looks like a spacing or width problem, first verify the **responsibility boundary**: which DOM/module should own the content and whether it belongs inside or outside the shared constrained container. Then verify fixture semantics (taxonomy/route/data contract), and only after that tune CSS geometry. Promote this beyond the Budokan learning notes only after repeated independent evidence.
