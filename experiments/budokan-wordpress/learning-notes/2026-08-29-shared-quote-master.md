# Budokan shared Gutenberg quote master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- SP Parts quote group: `1399:18954`; quote body: `1399:18956`.
- PC Parts quote group: `1157:8388`; quote body: `1157:8390`.
- Shared Theme owner: `css/blocks/wp-block-quote-style.css`.
- Runtime owner: native Gutenberg `core/quote` inside the existing `.block-editor_wrap` content surface.

## Dependency decision

The quote family is a shared Gutenberg Parts master. The existing Theme already owns the correct semantic block and icon asset, so no page-specific component, ACF field, render filter, or TOP derivative is needed. The correction belongs only in the shared quote CSS owner.

## Concrete Figma findings

### SP

- Quote body width: 327px.
- Left and right quote rails: 24px each.
- Copy starts at x=34, leaving a 10px rail-to-copy gap.
- Copy ends at x=293, leaving the same 10px gap before the right rail at x=303.
- Opening and closing quotation instances are 24×24.
- Body copy is 17px Regular, 160% line-height, 5% tracking.
- Quote vector uses `#777` at 20% opacity.

### PC

- Quote body width: 960px.
- Left and right quote rails: 36px each.
- Copy starts at x=46, again leaving a 10px rail-to-copy gap.
- Opening and closing quotation instances are 36×36.
- Body copy remains 17px Regular, 160% line-height, 5% tracking.
- Quote vector remains `#777` at 20% opacity.

## Existing mismatch

The Theme used the PC geometry (`padding: 0 46px`, quote primitive 36×36) for every breakpoint. That matched the PC authority but made the SP quote unnecessarily narrow and oversized the quotation primitive relative to the authored 24px rail.

## Implementation

- Preserve native Gutenberg quote markup and the existing mask asset.
- Make SP the base contract: `padding-inline: 34px`, quote primitive 24×24.
- Under `min-width:768px`, restore the verified PC contract: `padding-inline: 46px`, quote primitive 36×36.
- Keep quote color, opacity, top-left/bottom-right anchoring, sibling spacing, and semantics unchanged.

## Reusable lesson

For symmetric decorative content blocks, distinguish the decorative rail width from the copy inset. Here the invariant is a 10px rail-to-copy gap while the rail itself scales from 24px on SP to 36px on PC. Reusing the desktop copy inset at every breakpoint hid that relationship and reduced mobile text width unnecessarily.

Keep this as project-local evidence until the same rail-vs-copy-inset pattern repeats independently in another component family.
