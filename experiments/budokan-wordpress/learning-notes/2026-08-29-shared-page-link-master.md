# Budokan shared page-link master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- SP Parts page-link group: `1399:18933`; list: `1399:18935`; representative items: `1399:18936` and multiline `1399:18940`.
- PC Parts page-link group: `1157:8366`; list: `1157:8368`; master component: `1198:4686`.
- PC real-page instance: hardcover `1656:5309`, content frame `1657:5632`, page-link list `1672:6136`.
- Shared Theme owner: `css/blocks/wp-block-inPageLink-style.css`.
- Runtime markup owner remains existing ACF block `acf/blocks/inPageLink.php`; no contract change is required.

## Dependency decision

The page-link family is a shared Parts master. The existing ACF block and CSS owner are reusable, so no page-specific duplicate or TOP-only component is warranted.

A previous run stopped because the 220px desktop item width looked unsafe against an approximately 860px disposable-runtime content surface. Re-checking the correct Budokan Figma file resolved the ambiguity: the desktop component is explicitly `min-width:220px`, its parent uses wrap, and a real hardcover page instance uses the same 220px items inside a 960px content frame. Therefore the correct master behavior is minimum 220px desktop items with wrapping, not an unconditional four-column grid that can overflow narrower valid containers.

## Concrete Figma findings

### SP

- Authored content width: 327px.
- Items fill the available row and retain `min-width:220px`.
- Parent auto-layout wraps, with zero row gap on the SP example.
- One-line item: 327×58px.
- Multiline item: 327×76px.
- Horizontal padding: 12px left / 16px right; vertical padding 16px.
- Icon-to-copy gap: 10px.
- Icon primitive: 26×26 dark `#333` octagon with white 8px Font Awesome arrow rotated downward.
- One-line text is 16px Medium with 100% line-height. The multiline authored example overrides to 140% line-height; CSS keeps a safe 1.4 line-height so wrapping does not collide.

### PC

- Component master: 220×56px, `min-width:220px`, 12px left / 16px right, 10px icon gap.
- Parts list is 960px wide, wraps, column gap 20px, row gap 24px.
- Real hardcover list is also 960px wide and contains 220px items at x=0/240/480/720, confirming the master geometry is used on a real page rather than only in the Parts specimen.
- The real-page list has 24px top/bottom padding, but the Parts master list has zero vertical padding. Therefore that padding is page-context/derivative spacing and must not be promoted into the shared page-link CSS.
- The Parts specimen also contains a 568px-wide instance of the same component, showing the component can be widened above its 220px minimum. The shared master should not infer that every item is always exactly 220px in every context.

## Existing mismatch and failed approaches

The prior Theme used a responsive grid with `1fr` columns and the wrong icon treatment. A first branch correction changed `data-column=4` to four hard 220px grid tracks and added 24px vertical padding. That looked right in the 960px hardcover specimen but was still structurally wrong:

1. four fixed grid tracks cannot wrap when a valid container is narrower than 940px;
2. the 24px vertical padding belongs to the real-page derivative, not the shared Parts master;
3. the arrow itself is white in Figma, while the prior Theme used a gold/accent treatment.

The corrected implementation maps the verified Figma ownership instead: the four-column family uses a wrapping flex row with 220px item width/min-width and 20×24 gaps, while no shared vertical padding is introduced. Other 1/2/3-column contracts remain unchanged because this run does not have equivalent Figma evidence proving they should be rewritten.

The first real WordPress + ACF PRO runtime gate then failed on the arrow color even though the CSS intent was white. The implementation had introduced `var(--color-white)`, but the Theme does not define that token, so the pseudo-element inherited the dark text color and computed as `rgb(51, 51, 51)`. Inspecting the Theme variable authority showed that its established white token is `--color-secondary: #fff`. Reusing that existing token fixes the runtime mismatch without introducing a new global variable or hard-coded local color.

## Reusable lesson

When a Figma specimen looks like a fixed N-column grid, inspect `layoutWrap`, child `minWidth`, layout sizing, and at least one real-page instance before encoding `grid-template-columns`. A repeated 220px visual width can actually be a wrapped minimum-width component contract rather than a rigid grid contract.

Also separate component geometry from page-context spacing. The same page-link list has zero vertical padding in Parts and 24px vertical padding in the hardcover page. That repeated structure is evidence that the latter is derivative spacing, not master styling.

Finally, do not invent semantically plausible CSS variable names. Verify the Theme's token authority and then assert the resulting computed value in runtime QA. A syntactically valid undefined custom property can silently invalidate the declaration and fall back to inheritance, producing a visual mismatch without a CSS parse error.

Keep these as project-local findings until the same ownership pattern repeats independently elsewhere.
