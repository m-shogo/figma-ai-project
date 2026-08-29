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

## Runtime QA

A disposable real WordPress runtime was started with the supplied `nipponbudokan` Theme and ACF PRO 6.8.9 active. A native Gutenberg `core/quote` page was created through WP-CLI, then Playwright verified the established browser contract at 390px viewport for the authored 375px SP surface and 1395px viewport for the authored 1380px PC surface.

Final computed evidence was GREEN:

- SP: HTTP 200; left/right padding 34px; opening/closing primitives 24×24; pseudo-element opacity 0.2; no positive page-level horizontal overflow; no page errors.
- PC: HTTP 200; left/right padding 46px; opening/closing primitives 36×36; pseudo-element opacity 0.2; no positive page-level horizontal overflow; no page errors.
- The Figma screenshots for both quote bodies were re-read after the numeric inspection to confirm the same visual relationship: quotation rails sit outside the copy with a stable 10px rail-to-copy gap while the rail itself changes size by breakpoint.

## Failed QA approach / cause / fix

The first disposable workflow produced a false failure after the quote post had already been created successfully. The probe used `curl ... | grep -q ...`; once `grep -q` found the marker it closed the pipe, so `curl` reported write error 23 even though the HTTP response and block markup were valid. This was QA plumbing, not a Theme regression.

The corrected probe writes the HTTP response to a temporary file first and runs `grep -q` on that file. The browser probe path was also corrected to resolve Playwright from the repository-root `node_modules`, and Chromium dependencies are installed explicitly. The rerun then passed setup, fixture creation, SP QA, PC QA, and teardown.

## Reusable lesson

For symmetric decorative content blocks, distinguish the decorative rail width from the copy inset. Here the invariant is a 10px rail-to-copy gap while the rail itself scales from 24px on SP to 36px on PC. Reusing the desktop copy inset at every breakpoint hid that relationship and reduced mobile text width unnecessarily.

Also treat shell-pipeline failures as possible QA-harness failures before changing Theme code: a successful upstream HTTP request can still surface a non-zero `curl` exit when a downstream `grep -q` deliberately closes the pipe early.

Keep these as project-local evidence until the same patterns repeat independently in another component or QA family.
