# TOP Events type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC Events `1603:7488` / SNS `1603:7477`
- SP Events `1455:5487`

Owner remains `_top-events.php` + `css/project/top_events.css` + `js/home.js`. PHP, ACF, and FullCalendar initialization were not changed.

## Finding

Geometry (SP heading 28, banner 327×50, image 104×78, tabs 50, SNS 280×60; PC heading 32, gap 80, banner 48 vertical, image 200×150, calendar 420, SNS 280×80) already matched. Type still inherited Noto / Crimson.

LIVE:

- SP JA heading: Zen Kaku Medium 28. PC JA heading: Zen Old Mincho Medium 32.
- SP `Event`: Roboto Regular 14. PC `Event`: Zen Old Mincho Medium 22.
- SP banner: Zen Kaku Medium 18. PC banner: Zen Old Mincho Medium 20.
- Cards / tabs / month / more / SNS: Zen Kaku Medium.

## Cause

`--font-serif-ja` is still Noto Serif JP. Events copied that token for both widths even though SP heading/banner are Kaku and only PC heading/banner are Mincho.

## Fix

Module tokens on the existing owner. SP/PC family split on heading and banner. Zen Kaku on cards, chrome, SNS. Theme-owned FC weekday/day cushions 16 SP. No vendor-DOM QA.

## Lesson

A shared heading class can be Kaku on SP and Mincho on PC. Do not promote `--font-serif-ja` just because the PC specimen is Mincho.
