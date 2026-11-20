# Event card type resync — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC Event archive card `1630:9912` in `1619:9554`
- SP corroboration: TOP `注目の大会・募集` card `1399:11868` in `1455:5487` (same labels/date/title family, SP sizes)

Owner is the existing shared `module_newsCard-01.css` used by `archive.php` + `_list-card.php`. PHP / ACF / date format were not changed. Dedicated SP Event archive page remains UNDETERMINED.

## Finding

LIVE card type is Zen Kaku Medium throughout: labels 13, date SP 14 / PC 16, title SP 16 / PC 18. CSS had title 18/700 with no family, and date/label inherited Noto.

## Fix

Mobile-first Kaku Medium 16/14, PC 18/16. Weight 500 not Bold.

## Lesson

Event archive pager in Figma is the News underline family. WordPress Event archive now reuses `_pagination` variant `news` plus unscoped `.news_pager` CSS. Generic `module_pager-01` remains for search. Year/month calendar chrome on Event Figma stays fail-closed.
