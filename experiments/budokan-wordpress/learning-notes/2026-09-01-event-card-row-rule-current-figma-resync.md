# Event card PC row rule — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` card `1630:9912`: bottom stroke 1px `#d7d4d4` (inside), padding-bottom 24. Grid `1630:9911` row-gap remains 24.

Owner remains `module_newsCard-01.css`. SP Event archive stays UNDETERMINED, so the rule is PC-only.

## Finding

The geometry pass set 2-col / 200×150 but left cards hugging content. LIVE cards include 24px below the row and a 1px bottom rule, not a full box border (`strokeTop/Right/Left` are 0).

## Fix

PC `.mnc-01_article`: `padding-bottom: 24px` + `border-bottom: 1px solid var(--color-line)`. Do not add a 1px box around the thumbnail.

## Lesson

A MIXED strokeWeight on a card is often a single edge. Read per-side weights before treating it as a box outline or as “no border”.
