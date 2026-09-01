# 武道とは ruby type — 2026-09-01

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx` PC `1206:5446`. Dedicated SP counterpart is UNDETERMINED on page `114:5409`.

Owner is `css/blocks/wp-block-text-style.css`. Page-specific PHP / ACF / overlapping Figma furigana groups were not cloned.

## Finding

こども武道憲章 furigana in Figma is Zen Kaku Gothic New Regular 10, painted as sibling TEXT over the 16px body. Theme reset still applies Meyer `font: inherit` to `rt`, so native HTML ruby would render at paragraph size.

Other type on this page already maps: page title Mincho 32, h2 26, h4 18, page-link 16, btn-02 15, paragraph 17. Do not retarget global `p` to 16px from the charter body.

## Fix

Scoped `ruby` / `rt` in the Gutenberg wrap: Kaku 10 / 400. Editors must author real `<ruby>` if they want this; Figma overlay groups are not a layout to copy with `position: absolute`.

## Lesson

Canvas furigana is not proof to invent absolutely positioned kana. Restore native `rt` type against the Parts-adjacent specimen, then fail-closed on the missing SP page and the editor ruby contract.
