# TOP FV Visual Alignment — 2026-08-31

## Scope

This run re-checked the full Budokan TOP dependency picture before implementation and selected the existing TOP FV owner because Header / Footer / shared Parts foundations are already present and the remaining FV work can be expressed as a responsive derivative without adding a new component or ACF contract.

Canonical Figma evidence refreshed in this run:

- PC FV: `1399:12229` (`fv`)
- SP MV: `1455:5811` (`MV`)
- SP important notice: `446:11658`
- SP purpose-menu control: `1360:9370` (`menu-purpose`)
- canonical TOP frames remain PC `1603:7062` / SP `446:10020`

## Existing Theme ownership reused

No duplicate TOP component was created.

- `front-page.php` already owns `.top_mainVisual`, `.tm_stage`, `.tm_mv`, `.tm_guide`, and `.top_notice-01`.
- the existing `top_slider-01` ACF rows continue to own optional PC/SP slide media and title text.
- `home.js` continues to own the existing Swiper initialization.
- the existing purpose-guide markup remains the PC owner.
- the existing notice markup / ACF notice rows remain the notice owner.

No ACF schema, `parts.php`, Formidable/form work, or shared WordPress contract was changed.

## Fresh Figma findings

### SP

`1455:5811` is not the former 335px padded / 280px-tall card assumed by the CSS. It is a full 375px-wide, 483px-tall MV. The canonical text geometry is:

- title starts at x=20 / y=246 within the MV
- title: 32px, line-height 1.4, serif, text shadow
- lead: 15px, line-height 1.6
- title/lead gap: 24px

`446:11658` is 335×70 and starts 35px before the MV ends, so the notice intentionally overlaps the MV. Its text is 13px with 1.4 line-height and an 8px icon/text gap.

The full-size desktop purpose-guide is **not** present beside or below the SP MV. Instead the canonical SP TOP frame contains a separate 375×64 `menu-purpose` control (`1360:9370`) after the footer. That is a distinct responsive interaction/placement surface, not evidence that the 240×600 desktop guide should be stacked beneath the SP FV.

Therefore this run hides `.tm_guide` below 768px and restores it at the desktop breakpoint. It does **not** invent the missing SP purpose-menu interaction or relocate existing markup across the footer; that remains a separate authority/interaction task.

### PC

`1399:12229` confirms the existing desktop structure is fundamentally correct and reusable:

- overall width: 1380
- stage padding: 60px left / 20px right
- MV / guide gap: 20px
- guide: 240×600
- MV height: 600
- title: 44px at y=330 relative to the MV, left 5%
- lead: 18px
- notice: 700×80, overlapping the bottom of the MV by 40px

The PC layer remains a thin breakpoint extension over the same Theme owner; no new renderer is necessary.

## Implementation changes

`top_mainVisual.css` was corrected mobile-first:

- remove the old SP 20px horizontal inset on the MV
- set SP MV to 375-relative full width / 483px height
- align the SP gradient angle and text geometry
- set SP title to 32px and lead to 15px
- set the notice to 335×70 with the canonical -35px overlap
- hide the desktop purpose-guide on SP
- under `min-width:768px`, restore the existing PC 600px MV, 240px guide, 20px gap, 44px title, and 700×80 notice composition

The implementation intentionally keeps the existing Theme image/data owners. The disposable runtime uses `images/top/mv-sample.png`; the Figma stock photograph is not promoted into production because no canonical media/CMS authority has been established for that exact asset.

## QA added

A disposable WordPress runtime QA and Chromium geometry QA now assert the actual Theme rendering path instead of only reading CSS:

- `budokan-top-fv-runtime-qa.sh`
- `budokan-top-fv-browser-qa.mjs`
- `budokan-top-fv-runtime.yml`

SP assertions cover full-width 483px MV, 32px title, 15px lead, x=20/y=246 text placement, 335×70 overlapped notice, and hidden desktop guide.

PC assertions cover 1380px stage geometry, 20px column gap, 600px MV, 240×600 guide, 44px title, 18px lead, y=330 title block, and 700×80 notice.

## Reusable lesson

A responsive counterpart can change **interaction ownership**, not only dimensions. In this case the PC `purpose-guide` is part of the FV rail while SP exposes a separate `menu-purpose` control elsewhere in the page structure. Reusing the PC markup as a stacked SP block would have preserved code reuse superficially while violating the design's actual component boundary.

This is one concrete finding. Do not promote it to a higher project-wide standard until the same pattern is observed repeatedly in additional families.

## Remaining authority / blockers

- exact production slide images and final ACF content remain CMS/content authority
- SP `menu-purpose` (`1360:9370`) needs its own interaction and placement proof before implementation
- the Figma notice includes a textured/image treatment that is not currently backed by a canonical Theme asset; the implementation preserves the existing Theme color treatment rather than importing an expiring Figma asset
- final pixel-level photographic diff remains impossible until production-authoritative media is available
