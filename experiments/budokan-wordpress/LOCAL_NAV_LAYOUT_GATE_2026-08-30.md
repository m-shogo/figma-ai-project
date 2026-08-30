# Budokan Local Navigation — layout gate (2026-08-30)

## Status

A production CSS implementation was attempted against the confirmed Local Navigation authorities and then **reverted before merge** because the full page-layout dependency does not yet satisfy the Figma contract. This is an implementation finding, not a visual guess.

Canonical evidence used in this run:

- SP Figma: `560:632`
- PC Figma: `1216:6311`
- WordPress renderer: `sidebar.php` / `sidebar-nav`
- walker: `Custom_Sidebar_Walker_Nav_Menu`
- generic interaction: `common.js` → `moduleNavToggle()` via the walker-emitted `mm_*` classes

`parts.php`, Form/Formidable, and ACF contracts were not touched.

## What the attempted implementation proved

### 1. The menu hierarchy can be targeted structurally

The sidebar walker filters the top-level branch using WordPress current/ancestor classes. Once that branch is emitted, all lower siblings are rendered recursively. Therefore the current instructor-training subgroup can be selected without matching Japanese labels by using the depth/current classes already emitted by WordPress, for example the depth-03 `current-menu-ancestor` / `current-menu-item` state.

This means the unresolved fourth PC label does **not** need to be guessed in order to style the menu family. Production content can remain WordPress-owned.

### 2. Existing JS is reusable

`Custom_Sidebar_Walker_Nav_Menu` emits both `lnl_*` and `mm_*` classes. `common.js` executes `moduleNavToggle()` and binds buttons on `mm_item*._hasChild`. A second Local Navigation JS controller is not justified by current evidence.

### 3. CSS import order matters, but it is not the main blocker

`css/style.css` currently imports `local_navigation.css` before `module_menu.css`. Because Local Navigation intentionally reuses the generic `mm_*` baseline, equal-specificity component overrides can be overwritten by the later generic module stylesheet.

During the aborted implementation, moving Local Navigation after the generic menu stylesheet would have solved that cascade issue. That import-order change was also reverted because the larger page-layout problem below must be resolved first. Do not start a specificity war or permanently reorder imports until the final layout ownership is settled.

## Blocking dependency discovered before runtime/visual PASS

The Figma Local Navigation is a **full-width section after the page body**:

- SP `560:632`: full-width gray section after content and before footer
- PC `1216:6311`: full-width white section with top/bottom separators after the 960px body

The current ordinary-page render path is different:

```text
page.php
  .global_inner._column
    .gc_main
      the_content()
    aside.gc_sub
      get_sidebar()
        nav.local_navigation
```

At `min-width: 768px`, `global_inner.css` turns `._column` into a two-column grid:

```css
grid-template-columns: 1fr var(--width-side);
gap: 40px;
```

and `--width-side` is `260px`.

Therefore `sidebar.php` is currently placed in the **right-side grid column**, while Figma requires Local Navigation to be **below the body and full-width**. Styling `nav.local_navigation` alone would make its internal typography/controls closer to Figma but would leave the component in the wrong parent geometry and render order. That would be a false visual fix.

This also exposes a second dependency: the current ordinary-page `.gc_main` column is narrower than the 960px body shown in the Regional Training Figma page. The page-layout owner must be checked before moving the sidebar or flattening `._column` globally.

## Cross-family Figma re-check

Two additional ordinary-page families were inspected after the CSS attempt was stopped:

- Training Center: SP `1468:6595` / PC `1137:5348`
  - PC body container: `1296:8751`, width `962px`
  - no Local Navigation section is present between body and breadcrumb/footer
- Modern Budo: SP `1455:5489` / PC `1145:6042`
  - PC body container: `1687:6220`, width `960px`
  - no Local Navigation section is present between body and breadcrumb/footer

Regional Training already provides the third data point:

- Regional Training: PC `1203:4865`
  - body container: width `960px`
  - Local Navigation exists after the body as a full-width section

So the **960px single-column ordinary-page body is now repeated Figma evidence across three page families**, while Local Navigation is optional/contextual rather than universal. This makes the legacy `1fr + 260px` ordinary-page shell a higher-priority master dependency than Local Navigation styling itself.

It does **not** yet prove the exact WordPress migration rule. We still need to know which templates/pages should adopt the new one-column shell and how an optional `sidebar-nav` should be emitted after the body without leaving an empty gap on pages that do not belong to a local-nav branch.

## Existing Theme one-column owner found

The Theme already has two explicit one-column page templates:

- `templates/template-oneColumn.php` (`Template Name: 1カラムテンプレート`)
- `templates/template-oneColumnWide.php` (`Template Name: 1カラム幅広テンプレート`)

`template-oneColumn.php` already renders ordinary page content inside:

```text
.global_inner._content
  .gc_main._oneColumn
    the_content()
```

and `--width-content` is `960px`, so this existing template is structurally much closer to the repeated Figma ordinary-page body than default `page.php`'s legacy side-column grid. `template-oneColumnWide.php` uses the broader base-width wrapper and is therefore not the first candidate for the 960px family.

This changes the reuse decision materially: **do not invent a new 960px page shell or immediately rewrite `page.php`**. First determine whether the affected Figma pages are intended to use the existing `1カラムテンプレート`, and then add the optional Local Navigation as a thin derivative/extension only if runtime authority requires it.

The existing one-column template currently does not call `_dropdown-navigation.php` or `get_sidebar()`, so the remaining Local Navigation problem is smaller and more specific: prove how a page using this existing 960px shell should optionally render `sidebar-nav` after the body.

## Failed approach and cause

### Attempt

Implement `local_navigation.css` directly from SP first, then add the PC four-column extension.

### Why it was stopped

The initial work treated the Local Navigation renderer as if its parent already matched Figma. Re-reading `page.php`, `global_inner.css`, and `global_contents.css` showed that this assumption was false on PC. The component was inside a legacy side-column layout. A later template audit then found that the Theme already owns a 960px one-column page template, making a new shell even less justified.

### Reusable Budokan lesson

Before styling a full-width Figma section, verify not only its renderer and data owner but also the **parent layout owner and DOM placement at the target breakpoint**. Then search existing page templates before changing the default shell. A correct component renderer inside an incompatible parent grid is still the wrong implementation surface, and an already-existing layout owner should be reused before a new one is created.

This is now repeated inside the Budokan ordinary-page family (three Figma pages share the 960px body), so it is strong enough to guide the Budokan page-shell investigation. It is still not evidence for a company-wide standard.

## Smallest authority needed before production implementation

The Figma side is now substantially clearer: current ordinary-page designs use a centered ~960px body, and only some families add a full-width Local Navigation after it. The Theme also already owns a 960px one-column template.

The remaining authority is on the WordPress/runtime side:

- confirm whether Regional Training / Training Center / Modern Budo production pages are assigned to `1カラムテンプレート` (or are intended to be migrated to it); and
- confirm the runtime rule for whether `sidebar-nav` has a current branch, so an optional Local Navigation can be emitted after the one-column body without an empty visual section.

An actual production WordPress page-template assignment plus `sidebar-nav` menu/runtime export is now the highest-value input. The exact fourth Local Navigation label is **not** the blocker for CSS anymore; it remains content authority and must stay fail-closed.

## Safe next investigation

1. Build a disposable WordPress fixture using the existing `template-oneColumn.php`, with one page inside a `sidebar-nav` branch and one page outside it.
2. Prove an optional bottom Local Navigation render contract without guessed labels/content.
3. If the existing template + optional sidebar contract matches the Figma shell, implement that thin derivative instead of rewriting default `page.php`.
4. Then return to Local Navigation: SP styling → SP runtime QA → PC extension → PC runtime QA → visual diff.

No production CSS from the aborted attempt remains in the final branch diff.