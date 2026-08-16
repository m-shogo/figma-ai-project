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
- PC calendar: `894:19362`
- SP calendar: `1399:11920`

Figma's SP frame contains 40px device/status chrome. Web runtime geometry normalizes that chrome out.

## Evidence domain

- `evidenceDomain`: `web-page`
- generic geometry/typography/rendering learning may be portable
- responsive/section/component findings are Web-domain learning
- FullCalendar findings are library-scoped unless independently repeated elsewhere

Do not promote a one-off FullCalendar override into a global Figma-to-Web rule.

## FIRST_PASS

The first implementation wave deliberately stops after:

1. Header PC/SP
2. Hero PC/SP
3. Important notice
4. Event cards PC/SP
5. Real FullCalendar PC/SP

Later sections are deferred so FIRST_PASS evidence is not overwritten before diagnosis.

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

The authored Figma August grid places day 1 on Tuesday, which is consistent with August 2023. This date exists only to make Visual QA deterministic; it is not a production content assumption.

FullCalendar v7 uses its current container resize behavior. Do not add legacy `calendar.updateSize()` calls unless a measured runtime failure justifies a compatibility repair.

## Temporary assets

The FIRST_PASS uses short-lived Figma MCP asset URLs for the hero and two event photos. This branch is a temporary validation branch and must not be merged as a production asset implementation. A production implementation would materialize approved assets with provenance before merge.

## QA

`qa.mjs` verifies at 1380px and 375px:

- no horizontal overflow
- FullCalendar initialized
- 8月 deterministic initial month
- seven weekday columns, Monday first
- authored fixture events render
- PC event list ≈660px and calendar ≈420px
- SP event list/calendar ≈327px
- calendar/list view toggle works
- prev/next month works
- runtime screenshots and geometry evidence are uploaded

After FIRST_PASS is preserved, run the #132 Section Capture / Visual Cause tooling against the same Web fixture, diagnose the first material divergences, and repair the smallest correct owner.
