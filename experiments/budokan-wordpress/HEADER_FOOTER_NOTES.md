# Header / Footer — Figma vs Theme（作業メモ）

更新: 2026-09-11（現行 Figma `jqYoPtusYfTeDqRegMCsx3`。旧 file は見ない）

## Frontend 契約（人が触る）

- `docs/frontend-quick-contract.md` / `frontend-implementation-standard.md`
- 通常 layout は Flow / Flex / Grid。absolute は極力使わない（icon 線など意図的 micro UI のみ可）
- 学びは実装後 `research/frontend-learning-evidence*.yaml` 等へ戻す

## Figma（現行 `jqYoPtusYfTeDqRegMCsx3`）

実装前にこの file から LIVE 再取得する。旧 file の計測を引き継がない。

| | node | 要点 |
| --- | --- | --- |
| Header シンボル | `1086:3582` | component `2169:10597` 内 |
| Header in megamenu | `2209:9850` | megamenu `2206:9672` 先頭。閉じヘッダー単体の master としては使わない |
| Header SP 閉じ | `446:10020` | SP ページの TOP frame |
| Header SP 開き | `2169:10018` | menu `2169:10017` 内 |
| Footer PC | `2106:9471` | footer_subpage |
| Footer SP | `2189:10106` | footer-sp |

PC には `menu` / `megamenu` / `search` overlay が current top-level として存在する。見た目差分は LIVE context で取る。

PC menu `2096:6235`（Human 2026-09-11）: 暗幕は width 100% でヘッダーごと覆う。白パネル 888px も viewport 上端からヘッダーの上。ヘッダークロームは消さない。閉じる × はパネル内。詳細は `CURRENT_AUTHORITY.md`。

色: main `#bf3e2b` / sec `#ca9957` / text `#333` / search `#4e5055` / logo rail `#2c3036`

フォント: Header GNavi は Zen Old Mincho。EN は Zen Kaku Gothic New Medium 14px。

## 実装方針

1. 既存 `_header.php` / `_footer.php` + `global_header.css` / `global_footer.css`（新規 shell 禁止）
2. クラスは `gh_` / `gn_` / `gf_`。BEM `--modifier` 禁止
3. ロゴは Figma 書き出し（`logo-mark.svg` + wordmark）。手描き SVG 禁止
4. PC/SP を同じセクションで対にして直す
5. form は触らない
6. `parts.php` は触らない

## Header 突き合わせ（2026-08-31 新 Figma）

直した差:

- PC 白全幅 → 左 340px ダークロゴレール + 白ナビ、右 padding 30
- PC GNavi Noto 15px / current 赤字 → Zen Old Mincho 16px/500、current は 600 + 下線、文字色は `#333` のまま
- SP 操作ボタン 52px → 60px、logo を 140×28 相当へ縮小
- EN を Zen Kaku Gothic New Medium 14px に合わせる
- 全幅 border-bottom を廃止（current 下線だけ残す）

残:

- WP に global-nav が無いときは sample 4項目（fallback）
- PC メガメニュー中身はメニューデータ待ち

## Footer 突き合わせ（2026-08-31 新 Figma）

正本:

- PC: `footer_subpage` `2106:9471`（白・リンク2列・金 Page Top・地図なし）
- SP: `footer-sp` `2189:10106`（白・SNS・金 Page Top・地図なし）
- TOP の PC 地図付き footer `1901:13409` と SP `footer-sp-top` `1360:9369` は `get_footer( null, array( 'map' => true ) )`。`front-page.php` だけ渡す。`body.home` / `is_front_page()` では出さない。portable owner: `THEME_RULES.md` 節 13 / `docs/wordpress-acf-policy.md`

直した差:

- SP ダーク地図フッター → 白・ダーク wordmark・SNS 48px・地図なし
- SP Page Top 赤 → 金
- body copy を Zen Kaku Gothic New 14px に合わせる
- TOP は `front-page.php` が `map => true` を渡して既存 `gf_map` を表示。他ページは `get_footer( null, array( 'map' => true ) )` で同じレイアウトを選べる

残:

- SNS / アクセス / 問い合わせの本番 URL は Human 待ち
- WP メニューが入ったら fallback は消える
- SP sticky お問い合わせ/アクセスは `footer-sp` に無いが、現行 full-page で廃止証拠が無いため残す
