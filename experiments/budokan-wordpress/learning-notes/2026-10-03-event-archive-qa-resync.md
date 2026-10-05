# 2026-10-03 Event archive QA resync

## Authority

- Figma file: `D4c05PxMEw6oZxgRggfcks`
- PC archive: `1619:9554`
- SP archive: `2991:11982`
- Git authority: branch `so`

## Verified implementation contract

The current Event archive implementation already matches the authored layout in the key geometry reviewed in Figma:

- PC rail: 960px; outer top/bottom insets: 64px / 100px; section gap: 64px.
- PC category tabs: `全て / 一般 / 武道 / 書道`, 120x48px, 12px gap.
- PC card: 960x124px sample geometry; 20px horizontal and 24px vertical padding; 24px date divider inset; 90px category label.
- SP rail: 327px inside 24px side insets; top/bottom insets: 48px / 64px; section gap: 32px.
- SP month navigation: previous/current/next month in a 327x40px 3-column grid.
- SP category grid: 327x68px, 3 columns x 2 rows, with two decorative empty cells.
- SP card: 327x157px sample geometry; 20px padding; 24px column gap; date/category column around 45px and body around 218px.
- Event list data uses `event_date`, `event_open_time`, `event_start_time`, and `event_contact`. The UI label follows the product contract `開会` even though the Figma sample text still says `開演`.

## Failure pattern found

The Event archive runtime QA was still validating the old News-card DOM (`.module_newsCard-01`) and was reading the 64px/100px insets from `.event_archive`, although the current owner is `.event_archive_inner`. Its fixture also created legacy taxonomy names and did not populate `event_date`, so the current-month archive query could legitimately return no cards.

The local Event seed also contained literal `\\n` fragments in PHP array entries and legacy `大会 / 体験` terms.

## Prevention rule

Event archive QA must use only the current Event DOM (`.ea_*`), seed through the current ACF contract, preserve `一般 / 武道 / 書道`, and verify both 1380px PC and 375px SP. Do not repair a failing old QA by changing the implementation back toward News archive markup.

## 2026-10-05 local replay

Figma PC `1619:9554` and SP `2991:11982` still match the current CSS at the authored rails (PC 960 / SP 327). The local archive looked empty of the new cards because `seed-event-archive-qa.php` wrote `event_date` as `Y-m-d`, while the archive `BETWEEN` compares the ACF storage format `Ymd`.

The same seed must delete retired QA terms `体験` / `大会`. Otherwise the category board is no longer the authored 4 items plus two SP filler cells.

QA collection must measure the label that has a client rect. The card renders the SP label first, and that node is `display: none` on PC, so `.label` alone reports width 0 even when the visible PC label is 90px.

`networkidle` does not settle while the local hot-reload stamp poll is running. Windows classic scrollbars also shrink a requested 375px viewport to a 360px layout box; the harness has to grow the window until the document box is the Figma width. Neither of those is a reason to change Event CSS.
