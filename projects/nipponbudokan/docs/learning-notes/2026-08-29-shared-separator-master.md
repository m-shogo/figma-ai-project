# Budokan shared Gutenberg separator master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- SP Parts group: `1399:18867`; separator instance: `1399:18869`.
- PC Parts group: `1157:8336`; line primitive: `1157:8338`.
- Shared Theme owner: `css/blocks/wp-block-separator-style.css`.
- Runtime owner: native Gutenberg `core/separator` rendered inside the existing `.block-editor_wrap` content surface.

## Concrete findings

1. The separator is a shared Parts master, not a page-specific component. The existing `wp-block-separator-style.css` ownership is correct and should be reused.
2. SP and PC use the same authored primitive: an 11×11 octagonal marker, an 8px gap, then the horizontal rule. The rule therefore begins at x=19.
3. Marker and rule both use `#d7d4d4` (`color/line`). Figma authors the rule at 0.8px stroke weight and centers it vertically at y=5.5 inside the 11px-high primitive.
4. The previous Theme reduced the master to a plain 1px top border. That retained the generic idea of a separator but lost the marker, the 8px gap, the 11px authored rail height, and the 0.8px line weight.
5. Frontend `page.php` renders `the_content()` inside `.block-editor_wrap`, so the existing selector family is a real frontend contract as well as an editor-style surface. No new wrapper or render filter is needed.

## Implementation

- Preserve native Gutenberg `<hr class="wp-block-separator">` markup and the existing block margins.
- Make the separator an 11px-high relative rail.
- Neutralize the layout-contributing native/core border.
- Draw the line as a non-layout background beginning at 19px and centered vertically, using the existing `--color-line` token and the Figma-authored 0.8px thickness.
- Draw the 11px marker with `::before` and an octagonal `clip-path`, again using `--color-line`.
- Do not add a Budokan-only PHP component, SVG asset, ACF field, or page derivative for this primitive.

## Runtime QA

A disposable real WordPress + ACF PRO workflow seeds a native Gutenberg separator into page content and checks the established authored-width contract at browser 390 → Figma 375 SP and browser 1395 → Figma 1380 PC.

The first complete runtime pass was GREEN for both SP and PC: WordPress/ACF setup, fixture seed, browser capture/assertions, evidence upload, and cleanup all succeeded. Assertions covered HTTP/runtime health, page-level overflow, 11px separator height, 11×11 marker, neutralized native border, Figma line color, octagonal marker shape, and the x=19 line start. After that pass, the background line thickness was tightened from the provisional 1px to the directly observed Figma 0.8px before the final pass.

## Mistake / cause / fix

The first implementation used a 1px CSS line because that is a common browser-safe separator thickness and the initial runtime assertions focused on the larger geometry. Structured Figma inspection had already exposed the actual `0.8000000119` stroke weight, so keeping 1px would have been an unnecessary approximation. The fix was to treat primitive-level Figma evidence as authority and set the background rule to 0.8px before finalizing.

A second plausible mistake was avoided: replacing the native Gutenberg separator with bespoke markup simply because the design includes an octagonal marker. The existing block already owns content semantics and editor/runtime behavior; the marker is visual presentation and belongs in the existing CSS owner.

## Reusable lesson

For very small shared primitives, do not stop validation at the outer bounding box. Inspect the internal primitive geometry—marker size, gap, line start, stroke weight, and token—because a generic-looking browser implementation can be structurally correct while still visibly losing the authored identity. Prefer styling the existing semantic/CMS master over introducing new markup when the difference is purely presentational.

Keep this lesson project-local until independently repeated across another primitive family.
