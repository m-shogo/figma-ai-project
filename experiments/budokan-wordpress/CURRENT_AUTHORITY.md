# Budokan — Current Authority（案件正本メモ）

このファイルは **日本武道館 WordPress 案件**の会話決定を正本化する。  
以降の Agent は、ここを Current Authority として扱い、矛盾する旧命名・旧 LP runtime 前提で進めない。

更新日: 2026-09-19

---

## Agent connector preflight（Human Authority 2026-09-16）

- この案件を継続する各 run / 各セッションでは、**毎回 `@GitHub` と `@Figma` の両 connector を実際に呼んでから着手する**。会話履歴だけで接続可否・最新状態を推測しない。
- GitHub 正本は `m-shogo/figma-ai-project` branch `so`。着手時に最新 ref / authority / 対象コードを直接取得し、前回完了箇所から続ける。
- Figma 正本は file `OtS7731mhY2oD44HSpdADo` のみ。対象 node を LIVE 取得する。`jqYoPtusYfTeDqRegMCsx3` / `zMjOY4euPBi9T23y7ZSM6y` その他旧 file / screenshot は最終実装判断に使わない。
- 片方の取得が失敗しても即「接続不可」と断定せず、対象 connector を実際に呼んだ結果で判断する。
- この preflight 自体を毎回の成果物にせず、確認後は未完了の実装・QAを小さく前進させる。同じ確認だけを繰り返さない。

---

## 命名

- ファイル名・新規ディレクトリに `ref-002` / `ref002` を付けない
- 案件名は `budokan`（Theme slug 実体は `nipponbudokan`）
- 旧 `experiments/ref002-*` / `experiments/wordpress-acf-pro-standalone-lp` は **残置**（リネームしない）
- 新規進行先:
  - `experiments/budokan-wordpress/` … 案件 intake / 本メモ
  - `experiments/wordpress-acf-runtime/` … WP+ACF 実行環境

---

## Theme

- 正本 Theme: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/`
- 出所: **オリジナル**（外部 git repo / commit なし。手元 Theme が正本）
- **この案件のみ Theme を git 追跡する**（Human Authority A）。他案件の drop-in Theme は引き続き ignore
- 差し込みは `theme-dropin/` に **1 Theme のみ**（倉庫として溜めない）
- 本番 Theme 構造を `theme/sample-theme` から継承しない
- 専用ルール: [`THEME_RULES.md`](THEME_RULES.md)
- 当面4 family（イベント / 書写書道 / 武道 / 単行本）の一覧＋詳細表: [`FOUR_FAMILIES.md`](FOUR_FAMILIES.md)
- 刊行物 / 単行本の URL・テンプレ分担: [`PUBLICATIONS_CPT_ARCHITECTURE.md`](PUBLICATIONS_CPT_ARCHITECTURE.md)（Human 2026-09-15。次の大きな実装の正本。現行 Theme `budokan` の役割だけ継承し、archive と公開 IA を同一視しない）

付属:

- Block Patterns: `theme-dropin/nipponbudokan/patterns.json`
- ACF フィールド契約: 本ファイル「ACF」節（`acf-export.json` は退役。`acf/` を再読しない）

---

## ●●パーツ集●● 固定ページ（必須）

- 固定ページ「●●パーツ集●●」の本文は次を正本とする:

```text
experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/parts.php
```

- **タグを追加しない**
- **デフォルトか、`parts.php` の内容を変更なしで使う**
- 勝手に HTML / ブロック markup / class を増やしたり書き換えたりしない
- `parts.php` は Theme PHP テンプレートではなく、ブロックエディタ用 markup の参照ソース

---

## 環境 / プラグイン

- WordPress / ACF PRO: **最新**
- Form: **Human が担当。AI は form 実装しない**（Formidable Forms / Pro は環境に載る想定）
- 最低限 plugin（増えるかも）:
  - Advanced Custom Fields PRO
  - Advanced Editor Tools
  - All-in-One WP Migration and Backup
  - Autoptimize
  - Custom Post Type Permalinks
  - EWWW Image Optimizer
  - Flexible Table Block
  - Formidable Forms
  - Formidable Forms Pro
  - Intuitive Custom Post Order
  - WP Multibyte Patch
  - Yoast Duplicate Post

---

## 業務・編集運用

- 詳細は **Human が随時教える**（先回りで決め切らない）
- News / Events 運用: **変更して sample**（本番運用確定前。実装は sample データで進める）
- editor のカード追加/削除/並び替え要否: **随時**（セクション実装時に確認。UNDETERMINED のまま進めてよい）
- 任意の本番 URL / 実コンテンツ: まだない。随時

---

## TOP カレンダー（Human Authority）

- TOP のカレンダーは **FullCalendar**（手描きテーブル / 自前カレンダー UI は作らない）
- データ源は **Google Calendar**（FullCalendar の Google Calendar plugin）
- Theme 現状に FullCalendar は無い（Swiper のみ）。TOP カレンダー実装時に enqueue する
- Google Calendar の calendar ID / API key は Human が渡すまで sample / 非公開プレースホルダ
- FullCalendar 内部 DOM を QA contract にしない。見た目は Figma に合わせて Theme CSS で包む

---

## Frontend / 人が触れる CSS（必須）

正本:

- `docs/frontend-quick-contract.md`
- `docs/frontend-implementation-standard.md`
- `docs/frontend-maintainability-qa.md`

この案件での読み:

- **absolute 禁止ではないが、通常 content は極力使わない**
- 先に Flow / Flex / Grid。Hero artwork 等 art direction だけ intentional absolute
- Figma 座標の直写で Web を固くしない
- Theme 既存の `global_*` / `module_*` / `gh_` 等に合わせる
- 失敗・手戻り・レビュー指摘は [`IMPLEMENTATION_LEARNINGS.md`](IMPLEMENTATION_LEARNINGS.md) に原因と再発防止まで残す
- 学習は実装後に `research/frontend-learning-evidence*.yaml` / playbook candidate へ戻す（自動昇格しない）

Theme 専用の enqueue・命名は `THEME_RULES.md`。Frontend Standard は Company / Theme / Figma visual を上書きしない。

---

## レスポンシブ / タイポ（Human Authority）

```text
- layout 切替: min-width 768px
- PC canvas: body min-width 1280px（タブレット専用 UI なし）
- フォント: SP 値 / PC 値は固定 px（幅追従・clamp/vw で変えない）
- SP: 〜767 まで幅・余白はレスポンシブ。フォントサイズは SP 帯で固定
- PC: ≥768 は PC レイアウト（必要なら横スクロール）。フォントは PC 固定
- hover: 幅ではなく Theme 既存の any-hover に合わせる
```

- Theme 内の header `1080px` は **イレギュラー。案件ルールとしては気にしない**（後で変える場合は Human が明示）
- デザイン変更あり前提。breakpoint 契約は上記で固定し、細部 px は後から差し替えてよい

---

## ACF（Human Authority 2026-09-03）

フィールド名・用途はこの節が正本。WordPress 実行時の Local JSON / block PHP は Theme 内に残るが、**Agent は `theme-dropin/nipponbudokan/acf/` を再読してフィールドを増やしたり推測したりしない。** `acf-export.json` は退役（旧 portable dump。メニュー ACF グループを含むため使わない）。

フィールドグループ JSON は編集しない。ブロック見た目の markup 修正が必要なときだけ既存 block PHP を触る。新しい ACF / CPT / スラッグは発明しない。**例外:** 2026-09-04 Human が `parts2.php` 用スライダーを指示したので `acf/slider`（`slider_items` → `image` / `caption`）だけ追加済み。**例外:** 2026-09-11 Human がローカルナビを ACF 選択（動的メニュー一覧）で指示したので `page_local_nav` を追加済み。**例外:** 2026-09-15 Human が投稿一覧ブロックへ刊行物 CPT を足すと指示したので `block_post_type` に `budo-book` / `shodou-book` / `tankoubon`、単行本絞り込み `block_book`（taxonomy `book`）を追加済み。**例外:** 2026-09-15 Human がイベント詳細用に次の5フィールドだけ追加してよいと指示。`group_event.json`。他グループは触らない。

| 用途 | フィールド |
| --- | --- |
| TOP スライダー | `top_slider-01` → `img_pc` / `img_sp` / `text` |
| TOP お知らせ | `top_notice_select`（表示する） / `top_notice-01` → `date` / `textarea` / `none`（`_hide`） |
| TOP バナー | `top_banner-01` → `img` / `title` / `url` / `target` |
| 固定ページ タイトル帯画像 | `page_img` |
| 固定ページ ローカルナビ | `page_local_nav`（メニュー ID。なし＝非表示） |
| カテゴリー ラベル色 | `category_color`（枠線・文字。未設定＝本文色） |
| 投稿タイプ既定画像（Options `common_visual`） | `page_img-post` / `page_img-sampleslug` / `page_img-other` |
| SEO（固定ページ） | `page_title` / `page_description` |
| head/body タグ（Options `common_tag`） | `headTag_after` / `headTag_before` / `bodyTag_after` / `bodyTag_before` |
| 投稿の出し方 | `post_type`（`post` / `url` / `file` / `none`） / `postType_url` / `postType_target` / `postType_file` |
| ブロック ページ内リンク | `inPageLink_items` → `inPageLink_title` / `inPageLink_id` |
| ブロック ナビ大 | `navigation-large` → `image` / `title` / `text` / `url` / `target` |
| ブロック ナビ小 | `navigation-small` → 同上 |
| ブロック 投稿一覧 | `block_post_type`（`post` / `event` / `budo-book` / `shodou-book` / `tankoubon`） / `block_category` / `block_event_cat` / `block_book` / `block_posts_per_page` |
| ブロック タブ | コンテナは message のみ。パネルは `panel_title` |
| ブロック スライダー | `slider_items` → `image` / `caption` |
| 開催イベント | `event_status`（なし / 募集中 / 開催中 / 受付終了） / `event_date`（日付） / `event_time` / `event_capacity`（入場数） / `event_fee`（入場料） / `event_host`（主催） |

- グローバルナビは WordPress メニュー。旧 `common-menu-01` / `common-submenu-01` は現行 ACF に無い
- ローカルナビ（Human 2026-09-11 / 2026-09-15）: 外観 → メニューで名前を `ローカル：` で始める（slug は `local-*` に同期）。位置には割り当てない。固定ページ ACF `page_local_nav` の動的一覧にだけ出る（`global-nav` / `mega-nav` / `sub-nav` / `footer-nav` 等の位置割当メニューは除外）。**出すテンプレートはデフォルト `page.php` と `template-form.php` のみ**（1カラム系は出さない）。パンくず上・幅いっぱい・白背景。PC Figma `2108:10846`。SP 専用デザイン無し（非表示）。メニューは**2階層**（1=大会・イベント等のリンク見出し / 2=各ページ）。家族名（武道 振興・普及事業）はメニューに置かない。PC は1階層目を見出し、2階層目を4列で出す。2行リンクがある row は高さを揃え下線をセル下端に揃える。詳細: `LOCAL_NAV_DEPENDENCY_AUDIT.md`
- CPT `event` + `event_cat` は Theme `inc/custom.php`。イベント専用 ACF は上表。空は出さない。`event_status` の「なし」はチップを出さない。一覧は `event_date` の降順（開催日が遠い順）。**Human 2026-09-24: イベント一覧・詳細は終了。次の指示があるまで触らない。**
- **Human 2026-09-24: 武道の一覧・詳細は終了。次の指示があるまで触らない。** 対象は `/publications/budo/back/` と `budo-book` 詳細。最新号は同じ詳細部品（`_budo-detail` / `_budo-body` / `_budo-related` / 総索引）を使うので、指示があるまでまとめて触らない。
- **Human 2026-09-25: 単行本の一覧・詳細は終了。次の指示があるまで触らない。** 対象は `/publications/budo/books/` と `tankoubon` 詳細、および `module_publicationBook.css` / `_book-detail.php` / `_book-list-card.php`。
- Gutenberg ボタンスタイル「小ボタン」= `is-style-small`（Figma btn-02）。wrapper `.small` も互換で残す
- ブロック スライダーは Human 2026-09-04: `parts2.php` 用に `acf/` へ追加してよい
- `parts.php` / Form / Formidable は触らない
- `parts2.php` は Human が編集許可した参照ソース（post 661）

---

## ディレクトリーマップ / メニュー（Human Authority 2026-09-03）

正本: [`DIRECTORY_MAP.md`](DIRECTORY_MAP.md)

- これから言うメニューも、このマップの path / 階層 / 種類に合わせる
- 2026-09-04 Human: メニューは **作成済み**。作り直さない。追加 locaton はマップから載せる
- 2026-09-03 Human: メニューは **4本**。赤ハンバーガーメイン=`global-nav`（Figma SP/PC overlay の項目。URL はマップ）。サブハンバーガー=`sub-nav`。PCメガ=`mega-nav`（Figma 4本＋中身。URL はマップ）。フッター=`footer-nav`（指定10件を1本。見た目2列）。グループ見出しのみ `/`。固定ページはマップ全件（CPT一覧・外部ページは除く）
- PC メガの特殊パネル（Human 2026-09-15 / Figma `2206:9672`）: 外観 → メニューの CSS クラス。L2 に `_megaGrid`（セクション積み + グループ3つ以上は全幅、他は2列）。L4 グループに `_megaCols`（ダッシュ子を2列）。事業案内に限らず同じクラスで使える
- 作るときは完全一致より、マップからそれなりに載せる
- 種類「ナビゲーション」= ナビゲーションテンプレート + **画像付きビジュアル**（`page_img`）
- デフォルト（固定ページ等）= **黄土色**タイトル帯（`page_img` なし）
- マップ上の誤字・空行は無視する

---

## Figma（現行正本）

Human Authority 2026-09-19: デザイン変更。**この file だけを最終 Visual authority として LIVE 再取得する。**

File: [nipponbudokan](https://www.figma.com/design/OtS7731mhY2oD44HSpdADo/nipponbudokan)

| 面 | node-id | 備考 |
| --- | --- | --- |
| PC page | `0:1` | 🎨pc |
| SP page | `114:5409` | 🎨sp |
| 武道一覧 PC / SP | `1634:10806` / `2608:5702` | publications |
| 武道詳細 PC / SP | `1637:11288` / `2608:6933` | publications_detail |
| 書写書道一覧 PC | `2629:7385` | 専用 SP frame なし。武道 publication family を shared responsive authority とする |
| 書写書道詳細 PC | `2630:8447` | 専用 SP frame なし。武道 publication family を shared responsive authority とする |
| 単行本一覧 PC / SP | `1656:5309` / `2627:6075` | hardcover / SP_hardcover |
| 単行本詳細 PC / SP | `1686:5574` / `2628:6964` | hardcover_detail / SP_hardcover_detail |
| TOP 大会・イベント情報 PC | `1603:7488` | TOP 差分確認の重点箇所 |

- 旧 `jqYoPtusYfTeDqRegMCsx3` / `zMjOY4euPBi9T23y7ZSM6y` とそれ以前の file は historical/audit 参照に限る
- Visual の正本は上記 Figma。既存実装の正本は Theme。差分は Theme をこの Figma へ合わせる
- 書写書道 SP は専用 frame を発明せず、武道 publication family の共通 CSS/component owner で成立させる
- Figma から入れる画像（Theme / LP / HTML 共通）: 写真・ラスターは **WebP**。logo / icon はベクターをアウトライン化して **SVG**。短命 URL は直貼りしない。ラスターしか無い logo はトレースしない。正本は `AGENTS.md` Images 節 / `docs/image-gradient-visual-tolerance.md` / `config/frontend-raster-asset-export-policy.yaml`。Budokan Theme 適用は `THEME_RULES.md` 節 12

---

## PC メニュー overlay（Human Authority 2026-09-11）

現行 PC open menu は `2096:6235`（1380×768）。暗幕色は `2182:8277` = `rgb(51 51 51 / 0.9)`。検索 overlay は `2295:8023`。

- 暗幕は **width 100% で viewport 全体**。右 888px を `clip-path` で欠けさせない
- 白パネル（888px）は viewport **上端から**ヘッダーを覆う。`--header-height-PC` 分下げない
- ヘッダー GNavi / EN / 検索 / MENU は **`visibility: hidden` しない**。暗幕とパネルが覆う
- PC の × はパネル内 `#gn_close`（top 20 / right 30 / 60×60）。ハンバーガーを × にしない
- メニュー open でヘッダーを `position: relative` にしない（`_contentFixed` の padding と二重になり背景が落ちる）
- 閉じは検索パネルと同じ: 中身を崩さず 0.3s で右へ隠す。`_closing-menu` 中は `_open-menu` を残す
- sticky ヘッダー stacking のため、PC 開時の全面暗幕はヘッダー SC 内（`header::before`）で描き、白パネルをその上にする。兄弟 `#overlay` だけ上げてパネルを暗幕の下に入れない

ポータブルな判断（次案件）は `docs/frontend-quick-contract.md` 節4。この節の px / node は Budokan 固有。

---

## 実装順 / 全体俯瞰（Human Authority）

基本の土台は固定する。

```text
0. Theme 観測 → この Theme 専用ルールを短く固定
1. Header / Footer
2. パーツ集（parts.php 変更なし）
3. それ以降はページ順・TOP順を固定しない
```

3以降は、実装前に **Figma全体 / Theme全体 / WordPressのデータ構造** を見て、最も手戻りの少ない順に組み替える。

- 同じ UI family が `通常ページ / archive / single / TOP / sidebar / card` にあるか先に探す
- ある場合は、どれが **標準形・マスター・データ正本** かを先に決める
- 通常一覧や共通moduleがマスターなら、TOPを先に作る必要はない。TOPは派生・改良型として共通部品を使う
- 「今このセクションを見ているから次も隣」という理由だけで順番を決めない
- 既存Theme / Component / CSS / PHP / taxonomy / libraryをReuse-Before-Buildで確認してから新規実装する
- 一度決めた順番も、全体確認でより滑らかな依存順が見つかったら変更してよい
- ただし1つの実装単位の中では **SP Figma確認 → SP実装 → SP Runtime QA → PC拡張 → PC Runtime QA → 最終diff** の順を守る

Form は Human 担当のためこの順に含めない。

---

## Agent への短い命令

1. 本ファイルと Theme を先に読む
2. 実装前に Theme 専用ルールを短く決める（命名・Header/Footer・pattern・enqueue）。breakpoint は CURRENT_AUTHORITY の 768/1280 契約に従う（header 1080 は無視）
3. CSS は frontend-quick-contract に従う（通常 content は Flow/Flex/Grid 優先。absolute 極力避ける）
4. パーツ集は `parts.php` を変更なしで使う（タグ追加禁止）
5. form は触らない
6. TOP カレンダーは FullCalendar + Google Calendar。自前カレンダーを作らない
7. `ref002` 名の新規ファイルを作らない
8. デザイン変更前提で、Theme に合わせて載せる。運用未確定・契約変更は Human が明示するまで変えない
9. Header/Footer/Parts後は順番を固定せず、Figma/Theme/WP全体からcomponent familyと依存関係を調べ、マスター→派生の順を優先する
10. SP base → SP Runtime QA → PC extension → PC Runtime QAを1単位として完了させる
11. ミス・手戻りは `IMPLEMENTATION_LEARNINGS.md` に「事象→原因→次回ルール→一般化範囲」で残す
12. 再現可能な学びは evidence / playbook candidate に戻すが、自動で Company Policy へ上げない
13. Figma は本ファイルの file key だけを LIVE 取得する。旧 file は見ない
14. ACF フィールドは本ファイルの表だけ使う。`acf/` と `acf-export.json` を再読しない
15. サイト階層は `DIRECTORY_MAP.md`。メニューは既に作成済み。ナビゲーションは画像ビジュアル、デフォルトは黄土色。刊行物の一覧は CPT ネイティブ archive ではなくマップ path の固定ページが CPT を query する。詳細だけ CPT single。正本は `PUBLICATIONS_CPT_ARCHITECTURE.md`
16. 現行サイト Theme 参照は手元 `C:\htdocs\f-nipponbudokan\wp\wp-content\themes\budokan`。クラス移植禁止。query / skip-latest / tax `book` / CFS→既存 ACF 名だけ継承する。正本は `PUBLICATIONS_CPT_ARCHITECTURE.md`
17. 流用しうる塊は明示パラメーター。`body.home` で再利用 UI を縛らない。正本は `THEME_RULES.md` 節 13 / `docs/wordpress-acf-policy.md`
18. 固定ページも CPT もテンプレは 頭ACF / 本文ブロック（既存 Parts。他件一覧は投稿一覧ブロック）。分割に迷ったら Human。`PUBLICATIONS_CPT_ARCHITECTURE.md` 節0
19. **空フィールドは出力しない。** 値が無いときに「非売品」「データなし」「未選択」等の代替文言をテーマ側で出さない。ACF JSON に移行メモ（CFS、非売品、型変更の説明）を書かない。フィールド名と型を勝手に変えない。対象: `group_nbk_displaytime.json` / `group_nbk_gekkan_budo.json` / `group_nbk_gekkan_shodou.json` / `group_nbk_rensai.json` / `group_nbk_sousakuin.json` / `group_nbk_tankoubon.json`
20. 当面の実装単位はイベント / 書写書道 / 武道 / 単行本の一覧＋詳細。早見表は `FOUR_FAMILIES.md`

---

## 並列作業レーン（Human Authority 2026-09-04）

同じ Theme を Human と Agent が同時に触るときは write-scope を分ける。共有ファイルは片方だけ。

**Human**

- Form は従来どおり Human 担当

**Agent**

- TOP: `css/project/top_*` / `template-parts/_top-*` / `front-page.php`
- パーツ集の見た目: `css/blocks/` と `css/module/`（`parts.php` は読めるが編集しない）
- runtime ホットリロード / PHP limits など `experiments/wordpress-acf-runtime/` 基盤

**両方触らない**

- `css/style.css` / `css/global/variables.css` / `css/layout/`
- `inc/front.php` / `header.php` / `footer.php` / `_header.php` / `_footer.php`
- ACF JSON / `parts.php` / Formidable
