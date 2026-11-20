# Remaining Gutenberg page type coverage — 2026-09-01

Current file `fKYDn9ikpJk1nW7IWFtaUx`. No page-specific CSS / PHP / ACF. Form `1156:7728` / SP `1451:5737` stays Human-owned.

## Pages that already compose existing masters

- 大会・行事に参加したい PC `1148:6390` / SP shell `1468:7508` — page title + Navigation Large. SP body still UNDETERMINED; do not fill from `560:188` join_sp.
- 現代武道9種目 PC `1145:6042` / SP `1455:5489` — Navigation Large already resynced.
- 地域社会武道指導者研修会 PC `1203:4865` — heading / paragraph 17 / annotation-list / button_L / Local Nav. Figma `※` is Noto leftover; Theme annotation `※` is already Kaku Medium 16. SP `560:537` pill CTA 48px stays fail-closed without an editor class.
- 少年少女武道錬成大会 PC `2108:10725` (FIGMA_MAP `1700:7080` is stale)
- 鏡開き式 PC `2108:10871` (stale `1709:8313`)
- 古武道演武大会 PC `2108:10952` (stale `1714:8761`)

Those three event pages are page title (incl. image variant) + paragraph + h3/h4 + table + annotation + btn-02. MIXED table cells are PDF icon leftovers, not a new token.

## Explicitly not typed this pass

- Search form / search results — Figma has only the 60×60 header search icon. `module_search-01` / `module_searchList-01` stay on body inherit.
- Event archive year/month calendar and `カレンダーで見る` (`btn-02`) — no Theme owner on `archive.php` (dropdown + sidebar). Tab chips on that Figma page already share `module_tab`.
- Dropdown / sidebar archive labels — no Parts dropdown specimen.
- h1 / h5 / h6 — still `--font-serif-ja`; not in current Parts heading master.
- Form / Formidable / `parts.php`.
