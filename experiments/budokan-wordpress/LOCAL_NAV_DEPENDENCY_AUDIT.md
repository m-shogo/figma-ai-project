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

## What is now safe / what is still not safe

### Safe conclusions

1. PC and SP Local Navigation have current Figma authority on the same ordinary page.
2. The WordPress/PHP owner is `sidebar.php` / `sidebar-nav`.
3. The same sidebar markup is the reuse-before-build target for both responsive forms.
4. `local_navigation.css` is the correct component-specific CSS extension point; generic `module_menu.css` remains the interaction/layout baseline.
5. No new ACF field group, bespoke page template, duplicate TOP component, or second menu data contract is justified.

### Remaining implementation gates

Before committing the visual CSS, runtime must prove the actual `sidebar-nav` hierarchy because the Figma forms expose different hierarchy levels:

- SP title: `武道 振興・普及事業`
- PC title: `指導者研修・指導法研究`
- PC list: four child pages

The walker can represent nested hierarchy, but the repository does not contain authoritative seeded `sidebar-nav` menu items. CSS that hides/shows depth or replaces labels must not be guessed from class names alone.

Smallest missing runtime authority:

- a disposable WordPress `sidebar-nav` fixture matching the intended production hierarchy, or Human confirmation of that hierarchy.

Once that exists, the next implementation unit can be:

1. seed disposable `sidebar-nav` fixture only in QA;
2. SP CSS first in `local_navigation.css`;
3. SP runtime screenshot/interaction QA against `560:632`;
4. PC extension under `min-width: 768px`;
5. PC runtime QA against `1216:6311`;
6. visual diff/fixes;
7. remove disposable fixture/workflow from final diff;
8. clean PR/CI/squash merge.

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
