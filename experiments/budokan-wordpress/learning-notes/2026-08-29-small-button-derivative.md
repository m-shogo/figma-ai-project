# Budokan shared small-button derivative — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- Training Center SP: `1468:6595`
  - representative `parts / btn-02`: `1468:7272`
  - long-label sibling: `1468:7273`
- Training Center PC: `1137:5348`
  - representative `parts / btn-02`: `1296:8536`
  - long-label sibling: `1296:8542`
- Shared Theme owner: `css/blocks/wp-block-buttonLink-style.css`
- Existing Theme hook: `.wp-block-buttons.small` was already present as an empty derivative slot.

## Concrete findings

1. `parts / btn-02` is not another page-specific component. SP and PC use the same authored primitive, and the Theme already exposes an empty `.small` hook inside the native Gutenberg button master.
2. The authored small derivative is hug-content rather than the bordered 60px `button_L`: no root fill/stroke/padding, 32px high, 10px icon/text gap, 15px Medium text.
3. The arrow primitive is a 32×32 gold (`#ca9957`) octagon with no visible polygon stroke, a white 12px Font Awesome Regular arrow, and no bottom underline.
4. The desktop base master applies `min-width:270px` to default buttons. That is correct for `button_L` but would incorrectly widen `btn-02`; `.small` must explicitly neutralize that inherited minimum at the desktop breakpoint.
5. The default master added in PR #240 owns a bottom-line background layer and a white edged arrow tile. The `.small` derivative must explicitly neutralize both so it remains a thin variant instead of accumulating master decoration.

## Runtime QA

A disposable real WordPress + ACF PRO fixture rendered two native Gutenberg buttons under `.wp-block-buttons.small` and verified both established viewport contracts.

- SP browser 390 → authored content 375: HTTP 200, no page errors, no horizontal overflow; first control 168×32, 15px/500 text, 0 padding/border, 10px internal gap, 32×32 gold arrow tile, 12px/400 white arrow, no inherited background image, button min-width 0.
- PC browser 1395 → authored content 1380: the same primitive measurements pass, including min-width 0 instead of the default master’s 270px desktop minimum.
- The 168px runtime width exactly matches the representative Figma instance `1468:7272` / `1296:8536`; the longer label remains content-sized rather than forced into the representative width.

Runtime screenshots were inspected after the measurement pass. SP correctly wraps the two independent fixture buttons because the fixture intentionally places them as siblings within the authored content width; PC keeps them inline. That outer sibling arrangement is not promoted as a Figma component rule because this run proves the `btn-02` primitive, not the page-specific group layout.

## Reusable lesson

When a shared master already has a named derivative hook, fill that hook before inventing new markup or a new component. Variant implementation is not only about adding properties: it must also **neutralize master properties that are invalid for the variant**, especially breakpoint-only constraints such as minimum widths and decorative background layers. Keep outer layout ownership separate from the reusable primitive unless Figma explicitly proves both together.
