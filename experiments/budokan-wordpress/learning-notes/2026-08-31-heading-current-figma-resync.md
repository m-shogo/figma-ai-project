# Shared heading resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` Parts masters:

- SP `h2_sp` `2190:10305`, `h3_sp` `1451:5679`, `h4_sp` `1468:7466`
- PC `h2` `1157:8179`, `h3` `1157:8184`, `h4` `1157:8189`

Owner remains `css/blocks/wp-block-heading-style.css`. `parts.php` was not edited. h1/h5/h6 are not in the current Parts heading master and were left on `--font-serif-ja`.

## Finding

h2/h3/h4 still used Noto Serif JP. SP h2 was 26px/20px-gap (PC values). SP h4 gap was 16px. SP h2→paragraph was 32px.

Current Parts:

- family Zen Old Mincho Medium
- SP h2 24px / gap 12 / →p 28
- PC h2 26px / gap 20 / →p 32
- h3 20px, Figma inset SP 16×12 / PC 20×16
- SP h4 gap 12, PC gap 16

## Cause

The 2026-08-29 heading master locked PC geometry onto the SP base. After the file-key change, SP heading sizes/gaps are no longer the PC numbers.

## Fix

Mobile-first h2/h4 geometry, Zen Old Mincho on h2–h4, keep the existing h3 **border-compensated** padding (11/15 SP, 15/19 PC). Octagon stays `--clip-octagon`, not a Figma SVG hotlink.

## Lesson

Do not copy Figma h3 inset into CSS padding when a 1px border is already in the box. Do not assume SP heading size equals PC 26px after a design-adjustment file change.
