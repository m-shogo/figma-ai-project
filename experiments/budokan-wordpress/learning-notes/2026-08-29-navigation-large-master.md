# Budokan Navigation Large master — 2026-08-29

## Scope

Shared ACF `navigation-large` master only. Canonical Figma file: `w7SGVY63FuW6JpaQVKjxm2`.

- SP Parts authority: `1399:18870` (`ナビゲーション`)
- PC Parts authority: `1157:8339` (`ナビゲーション`)
- Theme owner: `css/blocks/wp-block-navigation-style.css` → `.module_navigation.--large`
- Render owner: `acf/blocks/navigationLarge.php`
- ACF group: `acf/navigation-large`, repeater `navigation-large`
- `navigation-small` is a separate contract and was intentionally left unchanged.

## Dependency finding: the old ambiguity is resolved by the data contract

The Figma card has a wide image-first card shape. The existing Theme has two similarly named ACF blocks, so visual naming alone was not enough to choose an owner safely.

The decisive evidence was the contract:

- `navigationLarge.php` renders `.module_navigation.--large` and authors a `335 × 219` image.
- `navigationSmall.php` renders `.module_navigation.--small` and authors a `120 × 120` image.
- ACF JSON independently locates the large repeater at `acf/navigation-large` and the small repeater at `acf/navigation-small`.

The current Figma specimen therefore maps to the existing `navigation-large` master. It is not authority to merge or replace the small variant.

### Reusable lesson

When two CMS masters have similar names, resolve ownership with **Figma geometry + render markup + field contract together**. Do not collapse variants because only one happens to appear on the current Parts sheet.

## Figma geometry read from primitives

### SP

Card list:

- one column
- card width in Parts specimen: `327px` (container-owned, not a global fixed card width)
- card-to-card gap: `24px`

Card:

- image ratio: exactly `3 / 2` (`327 × 218` in the Parts specimen)
- top corner radius: `3px`
- image and content touch with no inter-element gap
- content: `padding 24px 20px`, vertical gap `16px`, white background, `1px` bottom separator `#d7d4d4`
- arrow rail: `26 × 26px`, then `8px` to title
- title: `18px / 500 / 18px`, tracking `5%`, dark text
- copy: `15px / 400 / 24px`, tracking `5%`, with `8px` bottom inset

SP Figma title font is Zen Kaku Gothic New Medium. Theme does not ship Zen Kaku, so the implementation reuses the existing semantic sans-serif Japanese token rather than adding a new font dependency.

### PC

- 960px Parts specimen
- three cards in one row
- each specimen card is `293px`
- column gap: `40px` (`293 × 3 + 40 × 2 ≈ 960`)
- card internals are the same as SP
- PC Figma title changes to Zen Old Mincho Medium

Theme reuses its existing Japanese serif token for that PC derivative at `min-width:768px`.

The shared implementation remains fluid. It does **not** globally freeze cards at 293px because 293px is derived from the 960px Parts container; runtime pages can have another legitimate content width.

### Reusable lesson

Separate **specimen-derived width** from **component-owned geometry**. Exact ratio, padding, gaps, typography, and breakpoint column count belong to the card; the final card width can belong to the page container.

## Existing implementation mistakes found

The old `--large` CSS was a legacy visual model rather than the current Figma master:

- SP card gap `40px` instead of `24px`
- `20px` gap inserted between image and content instead of a zero-gap seam
- image ratio `335 / 219` instead of current exact `3 / 2`
- image radius `8px` instead of `3px` top corners
- title `24px`, primary red, underlined instead of `18px`, dark, non-underlined
- body `16px / 1.8` with a 20px margin instead of `15px / 1.6` in a 16px content stack
- desktop two columns / 60px instead of three columns / 40px

The fix stays inside `.module_navigation.--large`; shared and `--small` rules are preserved.

## Arrow implementation

No new PHP wrapper or image asset was introduced. The existing title element gains the visual arrow through CSS using the Theme's existing `--icon-arrow-right`, `--font-awesome`, `--clip-octagon`, color, and separator tokens. External-link state continues to reuse the existing title `::after` behavior.

This follows reuse-before-build and keeps the ACF render contract unchanged.

## Runtime QA contract

The temporary QA workflow first asserts the ACF JSON and render mapping, then starts the real WordPress + ACF PRO runtime. A frontend fixture matching the existing render DOM is used to test CSS geometry without mutating the ACF contract.

Required gates:

- HTTP 200 and no browser runtime error
- no page-level positive horizontal overflow
- SP: one column, physical 24px card gap
- PC: three columns, physical 40px column gaps
- image ratio 3:2 and 3px top radius
- zero image/content seam gap
- content padding 24/20/24/20, stack gap 16px, 1px bottom separator
- title 18/500/18 and no underline
- copy 15/400/24 with 8px bottom inset
- arrow rail 26px with 8px title gap

The workflow and screenshots are validation-only evidence and must be removed before final clean-head merge.

## Promotion decision

Keep these findings project-local for now. The master/derivative ownership method agrees with earlier Budokan work, but the Navigation-specific typography switch and ACF mapping should not be promoted into a global standard from one component.
