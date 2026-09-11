# 2026-09-11 Local Nav ACF / hover / spacing Human FB

## 起きたこと

1. Local Nav を ACF `page_local_nav` + `ローカル：` 接頭辞メニューで実装したあと、子リンクに `white-space: nowrap` を入れて Figma の1行を固定した。
2. 見出し「大会・イベント」の hover で八角アイコンを `clip-path` + `box-shadow: inset` のネガ反転にしたら、**枠が消えた**（直前に同じ注意を受けたのに再発）。
3. 「日本武道館で武道を体験してみよう」の上の行間が詰まって見えた。実測では grid gap 20px のはずが約 13px。原因は親 `.lnl_title-04 { height: 34px }` が、子リンクの `padding-bottom` + border をクリップして次行へ食い込んでいたこと。
4. パンくずとの間に汎用 `margin-top: 100px` が積み上がっていた。Local Nav 直後は 0 に上書き。

## なぜ起きたか

- screenshot fidelity を優先して nowrap / 固定 height を入れた（契約違反・overflow の温床）。
- W3「clip で stroke を食べない」を知っていても、Local Nav だけ `inset box-shadow` に戻してしまった。ボタン系は既に SVG chip で解決済みだったのに family を見なかった（W8）。
- 実測せず「直したつもり」で完了に近づいた（W7）。

## 次回ルール

- Local Nav 子リンクに nowrap を使わない。折り返し可。
- 八角ネガ反転は **SVG chip**（白塗り + 色 stroke）。`clip-path` + inset shadow で invert しない。
- 行の親にコンテンツより低い固定 `height` を置かない。`min-height` / `auto`。padding+border が次行 gap を食う。
- Local Nav 直後のパンくずは汎用 100px を重ねない。
- メニューは3階層（家族 / グループリンク / 子）。PC は 03 見出し + 04 グリッド。SP 専用無し（非表示）。
- 完了前に対象リンクの上下 gap を測り、見出しを hover して枠が残るか見る。

## 契約

- ACF: `page_local_nav`（動的。`ローカル：` のみ。位置割当メニュー除外）
- Theme: `sidebar.php` / `_local-navigation.php` / `local_navigation.css`
- 正本: `CURRENT_AUTHORITY.md` ACF 節
- 弱点: `docs/agent-human-fb-weak-spots.md` W3 / W7 / W8
