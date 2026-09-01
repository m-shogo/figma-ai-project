# Publications / Backnumber type coverage — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1634:10806` `publications`
- SP `560:677` `backnumber_sp` remains the responsive counterpart in `BACKNUMBER_DEPENDENCY_AUDIT.md`

No page-specific CSS / PHP / ACF was added. Monthly issue data ownership stays fail-closed.

## Finding

LIVE type on the PC page is covered by existing masters:

- page title Zen Old Mincho Bold 32 → `global_mainVisual`
- `月刊「武道」総索引` Mincho 18 → heading
- `使い方` Mincho 18 → h4
- index download → button_L (Kaku Medium 15)
- issue title Mincho Medium 20 → h3
- `ご注文` / `詳細はこちら` Kaku Medium 16 / 18 → button_L / text-link / in-page-link families already in Theme
- summary Kaku Regular 15 → close to paragraph 17; do not invent a 15px page-specific body
- breadcrumb Kaku 13
- numbered how-to `1.` Roboto Condensed Medium 16 is a specimen leftover beside Kaku body 16. Theme `ol.wp-block-list` stays Kaku. Do not retarget list numbers to Roboto from this page.

## Lesson

Repeated issue rows are still a data-contract problem, not a missing type token. Do not hard-code covers or invent a Backnumber CPT to chase Figma repetition.
