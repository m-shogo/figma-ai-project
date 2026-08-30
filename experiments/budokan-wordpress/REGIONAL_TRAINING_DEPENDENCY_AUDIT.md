# Budokan — 地域社会武道指導者研修会 dependency / reuse audit

更新: 2026-08-30

## 結論

現行Figma正本とThemeを再確認し、通常固定ページ「地域社会武道指導者研修会」のresponsive authorityを次で確定した。

- SP: `560:537` (`training_sp`, 375 × 2916)
- PC: `1203:4865` (`page`, 1380 × 2182)
- Theme owner candidate: 通常 `page.php` + Gutenberg content + 既存shared block CSS

このページは専用template/componentを増やす根拠がなく、既存のHeading / paragraph / annotation / button / small button / image / table familyをcompositionする方向が正しい。

ただしcanonical Gutenberg block tree / media ownership / 年度切替のeditor/data contractはrepo内で確定していないため、本文や年度データをPHPへhard-codeする実装は行わない。

`parts.php` とForm/Formidableは対象外のまま。

## SP authority

Figma `560:537` をcurrent SP authorityとして再取得した。

### global shell

- canvas: 375px
- page title: `gm_title_s`
- breadcrumb: shared `bread`
- content rail: 335px (`20px` side inset)
- footer: shared `footer_sp`

### intro / body

`560:539`:

- 335px content rail
- body: 16px / 400 / line-height 1.8 / 5% tracking
- paragraph group gap: 20px inside the copy
- annotation: 14px, red `※`
- intro stack gap: 32px
- CTA: 260 × 48px, pill radius 24px
- CTA copy: 16px / 500
- image pair: 160 × 107px × 2, 15px gap, 5px radius
- intro → image pair: 40px

重要: SP CTAはcurrent shared `button_L` default geometry（60px rectangular）とは異なる48px pill derivativeに見える。既存editor style/class authorityが未確認のため、ページ専用CSSや新規blockとして推測実装しない。

### 中学校武道必修化関連事業

`560:551`:

- heading: 22px / 500, 8px red dot, 16px dot-to-text gap
- heading → year controls: 32px
- year controls: 90 × 32px, radius 16px, 14px / 500
- 3 columns × 2 rows
- horizontal gap: 20px
- vertical gap: 20px
- active year: dark `#333` / white text
- inactive: `#eee` / dark text

このyear-control familyは既存shared Tab masterとはgeometry/semanticsが異なる。Tabへ寄せる根拠はない。

### schedule tables

SPは3つの横スクロールtable specimenを縦に並べる。

- each specimen outer width: 335px viewport
- actual table content extends beyond viewport
- first dark No. column: 140px
- label column: 136px
- text: 16px / 400 / line-height 1.5
- table group gap: 30px
- Figma上にscroll hintと5px railが存在

既存shared Table / Flexible Table / scroll-hint ownershipを優先し、ページ専用table markupは作らない。

## PC authority

Figma `1203:4865` をexact title / body / breadcrumbでSP counterpartと確認した。

Main content owner is `1203:4878`:

- content rail: 960px centered
- top padding: 64px
- major stack gap: 72px
- bottom padding: 100px

`1203:4880` intro:

- body: 17px / 400 / line-height 1.6 / 5% tracking
- annotation: 14px / 400 / line-height 1.6
- shared `button_L`: 270 × 60px
- shared `parts / btn-02`: 32px arrow + 15px / 500 copy
- representative image: 645 × 430

PC authority therefore reinforces reuse of the already-implemented shared default button and small-button masters. SP CTA is the exceptional derivative and must not redefine the shared master from one page.

## Local Navigation responsive finding

This page also resolves an important part of the previously open Local Navigation question.

### PC

Within `1203:4865`, Figma contains:

- `1216:6311` `local_nav`
- list width: 1160px
- child `nav_local` instances including the current page title

This proves the PC `local_nav` family is used on a real ordinary page, not only on the Parts specimen.

### SP

The same page does **not** render the 4-column PC local-nav grid. Instead, after content it contains:

- `560:632` navigation area
- title row `武道 振興・普及事業`
- `560:637` 335 × 50px selector-like control with `選択してください`

Therefore the missing SP behavior is no longer “unknown local_nav geometry”: the responsive counterpart is a selector/dropdown-style navigation rather than a compressed local-nav grid.

Theme `page.php` already calls `_dropdown-navigation.php`, whose WordPress owner is the `dropdown-nav` menu rendered through `Custom_Dropdown_Walker_Nav_Menu`. This is a strong existing SP/menu-data owner candidate and must be reused before creating new mobile local-navigation markup.

The remaining uncertainty is the exact PC PHP/render owner for `.local_navigation` / `.ln_links`, and whether the same WordPress menu data is intended to feed both PC local-nav and SP dropdown. Do not guess that mapping until runtime markup/data ownership is proven.

## WordPress / Theme dependency picture

`page.php` currently owns ordinary pages and renders:

1. `_visual`
2. `_dropdown-navigation`
3. `.global_inner._column`
4. `.block-editor_wrap`
5. `the_content()`
6. sidebar

This page therefore remains an ordinary Page + Gutenberg composition candidate.

Existing shared CSS evidence:

- `wp-block-buttonLink-style.css` already owns default `button_L` and `.wp-block-buttons.small` / `parts / btn-02` behavior.
- existing Table/Flexible Table/scroll-hint contracts should own the horizontal schedule tables.
- `module_dropdown.css` already owns the hierarchical WordPress dropdown-nav runtime contract.

No new ACF field group or page-specific PHP template is justified by the current evidence.

## Current blockers / smallest Human authority

The visual hierarchy is sufficiently clear. Remaining blockers are editorial/data ownership, not Figma geometry:

1. canonical Gutenberg block tree for this page, or confirmation that Agent-generated sample editor content may become the implementation seed;
2. the source/ownership of the two intro images and the 645 × 430 PC image;
3. year-selector behavior and data lifecycle (static links, tabs, anchors, or another editorial contract);
4. exact PC runtime owner/data source for `local_nav` if it must be implemented from the same WordPress menu as SP dropdown.

Until those are explicit, do not hard-code page copy/data in PHP and do not invent an ACF contract.

## Reusable findings

- Responsive counterparts can change **interaction form**, not merely dimensions: PC `local_nav` becomes an SP selector/dropdown on this real page.
- A page-specific SP visual exception must not silently redefine a verified shared master. Here the 48px pill CTA differs from shared `button_L`, while PC explicitly uses the shared master.
- Real-page instances are stronger dependency evidence than Parts-only naming, but runtime/PHP ownership still has to be proven before modifying shared Theme CSS.
- For data-heavy ordinary pages, visual authority can be complete while editor/data authority remains incomplete; fail closed on CMS contracts and continue with independent work.

These remain project-local evidence and are not promoted to Company/frontend standards from this single page.
