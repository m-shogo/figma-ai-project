# Hardcover / issue-detail type coverage — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC hardcover index `1656:5309`
- PC hardcover detail `1686:5574`
- PC publications detail `1637:11288`

No page-specific CSS / PHP / ACF. Same data-contract fail-closed as Backnumber: do not invent a book CPT from repeated Figma rows.

## Finding

Type maps to existing masters:

- page title Mincho Bold 32, h2 Mincho 26, h3 Mincho 20, h4 Mincho 18
- body Kaku Regular 17
- `詳細はこちら` / `バックナンバー一覧` are `parts / btn-02` (Kaku Medium 15) → `.wp-block-buttons.small`
- publications detail `ご注文` is `parts / btn-03` (Kaku Medium 20) → `.wp-block-buttons.cta` added this same pass
- hardcover detail `※` is Noto Sans JP leftover; Theme annotation-list is already Kaku Medium 16
- MIXED price strings on the index are specimen leftovers, not a new token

## Lesson

btn-03 now has a Theme owner. Remaining publication/hardcover work is editor content + monthly/book data authority, not another type pass.
