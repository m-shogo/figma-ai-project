# Budokan — shared breadcrumb responsive master (2026-08-31)

## Dependency decision

Re-checked the current Budokan Figma authority (`w7SGVY63FuW6JpaQVKjxm2`) and the Theme before editing. Header/Footer/Parts remain foundation work already owned by their existing surfaces; `parts.php` and Form/Formidable remain out of scope. Training Center content and Event data contracts still require Human/WordPress authority, so this run selected a smaller shared UI family with complete visual + Theme ownership: the global breadcrumb.

The existing owner is `css/module/module_breadCrumb.css`; no page-specific breadcrumb duplicate is warranted.

## Current Figma evidence

Fresh design context was fetched in the same run for both News single counterparts:

- SP: `1451:5197` (`SP_post`)
- PC: `1235:6361` (`post`)

Both use the same breadcrumb family and the existing Theme chevron token/glyph is compatible.

Observed responsive rhythm:

- SP breadcrumb base text: 13px, single-line line-height where not wrapping; chevrons 10px; authored sequence gap is 8px.
- PC breadcrumb base text: 13px; chevrons 10px; authored sequence gap is 10px.
- chevrons use the existing primary red.

The content labels themselves vary by hierarchy (for example the authored archive/category crumbs can use 12px while the base/current crumb is 13px). That content-specific typography was not generalized into the shared master without stronger repeated evidence.

## Mismatch and cause

Theme baseline used:

- `line-height: 1.5` on the whole breadcrumb;
- `margin-inline: 10px` around each generated chevron at every breakpoint.

The desktop spacing already matched the current PC design, but SP inherited the PC 10px rhythm and the shared 1.5 line-height, making the mobile breadcrumb visibly looser than the authored SP component.

Cause: the original module encoded one desktop-like rhythm for both responsive bands rather than treating the breadcrumb as a shared master with a small SP derivative.

## Fix

Kept the existing markup, pseudo-element chevron, Theme tokens, and breadcrumb owner. Only the shared CSS contract changed:

- base/SP line-height -> `1`;
- base/SP generated-chevron margin -> `8px` per side;
- `min-width:768px` restores `10px` per side for PC.

No new component, JavaScript, ACF field, page template, or page-specific override was added.

## Runtime/browser QA

Extended the existing real WordPress News single browser QA rather than creating a parallel fixture. It now checks, in addition to the already-covered return pager:

- breadcrumb exists on the real single route;
- 13px shared base font;
- computed 13px line-height from `line-height:1`;
- 10px generated chevron;
- primary-red chevron color;
- SP 8px separator margins;
- PC 10px separator margins.

This keeps the assertion on the actual Theme pseudo-element rather than approximating the visual with a new DOM contract.

## Reusable lesson

A shared component can be correct on PC and still carry a stale PC rhythm into SP. For a responsive shared master, verify the same component in current SP and PC Figma during the same run before deciding whether the correction belongs in the master or a page derivative.

This is consistent with the already repeated Budokan rule to re-fetch both current responsive authorities before editing a shared family. It reinforces that project-local rule; it does not add a new repository-wide standard.
