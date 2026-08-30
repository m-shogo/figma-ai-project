# Budokan TOP Events visual alignment — 2026-08-31

## Scope

This pass re-checked the current Figma / Theme / WordPress dependency picture before selecting the next section. The target is the existing TOP Events owner only; no new event renderer, ACF contract, or calendar system is introduced.

Authority used:

- canonical SP TOP: `446:10020`
- SP Events: `1455:5487`
- canonical PC TOP: `1603:7062`
- PC Events: `1603:7488`
- PC SNS derivative: `1603:7477`
- Theme markup owner: `template-parts/_top-events.php`
- Theme CSS owner: `css/project/top_events.css`
- behavior owner: `js/home.js`
- enqueue/config owner: `inc/front.php`
- calendar authority: `CURRENT_AUTHORITY.md` = FullCalendar + Google Calendar plugin

`parts.php`, Form/Formidable, ACF schema, and event schema are intentionally untouched.

## Dependency re-check

The foundation remains Header → Footer → Parts. Among the remaining TOP families, Events is now a safe visual target because the Theme already has:

- one `_top-events.php` owner;
- FullCalendar and its Google Calendar plugin enqueued on the front page;
- `home.js` behavior for calendar/list switching and sample-data fallback while credentials are absent;
- existing Event post type/taxonomy ownership for cards;
- the SP SNS markup already co-located with the Event owner, while PC Figma renders the same three links as the immediately following SNS band.

This means the current work is a responsive correction to an existing master/derivative family, not a new TOP-only system.

## Fresh Figma findings

### SP `1455:5487`

- section width: 375px;
- heading: `大会・イベント情報` 28px centered, with `Event` marker below;
- content rail: 20px side padding;
- featured banner: about 327×50px, horizontal dark band;
- four featured rows;
- each featured image: 104×78px;
- status/category chips: 20px high;
- date: 14px; title: 16px;
- calendar/list tabs: two equal 50px controls;
- month controls use 36px navigation shapes;
- FullCalendar is the implementation authority for the calendar body; Figma's internal calendar cells are visual reference only;
- SNS follows the calendar in the same responsive family: three 280×60px stacked controls.

### PC `1603:7488` + SNS `1603:7477`

- Events section uses 110px side rails / 1160px content width and 80px top space;
- heading: 32px;
- inner layout is featured rail + 80px gap + fixed 420px calendar rail;
- featured label becomes a narrow vertical gold rail;
- event images become 200×150px;
- date becomes 16px; title 18px;
- calendar tabs are 210+210px;
- SNS is the immediate next PC band and contains the same three destinations in one row;
- each PC SNS control is 280×80px with 20px gaps and 80px vertical band padding.

## Previous implementation mismatches

The existing Theme already had the correct ownership but its geometry represented an earlier approximation:

- SP Japanese heading was hidden;
- SP featured images were 90×90 instead of 104×78;
- SP featured banner typography/height was smaller;
- PC used a 50/50 Events layout rather than the fixed 420px calendar rail with 80px gap;
- PC featured images were 160×100 instead of 200×150;
- PC SNS controls were 64px high rather than 80px;
- section background and several type sizes no longer matched current Figma.

The fix changes only CSS. Existing PHP/JS/data owners remain in place.

## WordPress/data authority still unresolved

`_top-events.php` currently uses `get_the_date()` under a `開催日` label when real Event posts exist, and does not have a canonical real-post recruitment-status field. Those semantics are not established by the current ACF/Event contract. This pass does not rename fields, treat publish date as a newly-approved event date, or invent a status contract.

The disposable visual/runtime fixture deliberately creates no Event posts so the already-authorized sample branch is used. Therefore the responsive visual work can be verified without silently legitimizing unresolved production semantics.

Google Calendar `calendarId` / `apiKey` also remain Human Authority. `home.js` correctly stays in sample-event mode while both values are empty.

## Runtime/browser QA

A dedicated workflow renders the real Theme front page in disposable WordPress and verifies:

- Events owner and four fallback cards render;
- FullCalendar core, Google Calendar plugin, and `home.js` are enqueued;
- no production Google credentials are fabricated;
- Chromium renders a real `.fc` calendar at both widths.

Browser geometry assertions intentionally target Theme-owned shells rather than FullCalendar's internal DOM.

SP contract:

- 375px section;
- visible 28px Japanese heading;
- ~327×50 featured banner;
- 104×78 first event image;
- 50px view tabs;
- FullCalendar rendered;
- three 280×60 stacked SNS controls.

PC contract:

- 32px heading;
- grid layout with 80px gap and 420px calendar rail;
- vertical featured label rail;
- 200×150 event image;
- FullCalendar rendered;
- full-width SNS breakout with three 280×80 controls in one row.

## Reusable findings

1. A responsive derivative may move to a visually separate band on PC while still sharing one markup owner. Do not duplicate the SNS data/markup solely because Figma promotes it to a sibling PC frame.
2. For third-party widgets, assert the Theme-owned container/controls and the fact that the widget rendered; do not make vendor-internal DOM the durable QA contract.
3. Visual work can safely use an authorized sample-data branch when production semantics are unresolved, but the fixture must explicitly avoid turning that sample into production authority.

These remain Budokan-project findings until repeated evidence warrants promotion.
