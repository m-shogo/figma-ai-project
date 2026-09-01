# Budokan — Local Navigation dependency / responsive authority audit

更新: 2026-09-01

## 結論

Local Navigation の WordPress owner / PHP render path / shared interaction / PC current visual authority は確認済みで、既存実装を再利用する方針は変わらない。

- current Figma file: `fKYDn9ikpJk1nW7IWFtaUx`
- PC current Figma authority: `1216:6311` `local_nav`
- SP current dedicated Local Nav authority: **UNDETERMINED**
- WordPress owner: `sidebar-nav`
- shell derivative: `templates/template-oneColumnLocalNav.php`
- PHP render path: `template-oneColumnLocalNav.php` → `get_sidebar()` → `sidebar.php`
- markup owner: `.local_navigation` / `.ln_links` + `Custom_Sidebar_Walker_Nav_Menu`
- interaction base: walker の `mm_*` class + `common.js` `moduleNavToggle()`
- component CSS: `css/module/local_navigation.css`
- disposable runtime hierarchy proof: `lnl_item-02` → `lnl_item-03` → four `lnl_item-04`

旧監査で current としていた SP `560:632` / page `560:537` は、2026-09-01 の current SP page re-scanでは top-level authorityとして存在を確認できない。旧lineageのSP specimenを current visual authorityへ戻さない。

`parts.php` と Form/Formidable は対象外。

## Current Figma authority

### PC `1216:6311`

2026-09-01 に current file `fKYDn9ikpJk1nW7IWFtaUx` から `get_design_context` をLIVE再取得した。

- full-width white section + top/bottom separator
- padding `56px 110px`
- visible subgroup heading: `指導者研修・指導法研究`
- heading: Zen Kaku Gothic New Medium, 20px
- heading/list gap: `48px`
- child list: 4 columns, gap `20px`, inset `36px`
- child copy: Zen Kaku Gothic New, 14px
- bullet: 5px gold
- current item: gold bottom rule + medium weight

Figma children:

1. `全国武道指導者研修会`
2. `地域社会武道指導者研修会`（current）
3. `中学校武道授業指導法研究事業`
4. literal placeholder `ローカルナビゲーション`

4枠目のproduction destinationは推測しない。

### SP

旧監査では `560:632` をcurrent SP authorityとしていたが、current Figma `fKYDn9ikpJk1nW7IWFtaUx` のSP page `114:5409` を2026-09-01に再走査した結果、Regional Trainingのdedicated current full-page counterpartおよび専用Local Nav closed-state frameは確認できなかった。

したがって現在の扱いは以下。

- current SP pixel-perfect Local Nav authority = **UNDETERMINED**
- `560:632` / `560:537` の旧geometryを新規変更の根拠にしない
- 既存ThemeのSP selector behaviorはshared runtime behaviorとして維持してよい
- shared runtimeが旧specimenと一致していても「current Figma parity」とは呼ばない
- current SP counterpart、またはHumanによる「shared SP behaviorをownerとする」明示が出るまでSP visual再設計はfail closed

## Owner proof

`sidebar.php` が次を所有する。

- `<nav class="local_navigation" ...>`
- `theme_location => sidebar-nav`
- `menu_class => ln_links module_menu`
- `Custom_Sidebar_Walker_Nav_Menu`

walker はLocal Navとshared menuのclassを併記する。

- `lnl_item-* mm_item-*`
- `lnl_title-* mm_title-*`
- `lnl_link-* mm_link-*`
- `lnl_button-* mm_button-*`
- `lnl_wrapper-* mm_wrapper-*`
- `lnl_list-* mm_list-*`

`common.js` の既存 `moduleNavToggle()` が `mm_item*._hasChild` を処理するため、Local Navigation専用JSを新設しない。

`_dropdown-navigation.php` は別の `dropdown-nav` ownerで本文前に描画されるため、Local Navigation rendererへ統合しない。

## Shell / reuse contract

default `page.php` はPCで本文とsidebarを2columnにするため、Figmaの「one-column本文 → global-width Local Navigation」という親layoutとは一致しない。

既存 `template-oneColumn.php` をmasterとし、`template-oneColumnLocalNav.php` は本文後に既存 `get_sidebar()` を置く薄いderivativeとして維持する。

新しいpage-body renderer、Local Nav renderer、menu data contractは作らない。

## Runtime proofの扱い

既存local-only fixture `scripts/seed-budokan-local-nav-qa.php` では、WordPress/WP menu/Waker/runtime pathが以下を出せることを確認済み。

`lnl_item-02` broad family → `lnl_item-03` subgroup → four `lnl_item-04` child links.

PC 1380px runtimeでは以下が確認済み。

- broad-family heading非表示
- subgroup heading `指導者研修・指導法研究` 表示
- depth-02/depth-03 selector button非表示
- depth-04 child 4件が同一row 4 columns
- current item stateがgold bottom rule + medium weight

SP runtime proofはinteraction/shell regression proofとして保持するが、旧 `560:632` をcurrent design authorityへ再昇格させない。

## 現在残るauthority gate

Local Navigationのshared ownerとPC current visualは閉じている。残るのはproduction assignment/dataおよびcurrent SP authority。

- real page(s) の `template-oneColumnLocalNav.php` production assignment
- actual production `sidebar-nav` hierarchy/menu IDs/URLs
- Figma 4枠目の正式destination
- current SP dedicated visual authority、またはshared SP behaviorをownerとするHuman明示
- SP open-stateの正式visual/content behavior

これらが無い状態でQA fixtureをproduction menuへseedしたり、4枠目やSP presentationを推測したりしない。

## Reuse rule

次の変更でも必ず次を先に再利用する。

`one-column shell` → `template-oneColumnLocalNav.php` thin derivative → existing `sidebar-nav` walker → shared `moduleNavToggle()` → `local_navigation.css` responsive specialization.

PC visual diffで差が証明されない限り、新しいpage-specific Local Nav CSSや別rendererを作らない。

## Promotion boundary

runtime/harness lessonはプロジェクト内で再現可能だが、Company/frontend standardへ自動昇格しない。別component familyでも同じ失敗パターンが繰り返された場合に上位evidence候補とする。
