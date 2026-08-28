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
6. お知らせ ← **mobile-first 実装 + 実WordPress/ACF PRO Runtime Visual QA 完了**
7. 公式パートナー
8. 月刊「武道」
9. 導線バナー
10. Footer（共通。TOP 内に地図付き別案あり → デザイン変更前提で当面 `footer_subpage`）

## 実装メモ

- 既存 `front-page.php` / `top_*` CSS を改修（新規 shell 禁止）
- 命名は `tm_` / `top_` / Theme 流儀
- **TOP は mobile-first。SP を通常フローの正本として先に実装し、PC は `@media (min-width: 768px)` で拡張する**
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
- お知らせは `template-parts/_top-news.php` + `css/project/top_news.css`。`front-page.php` の旧 stub は template-part 呼び出しへ置換
  - Figma: SP `446:11772` / PC `1603:7236`
  - SP 正本: 左右24px、上下64px、見出し+一覧CTA、3列×2段カテゴリ、記事5件縦積み
  - PC 拡張: 1160px 白パネル、160pxサイド + 記事列、カテゴリ縦表示、記事横組み
  - WordPress 投稿があれば最新5件を表示。投稿なしは Figma 照合用 sample 5件
  - カテゴリ表示の実際の絞り込み方法は News 運用未確定のため第一通では表示のみ。勝手に JS filter / taxonomy 契約を作らない
  - 日付数字は Figma 幅に合わせ Theme の `--font-sansSerif-en`（Roboto）12pxを使用
  - **2026-08-28 実Runtime QA: WordPress 7.0.2 + ACF PRO 6.8.9 + 実 `nipponbudokan` Theme + Playwright Chromium PASS**
  - SP authored 375: section width=375、panel x=24 / width=327、article=5、category=6、HTTP 200、page error 0、horizontal overflow 0。section DOM height=974.9375（Figma 975相当）
  - PC authored 1380: section width=1380、panel x=110 / width=1160 / height=606、article=5、category=6、HTTP 200、page error 0、horizontal overflow 0
  - Linux Chromium は既存 `scrollbar-gutter: stable` が15pxを予約するため、CIは outer 390→authored 375 / outer 1395→authored 1380 として比較。News固有の15px補正は入れない
  - SP→PCの順で最終captureを目視比較し、日付・カテゴリ・タイトル開始位置、PC `News` 灰色八角、active/inactiveカテゴリ点、罫線のPC漏れを修正済み

## 次の作業（引き継ぎ）

PC と SP を同じセクションで対にして直す。`parts.php` と form は触らない。

1. **公式パートナー** … まずSP正本をFigmaから取得・構造確認 → 実装 → SP Runtime QA → PC拡張 → PC Runtime QA
2. **月刊「武道」**
3. **導線バナー**（既存 `top_banner-01` を Figma 寄せ）
4. TOP 地図付き footer は当面使わない（グローバルは `footer_subpage`）

Human 待ち: Google Calendar ID/API key、SNS/PDF/動画の本番 URL、タイトル写真、form（Formidable）
