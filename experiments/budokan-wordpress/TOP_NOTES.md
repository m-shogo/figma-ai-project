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
6. お知らせ ← **通常Archiveをマスター化 + TOP派生リファクタ + 実WordPress/ACF PRO Runtime Visual QA完了**
7. 公式パートナー ← **SP/PC Figma + 実WordPress/ACF PRO Runtime Visual QA完了**
8. 月刊「武道」
9. 導線バナー
10. Footer（共通。TOP 内に地図付き別案あり → デザイン変更前提で当面 `footer_subpage`）

> 上の番号はFigma上の並び順のメモ。Header / Footer / Parts完了後の**実装順そのものではない**。着手前に全体を見てmaster / derivative / 既存Theme依存を確認し、戻りが少ない順に組み替える。

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

## お知らせ — Archive master / TOP derivative

### 設計

- **通常投稿のお知らせArchiveをマスター**とする。TOPは同じ情報構造の派生。
- 共通1記事: `template-parts/_news-item.php`
- 共通category navigation: `template-parts/_news-tabs.php`
- Archive composition: `template-parts/_news-archive.php`
- Archive / 共通News CSS: `css/module/module_newsList-01.css`
- TOP固有レイアウト差分: `css/project/top_news.css`
- paginationは既存 `_pagination.php` に `news` variantを追加。汎用pagerのmarkup/APIを壊さず、NewsだけSP/PCで別compositionを持つ。
- `module_pager-01.css` のdefaultは `.news_pager` を対象外にし、variant CSSとgeneric CSSのspecificity競合を起こさない。
- 通常post Archive / category / tag / dateはNews masterへ。custom post archiveは従来構造を維持する。
- TOPカテゴリは運用未確定なので表示のみ。勝手にJS filter等の契約は追加しない。

### Figma

- Archive PC master: `1669:5733` / content 960px
- Archive PC pager: `1137:4996` / 40px八角矢印 + 50px underline page numbers
- Archive SP master: `560:4185` / content 335px
- Archive SP pager: `560:4260` / 335×94、40px円形page numbers + 30px薄灰色の前後control
- TOP SP: `446:11772`
- TOP PC: `1603:7236`

### Runtime QA

**実 WordPress + ACF PRO + 実 `nipponbudokan` Theme + Playwright ChromiumでPASS。**

- Fixture: 通常投稿12件 + `武道 / 書道 / 刊行物 / 研修 / 事務局`
- Archive SP authored 375:
  - archive x=20 / width=335
  - 10 posts / 6 category tabs
  - pager width=335 / height=94
  - current page=40×40 dark circle
  - prev/next control=30px lightgray circle + horizontal text
  - HTTP 200 / page error 0 / horizontal overflow 0
- Archive PC authored 1380:
  - archive x=210 / width=960
  - article row約90px
  - pager height=40
  - current page=50×40 underline state
  - prev/next=40px red octagon + white arrow
  - HTTP 200 / page error 0 / horizontal overflow 0
- category `武道` URLへ実遷移し、active tab / masthead「お知らせ」/ breadcrumbを確認。
- TOP derivativeも同じfixtureで同時再検証:
  - SP: section width=375 / panel x=24 / width=327 / 5 posts / 6 tabs
  - PC: panel x=110 / width=1160 / height=606 / 5 posts / 6 tabs
- Linux Chromiumの既存 `scrollbar-gutter: stable` 15px予約はouter viewport側で扱い、News CSSに15px magic compensationは入れない。
- 親frameのgeometry PASSだけでは完了扱いにせず、SP/PC pager子nodeを個別にFigma再取得して最終captureを目視確認済み。

### 学び

- 最初にTOPだけを完成扱いしたのは局所最適だった。Archiveを見てから共通正本を決める方がよい。
- component familyは見た目ではなく、date/category/title/link等の情報構造から判断する。
- Visual QAは親sectionだけでなく、SP/PCでvariantが変わるpager/tab/CTA等の子componentまで確認する。
- 詳細は `IMPLEMENTATION_LEARNINGS.md` に「事象→原因→次回ルール→一般化範囲」で残す。

## 公式パートナー — mobile-first / Runtime QA PASS

### Figma

- SP: `1363:9405` — 375×769
- PC: `1603:7187` — authored 1380 / inner 1160×421
- SPの淡い300×314装飾は実Figma node `1363:9407` をPNG exportしてThemeへ保存。
- PCの公式パートナーrootには同装飾が存在しないため、PCでは非表示。

### 実装

- `template-parts/_top-partner.php` + `css/project/top_partner.css`。
- TOP News直後へ接続。
- 12団体のロゴはFigmaからTheme内 `images/top/partner/` へ永続保存し、一時Figma URLへhotlinkしない。
- 未確定ACF構造や本番URLは作らず、fallback data + `nipponbudokan_top_partner_items` / `nipponbudokan_top_partner_url` filterで差し替え可能にした。
- 同一DOMをSP 2列 → PC 4列へCSSで展開。

### Runtime QA

**実WordPress + ACF PRO 6.8.9 + 実Theme + Playwright ChromiumでPASS。**

- SP authored 375:
  - section x=0 / width=375 / **height=769**
  - inner x=20 / width=335
  - intro height=95
  - list width=335 / height=456
  - card **161.5×66** / logo **30×30**
  - SP CTA height=26 / PC CTAは非表示
  - 12 item / 12 logo / broken logo 0
  - HTTP 200 / page error 0 / horizontal overflow 0
- PC authored 1380:
  - section x=0 / width=1380 / **height=421**
  - inner x=110 / width=1160 / height=421
  - intro width=189
  - list x=410 / width=860 / height=220
  - card **200×60** / logo **40×40**
  - PC CTA height=26 / SP CTAは非表示
  - 12 item / 12 logo / broken logo 0
  - HTTP 200 / page error 0 / horizontal overflow 0
- 既存 `.global_contents > section` がSP 50px / PC 100pxのbottom paddingを追加してFigma寸法を伸ばす競合をRuntimeで発見。`top_partner-01`だけ明示的に上書きし、globalルール自体は変更していない。
- Linux Chromiumの `scrollbar-gutter: stable` 15px予約はouter viewportでのみ吸収し、component CSSへ15px補正を入れていない。

## 次の作業（引き継ぎ）

`parts.php` と form は触らない。

公式パートナーをfinal diff / squash mergeで閉じた後、次は **月刊「武道」編集部** のmaster / derivative監査から開始する。

Figma候補:
- TOP SP `1360:9389`
- TOP PC `1603:7173`
- 刊行物 / backnumber関連ページおよびFooter SNSに「月刊『武道』編集部」表現が存在するため、TOPだけ独立実装せず再利用可能性を先に確認する。

その後:
1. 月刊「武道」: master/derivative監査 → SP Figma → SP実装/Runtime → PC拡張/Runtime
2. 導線バナー: SP `1360:9354` / PC `1603:7145`。既存 `top_banner-01` / Footer系との再利用関係を先に確認
3. TOP 地図付き footer は当面使わない（グローバルは `footer_subpage`）

選んだ1単位では必ず、**SP Figma → SP実装 → SP Runtime QA → PC拡張 → PC Runtime QA → final diff** の順で完了させる。

Human 待ち: Google Calendar ID/API key、SNS/PDF/動画の本番 URL、タイトル写真、form（Formidable）
