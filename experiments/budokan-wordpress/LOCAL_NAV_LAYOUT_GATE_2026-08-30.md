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

## Failed approach and cause

### Attempt

Implement `local_navigation.css` directly from SP first, then add the PC four-column extension.

### Why it was stopped

The initial work treated the Local Navigation renderer as if its parent already matched Figma. Re-reading `page.php`, `global_inner.css`, and `global_contents.css` showed that this assumption was false on PC. The component was inside a legacy side-column layout.

### Reusable Budokan lesson

Before styling a full-width Figma section, verify not only its renderer and data owner but also the **parent layout owner and DOM placement at the target breakpoint**. A correct component renderer inside an incompatible parent grid is still the wrong implementation surface.

This is one Budokan-local occurrence. Do not promote it to a company-wide standard yet.

## Smallest authority needed before production implementation

Determine whether ordinary Budokan pages in the new design are intended to replace the legacy two-column `.global_inner._column` layout with a one-column 960px body followed by a full-width Local Navigation, or whether only a specific page family does so.

Useful authority would be either:

- an actual production WordPress page/runtime showing the intended new ordinary-page shell, or
- explicit Theme/Figma ownership confirming that `page.php` should move `get_sidebar()` outside `.global_inner._column` (and defining which ordinary pages are affected).

The exact fourth Local Navigation label is **not** the blocker for CSS anymore; it remains content authority and must stay fail-closed.

## Safe next investigation

1. Compare at least two more Figma ordinary-page families that include Local Navigation and measure their body width / Local Navigation placement.
2. Audit all Theme templates that use `.global_inner._column` / `get_sidebar()` before changing the shared page shell.
3. If repeated Figma evidence confirms the same one-column body + bottom Local Navigation shell, implement that shell as the master dependency first.
4. Then return to Local Navigation: SP styling → SP runtime QA → PC extension → PC runtime QA → visual diff.

No production CSS from the aborted attempt remains in the final branch diff.