# Budokan — Local Navigation dependency / responsive authority audit

更新: 2026-08-30

## 結論

Local Navigation の残っていた owner 不明を、現行 Figma / Theme / WordPress render path の再確認で解消した。

- PC Figma authority: `1216:6311` `local_nav`
- SP Figma authority: `560:632`（同じ「地域社会武道指導者研修会」ページの content 後に置かれる selector-style local navigation）
- WordPress owner: `sidebar-nav`
- PHP render path: `page.php` → `get_sidebar()` → `sidebar.php`
- markup owner: `.local_navigation` / `.ln_links` + `Custom_Sidebar_Walker_Nav_Menu`
- interaction base: walker が併記する `mm_*` class + `common.js` の `moduleNavToggle()`
- shared CSS: `css/module/local_navigation.css` + `css/module/module_menu.css`

以前の audit では SP selector の見た目だけから `_dropdown-navigation.php` / `dropdown-nav` を strong candidate としていたが、これは render position と実 PHP owner を最後まで追えていない段階の仮説だった。現行 Figma の page-level placement と Theme render order を照合すると、SP/PC Local Navigation は `sidebar.php` を responsive に見せ分ける family として扱う方が証拠に合う。

`parts.php` と Form/Formidable は本 audit の対象外。

## Figma placement evidence

### SP — `560:537` `training_sp`

page-level child geometry を current file から再確認した。

- body/content: `560:538` at y=317, h=1834
- Local Navigation counterpart: `560:632` at y=2211, `375 × 176`
- footer: `560:642` at y=2387

つまり `560:632` は page title 直後の global dropdown ではなく、**本文の後・footer の前**に置かれている。

`560:632` の visual contract:

- light-gray full-width background
- `40px 20px` padding
- title/control gap `24px`
- title: `武道 振興・普及事業`, 16px medium
- selector: `335 × 50px`
- placeholder: `選択してください`, 13px medium
- right control: `50 × 50px`, dark background + white down-chevron

### PC — `1203:4865` `page`

page-level child geometry:

- content container: `1203:4878` at y=252, `960 × 1026`
- Local Navigation: `1216:6311` at y=1278, `1380 × 222`
- breadcrumb: y=1500
- footer: y=1561

Local Navigation は PC でも **本文の後**に full-width section として置かれている。

`1216:6311` visual contract:

- white full-width section, top/bottom separator
- `56px 110px` padding
- title/list gap `48px`
- title: `指導者研修・指導法研究`, 20px medium + 26px arrow primitive
- list: 4 columns, `20px` gap, horizontal inset `36px`
- child item: 5px gold dot + 12px gap + 14px copy + bottom rule
- current item uses medium copy and gold bottom rule

Current design-context extraction confirms the first three concrete PC child labels:

1. `全国武道指導者研修会`
2. `地域社会武道指導者研修会`（current）
3. `中学校武道授業指導法研究事業`
4. Figma remains literal placeholder `ローカルナビゲーション`

The fourth slot therefore must **not** be assigned a production label from visual inference alone.

## Theme / WordPress owner proof

### `page.php`

Ordinary pages render content and then the sidebar inside `.global_inner._column`:

```php
<div class="gc_main">
    <div class="block-editor_wrap">
        <?php the_content(); ?>
    </div>
</div>
<aside class="gc_sub">
    <?php get_sidebar(); ?>
</aside>
```

This render order matches the Local Navigation placement being after page content semantically. Desktop full-width breakout styling is still incomplete, but the owner is no longer unknown.

### `sidebar.php`

`sidebar.php` explicitly declares:

```php
<nav class="local_navigation" id="local_navigation">
```

and renders:

- `theme_location => sidebar-nav`
- `menu_class => ln_links module_menu`
- `Custom_Sidebar_Walker_Nav_Menu`

Therefore `.local_navigation` / `.ln_links` are not orphan CSS names; the WordPress menu owner is proven.

### `Custom_Sidebar_Walker_Nav_Menu`

The walker emits both Local Navigation and generic module-menu classes:

- `lnl_item-* mm_item-*`
- `lnl_title-* mm_title-*`
- `lnl_link-* mm_link-*`
- `lnl_button-* mm_button-*`
- `lnl_wrapper-* mm_wrapper-*`
- `lnl_list-* mm_list-*`

It also limits the top-level output to the current page/current ancestor branch, which is consistent with a contextual local navigation rather than a sitewide global menu.

`common.js` already applies `moduleNavToggle()` to `mm_item*._hasChild`, so the sidebar markup already has a reusable open/close interaction base. Do not invent a second Local Navigation JS controller unless runtime evidence proves the existing toggle cannot express the Figma behavior.

## Why `_dropdown-navigation.php` is not the Local Navigation owner

`page.php` also calls `_dropdown-navigation.php`, which renders a different menu location:

- `theme_location => dropdown-nav`
- `menu_class => module_dropdown`
- `Custom_Dropdown_Walker_Nav_Menu`

That renderer appears before the `.global_inner._column` content in PHP. By contrast, the Figma SP `560:632` is after the page body. The similar selector/dropdown visual was insufficient evidence to equate the two components.

Do not merge `sidebar-nav` and `dropdown-nav`, or copy their data between menu locations, without explicit runtime/editor authority.

## Live production-site authority follow-up

The current public 日本武道館 site was checked as an independent production-content authority after the repository and Drive did not expose a seeded `sidebar-nav` export.

Production page:

- `https://www.nipponbudokan.or.jp/shinkoujigyou/gyouji_04` — 地域社会武道指導者研修会
- `https://www.nipponbudokan.or.jp/shinkoujigyou` — 武道の振興・普及 index

Current production content confirms that the Figma labels are real sibling destinations under the `武道の振興・普及` / instructor-training area:

- 全国武道指導者研修会
- 地域社会武道指導者研修会
- 中学校武道授業指導法研究事業

The production index also contains `中学校武道必修化指導書`, but **that does not prove it is the fourth Figma local-nav slot**. Figma still calls the fourth item `ローカルナビゲーション`, and the public index does not expose the exact `sidebar-nav` WordPress menu tree or menu-item IDs. Therefore the fourth label remains fail-closed.

What this new evidence changes:

- A disposable QA fixture may safely use the three confirmed sibling labels above to exercise the existing walker/current-ancestor behavior.
- The fourth QA item may only be a clearly marked sentinel used to test four-column geometry; it must not be promoted into production content or documented as a real destination.
- CSS must depend on structural classes/depth/current state, not on Japanese label strings or guessed URLs.
- Production menu seeding still requires the actual WordPress menu hierarchy/export or explicit content-owner confirmation.

This narrows the blocker from “the hierarchy is unknown” to “three siblings are independently confirmed; the exact fourth slot and production menu tree are still unknown.”

## What is now safe / what is still not safe

### Safe conclusions

1. PC and SP Local Navigation have current Figma authority on the same ordinary page.
2. The WordPress/PHP owner is `sidebar.php` / `sidebar-nav`.
3. The same sidebar markup is the reuse-before-build target for both responsive forms.
4. `local_navigation.css` is the correct component-specific CSS extension point; generic `module_menu.css` remains the interaction/layout baseline.
5. No new ACF field group, bespoke page template, duplicate TOP component, or second menu data contract is justified.
6. The three named PC sibling destinations are corroborated by the current production site and can be used in disposable QA fixtures.

### Remaining implementation gates

Before committing production visual CSS, runtime still must prove a production-equivalent `sidebar-nav` hierarchy because the Figma forms expose different hierarchy levels:

- SP title: `武道 振興・普及事業`
- PC title: `指導者研修・指導法研究`
- PC list: four child slots, of which only three production labels are independently confirmed

The walker can represent nested hierarchy, but the repository and Drive do not contain an authoritative seeded `sidebar-nav` menu export. CSS that hides/shows depth or replaces labels must not be guessed from class names alone.

Smallest missing production authority:

- actual WordPress `sidebar-nav` hierarchy/export, or explicit confirmation of the fourth slot and parent/child menu tree.

Safe next implementation investigation:

1. seed a **disposable QA-only** hierarchy using the three confirmed siblings plus a clearly marked fourth sentinel;
2. render the existing walker and inspect emitted depth/current classes;
3. if structural selectors alone can express the design, implement SP CSS first in `local_navigation.css`;
4. SP runtime screenshot/interaction QA against `560:632`;
5. PC extension under `min-width: 768px`;
6. PC runtime QA against `1216:6311`;
7. visual diff/fixes;
8. remove disposable fixture/workflow from final diff;
9. clean PR/CI/squash merge.

If the CSS would need production-label knowledge, stop rather than baking the sentinel or guessed fourth destination into product code.

## Mistake / cause / reusable lesson

### What happened

A previous dependency audit treated `_dropdown-navigation.php` as a strong SP Local Navigation owner candidate because the Figma SP control looked like a dropdown and `page.php` already had a dropdown renderer.

### Cause

The component was classified by **visual resemblance and filename** before checking both:

- its position in the full page hierarchy; and
- the actual `get_sidebar()` → `sidebar.php` render path.

### Next rule

For responsive component ownership, verify in this order:

1. full-page placement/order,
2. PHP/template render path,
3. WordPress data owner,
4. emitted runtime classes,
5. existing JS behavior,
6. only then visual CSS mapping.

A visual resemblance such as “selector-like” or “dropdown-like” is not enough to assign the data/render owner.

### Generalization scope

This is currently Budokan-local evidence. It should not be promoted to Company/frontend standards from this single correction; repeat evidence in another component family before promotion.
