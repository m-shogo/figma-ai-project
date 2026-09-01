# SP hamburger menu type resync — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` SP open menu `2169:10017`. Owner remains `css/layout/global_navigation.css`. PC GNavi top `2209:9850` Mincho Medium 16 is unchanged. PHP / menu contract / accordion Disclosure were not changed.

## Finding

LIVE SP overlay type by depth:

- L2 (`日本武道館について` / `事業について`): Zen Old Mincho SemiBold 18
- L3 group titles (`大会イベント`): Zen Old Mincho SemiBold 16
- L4 children: Zen Kaku Regular 15
- Utility (`お問い合わせ` …): Zen Kaku Medium 13

Theme SP links inherited body Noto. Only PC `.gnl_link-02` had a family.

## Cause

Header chrome was re-read after the file-key change; the open-menu tree was not. Accordion padding and plus rails stayed on the existing Disclosure contract, so type never got an owner declaration on the mobile-first selectors.

## Fix

Mobile-first families on `.gnl_link-02` / `-03` / `-04+` and `.gn_links-02 a`. PC `.gnl_link-02` still overrides to Medium 16. Do not flatten Figma's always-open `#f2f2f2` tree or 42px nested indent onto the accordion.

## Lesson

A Header resync that only measures the 60px closed bar will leave the open overlay on `body` inherit. Re-read `menu` `2169:10017` as its own type owner. Expanded-tree geometry in a static frame is not permission to retire Disclosure.
