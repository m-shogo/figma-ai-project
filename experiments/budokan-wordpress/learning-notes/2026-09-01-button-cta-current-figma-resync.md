# Gutenberg CTA button (btn-03) — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC Parts `parts / btn-03` `1157:8271` (400×80)
- SP Parts `parts / btn-03-sp` `1450:5194` (327×88)
- PC Event detail instance `1634:10787` (`お申込み`)

Owner remains `css/blocks/wp-block-buttonLink-style.css`, same file as button_L and `.small` (btn-02). `parts.php` / ACF were not changed. Editors add class `cta` on `.wp-block-buttons`, matching the existing `.small` hook.

## Finding

Event detail CTA is not button_L. LIVE fill is `--color-primary`, label Zen Kaku Gothic New Medium, SP 18 / PC 20. Hidden master leftovers (PDF glyph, trailing chevron) stay off. Theme had no btn-03 owner, so Event `お申込み` fell through to 60px / 15 button_L.

## Fix

`.wp-block-buttons.cta` mobile-first 88×18 / padding 16 / gap 12, PC 80×20 / padding 16×24 / gap 15 / width 400. White 26 octagon arrow stays on the existing `::before`. Geometry of button_L and `.small` is unchanged.

## Lesson

A page CTA instance is not proof to restyle the default button. Read the Parts component name (`btn-03` vs `button_L` vs `btn-02`) before changing shared button CSS. SP Event detail page remains UNDETERMINED; the SP Parts master is still enough for mobile-first btn-03.
