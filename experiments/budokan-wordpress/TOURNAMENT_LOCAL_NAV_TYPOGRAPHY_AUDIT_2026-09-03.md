# Tournament Local Navigation typography authority audit — 2026-09-03

## Scope

Current Figma authority: `fKYDn9ikpJk1nW7IWFtaUx`.

- Tournament page: `2108:10725` (`page_youth-budo-tournament-02`)
- Tournament Local Navigation: `2108:10846`
- Existing Training Center Local Navigation authority: `1216:6311`
- Theme owner: `css/module/local_navigation.css`
- WordPress owner: `sidebar-nav` rendered through the existing Local Navigation walker/shell

No Theme PHP/CSS/JS, ACF/CPT, Form/Formidable, `parts.php`, Slider, Calendar, or Search changes are made by this audit.

## Live finding

LIVE current-Figma inspection shows that Local Navigation geometry and item typography are shared, but the subgroup heading family is not universally shared.

### Tournament `2108:10846`

- subgroup heading `大会・イベント`: Zen Old Mincho Medium, 20px, approximately 1.5 line-height, 10% tracking
- menu items: Zen Kaku Gothic New Regular/Medium, 15px, approximately 1.5 line-height, 5% tracking
- four-column child grid, 20px gap
- active item: gold bottom rule + Medium weight

### Training Center `1216:6311`

- subgroup heading `指導者研修・指導法研究`: Zen Kaku Gothic New Medium, 20px
- existing four-column / active-item Local Navigation behavior remains the current shared reference already recorded in `LOCAL_NAV_DEPENDENCY_AUDIT.md`

## Theme / blast-radius comparison

The shared Theme currently gives `.lnl_link-03` the Local Navigation Kaku family and PC 20px / Medium treatment. That is correct for the Training Center consumer, but it does not reproduce the Tournament subgroup heading's Mincho family.

Changing the shared `.lnl_link-03` family to Mincho would therefore repair one current-Figma instance by regressing another current-Figma instance. The mismatch is a real semantic-family variant, not evidence that the shared base rule is globally wrong.

## Fail-closed disposition

Do not change `local_navigation.css` globally and do not add a tournament page-slug selector, menu-title string selector, new modifier class, ACF field, CPT, or dedicated renderer from this visual evidence alone.

A safe implementation requires an already-authoritative semantic variant hook or a proven production assignment/data contract that distinguishes the Tournament Local Navigation from the Training Center family. Until that exists, keep the current shared Kaku owner unchanged and record the Tournament heading family delta as an unresolved authority gate.

This preserves the proven Training Center consumer and avoids manufacturing a new ownership contract from one page's typography.

## Reuse-before-build finding

The existing Local Navigation renderer, menu hierarchy, grid, active state, item typography, and responsive shell remain reusable. Only the subgroup-heading family differs in the observed Tournament instance. Any future authorized variant should reuse the same renderer and scope only the proven heading-family difference rather than cloning the component.

## Promotion review

Disposition: **KEEP_PROJECT_ONLY**.

This is useful `REF-002-BUDOKAN` evidence for checking all known consumers before changing a shared component token and for distinguishing a real component variant from a globally wrong base rule. It remains one project/reference and does not satisfy the independent-reference requirement for cross-project promotion. No auto-promotion.
