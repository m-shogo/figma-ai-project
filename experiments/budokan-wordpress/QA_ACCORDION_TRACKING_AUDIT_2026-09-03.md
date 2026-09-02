# QA accordion tracking audit — 2026-09-03

## Scope

Current Figma authority: `fKYDn9ikpJk1nW7IWFtaUx`.

- SP standard Details: `1399:18837`
- SP QA Details: `1399:18857`
- PC standard Details: `1157:8302` / open `1157:8314`
- PC QA Details: `1157:8324`
- Theme owner: `css/blocks/wp-block-details-style.css`
- WordPress markup owner: native Core Details with existing `._qa` variant marker. `parts.php` was inspected only and not changed.

## Observed diff

LIVE text properties show a real breakpoint/variant distinction:

- SP standard summary: Zen Old Mincho SemiBold 18, 150% line-height, 5% tracking.
- SP QA summary: Zen Old Mincho SemiBold 18, 150% line-height, 10% tracking.
- PC standard/open summary: Zen Old Mincho SemiBold 18, 150% line-height, 10% tracking.
- PC QA summary: Zen Old Mincho SemiBold 18, 150% line-height, 5% tracking.

The Theme already matched every case except PC QA: its PC rule set all Details summaries to `0.1em`, and `._qa` did not override that value.

## Fix

Add only `letter-spacing: 0.05em` to the existing `._qa` summary rule inside the existing `min-width: 768px` block.

No DOM, PHP, JS, data model, Form/Formidable, `parts.php`, Slider, Calendar, Search, standard accordion, or SP behavior changes.

## Blast-radius review

The existing editor contract already supplies `class="wp-block-details _qa"` for the FAQ variant. The fix uses that existing marker rather than introducing a page selector or a new Gutenberg style/data model. Standard Details remain on their existing PC 10% rule; SP QA remains on its existing 10% base behavior.

## Verification

The change is directly traceable to current Figma text properties and to the existing Theme cascade. PR CI and the frontend learning promotion review must be green before merge. The generic WordPress runtime harness does not currently seed the Budokan Parts/Core Details surface, so no claim of a new browser fixture is made here.

## Promotion review

Disposition: **KEEP_PROJECT_ONLY**.

This is one Budokan-local case demonstrating that responsive component variants can intentionally reverse a typographic token at one breakpoint. It does not provide independent-reference evidence, so it must not auto-promote beyond PROJECT_ONLY.
