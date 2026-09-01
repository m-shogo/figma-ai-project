# Training Center type audit against current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1137:5348` (`navigation_training-center`)
- SP `1468:6595` (`SP_navigation`)

No page-specific CSS / PHP / ACF was added. Canonical WordPress block ownership remains fail-closed on production assignment, as in `TRAINING_CENTER_DEPENDENCY_AUDIT.md`.

## LIVE type (excluding Header / Footer / Font Awesome)

| Role | SP | PC | Existing owner |
|---|---|---|---|
| Page title `研修センター` | Mincho Bold 24 | Mincho Bold 32 | `global_mainVisual` / shared page title |
| h2 | Mincho Medium 24 | Mincho Medium 26 | `wp-block-heading-style.css` |
| h3 | Mincho Medium 20 | Mincho Medium 20 | same |
| h4 | Mincho Medium 18 | Mincho Medium 18 | same |
| Body | Kaku Regular 17 | Kaku Regular 17 | `wp-block-text-style.css` |
| Annotation copy | Kaku Regular 14 | Kaku Regular 14 | `ul.annotation-list` |
| Annotation `※` glyph in file | Noto Sans JP Medium 16 | same leftover | Theme already paints `※` as Zen Kaku Medium 16 / primary red |
| Small button | Kaku Medium 15 | Kaku Medium 15 | `wp-block-buttonLink-style.css` |
| News row title | Kaku Medium 16 | Kaku Medium 16 | `module_newsList-01.css` (#321) |
| Breadcrumb | Kaku 13 | Kaku 13 | `module_breadCrumb.css` |

## Decision

Do not create `page-training-center` CSS. The page is a composition of masters already resynced to this file. The Figma `※` Noto glyph is a specimen leftover, not a new Theme token.

The 8px SP content-rail vs `--padding-SP` question stays fail-closed until canonical page assignment exists. That is geometry, not type.

## Adjacent frames checked in the same pass

- `1145:6042` / SP `1455:5489` 現代武道9種目紹介 — details titles Mincho SemiBold 18 + Kaku 15 body already match details/media-text masters.
- `1148:6390` / SP `1468:7508` 大会・行事に参加したい — page title + purpose heading use the same Mincho Bold / Medium 18 masters.
