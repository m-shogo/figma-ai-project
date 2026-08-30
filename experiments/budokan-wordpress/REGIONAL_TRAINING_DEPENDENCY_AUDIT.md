# Budokan — 地域社会武道指導者研修会 dependency / reuse audit

更新: 2026-08-30

## 結論

現行Figma正本とThemeを再確認し、通常固定ページ「地域社会武道指導者研修会」のresponsive authorityを次で確定した。

- SP: `560:537` (`training_sp`, 375 × 2916)
- PC: `1203:4865` (`page`, 1380 × 2182)
- Theme owner candidate: 通常1カラムGutenberg content + 既存shared block CSS
- Local Navigation derivative: `template-oneColumnLocalNav.php` + existing `sidebar-nav` walker

このページは本文専用componentを増やす根拠がなく、既存のHeading / paragraph / annotation / button / small button / image / table familyをcompositionする方向が正しい。

Local Navigationについては、後続のruntime/browser QAでSP/PCの3階層responsive構造をdisposable WordPress上で実証済み。したがって、以前の「walker depthが不明」というgateは解消した。ただしproduction page-template assignment / production `sidebar-nav` dataは依然としてHuman/WordPress authorityであり、fixtureを本番データへ昇格しない。

canonical Gutenberg block tree / media ownership / 年度切替のeditor/data contractはrepo内で確定していないため、本文や年度データをPHPへhard-codeする実装は行わない。

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

Full ownership and implementation evidence is recorded in `LOCAL_NAV_DEPENDENCY_AUDIT.md`, `LOCAL_NAV_SHELL_IMPLEMENTATION_2026-08-30.md`, and `LOCAL_NAV_VISUAL_IMPLEMENTATION_2026-08-30.md`.

### PC

Within `1203:4865`, Figma contains:

- `1216:6311` `local_nav`
- page-level placement immediately after the 960px body container
- full-width `1380 × 222` section
- visible subgroup heading `指導者研修・指導法研究`
- four page-link columns, with `地域社会武道指導者研修会` as current item

The Theme render owner is:

`template-oneColumnLocalNav.php` → `get_sidebar()` → `sidebar.php` → `sidebar-nav` → `Custom_Sidebar_Walker_Nav_Menu` → `.local_navigation .ln_links`.

The sidebar walker also emits `mm_*` classes, so existing `module_menu.css` and `common.js` `moduleNavToggle()` remain the interaction/layout baseline.

### SP

The same page does **not** render the 4-column PC local-nav grid. Instead, after the content it contains:

- `560:632` navigation area
- broad-family title `武道 振興・普及事業`
- `560:637` 335 × 50px selector-like control with `選択してください`

A page-level geometry re-check is decisive here: `560:632` is after the body and directly before `footer_sp`. It therefore maps to the responsive form of the sidebar Local Navigation, not to `_dropdown-navigation.php`, which is rendered before content by the ordinary page flow.

`dropdown-nav` remains a separate WordPress menu location and must not be merged with `sidebar-nav` without explicit authority.

### Local Navigation runtime gate status — resolved structurally, production assignment still external

The later disposable WordPress fixture proved the exact walker structure required by the current authored states:

`lnl_item-02` `武道 振興・普及事業` → `lnl_item-03` `指導者研修・指導法研究` → four `lnl_item-04` page links.

Hosted Chromium QA also verified:

- SP 375px closed state: broad-family heading visible, 50px selector visible, closed wrapper collapsed, authored gray background present.
- PC 1380px: broad-family heading hidden, depth-03 subgroup heading visible, depth-04 children rendered as four columns, current Regional Training item preserved by WordPress current classes.

This resolves the former walker-depth/CSS inference blocker without label-specific selectors or a duplicate renderer. It does **not** prove the production menu tree or assign this template to a real production page. The SP open state also remains unauthored in Figma, so no bespoke open-state design is invented.

## WordPress / Theme dependency picture

The generic `page.php` two-column shell is not the correct parent for the Figma page because the authored PC body is a centered ~960px one-column rail and Local Navigation follows the body at global width. Existing `template-oneColumn.php` established the canonical one-column content shell; `template-oneColumnLocalNav.php` is the thin derivative that adds the existing sidebar-nav after content.

For this page, the intended reuse direction is therefore:

1. shared page visual/breadcrumb
2. one-column Gutenberg body ownership
3. existing shared heading/button/table/image masters
4. optional Local Navigation derivative through `template-oneColumnLocalNav.php`
5. existing Footer

No new ACF field group or page-specific hard-coded PHP body is justified by current evidence.

## Current blockers / smallest Human authority

Local Navigation structure is no longer a blocker for disposable implementation. The remaining blockers are editorial/data/production-assignment ownership:

1. canonical Gutenberg block tree for this page, or confirmation that Agent-generated sample editor content may become the implementation seed;
2. source/ownership of the two intro images and the 645 × 430 PC image;
3. year-selector behavior and data lifecycle (static links, tabs, anchors, or another editorial contract);
4. production WordPress assignment of this page to the one-column + Local Navigation shell and the real `sidebar-nav` menu data/tree.

Until those are explicit, do not hard-code page copy/data in PHP, do not invent an ACF contract, and do not promote the disposable Local Navigation fixture into production data.

## Reusable findings

- Responsive counterparts can change **interaction form**, not merely dimensions: PC `local_nav` becomes an SP selector-style Local Navigation on this real page.
- A page-specific SP visual exception must not silently redefine a verified shared master. Here the 48px pill CTA differs from shared `button_L`, while PC explicitly uses the shared master.
- Full-page placement + PHP render path are stronger owner evidence than visual resemblance/name. The SP selector is owned by `sidebar.php`, not automatically by a renderer named `dropdown`.
- A responsive hierarchy that looks ambiguous in static Figma can be tested safely with a local-only CMS fixture. Prove walker depths/current classes in real WordPress before writing breakpoint selectors; keep fixture content separate from production authority.
- For data-heavy ordinary pages, visual authority can be complete while editor/data authority remains incomplete; fail closed on CMS contracts and continue with independent work.

The Local Navigation runtime lesson is repeated executable evidence inside this project, but remains project-local here; it is not automatically promoted to Company/frontend policy.
