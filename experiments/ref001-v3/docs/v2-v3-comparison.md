# V2 vs V3 comparison

V2 = `experiments/ref001-blind-clean-20260812`  
V3 = `experiments/ref001-v3`

V2 files were not modified in this work.

## Directory structure

V2 keeps a WordPress-like theme with one giant `style.css` plus three overlay CSS files (`responsive-continuity.css`, `visual-repair.css`, `human-review-repair.css`). Content is a flat ACF-shaped key list.

V3 splits:

- `data/` — nested copy, asset map, course identity
- `components/` — heading, CTA button
- `sections/` — one PHP file per Figma section
- `styles/` — tokens → base → components → sections → responsive

## Component structure

V2 sections are self-contained but repeated CTA markup and heading patterns live inline.

V3 extracts only repeated UI (`section-heading`, `cta-button`). One-off sections stay as sections, not fake generic components.

## CSS structure

| | V2 | V3 |
|---|---|---|
| tokens | mixed into `:root` in one file | `styles/tokens.css` |
| layout vs repair | FIRST PASS + 3 repair layers | single readable cascade |
| class prefix | `ref-` | `v3-` |
| Figma nodes | mostly absent | `data-figma-pc` / `data-figma-sp` |

## Duplicated rules

V2 accumulated the same picture/object-fit/portrait rules across repair files.

V3 states them once (cover for photos, contain + transparent for CTA people).

## Responsive

Both use the owner-resolved breakpoint: mobile `<= 767px`, desktop `>= 768px`. V3 documents probe widths in `tools/capture.mjs` without adding extra layout breakpoints.

## Asset management

Both consume the same canonical WebP set under `implementation/theme/assets/images/ref001/rendered/`.

V3 maps slots in `data/assets.php` with Figma node IDs and serves files from the repo root. It does not copy or regenerate rasters.

## Maintainability / editability

Improves:

- Copy lives in nested `data/page.php` (ACF/React-shaped)
- Course identity stays in `data/courses.php`
- Section files are independently editable
- CSS files match section names
- Asset slot → Figma node is explicit

## Visual fidelity (approximate)

Runtime probes (local): 11 widths, overflow 0, image decode failures 0, runtime errors 0.

PC 1380 body height 7597 vs Figma 7714.  
SP 375 body height 10643 vs Figma 10817 (Figma includes 40px status bar).

CTA people show person + yellow (left) / green (right) silhouettes on transparent canvases.

## V3 remaining visual gaps

These are expected; pixel-perfect close-out stays on the V2 track.

- Licensed Figma display fonts (A-OTF Ryumin / Futo Go) are substituted with Zen Kaku Gothic New
- Some card/title geometry still differs by more than 1px from Figma
- Student Voice collapsed/open interaction remains UNDETERMINED (visible states only)
- Shared CTA campus wash is a V3-local Figma export (not part of the canonical 32 WebP set)

## Design improvements vs V2

- No repair-CSS archaeology
- No dummy-media placeholders in the default path
- CTA silhouettes are first-class (transparent, `object-fit: contain`)
- Section ↔ Figma IDs are in the DOM
- Human editors can change copy without hunting minified CSS
