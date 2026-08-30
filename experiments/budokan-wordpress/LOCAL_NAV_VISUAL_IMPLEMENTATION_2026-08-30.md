# Local Navigation visual implementation — 2026-08-30

## Scope

This run closes the visual layer for the existing `sidebar-nav` Local Navigation family without creating a second renderer or inventing production menu data.

Authoritative Figma nodes:

- SP: `560:632`
- PC: `1216:6311`

Existing Theme owner path:

`template-oneColumnLocalNav.php` → `get_sidebar()` → `sidebar.php` → `sidebar-nav` → `Custom_Sidebar_Walker_Nav_Menu`

The walker remains the data/markup owner. It emits both `lnl_*` and shared `mm_*` classes, and the existing `moduleNavToggle()` remains the interaction owner.

## Figma facts used

### SP `560:632`

- gray background `#f2f2f2`
- horizontal padding `20px`
- vertical padding `40px`
- title/selector gap `24px`
- title `16px`
- selector `50px` high
- selector prompt `選択してください`
- right control `50px × 50px`

### PC `1216:6311`

- white background with top/bottom separator
- vertical padding `56px`
- title/list gap `48px`
- title `20px`
- four columns
- column gap `20px`
- list horizontal inset `36px`
- child text `14px`
- bullet `5px`, gold
- current child uses gold bottom border and medium weight

The fourth Figma child is still a literal placeholder. No production label was invented for it.

## Implementation

`css/module/local_navigation.css` is now mobile-first.

SP uses the existing depth-0 walker title as the section heading and the existing depth-0 menu button as the selector control. The existing `moduleNavToggle()` toggles the already-supported `data-open` state; no Local-Navigation-specific JavaScript was added.

At `min-width:768px`, the selector button is hidden and the existing depth-1 sibling list becomes the four-column PC navigation.

No Japanese menu item label is used as a CSS selector or PHP condition. Current state continues to come from WordPress menu classes.

## Important correction found during final review

The first PC draft kept the Local Navigation inside the already-padded `.global_inner` and added another `50px` internal padding. That double-constrained the component and reduced the intended `1160px` Theme content width.

Cause: the Figma component padding was copied locally without first resolving the parent shell's width contract.

Fix: reuse the Theme shell tokens. At PC the Local Navigation breaks out by `--padding-TB` and then uses the same `--padding-TB` internally. This preserves the canonical `--width-base:1160px` content geometry instead of introducing another width system.

Reusable lesson: when a full-width derivative is nested inside a padded master shell, resolve the parent padding/content-box geometry before copying child-frame padding from Figma. Do not compensate with arbitrary extra width or absolute positioning.

## Cascade correction

`local_navigation.css` previously loaded before `module_menu.css`, even though Local Navigation intentionally specializes the shared `mm_*` baseline. That means later generic menu rules could override the Local Navigation variant.

The import now follows `module_menu.css`, allowing the component-specific variant to override the shared baseline without `!important` or specificity escalation.

This is recorded as a project-local finding only. It is not promoted to a higher standard yet.

## Verification and limits

The closed SP and PC Figma states were re-fetched in this run and the CSS was reviewed against their measured geometry and state treatment.

A disposable headless-browser screenshot probe was attempted, but Chromium did not complete in the current execution container because its headless process stalled on the container runtime/DBus path. This was classified as a harness failure rather than evidence of a Theme failure; no product CSS was changed to accommodate the harness.

The remaining production authority gate is unchanged:

- which real WordPress page(s) are assigned `template-oneColumnLocalNav.php`
- the actual production `sidebar-nav` tree/current-item state

Until that data is available, this run does **not** claim production WordPress runtime visual PASS. The visual implementation remains structural and label-agnostic, and does not assign templates or create menu data.

## Files intentionally untouched

- `parts.php`
- Form/Formidable files
- ACF schema/contracts
- production menu content
- `sidebar.php`
- `Custom_Sidebar_Walker_Nav_Menu`
- `common.js`
