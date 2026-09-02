# Tournament table variant audit — 2026-09-03

## Scope

Current Figma authority: `fKYDn9ikpJk1nW7IWFtaUx`.

- Tournament page: `2108:10725` (`page_youth-budo-tournament-02`)
- Shared table Headercell master: `1157:8286`
- Theme owner: `css/blocks/wp-block-table-style.css`
- Existing human-editable editor owner: Flexible Table Block patterns in `patterns.json`, including `左ヘッダー付きテーブル`

No Theme PHP/CSS/JS, ACF/CPT, Form/Formidable, `parts.php`, Slider, Calendar, or Search changes are made by this audit.

## Live finding

The current tournament page is composed from the existing shared table family, but its left row-header labels (`趣旨`, `会場`, `参加資格`, `表彰`) are authored as Zen Kaku Gothic New **Medium 500**, 15px, line-height 1.6, letter-spacing 5%.

The current shared Headercell master `1157:8286` is Zen Kaku Gothic New **Regular 400**, 15px, line-height 1.6, letter-spacing 5%. The Theme correctly reflects that shared master with `th { font-weight: 400; }`.

Therefore changing the shared `th` rule to 500 would fix one tournament instance by regressing the canonical table Headercell and other table consumers. That is an unacceptable blast-radius expansion.

## Reuse-before-build disposition

- Reuse the existing Flexible Table Block / shared table CSS for structure, dimensions, borders, color, and base typography.
- Do **not** globally change `th` weight.
- Do **not** add a tournament page-specific selector or new Gutenberg style slot merely from this visual override.
- A 500-weight derivative is only authorized if an existing editor/data marker is found, or Human authority explicitly defines a reusable table variant.
- Until then, this one typography delta remains an observed but intentionally fail-closed implementation difference.

## Promotion review

This is one Budokan-project observation, not independent cross-project evidence. Keep the learning `PROJECT_ONLY`; do not auto-promote.
