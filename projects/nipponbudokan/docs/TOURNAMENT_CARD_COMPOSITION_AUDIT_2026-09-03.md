# Tournament card composition reuse audit — 2026-09-03

## Scope

Current Figma authority: `fKYDn9ikpJk1nW7IWFtaUx`.

- Tournament page: `2108:10725` (`page_youth-budo-tournament-02`)
- Theme shared media/text owner: `css/blocks/wp-block-media-text-style.css`
- Theme shared columns owner: `css/blocks/wp-block-columns-style.css`
- Existing human-editable editor owner: Gutenberg/core block composition and existing patterns in `patterns.json`

No Theme PHP/CSS/JS, ACF/CPT, Form/Formidable, `parts.php`, Slider, Calendar, or Search changes are made by this audit.

## Live finding

The current tournament `大会案内` section is a two-column composition of 500px cards. Each card uses:

- 240×160 image
- 30px image/text gap
- shared h4
- existing paragraph typography
- existing `parts / btn-02` detail action

The repeated card grid itself is authored with 40px horizontal and 60px vertical gaps.

The Theme already owns the card-internal media/text relationship at 30px in `wp-block-media-text-style.css`, which matches the current Figma card anatomy. The generic Gutenberg columns owner intentionally uses a 24px gap for its shared text-column master; changing that shared rule to 40/60 would widen blast radius beyond this tournament composition.

## Reuse-before-build disposition

- Reuse the existing media/text, heading, paragraph, image, button, separator, annotation-list, and Local Nav masters for card internals and surrounding content.
- Keep the tournament grid's 40px/60px spacing as page/content composition ownership unless real WordPress runtime evidence proves a repeated reusable Theme variant is required.
- Do **not** globally change `.wp-block-columns` from its current shared 24px contract to match one page composition.
- Do **not** create tournament page-specific CSS, a new Gutenberg style slot, ACF field, CPT, or repeater from the visual repetition alone.
- A new shared layout derivative is only justified after an existing editor marker is found or repeated runtime/authority evidence establishes a reusable family.

## Verification

LIVE `get_design_context` on `2108:10725` confirmed the card geometry and also reconfirmed the existing PC Local Nav contract: four columns, 20px grid gap, 36px inset, 14px labels, and active-only Medium/accent treatment. `local_navigation.css` already matches that authority, so it remains unchanged.

The previously documented tournament table 500-weight instance delta also remains fail-closed; this audit does not alter the shared table owner.

## Promotion review

Disposition: **KEEP_PROJECT_ONLY**.

This is additional `REF-002-BUDOKAN` evidence for separating component-internal geometry from page-composition geometry, but it is still one project/reference. It does not satisfy the canonical independent-reference requirement for promotion to ACTIVE and must not auto-promote.
