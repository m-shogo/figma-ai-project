# Header / Footer — Figma vs Theme（作業メモ）

更新: 2026-08-31（新 Figma `fKYDn9ikpJk1nW7IWFtaUx` 再同期）

## Frontend 契約（人が触る）

- `docs/frontend-quick-contract.md` / `frontend-implementation-standard.md`
- 通常 layout は Flow / Flex / Grid。absolute は極力使わない（icon 線など意図的 micro UI のみ可）
- 学びは実装後 `research/frontend-learning-evidence*.yaml` 等へ戻す

## Figma（現行 `fKYDn9ikpJk1nW7IWFtaUx`）

| | node | 要点 |
| --- | --- | --- |
| Header PC | `2209:9850` | 左340ダークロゴレール + 白ナビ。h100。GNavi Zen Old Mincho 16px/500 tracking 0.8px、current 600+下線。EN/search/menu 60px角 gap10 radius3。右padding 30 |
| Header SP 閉じ | `446:10020` | ダーク帯 h60 / logo 140×28 + EN・search・menu 各60px 隙間なし / ハンバーガー |
| Header SP 開き | `2169:10018` | 同じ3ボタン。menu は赤地に白 × |
| Footer PC | `1901:14268` | 未再同期。次回 Footer セクションで LIVE 再取得 |
| Footer SP 下層 | `560:2524` / `560:188` 末尾 | 未再同期。次回 Footer セクションで LIVE 再取得 |

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

## Footer 突き合わせ（今回）

Human: Header 完成。Footer を PC+SP で進める。

正本:

- PC: `footer_subpage` `1901:14268`（白・リンク2列・金 Page Top・地図なし）
- SP 下層: `news_sp` / `join_sp` 末尾（ダーク・地図・赤 Page Top・sticky お問い合わせ/アクセス）
- TOP の PC 地図付き footer (`1901:13409`) と TOP sticky「目的から探す」はグローバルに入れない

入れたもの:

- ロゴは Header と同じ紋 + picture（SP 白字 / PC 濃色 wordmark）
- アクセスアイコンは Figma 書き出し `icon-access.svg`
- footer-nav / sub-nav 未設定時は Figma 10項目 fallback
- SP 固定バー: お問い合わせ / アクセス（メニュー開時は隠す）
- 地図は SP のみ（静止画・グレースケール）。PC 下層には出さない

残:

- SNS / アクセス / 問い合わせの本番 URL は Human 待ち
- WP メニューが入ったら fallback は消える
- TOP 専用 footer（PC 地図・「目的から探す」sticky）は TOP セクションで別途
