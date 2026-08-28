# News archive master validation — 2026-08-29

## Scope

Validated the existing Budokan News archive as a **shared master** before considering any new TOP-specific implementation.

Figma authority:

- SP full page: `560:2524`
- SP archive content: `560:4185`
- SP pager: `560:4260`
- PC full page: `413:2191`
- PC archive content: `1669:5733`
- PC pager: `1137:4996`

Theme dependency authority:

- `_news-archive.php` composes `_news-tabs.php` and `_list-news.php`.
- `_list-news_article.php` delegates each row to `_news-item.php`.
- `module_newsList-01.css` owns the archive master.
- `top_news.css` is a derivative layer and should contain only TOP differences.

No duplicate News component is warranted.

## Runtime result

A disposable real WordPress + ACF PRO runtime was populated with 25 Posts and the five authored category families, then checked at the authored SP/PC widths.

Final assertions passed for both SP and PC:

- HTTP 200 and no page errors.
- No horizontal overflow.
- 20 visible archive rows per page.
- Six category tabs with `すべて` active.
- SP: 335px content, 90×32 tabs, stacked article layout, 80px category labels, 40px circular page numbers, two-row mobile pager family.
- PC: 960px content, 120×48 tabs, horizontal article rows, 80px category labels, 50×40 underline page numbers, one-row pager with octagonal arrows.

A final visual capture confirmed that the current master follows the live Figma composition closely enough that production CSS changes would be overfitting rather than a justified repair. Programmatic Figma inspection showed the authored desktop article rows are 960×90 and the authored label component is 80×23. Runtime bounding boxes can be 1–2px larger because CSS borders participate in the measured DOM box; the rendered composition and spacing remain aligned.

## Failed approaches and causes

### 1. Looking up category terms by Japanese display name

The first QA fixture used `wp term get category <display-name>` as if the display name were an unambiguous identifier. The disposable runtime rejected the lookup.

**Fix:** capture the term IDs returned by `wp term create` and use those IDs in later fixture commands.

### 2. Capturing the site root for an archive test

The second fixture changed `show_on_front` and then opened `/`, but WordPress template hierarchy still selected the Theme front-page surface, so `.news_archive` correctly did not exist.

**Fix:** create an explicit static front page and a real Posts page, set `page_for_posts`, and capture `/news/` as the archive route.

### 3. Adding a category without replacing `Uncategorized`

Using `wp post term add` left the default category attached. The shared News item correctly rendered the first category, which became `Uncategorized`, producing a false visual mismatch and a taller label.

**Fix:** use `wp post term set ... --by=id` so the fixture reflects the intended single-category production contract.

## Reusable lesson

Before interpreting a runtime visual difference as a Theme/CSS defect, verify the **fixture authority** in this order:

1. WordPress template route is the intended route.
2. Seed data matches the production taxonomy/content contract.
3. The measured DOM node corresponds to the same Figma boundary.
4. Only then modify production CSS.

This run produced three independent examples of fixture/routing mistakes that initially looked like implementation defects, so this lesson is strong enough to retain as a project-local practice. It is not yet promoted into a repository-wide standard beyond Budokan without repeated evidence from another implementation family.
