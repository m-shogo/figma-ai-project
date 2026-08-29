# Budokan Tab master — 2026-08-29

## Scope

Shared ACF tab container / tab panel master only. Canonical Figma file: `w7SGVY63FuW6JpaQVKjxm2`.

- SP Parts authority: `1399:19390` (`tab`)
- PC Parts authority: `1663:5661` (`tab`)
- Render owners: `acf/blocks/tabContainer.php`, `acf/blocks/tabPanel.php`
- Theme owner: `css/module/module_tab.css`
- Runtime behavior owner: existing `js/common.js`, which generates `.tab-button` elements from `.tab-panel[data-title]`

No ACF contract or render markup was changed.

## Dependency / reuse finding

This is not a Gutenberg primitive and not a new component candidate. The Theme already has a complete ACF master:

- `tabContainer.php` owns `.module_tab-wrapper`, `.tab-buttons`, and `.tab-contents`.
- `tabPanel.php` owns `.tab-panel[data-title]`.
- `common.js` generates the actual tab buttons and active state from those panels.
- `module_tab.css` is therefore the correct visual owner.

The implementation reuses those contracts and changes CSS only.

### Reusable lesson

For JS-generated UI, do not infer the visual owner from the final DOM alone. Trace **render source → generated runtime DOM → CSS owner** before building anything new.

## Figma geometry

### SP

The Parts specimen is `327 × 68` and contains six tabs in a `3 × 2` grid.

- outer border: `1px`, dark text token
- three equal columns (`109px` each in the 327px specimen)
- two `34px` rows
- active: dark background / white text
- inactive: white background / dark text
- internal dividers: `1px`
- no corner radius
- label: `14px / 500 / line-height 1 / 0.05em`
- vertical padding: `10px`

The mobile implementation therefore uses a three-column CSS grid rather than horizontal scrolling.

### PC

The Parts specimen is a flex row inside a 960px rail.

- each tab: `120 × 48px`
- gap: `12px`
- wrap is allowed by the Figma component
- radius: `3px`
- inactive border: `1px` dark
- active: dark background / white text
- horizontal padding: `16px`
- label: `14px / 500 / 0.05em`

The implementation switches under `min-width:768px` from the SP grid to the PC flex-wrap model.

## Existing implementation mismatch found

The prior Theme represented a different visual system:

- horizontal scrolling on SP
- `16px` gaps
- red underline rail and red border ownership
- `17px` labels
- `15px 20px` padding
- top-only rounded corners
- no 3-column mobile grid

Those defaults did not match the current Parts authority.

## Implementation correction found during review

The first mobile pass used a normal `1px` CSS border on the `68px`-tall Figma specimen while each grid row was also authored as `34px`. On the web, an auto-height container would then become `34 + 34 + 2 = 70px`; Figma's stroke is visually inside the authored `68px` geometry.

The corrected implementation keeps the two physical `34px` rows and renders the outside stroke with an **inset box-shadow**, so the stroke does not inflate the component's layout box. `box-sizing: border-box` is also explicit on the generated buttons.

### Reusable lesson

When matching an exact Figma box, distinguish **painted stroke geometry** from **layout-affecting CSS border geometry**. If the authored child dimensions already consume the full component height, an inset stroke can preserve visual fidelity without silently adding pixels to runtime layout.

## Unknown / intentionally preserved

Figma provides default and active visual authority here, but no explicit hover-state authority. The existing Theme hover behavior is therefore preserved instead of inventing a new hover state.

This is intentionally project-local evidence. Do not promote the exact Tab geometry to a global frontend standard.

## Verification status for this run

- Figma SP and PC nodes were read through design context before editing.
- Existing ACF render ownership and JS-generated button ownership were re-checked.
- The CSS change is isolated to `module_tab.css`.
- `parts.php`, Form/Formidable, ACF fields, PHP render markup, and tab JS behavior were not modified.

A real WordPress browser runtime was not available directly in the connector execution environment during this run. CI/check status is therefore treated separately from browser-runtime evidence; do not claim a browser visual pass unless a later workflow supplies it.
