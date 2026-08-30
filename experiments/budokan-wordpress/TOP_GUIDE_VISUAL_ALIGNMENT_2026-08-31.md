# Budokan TOP User Guide visual alignment — 2026-08-31

## Scope

This pass re-checks the whole current TOP composition before touching code, then aligns only the independent `目的から探す / User guide` family.

Authoritative Figma nodes:

- SP: `1455:5672` (`User Guide`, 375 × 1668)
- PC: `1603:7370` (`目的から探す` inside TOP PC)

Theme owner:

- markup/data shell: `template-parts/_top-guide.php`
- visual specialization: `css/project/top_guide.css`

No new component, ACF field, renderer, or TOP-only copy of a shared page component was introduced.

## Dependency re-check before implementation

The current TOP remains composed in this order:

`FV → Event → SNS → User guide → About → News → Official Partner → Instagram → Banner → Footer` on PC.

On SP, SNS is visually grouped at the end of the Event frame, but this frame grouping alone is not a reason to move Theme ownership. The existing Theme Event/SNS composition can remain separate from the User Guide work.

The Event family was investigated first because it precedes User Guide. Current `event` ownership proves only the custom post type, `event_cat`, title/editor/thumbnail, and sticky archive behavior. The ACF export does not define a canonical event-date or status field. `_top-events.php` currently renders publication date for real posts while Figma labels the semantic as event date and visually includes status. Therefore changing Event date/status now would fabricate a CMS contract. That family remains fail-closed on those data semantics while independent visual work proceeds.

## Figma facts used for User Guide

### SP `1455:5672`

- section: `375 × 1668`
- dark intro background height: `514px`
- intro content x: `32px`, width `311px`, top `64px`
- title: `30px`, centered
- title → English label spacing: `20px`
- heading → lead spacing: `24px`
- lead: `16px / 1.8 / 0.05em`
- card rail starts at y=`401px`, overlapping the intro by `113px`
- card width: `311px`
- image height: `189px`
- cards are contiguous, not separated by 24px gutters
- card body: `24px 20px 32px`, `16px` internal gap
- title: `18px`, icon `36px`
- divider: `36px`
- body copy: `15px / 1.6`

### PC `1603:7370`

- intro/background band height: `320px`
- content rail: `960px`, x=`210px`
- heading/content grid: `200px + 80px + remaining copy rail`
- top content y-offset: `80px`
- cards start at y=`218px`, therefore overlap the 320px intro band by `102px`
- card rail: `960px`, exactly three `320px` columns with no gutter
- card image height: about `194px`
- card body is left aligned, not centered
- card body padding: `24px 32px 32px`
- title: `20px` serif, icon `36px`
- body copy: `16px / 1.8`

## Corrected implementation assumptions

The previous CSS had several structural mismatches that were visible without guessing content:

1. SP heading was 22px instead of the authored 30px.
2. SP intro/body split placed cards after the intro instead of overlapping it.
3. SP cards used 24px gaps although Figma uses one continuous rail.
4. SP image/body typography was undersized.
5. PC cards used 24px gutters instead of three contiguous 320px columns.
6. PC card contents were centered and icon/title stacked, while Figma keeps them left aligned and inline.
7. PC card rail did not overlap the intro band by the authored 102px.
8. PC lead used 15px rather than 16px.

The correction is mobile-first and keeps the same existing PHP markup. PC specialization begins only under `min-width:768px`.

## Asset authority still open

`_top-guide.php` still renders `images/common/noimage.webp` for all three card images. The current Figma nodes clearly contain the Budo / Calligraphy / Budokan photographs, but the tracked Theme does not yet expose canonical production files or CMS ownership for those three images.

Do **not** convert the temporary seven-day Figma MCP asset URLs into production source URLs. Do not infer a new ACF repeater merely to replace the placeholders. The geometry/CSS can be corrected independently; production image ownership remains a separate asset/data gate.

The current Theme already owns the three category icons in `images/top/` and those remain reused.

## Event data lesson from the same dependency pass

Library/post-type availability is not enough to infer event semantics. The current `event` post type and taxonomy do not establish a canonical `開催日` or `募集状態` field. A TOP derivative must consume an existing archive/detail contract when one exists; it must not silently use publish date as event date or invent a new status field solely because Figma displays those concepts.

This remains project-local evidence. Promote it only if the same owner-vs-semantics failure repeats in another independent data family.

## Runtime/browser QA and failed approaches

The PR adds a disposable real-WordPress runtime plus Chromium geometry assertions rather than treating source inspection as a visual PASS.

The WordPress runtime path passed immediately: the real Theme front page rendered `#top_guide-01` and exactly three existing User Guide cards.

The browser QA exposed two harness mistakes before reaching GREEN:

1. A nominal Playwright `375px` desktop-style context produced a `360px` layout content width because Linux Chromium reserved a vertical scrollbar. That made the SP card `296px` rather than the Figma-authored `311px`. This was not fixed in Theme CSS. The QA was corrected to use a mobile/touch context so the runtime matches the authored 375px mobile viewport behavior.
2. The first PC assertion treated Figma's absolute `x=210px` as cross-platform browser truth. Linux Chromium again reserved a 15px desktop scrollbar, so the correctly centered 960px rail began at `202.5px` inside a 1365px layout area. The assertion was corrected to prove the actual invariant — a centered 960px rail with three contiguous 320px columns — instead of baking in a platform-specific scrollbar assumption.

After those harness fixes, both the disposable WordPress runtime and SP/PC browser geometry QA passed on the same code head.

Reusable lesson: exact Figma canvas coordinates are good implementation targets, but browser QA should distinguish authored geometry invariants from OS/browser scrollbar mechanics. Use true mobile emulation for SP and relational centering assertions for desktop rails; do not distort production CSS merely to satisfy a CI runner's scrollbar model.

## Verification boundary

This pass closes the code-level responsive geometry proof for the existing placeholder-image state:

- SP 375px: 514px intro, x=32 / 311px rail, y=401 card start, 189px images, contiguous cards, authored typography
- PC: centered 960px rail, y=218 card start, 3 × 320px contiguous columns, 194px images, left-aligned card body
- real WordPress Theme front-page render path: PASS

It still does **not** claim the final production-image visual PASS because the canonical three User Guide photographs are unresolved. Run the final visual diff again after real assets replace `noimage.webp`.

## Files intentionally untouched

- `parts.php`
- Form/Formidable
- ACF schema/contracts
- Event data schema
- `_top-events.php`
- User Guide PHP data structure
- production image ownership
