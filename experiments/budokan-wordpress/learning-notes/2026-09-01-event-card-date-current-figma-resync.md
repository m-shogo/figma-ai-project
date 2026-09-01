# Event card date punctuation — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` PC Event archive card `1630:9912` date node `1630:9922`: `開催日：2026.00.00～00.00` (Zen Kaku Medium 16 / `#333`).

Owner remains `_list-card_article.php`. No ACF, no date-range field, no `開催日：` prefix.

## Finding

News list / News single / TOP Events already print `Y.m.d`. Event cards still used `Y/n/j`, so the visible date was slash-separated and unpadded.

## Fix

Display `Y.m.d`. Keep `datetime` as ISO `Y-m-d`. Do not invent the `開催日：` label or `～` range; those stay fail-closed until an event-date field exists.

## Lesson

Same as News single: geometry PASS is not punctuation PASS. Align the existing publish-date presentation with the Figma separator before treating a missing prefix as a new CMS contract.
