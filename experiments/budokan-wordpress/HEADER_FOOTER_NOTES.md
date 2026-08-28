# Header / Footer — Figma vs Theme（作業メモ）

更新: 2026-08-28

## Frontend 契約（人が触る）

- `docs/frontend-quick-contract.md` / `frontend-implementation-standard.md`
- 通常 layout は Flow / Flex / Grid。absolute は極力使わない（icon 線など意図的 micro UI のみ可）
- 学びは実装後 `research/frontend-learning-evidence*.yaml` 等へ戻す

## Figma（現行）

| | node | 要点 |
| --- | --- | --- |
| Header PC | `1399:12372` | 白 / h100 / logo(金赤+薄い字) + 4ナビ(赤 angle-down) + EN/search/menu 60px角 gap10 radius3 / padding 60/20 |
| Header SP 閉じ | `446:10020` | ダーク帯 / logo白字 + EN・search・menu が隙間なく全高 / ハンバーガー |
| Header SP 開き | `2096:9573` | 同じ3ボタン。menu は赤地に白 × |
| SP menu 別案 | `2096:9496` | PlanB。閉じボタンが白枠 × のみ（3ボタン案を正とする） |
| Footer PC | `1901:14268` | logo+住所+SNS / 2列リンク / copyright + 金 Page Top。地図なし |
| Footer SP 下層 | `560:2524` / `560:188` 末尾 | ダーク / logo白字+住所+アクセス / グレー地図 / copyright + 赤 Page Top / sticky お問い合わせ・アクセス |

色: main `#bf3e2b` / sec `#ca9957` / text `#333` / search `#4e5055` / logo字 PC `#e6e6e6`

フォント: Figma は Zen 系。Theme は Noto/Roboto を当面維持。

## 実装方針

1. 既存 `_header.php` / `_footer.php` + `global_header.css` / `global_footer.css`（新規 shell 禁止）
2. クラスは `gh_` / `gn_` / `gf_`。BEM `--modifier` 禁止
3. ロゴは Figma 書き出し（`logo-mark.svg` + wordmark）。手描き SVG 禁止
4. PC/SP を同じセクションで対にして直す
5. form は触らない
6. `parts.php` は触らない

## Header 突き合わせ（今回）

直した差:

- 旧 Codia `logo.svg` → Figma 紋+社名
- SP が白ヘッダー＋ハンバーガーのみ → Figma どおりダーク＋EN/search/menu 常時
- SP 開時ハンバーガー → ×
- PC ナビ セリフ 15px / 赤 `\f107` / gap 48
- search の JS が `#search` のまま効いていなかった → `#gh_search`
- JS の 1080 判定 → 案件 768

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
