# Budokan — 地域社会武道指導者研修会 dependency / reuse audit

更新: 2026-09-06

## 結論

current Human-selected Figma `FKQaJDu5TZXHoCzPsfP92E` とThemeを再確認した結果、このページで確定しているのはPC authorityとshared WordPress ownerであり、旧SP `560:*` はcurrent authorityではない。

- PC current authority: `1203:4865` (`page`, 1380 × 2182)
- SP current dedicated full-page authority: **UNDETERMINED**
- Theme owner candidate: 1カラムGutenberg content + existing shared block CSS
- Local Navigation derivative: `template-oneColumnLocalNav.php` + existing `sidebar-nav` walker

このページは本文専用componentを増やす根拠がなく、Heading / paragraph / annotation / button / small button / image / table / Local Navの既存familyをcompositionする方向が正しい。

canonical Gutenberg block tree / media ownership / 年度切替のeditor/data contract / production template assignmentはrepo内で確定していないため、本文や年度データをPHPへhard-codeせず、新しいACF/CPTも発明しない。

`parts.php` とForm/Formidableは対象外。

## Current PC authority

Figma `1203:4865` はcurrent file上に存在し、page title / body / breadcrumbで地域社会武道指導者研修会ページとして識別できる。

Main contentは約960px centered railで、既存one-column shellとのreuseが妥当。

観察済みのshared family:

- paragraph / annotation
- shared standard button
- small external/detail action
- image
- heading family
- table / scrollable-table family
- Local Navigation
- breadcrumb / footer

PC内のLocal Navigation `1216:6311` は2026-09-01にcurrent fileからLIVE再取得済み。

- full-width white section + top/bottom separator
- padding `56px 110px`
- subgroup heading `指導者研修・指導法研究`
- heading: Zen Kaku Gothic New Medium, 20px
- 4 columns / gap 20px / inset 36px
- child copy 14px
- current `地域社会武道指導者研修会` はgold bottom rule + medium weight

Local Nav詳細は `LOCAL_NAV_DEPENDENCY_AUDIT.md` を正本とする。

## SP authority correction

旧監査では `560:537` `training_sp` と `560:632` Local Navをcurrent SP authorityとしていたが、この前提は失効した。

2026-09-01 のcurrent SP page `114:5409` live re-scanでは、地域社会武道指導者研修会に対応すると証明できるdedicated current full-page frameは確認できない。旧 `560:537` / `560:632` はcurrent top-level authorityへ自動昇格させない。

したがって現在は以下を守る。

- current page-specific SP pixel parity = **UNDETERMINED**
- 旧SP geometry（48px pill CTA、year controls、table dimensions等）を新規Theme変更の根拠にしない
- shared Theme responsive behaviorはruntime behaviorとして維持してよい
- old SP specimenと一致してもcurrent Figma parityとは呼ばない
- Humanがcurrent SP counterpart、またはshared SP mastersをownerとすることを明示するまでSP visual derivativeを追加しない

## WordPress / Theme dependency picture

Generic `page.php` はPCで2-column本文＋sidebarなので、このページのcentered one-column body + full-width Local Navとは一致しない。

既存のreuse順は次。

1. shared page visual / breadcrumb
2. existing one-column Gutenberg shell
3. shared heading / paragraph / annotation / button / table / image masters
4. `template-oneColumnLocalNav.php` thin derivative
5. existing `sidebar-nav` + walker + `moduleNavToggle()`
6. existing Footer

新しいpage-body rendererやLocal Nav rendererは作らない。

## Runtime proofの扱い

既存disposable WordPress fixtureで、Local NavのWordPress hierarchy / walker classes / PC 4-column output / SP selector interactionが実行可能であることは確認済み。

これはshared implementation regression proofとして有効。ただしproduction menu data、production template assignment、current SP Figma visualを証明するものではない。

## Current blockers / smallest Human authority

残るgateはeditor/data/production assignmentとcurrent SP visual authority。

1. canonical Gutenberg block tree、またはsample editor contentをproduction seedとしてよいというauthority
2. media assetsのcanonical ownership
3. 年度切替のeditor/data lifecycle（static links / anchors / tabs / other contract）
4. production pageへのone-column + Local Navigation template assignment
5. real `sidebar-nav` hierarchy/menu IDs/URLs
6. current SP counterpart、またはshared SP responsive mastersをownerとするHuman明示

これらが無い状態で本文copy/dataをPHPへhard-codeしたり、旧SP UIを復活させたりしない。

## Reuse rule

このページの次の実装では、current PC runtime diffで既存shared masterとの差が証明された箇所だけを最小修正する。

`one-column shell` → `shared Gutenberg blocks` → `template-oneColumnLocalNav.php` → `sidebar-nav` walker → existing responsive CSS.

ページ専用CSSは最後の手段。
