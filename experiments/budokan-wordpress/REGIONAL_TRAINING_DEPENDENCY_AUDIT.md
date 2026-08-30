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

This page resolves the Local Navigation responsive family and, after a source/render-path re-audit, also resolves its WordPress/PHP owner. Full evidence is recorded in `LOCAL_NAV_DEPENDENCY_AUDIT.md`.

### PC

Within `1203:4865`, Figma contains:

- `1216:6311` `local_nav`
- page-level placement immediately after the 960px body container
- full-width `1380 × 222` section
- child `nav_local` instances including the current page title

The Theme render owner is no longer unknown:

`page.php` → `get_sidebar()` → `sidebar.php` → `sidebar-nav` → `Custom_Sidebar_Walker_Nav_Menu` → `.local_navigation .ln_links`.

The sidebar walker also emits `mm_*` classes, so existing `module_menu.css` and `common.js` `moduleNavToggle()` are the interaction/layout baseline to reuse before adding new behavior.

### SP

The same page does **not** render the 4-column PC local-nav grid. Instead, after the content it contains:

- `560:632` navigation area
- title row `武道 振興・普及事業`
- `560:637` 335 × 50px selector-like control with `選択してください`

A page-level geometry re-check is decisive here: `560:632` is after the body and directly before `footer_sp`. It therefore maps to the responsive form of the sidebar Local Navigation, not to `_dropdown-navigation.php`, which is rendered before content by `page.php`.

The earlier audit treated `_dropdown-navigation.php` / `dropdown-nav` as a strong SP candidate because the control looked selector-like. That was an owner-classification mistake based on visual resemblance before checking full-page order and the actual PHP render path.

`dropdown-nav` remains a separate WordPress menu location and must not be merged with `sidebar-nav` without explicit authority.

### Remaining Local Navigation gate

The component owner and SP/PC visual authority are now known. The remaining blocker is the **actual `sidebar-nav` hierarchy/data fixture**. Figma exposes different hierarchy levels in each responsive form (`武道 振興・普及事業` on SP, `指導者研修・指導法研究` + four child pages on PC), but the repository does not contain authoritative seeded menu items proving which walker depth corresponds to each label.

Until a disposable runtime menu fixture or Human-confirmed hierarchy exists, do not hide/show walker levels or replace labels through CSS guesses.

## WordPress / Theme dependency picture

`page.php` currently owns ordinary pages and renders:

1. `_visual`
2. `_dropdown-navigation` (separate `dropdown-nav` contract)
3. `.global_inner._column`
4. `.block-editor_wrap`
5. `the_content()`
6. `get_sidebar()` → Local Navigation owner (`sidebar-nav`)

This page therefore remains an ordinary Page + Gutenberg composition candidate.

Existing shared CSS/JS evidence:

- `wp-block-buttonLink-style.css` already owns default `button_L` and `.wp-block-buttons.small` / `parts / btn-02` behavior.
- existing Table/Flexible Table/scroll-hint contracts should own the horizontal schedule tables.
- `local_navigation.css` is the Local Navigation component-specific CSS extension point.
- `module_menu.css` + `common.js` `moduleNavToggle()` already provide the generic nested-menu interaction baseline used by the sidebar walker.
- `module_dropdown.css` / `dropdown-nav` are a separate contract and are not the Local Navigation owner.

No new ACF field group or page-specific PHP template is justified by the current evidence.

## Current blockers / smallest Human authority

The visual hierarchy is sufficiently clear. Remaining blockers are editorial/data ownership, not Figma geometry:

1. canonical Gutenberg block tree for this page, or confirmation that Agent-generated sample editor content may become the implementation seed;
2. the source/ownership of the two intro images and the 645 × 430 PC image;
3. year-selector behavior and data lifecycle (static links, tabs, anchors, or another editorial contract);
4. for Local Navigation visual implementation, the intended `sidebar-nav` hierarchy (a disposable QA fixture matching production hierarchy is sufficient; no new production contract is required).

Until those are explicit, do not hard-code page copy/data in PHP and do not invent an ACF contract.

## Reusable findings

- Responsive counterparts can change **interaction form**, not merely dimensions: PC `local_nav` becomes an SP selector-style Local Navigation on this real page.
- A page-specific SP visual exception must not silently redefine a verified shared master. Here the 48px pill CTA differs from shared `button_L`, while PC explicitly uses the shared master.
- Full-page placement + PHP render path are stronger owner evidence than visual resemblance/name. The SP selector is owned by `sidebar.php`, not automatically by a renderer named `dropdown`.
- For data-heavy ordinary pages, visual authority can be complete while editor/data authority remains incomplete; fail closed on CMS contracts and continue with independent work.

These remain project-local evidence and are not promoted to Company/frontend standards from this single page.
