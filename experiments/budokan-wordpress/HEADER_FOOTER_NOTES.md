# Header / Footer — Figma vs Theme（作業メモ）

更新: 2026-08-28

## Frontend 契約（人が触る）

- `docs/frontend-quick-contract.md` / `frontend-implementation-standard.md`
- 通常 layout は Flow / Flex / Grid。absolute は極力使わない（icon 線など意図的 micro UI のみ可）
- 学びは実装後 `research/frontend-learning-evidence*.yaml` 等へ戻す

## Figma（現行）

| | node | 要点 |
| --- | --- | --- |
| Header PC | `1399:12372` | h100 / logo + 4ナビ(chevron) + EN/search/menu 60px角 |
| Footer PC | `1901:14268` | logo+住所+SNS / 2列リンク / copyright + Page Top |

色の目安: main `#bf3e2b` / sec `#ca9957` / text `#333` / copyright bar `#2c3036`

## Theme 現状との差

- 現行 Header は汎用 Codia 殻（cyan primary、hamburger 右上、PC で menu 非表示）
- Figma は武道館ブランド（赤/金）、PC でも menu / EN / search を常時表示
- Footer も住所・SNS・2列リンク・Page Top の構成が現行と大きく違う
- フォント Figma は Zen 系。Theme は Noto/Roboto → **当面 Theme フォントを維持**（差し替えは別判断）

## 実装方針

1. 既存 `template-parts/_header.php` / `_footer.php` + `global_header.css` / `global_footer.css` を改修（新規 shell 禁止）
2. layout は flex。fixed header は sticky 用途として維持可
3. デザイン変更前提なので構造とトークンを先に合わせ、pixel 追い込みは後
4. form は触らない

## SP

SP menu 例: `2096:9496`。Header SP は後続で PC 殻に合わせて調整。
