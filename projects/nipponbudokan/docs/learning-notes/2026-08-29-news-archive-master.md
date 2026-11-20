# News archive master validation — 2026-08-29

## Scope

Validated the existing Budokan News archive as a **shared master** before considering any new TOP-specific implementation.

Current Figma authority re-checked on 2026-08-31:

- SP full page: `1399:14225` (`SP_archive`)
- PC full page: `413:2191` (`news`)
- PC pager: `1137:4996`

Older SP frame `560:2524` (`news_sp`) remains corroborating evidence only. It must not override the current full-page redesign authority.

Theme dependency authority:

- `_news-archive.php` composes `_news-tabs.php` and `_list-news.php`.
- `_list-news_article.php` delegates each row to `_news-item.php`.
- `module_newsList-01.css` owns the archive master.
- `top_news.css` is a derivative layer and should contain only TOP differences.

No duplicate News component is warranted.

## Current responsive contract (2026-08-31)

Fresh `get_design_context` was run against both current full-page frames before editing.

### SP `1399:14225`

The redesign is materially different from the older `560:2524` specimen used by the first runtime QA:

- body/content rail: about **327px** (`x=24` in a 375px canvas)
- category navigation: **3 columns × 2 rows**, contiguous, outer 1px border and shared interior separators
- category cells: about **109×34px**, square corners; no pill treatment
- News row: 327px wide, `20px 16px` padding, 16px row gap, 24px metadata gap
- title: 16px / 1.6
- pager: **single row**, 40px octagonal arrow slots + 50×40 underline page numbers; no circular mobile-number family

### PC `413:2191`

Fresh context also corrected the previous desktop assumption:

- content rail: **960px**
- category navigation: six independent **120×48px** tabs
- gap: **12px**
- each tab owns a 1px border and 3px radius
- pager: centered, 48px gap around the underline-number family and octagonal arrows

The previous #285 implementation had changed PC to six contiguous 160px tabs based on an earlier interpretation. The current full-page frame shows that was no longer canonical.

## Fix applied

`module_newsList-01.css` now follows the current responsive master instead of preserving stale SP/PC variants:

- SP archive rail narrowed from inherited 335px to the authored 327px without changing the global SP padding token;
- SP tabs changed from 90×32 pills with 20px gaps to the current contiguous 3×2 grid;
- SP News rows aligned to current padding/gap/line-height;
- SP pager changed from the old two-row/circular family to the current one-row/octagon + underline family;
- at `min-width:768px`, tabs return to the current six 120×48 cards with 12px gaps;
- PC 960px rail, row rendering and current pager family stay shared.

`_news-tabs.php`, `_news-item.php`, taxonomy lookup, archive route, TOP derivative and ACF contracts remain unchanged.

The browser QA was updated to assert the current full-page responsive geometry rather than the superseded stored node assumptions.

## Failed approaches and causes

### 1. Looking up category terms by Japanese display name

The first QA fixture used `wp term get category <display-name>` as if the display name were an unambiguous identifier. The disposable runtime rejected the lookup.

**Fix:** capture the term IDs returned by `wp term create` and use those IDs in later fixture commands.

### 2. Capturing the site root for an archive test

The fixture changed `show_on_front` and then opened `/`, but WordPress template hierarchy selected the Theme front-page surface, so `.news_archive` correctly did not exist.

**Fix:** create an explicit static front page and a real Posts page, set `page_for_posts`, and test the authored `/news/` route.

### 3. Adding a category without replacing `Uncategorized`

Using `wp post term add` left the default category attached. The shared News item correctly rendered the first category, which became `Uncategorized`.

**Fix:** use `wp post term set ... --by=id` so the fixture reflects the intended single-category contract.

### 4. Treating stored Figma evidence as permanent authority

This happened twice in the same family:

- an older SP `news_sp` frame led runtime QA to preserve 90×32 pill tabs and a two-row circular pager;
- a previous PC interpretation led #285 to promote 160px contiguous desktop tabs.

Fresh full-page `get_design_context` on current `1399:14225` and `413:2191` disproved both assumptions.

**Cause:** the implementation revalidated only the surface thought to have changed and preserved the opposite breakpoint from stored notes. That violates the requested SP → PC verification loop when the design file itself is actively changing.

**Fix:** when a shared responsive component is touched, re-fetch **both current full-page counterparts in the same run**, even if the planned code change initially appears breakpoint-specific. Stored geometry may guide discovery but must not be used as the final visual authority.

### 5. Letting the disposable WordPress install inherit unrelated defaults

The fixture implicitly relied on WordPress defaults for permalink routing and `posts_per_page`.

**Fix:** make the Posts page assignment, pretty-permalink structure and `posts_per_page=20` explicit as QA-environment inputs only.

### 6. Counting a shared master row by an exact class string

The CI fixture counted `class="news_item"`, but the renderer intentionally emits multiple classes.

**Fix:** assert the stable class prefix instead of simplifying the renderer contract in the test.

## Reusable lesson

Before changing a shared responsive master:

1. confirm the current Figma file authority;
2. resolve and fetch the current SP **and** PC full-page counterparts in the same run;
3. verify the WordPress route/fixture/data contract;
4. map the measured DOM to the same Figma boundary;
5. only then edit shared CSS and update runtime/browser assertions.

The “stored evidence is not current authority” failure is now repeated within the News family and also matches the project’s separate file-key reconciliation incident. It is strong enough to use as a Budokan project-local operating rule, but not as a repository-wide standard for unrelated projects.
