# TOP — 作業メモ

更新: 2026-08-28

## Figma

- PC: `1603:7062` topdesign04（全体が大きいのでセクション単位で取る）
- FV 参照: `1399:12229`（figma_thumbnail 内 fv）

## セクション候補（上から）

1. Header（共通）
2. FV: MV + 目的から探す + 重要なお知らせ ← **着手中**
3. 大会・イベント + カレンダー
4. 目的から探す（大）
5. 日本武道館とは
6. お知らせ
7. 公式パートナー
8. 月刊「武道」
9. 導線バナー
10. Footer（共通。TOP 内に地図付き別案あり → デザイン変更前提で当面 `footer_subpage`）

## 実装メモ

- 既存 `front-page.php` / `top_*` CSS を改修（新規 shell 禁止）
- 命名は `tm_` / `top_` / Theme 流儀
- ACF 未投入時は sample fallback（MV・notice・guide）
- `parts.php` は触らない
- form は触らない
