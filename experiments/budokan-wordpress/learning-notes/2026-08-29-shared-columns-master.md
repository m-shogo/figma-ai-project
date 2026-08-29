# Budokan shared Gutenberg columns master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- SP Parts Text group: `1399:18736`; two-column stack: `1399:18742`; representative background boxes: `1399:18743`, `1399:18745`.
- PC Parts Text group: `1157:8194`; two-column row: `1157:8200`; representative background boxes: `1157:8201`, `1157:8203`.
- Shared Theme owner: `css/blocks/wp-block-columns-style.css`.
- Runtime owner remains native Gutenberg `core/columns` / `core/column`.

## Dependency decision

The two-column arrangement belongs to the shared native Gutenberg columns master. It must be corrected before page-specific Text or Text+Image derivatives because those consumers should reuse the same layout primitive rather than duplicate their own spacing rules.

## Concrete Figma findings

### SP

- The two-column specimen is 327px wide and stacks vertically.
- The authored sibling gap is 24px.
- Each background box is 327px wide.
- The box specimens use 30px internal padding and 24px internal content gap.

### PC

- The two-column specimen is 960px wide and lays out horizontally.
- The two columns are 468px each with a 24px gap (`468 + 24 + 468 = 960`).
- Each background box uses 32px internal padding and a 24px internal content gap.

## Existing mismatch and fix

The Theme already owns the correct semantic master in `wp-block-columns-style.css`, but it used a 32px gap on SP and a 32px gap on PC. That disagreed with both Figma breakpoints. The safe correction is therefore to keep native Gutenberg columns and set the shared `.wp-block-columns.is-layout-flex` gap to 24px at every breakpoint.

The background-box padding is deliberately **not** generalized in this change. Figma proves 30px SP / 32px PC on these authored boxes, but it does not yet prove which WordPress style/class owns that padding across all background-column usages. Applying padding to every `.wp-block-column.has-background` would overreach the available authority. That derivative remains a separate follow-up once real runtime markup/usage authority is confirmed.

## Reusable lesson

When a Parts specimen contains a layout primitive plus styled content boxes, separate parent-layout ownership from child-style ownership. A directly verified parent gap can be fixed safely in the shared columns master even when the child box class/contract remains ambiguous. Do not use that ambiguity as a reason to preserve a known-wrong shared gap, and do not use the known gap as justification to guess the child styling contract.

Keep this project-local until independently repeated.
