# TOP — 作業メモ

更新: 2026-08-28

## Figma

- PC: `1603:7062` topdesign04（全体が大きいのでセクション単位で取る）
- FV 参照: `1399:12229`（figma_thumbnail 内 fv）

## セクション候補（上から）

1. Header（共通）
2. FV: MV + 目的から探す + 重要なお知らせ ← **PC+SP 第一通（CSS を style.css に接続）**
3. 大会・イベント + カレンダー（**FullCalendar + Google Calendar**。自前 UI 禁止）← **PC+SP 検証済み（SNS 3本含む）**
4. 目的から探す（大） ← **PC+SP 第一通**
5. 日本武道館とは ← **PC+SP 第一通**
6. お知らせ（front-page の `top_news-01` は Theme 残り。次セクションで置換）
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
- カレンダーは FullCalendar + Google Calendar plugin。calendar ID / API key は Human 待ち。内部 DOM を QA にしない
- FV CSS は `css/project/top_mainVisual.css`（`style.css` から import）。SP は MV → お知らせ → 目的から探すの順。PC は横並び + お知らせが MV に 40px 重なる
- 大会・イベントは `template-parts/_top-events.php` + `css/project/top_events.css`。カレンダーは FullCalendar 6.1.15（`js/fullcalendar.min.js` + google-calendar plugin）。API key / calendar ID は `nipponbudokan_google_calendar` filter。未設定時は sample events
- MV 写真は sample（PIXTA 透かしあり）。本番アセット待ち
- **2026-08-28 検証（PC 1380 / SP 375・Edge）**
  - PC: 見出し「大会・イベント情報」+ 赤八角 Event、金縦帯、カード4、FullCalendar 月曜始まり、CTA は赤八角矢印+テキスト、SNS 3列
  - SP: Event のみ（日本語見出しなし）、ダーク横帯「注目の大会・募集」、カード縦積み、CTA は金八角矢印、SNS 縦3本
  - 切替（カレンダー/リスト）と前後月は動作確認済み。FullCalendar 内部 DOM は契約外
  - `top_module.css` を head インラインから外した（FV お知らせの SP padding-top 50px / PC absolute 漏れ）
  - 残差: サムネは noimage（sample）、Google Calendar 未接続、SNS URL は `#`、お知らせ帯の Figma（白+赤枠）と現行（赤ベタ）は FV 第一通のまま
- 目的から探す（大）は `template-parts/_top-guide.php` + `css/project/top_guide.css`。クラスは `top_guide-01` / `tg_*`（`gh_` は Header 専用。FV の `tm_guide` とは別）
  - PC: クリーム地、見出し左 + User guide 金八角 + リード右、カード3列（アイコン上・中央）
  - SP: 導入はダーク `#2c3036`、カードはグレー地に白カード縦積み（アイコン左）
  - 写真は sample noimage。本番アセット待ち
- 日本武道館とはは `template-parts/_top-about.php` + `css/project/top_about.css`。クラスは `top_about-01` / `ta_*`
  - PC: 縦見出し + About us 八角、リード右、パンフレット/動画、カード4列（縦書き帯）
  - SP: ダーク導入 + 白パネル、カードは横スクロール（scroll-snap）
  - 写真・PDF・動画 URL は sample / `#`

## 次の作業（引き継ぎ）

順序は上から。PC と SP を同じセクションで対にして直す。`parts.php` と form は触らない。

1. **お知らせ** … `front-page.php` の `top_news-01` stub を Figma に置換（PC: 左見出し+フィルタ、右リスト。SP: タブグリッド+一覧CTA）
2. **公式パートナー**
3. **月刊「武道」**
4. **導線バナー**（既存 `top_banner-01` を Figma 寄せ）
5. TOP 地図付き footer は当面使わない（グローバルは `footer_subpage`）

Human 待ち: Google Calendar ID/API key、SNS/PDF/動画の本番 URL、タイトル写真、form（Formidable）
