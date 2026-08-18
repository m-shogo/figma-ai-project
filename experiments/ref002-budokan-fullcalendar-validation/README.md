# REF-002 Budokan + FullCalendar validation

Temporary independent Web benchmark for PR #132 Fast Loop / Visual Cause Engine.

## Scope

This fixture intentionally validates a **real responsive Web page**, not a graphic artifact.

- Figma file: `RfAQQ28V1HGaeIcpgRmQq1`
- structured PC: `839:4676`
- structured SP: `446:10020`
- final PC visual truth: `2270:4565`
- final SP visual truth: `2270:5570`
- PC event/calendar section: `894:19272`
- SP event/calendar section: `1399:12408`
- PC event list: `894:19280` = `660×744`
- SP event list: `1399:11837` = `327×656`
- PC calendar: `894:19362` = `420×706`
- SP calendar: `1399:11920` = `327×674`

Figma's SP frame contains 40px device/status chrome. Web runtime geometry normalizes that chrome out.

## Evidence domain

- `evidenceDomain`: `web-page`
- generic geometry/typography/rendering learning may be portable
- responsive/section/component findings are Web-domain learning
- FullCalendar findings are library-scoped unless independently repeated elsewhere

Do not promote a one-off FullCalendar override into a global Figma-to-Web rule.

## FIRST_PASS evidence

The first implementation commit is intentionally preserved as `11d95c675b5b99f2dfd86b210c004367f76a8085` before repair.

That first pass exposed real mistakes instead of hiding them:

1. the event area was incorrectly interpreted as two large cards; direct node re-observation showed four authored rows
2. static CI grepped for a JavaScript literal even though the behavior was data-driven
3. browser QA assumed private FullCalendar DOM classes/tags
4. initial metadata summary dimensions for the SP list/calendar were wrong and were corrected by re-reading the concrete target nodes

These failures are evidence. They are not promoted to global rules until clean replay or cross-reference supports them.

## Repair Wave 1

The current repair wave corrects the event/calendar structure while preserving unresolved asset fidelity as an explicit state:

- four event rows
- PC vertical featured-event label
- SP horizontal featured-event label
- exact authored list geometry
- real FullCalendar month/list interaction
- public FullCalendar API + documented render hooks for QA instrumentation
- no persisted short-lived Figma asset URL
- Figma image slots remain `ASSET_PENDING` until approved bytes can be materialized with provenance

An `ASSET_PENDING` slot is never counted as visual fidelity completion.

## FullCalendar contract

FullCalendar is mandatory for the calendar. The month grid is not hand-authored.

Current validation target: FullCalendar `7.0.2` browser global bundle.

Deterministic Figma-comparison state:

- `initialView: dayGridMonth`
- `initialDate: 2023-08-01`
- `firstDay: 1`
- `fixedWeekCount: false`
- `showNonCurrentDates: false`
- custom external toolbar matching Figma
- calendar tab → `dayGridMonth`
- list tab → `listMonth`
- previous/next month controls remain functional

The authored Figma August grid places day 1 on Tuesday. August 2023 is therefore used only to make the Visual QA fixture deterministic; it is not production content authority.

### Library compatibility learning

QA must not treat private `fc-*` DOM/CSS shape as test authority. Runtime assertions use the public Calendar API and documented render hooks, with our own stable `data-ref002-*` instrumentation.

Likewise, do not carry a legacy `calendar.updateSize()` workaround into v7 without a measured runtime failure that actually requires a compatibility repair.

## QA

`qa.mjs` verifies at 1380px and 375px:

- no horizontal overflow
- FullCalendar initialized
- deterministic `8月` initial month
- seven weekday columns, Monday first
- authored fixture events render
- PC event list `660px` and calendar `420px`
- SP event list/calendar `327px`
- calendar/list view toggle works both functionally and visually
- prev/next month works
- runtime screenshots and geometry evidence are uploaded

The #132 Section Capture / Visual Cause tooling then captures the same real Web event section, including stability, document-space geometry, typography, semantic regions, and CSS-owner evidence.

## Promotion gate

Only proven learnings are folded back into #132. This validation fixture itself is not a production feature and should not be merged into `so` after the learning loop is complete.
