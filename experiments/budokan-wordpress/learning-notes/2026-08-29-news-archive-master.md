# News archive master validation — 2026-08-29

## Scope

Validated the existing Budokan News archive as a **shared master** before considering any new TOP-specific implementation.

Current Figma authority re-checked on 2026-08-31:

- SP full page: `560:2524` (`news_sp`, 375×2276)
- PC full page: `413:2191` (`news`, 1380×3096)
- PC pager: `1137:4996`

The older sublayer anchors `560:4185`, `560:4260`, and `1669:5733` are no longer resolvable in the current file and must not be treated as current authority.

Theme dependency authority:

- `_news-archive.php` composes `_news-tabs.php` and `_list-news.php`.
- `_list-news_article.php` delegates each row to `_news-item.php`.
- `module_newsList-01.css` owns the archive master.
- `top_news.css` is a derivative layer and should contain only TOP differences.

No duplicate News component is warranted.

## Runtime result

A disposable real WordPress runtime was populated with 25 Posts and the five authored category families, then checked at the authored SP/PC widths.

The original 2026-08-29 assertions passed for both SP and PC except that the PC category-tab assertion was based on stale Figma sublayer evidence. The current Figma full-page authority was re-read on 2026-08-31 and supersedes that specific assertion.

Stable assertions:

- HTTP 200 and no page errors.
- No horizontal overflow.
- 20 visible archive rows per page.
- Six category tabs with `すべて` active.
- SP: 335px content, 90×32 tabs with 20px gaps, stacked article layout, 80px category labels, 40px circular page numbers, two-row mobile pager family.
- PC: 960px content, horizontal article rows, 80px category labels, 50×40 underline page numbers, one-row pager with octagonal arrows.

### 2026-08-31 PC tab correction

Fresh `get_design_context` against current PC frame `413:2191` shows the category navigation is a **contiguous 960px rail** made from six **160×48px** tabs. The first and last tabs carry the outer 3px corner radii; interior tabs share borders with no gaps.

The Theme still had the previous runtime assumption of six 120×48px tabs separated by 12px gaps. That produced only 780px of occupied tab geometry inside the 960px archive rail and was a real visual mismatch, not a data/fixture issue.

Fix:

- preserve the existing SP 90×32 / 20px-gap implementation unchanged;
- under `min-width:768px`, change archive tabs to 160×48px, `gap:0`;
- remove duplicate interior left borders and keep only the outer corner radii;
- keep `_news-tabs.php`, taxonomy lookup, archive route, TOP derivative and ACF contracts unchanged.

## Failed approaches and causes

### 1. Looking up category terms by Japanese display name

The first QA fixture used `wp term get category <display-name>` as if the display name were an unambiguous identifier. The disposable runtime rejected the lookup.

**Fix:** capture the term IDs returned by `wp term create` and use those IDs in later fixture commands.

### 2. Capturing the site root for an archive test

The second fixture changed `show_on_front` and then opened `/`, but WordPress template hierarchy still selected the Theme front-page surface, so `.news_archive` correctly did not exist.

**Fix:** create an explicit static front page and a real Posts page, set `page_for_posts`, and test the authored `/news/` route.

### 3. Adding a category without replacing `Uncategorized`

Using `wp post term add` left the default category attached. The shared News item correctly rendered the first category, which became `Uncategorized`, producing a false visual mismatch and a taller label.

**Fix:** use `wp post term set ... --by=id` so the fixture reflects the intended single-category production contract.

### 4. Treating stored Figma sublayer IDs as permanent authority

The 2026-08-29 note recorded sublayer IDs that later disappeared while the current full-page frames remained available. Reusing the old `1669:5733` result led to a false belief that the 120px desktop tabs were still canonical.

**Fix:** begin each new implementation run by resolving the current top-level page/frame (`114:5409 → 560:2524` for SP and `0:1 → 413:2191` for PC), then call `get_design_context` on the current full-page frame before trusting older sublayer notes.

### 5. Letting the disposable WordPress install inherit unrelated defaults

The first CI version of the new runtime fixture implicitly relied on WordPress defaults for both permalink routing and `posts_per_page`. That is not a faithful representation of the authored News surface: the design/master expects `/news/` and 20 rows on page one.

**Fix:** make those fixture inputs explicit with the Posts page assignment, pretty-permalink structure and `posts_per_page=20`. These are QA-environment inputs only; they do not alter Theme/CMS production contracts.

### 6. Counting a shared master row by an exact class string

The CI fixture initially counted `class="news_item"`, but the shared renderer intentionally emits multiple classes: `news_item news_item_archive mnl-01_article`. Under `set -euo pipefail`, the no-match `grep` exited before a useful assertion message was printed.

**Fix:** assert the stable class prefix `class="news_item news_item_archive` instead of pretending the component has only one class. A runtime assertion must follow the real renderer contract rather than a simplified mental model of it.

## Reusable lesson

Before interpreting a runtime visual difference as a Theme/CSS defect, verify the **fixture and Figma authority** in this order:

1. Current Figma page/frame IDs still resolve and represent the intended SP/PC surface.
2. WordPress template route is the intended route.
3. Seed data and site options match the production-facing content contract being exercised.
4. The measured DOM node corresponds to the same Figma boundary and actual renderer class contract.
5. Only then modify production CSS.

The fixture/routing lesson has multiple independent Budokan examples and remains a project-local practice. The Figma-node-drift case is currently one concrete recurrence discovered during News archive revalidation, so it is recorded here but is **not** promoted to a repository-wide standard yet.
