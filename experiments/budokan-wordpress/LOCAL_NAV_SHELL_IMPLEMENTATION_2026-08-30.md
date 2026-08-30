# Budokan Local Navigation — one-column shell implementation (2026-08-30)

## Outcome

The page-shell gate identified in `LOCAL_NAV_LAYOUT_GATE_2026-08-30.md` now has a concrete Theme implementation surface: `templates/template-oneColumnLocalNav.php`.

This is intentionally a **thin derivative** of the existing `templates/template-oneColumn.php`, not a rewrite of `page.php` and not a second 960px layout system.

## What changed

The derivative preserves the existing one-column content owner exactly:

```text
.global_inner._content
  .gc_main._oneColumn
    .block-editor_wrap
      the_content()
```

After that content wrapper closes, it renders the existing `sidebar.php` owner inside a normal `global_inner`:

```text
.global_inner
  get_sidebar()
    nav.local_navigation
      wp_nav_menu(sidebar-nav)
```

This moves Local Navigation out of the legacy `page.php` `1fr + 260px` sidebar column while continuing to reuse the canonical `sidebar-nav` renderer, walker, menu data, and JavaScript contract.

## Why this is safe

- No production WordPress page is automatically assigned to the new template.
- No menu labels or the unresolved fourth Local Navigation item are hard-coded.
- `page.php`, `sidebar.php`, walker code, CSS, JavaScript, ACF contracts, `parts.php`, and Form/Formidable are unchanged.
- Pages that continue using `template-oneColumn.php` remain Local-Navigation-free, matching the Training Center and Modern Budo Figma evidence.
- A Regional Training-type page can opt into the derivative once WordPress authority confirms the intended page-template assignment.

## Verification performed in this run

- Re-read latest `so` before branching.
- Re-checked Figma Local Navigation SP `560:632` and PC `1216:6311`.
- Re-read `page.php`, `template-oneColumn.php`, and `sidebar.php` to verify ownership and DOM placement.
- Confirmed the new file is additive and inert until selected in WordPress.

## Remaining gate

This change resolves the **Theme page-shell placement** problem, but it does not claim visual completion of Local Navigation yet.

Still required before the section can be called complete:

1. actual WordPress/runtime confirmation that the Regional Training family should use this derivative (or equivalent explicit assignment);
2. a disposable/real `sidebar-nav` current-branch fixture;
3. SP runtime QA against `560:632`;
4. PC extension/runtime QA against `1216:6311`;
5. visual diff and CSS fixes, if needed.

The unresolved fourth menu label remains a content-authority issue, not a reason to duplicate renderer logic or guess production navigation content.

## Reusable lesson

When Figma shows an optional full-width section after a shared one-column body, prefer **template composition** over changing the shared body master or styling around an incompatible parent grid. Keep content/data ownership in the existing renderer and make the derivative responsible only for placement.

This is a Budokan-specific implementation lesson. It should not be promoted to a broader standard until repeated in another independent project/family.
