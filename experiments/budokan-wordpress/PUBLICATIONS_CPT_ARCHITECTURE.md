# 刊行物 CPT / 公開URL の組み立て（次の大きな実装の正本）

更新: 2026-09-19  
参照 Theme（現行サイト）: `C:\htdocs\f-nipponbudokan\wp\wp-content\themes\budokan`  
実装 Theme: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/`  
公開 IA: `DIRECTORY_MAP.md`  
Visual: `FIGMA_MAP.md` / `CURRENT_AUTHORITY.md` の file key のみ

この文書は Human が「次の大きな実装で大事だから覚えて」と指定した契約。Agent は刊行物・単行本に着手する前に読む。現行 `page-shupan*.php` をクラスごと移植しない。**役割分担と query 契約だけを継承する。**

オリジナルの Theme テンプレートを新 Theme に作る（旧 HTML/CSS のコピーではない）。

**固定ページも CPT も同じ型。** 号詳細だけの話ではない。迷う分割は Human に聞く。Agent がページごとに ACF / 本文 / 自動を自己判断しない。

---
## Human override 2026-09-19 — Visual / 実装順

この節は本ファイル内の古い「書写 single 未確定」「SP counterpart 未確定」「旧 Figma key」記述を supersede する。

- 現行唯一の Figma Visual authority: `d1pD6gL2Sqal8Cf6h9WLp6`（Human 2026-09-25）
- PC page: `0:1` / SP page: `114:5409`
- この節より下の frame node-id は前 file `OtS7731mhY2oD44HSpdADo` の記録。新 file では未確認なので、実装前にページを再走査する
- 武道一覧 PC/SP: `1634:10806` / `2608:5702`
- 武道詳細 PC/SP: `1637:11288` / `2608:6933`
- 書写一覧 PC: `2629:7385`、書写詳細 PC: `2630:8447`。専用 SP は無く、武道 publication family の shared responsive rule を使う
- 単行本一覧 PC/SP: `1656:5309` / `2627:6075`
- 単行本詳細 PC/SP: `1686:5574` / `2628:6964`
- 実装順: 武道残り完了 → 書写詳細/一覧 → 単行本詳細/一覧 → 全 gate 完了後 TOP
- TOP は新旧差分表を先に作る。重点確認 node は大会・イベント情報 PC `1603:7488`

単行本一覧は「最新刊自動取得」「カテゴリ見出しへのページ内リンク」「カテゴリごとに全件自動取得」「ページャーなし」。単行本詳細は現行サイト同等の仕様を既存 `tankoubon` CPT/ACF/content owner で実現し、新 data model を発明しない。

---


## 0. 共通のページ型（Human 2026-09-15）

オリジナルテンプレート1本の中は、原則この3段。

```text
① テンプレが描く頭     … 毎号・毎ページ同じ骨格。ACF + タイトル + アイキャッチ + 固定CTA
② 本文                 … ブロックエディタ（the_content）
                         既存 Gutenberg + 既存 Parts
                         他件一覧が要るところだけ ACF 投稿一覧ブロック
```

適用:

- CPT single（`budo-book` / `shodou-book` / `tankoubon` / news / event など、頭と尻が型にはまるもの）
- それを query する固定ページ（最新号 page 等）。中身の part は single と共有

②に載せる「型のある塊」は、wysiwyg を増やさない。

- おすすめ / ピックアップ / 特集 / 連載: **既存 Gutenberg + 既存 Parts**（Human 2026-09-15。新規 ACF Block にしない）
- バックナンバー等の他件一覧: **既存 ACF 投稿一覧ブロック**に CPT を足す（`budo-book` / `shodou-book` / `tankoubon`）。本文②の末に置く。テンプレ③の PHP 直 query にしない
- 新しい Block / フィールドは Human が指してから

Figma を見て「これは①か②か」が一本に決まらないときは実装しない。聞く。

---

## 1.1 号詳細 `1637:11288` の3段（Human 2026-09-15）

前 file の記録: `OtS7731mhY2oD44HSpdADo` の `1637:11288`。現行 file `d1pD6gL2Sqal8Cf6h9WLp6` の node ではない。

`single-budo-book.php`（最新号 page も同じ part）の中身は次の3段。**オリジナルテンプレートに書く。**

```text
① ご注文まで     … ACF + アイキャッチ + タイトル（テンプレが組み立てる）
② ご注文の下     … ブロックエディタ（the_content）
                 おすすめ / ピックアップ / 特集 / 連載 = 既存 Parts
                 末尾のバックナンバー5冊 = ACF 投稿一覧ブロック（budo-book、件数5）
                 「バックナンバー一覧」リンク = 既存 Parts のボタン
```

テンプレ尻の自動 PHP ギャラリーは作らない。single で同じ CPT を開いているときは、投稿一覧ブロックが今の号を `post__not_in` する。最新号**固定ページ**では page がクエリ対象なので除外されない。旧サイトの offset 1 が必要ならそのとき聞く。

### ① ACF（ご注文まで）

テンプレがフィールドを並べる。毎号同じ骨格。

- 表紙: アイキャッチ（必要なら `budo_topimg` は TOP 用のまま）
- 見出し月号: `budo_month` + タイトル
- キャッチ・紹介・版型/ページ/定価/定期購読: 既存 `budo_size` `budo_page` `budo_price` `budo_teiki` 等。キャッチ文言を新フィールドにしない（現行 Theme は PHP 直書き。Figma と差があれば既存フィールドか本文の外に出さない）
- **ご注文**: テンプレ固定リンク → DIRECTORY_MAP `/publications/budo/order/`（Form は Human）。ACF ボタンにしない

### ② ブロックエディタ

Figma の「今月のおすすめ」「今月のピックアップ」「今月の特集・企画」「連載」は **本文**。Parts の h2/h3、リスト、画像、カード相当ブロックを号ごとに組む。

- `the_content()` を ① の下に置く
- 現行 ACF の wysiwyg（`budo_speacial` `budo_rensai` 等）は **本文へ移す方向**。新 wysiwyg を足さない。移行完了までフィールド削除しない
- おすすめ / ピックアップは既存ブロックエディタ + Parts。repeater を詳細 PHP に直書きしない。専用 ACF Block も新設しない

### バックナンバー一覧（本文の投稿一覧ブロック）

号詳細・最新号の本文末に ACF `acf/custom-post-list` を置く。`block_post_type=budo-book`、表示件数 5。表紙は既存 `wp-block-gallery` クラスで出す（Parts ギャラリー CSS）。「バックナンバー一覧」文言リンクはブロック外の Parts ボタン。

`group_nbk_rensai` / `sousakuin` は号詳細 Figma のこの3段には出ていない。総索引 page 用。詳細テンプレに無理に出さない。

---

## 1. 結論（破綻しない一本）

公開サイトの「一覧」と WordPress の「CPT archive」を同一視しない。

```text
公開 IA（DIRECTORY_MAP の path）
  = 人がメニューで踏む URL。固定ページが CPT を query する。

CPT（budo-book / shodou-book / tankoubon）
  = 編集データと詳細 permalink の owner。

ネイティブ archive（/budo-book/ 等）
  = 現行でも存在するがナビ非使用。新サイトでは公開正本にしない。
```

お知らせ `/news/` と開催イベント `/event/` だけが、DIRECTORY_MAP 上も **CPT archive そのもの**。刊行物は違う。

| 役割 | 公開 URL の owner | WP オブジェクト | テンプレート |
| --- | --- | --- | --- |
| 武道 最新号 | `/publications/budo/latest/` | **page** が `budo-book` を 1件 query | page 専用（最新号レイアウト） |
| 武道 バックナンバー | `/publications/budo/back/` | **page** が `budo-book` を一覧 query（最新号は除外） | page 専用（Figma `publications`） |
| 武道 号詳細 | `/budo-book/{slug}/` | **CPT single** | `single-budo-book.php`（号レイアウト。最新号 page と markup 共有） |
| 武道 総索引 | `/publications/budo/back/` に同居する別 page 現行 `/shupan/sousakuin`。新マップは back と同一行 | **page**（現行）。ACF `sousakuin` は `budo-book` 側グループ | page。フィールドを page に移さない。出し方は Human 確定まで fail-closed |
| 単行本一覧 | `/publications/budo/books/` | **page** が `tankoubon` を tax `book` ごとに query | page 専用（Figma `hardcover`）。現行は `page.php` + `is_page('tankoubon')` |
| 単行本詳細 | `/tankoubon/{slug}/` | **CPT single** | `single-tankoubon.php` |
| 書写書道 最新号 | `/publications/shodo/latest/` | **page** が `shodou-book` 1件 | page 専用。Figma 専用 frame **なし** |
| 書写書道 バック | `/publications/shodo/back/` | **page** が `shodou-book` 一覧（最新除外） | page 専用。表紙 + `rensailist` PDF + public single 導線。武道と shared publication family |
| 書写書道 号詳細 | `/shodou-book/{slug}/` | CPT single | public single。PC `2630:8447`、専用SPなし。shared publication family |
| お知らせ一覧 | `/news/` | **CPT archive** | `archive-news.php` / 既存 news 系。現行 `/news/ichiran/` は新サイトに持ち込まない |
| お知らせ詳細 | `/news/{slug}/` | **CPT single** | 既存 `single.php` news 分岐 |

詳細 permalink を DIRECTORY_MAP の下にネスト（`/publications/budo/back/{slug}`）しない。現行・既存リンク・CPT Permalinks 衝突を増やす。一覧 path と詳細 path のプレフィックスが違うのは **現行どおりの仕様** でありバグではない。

---

## 2. なぜ「CPT ごとに archive.php」だけでは破綻するか

現行 Theme は `has_archive => 'budo-book'` を登録しつつ、公開一覧は **Template Name 付き固定ページ** で別 query している。

証拠:

- `page-shupanbudonew.php` … `posts_per_page => 1`。最新号の専用セクション（pickup / おすすめ / 連載…）。末尾で offset 1 の 5冊ギャラリー。
- `page-shupanbudoback.php` … `nopaging` の全号ループ。**`$num == 1` を skip**（最新号を一覧から外す）。`budo_backcontent` + `the_permalink()`。
- `page-shodoubooknew.php` / `page-shodoubookback.php` … 同じ 1件 / 全件-最新除外。バックは permalink なし、`rensailist` PDF。
- `page.php` `is_page('tankoubon')` → `content-tankoubon.php` … **1ページに tax 複数 query**（`new`, `budoall`, `judo`, …）。ページネーション archive ではない。
- `single.php` … `budo-book` / `tankoubon` だけ専用 part。`shodou-book` 専用レイアウトは無い。
- `archive-news.php` … お知らせだけが「本物の archive ループ」。

ネイティブ `/budo-book/` は現行でも 200（`post-type-archive-budo-book`）だが、メニューは `/shupan/back`。二重 URL。新サイトで archive を公開正本にすると:

1. DIRECTORY_MAP の `/publications/budo/back/` と衝突（どちらがメニューか不明）。
2. 最新号レイアウトとバック一覧レイアウトを 1つの archive に押し込めない。
3. 単行本の種目アンカー1ページが `archive-tankoubon.php` の標準ループと合わない。
4. Figma `publications` は1カラム。Theme の default `page.php` 2カラムとも、素の archive とも一致しない。

---

## 3. 現行 Theme から継承するもの / 捨てるもの

### 継承（契約）

- 最新号 page = 最新 1 CPT。バック page = 全件 minus 最新。
- 武道バックの行は要約 + 詳細リンク。書写書道バックの行は PDF リスト。
- 単行本一覧は taxonomy `book` の term slug でセクション分け。現行 slug: `new`（最新刊）, `budoall`, `judo`, `kendo`, `kyudo`, `karate`, `aikidou`, `syorinji`, `naginata`, `kobudo`。**新しい term slug を Figma 見出しから発明しない。**
- 号・本の本文フィールドは CPT。CFS 名は ACF JSON にほぼ残っている（`budo_month`, `budo_pickup`, `budo_backcontent`, `rensailist`, `book_author`, `readingtest`, `amazon`, `book_select`, `book_addbtn` 等）。`get_field()` に差し替える。
- サイドバーは現行「出版事業」ローカルナビ。新サイトは DIRECTORY_MAP の Local Nav（`page_local_nav`）。Figma 刊行物 PC は sidebar 無し 1カラム → **page shell は one-column**。Local Nav の要否は既存 Local Nav 契約（下層 PC）に従い、Figma に無いから消さない／あるから足すをその場で発明しない。実装時に `BACKNUMBER_DEPENDENCY_AUDIT.md` / `HARDCOVER_DEPENDENCY_AUDIT.md` と Figma を再突合。

### 捨てる（移植禁止）

- `CFS()` / `$cfs->get`。
- `is_page('733')` や slug `tankoubon` 直書き。DIRECTORY_MAP の path で振り分ける。
- `id="contents"` / `backNumberArchive` 等の旧クラスを新 Theme のマスターに混ぜる。見た目は Figma + 既存 `module_*` / Parts。
- 最新号テンプレと `content-budobook.php` の **二重コピペ**。新 Theme は **1つの issue body part** を latest page と single が共有する。
- 種目ごとの WP_Query を 9回コピペ。term 配列を1つにしてループする（term 集合自体は現行 slug のまま）。
- ネイティブ archive を「とりあえず archive.php で公開」。
- `SP_archive`（お知らせ）を刊行物 SP に流用。刊行物 SP は UNDETERMINED。
- 書写書道 SP に専用 frame が無いことを理由に書写専用 layout/CSS を発明する。SP は shared publication family を使う。

---

## 4. 新 Theme のファイル分担（実装時）

既存 drop-in の `single-budo-book.php` / `single-shodou-book.php` / `single-tankoubon.php` は ACF dump。本番 UI に置き換えるが、**フィールドを増やさない。** 次の ACF JSON に CFS 移行メモ・「非売品」等の Theme 契約を書かない（Human 2026-09-15）:

```text
acf/json/group_nbk_displaytime.json
acf/json/group_nbk_gekkan_budo.json
acf/json/group_nbk_gekkan_shodou.json
acf/json/group_nbk_rensai.json
acf/json/group_nbk_sousakuin.json
acf/json/group_nbk_tankoubon.json
```

空の ACF / WP フィールドは **出力しない**。`book_price` が空でも「非売品」と出さない。`book_select` が空でも「未選択」と出さない。dump の「データなし」も出さない。

推奨:

```text
template-parts/publications/_issue-budo.php      … 号の中身（latest と single が同じ）
template-parts/publications/_issue-shodou.php    … 最新号 page 用。single は導線確定まで dump または同一 part
template-parts/publications/_back-budo.php       … バック行
template-parts/publications/_back-shodou.php     … PDF 行
template-parts/publications/_book-card.php       … 単行本カード
template-parts/publications/_book-detail.php     … 単行本詳細
```

固定ページの載せ方（どれか1つ。混ぜない）:

1. **Directory slug で page テンプレートを割り当て**（現行と同じ Template Name）。path は seed 済み `publications/budo/latest` 等。
2. 汎用 `page.php` に slug 分岐を増やさない（現行 `page.php` の `is_page('tankoubon')` が破綻源）。

Query は main query を壊さない。`WP_Query` + `wp_reset_postdata()`。latest の「最新」は `posts_per_page=1` + 既存の公開日/メニュー順（Intuitive Custom Post Order がある。順序の正本は現行運用に合わせ、勝手に meta ソートを新設しない）。

ネイティブ archive:

- `has_archive` は残してよい（管理画面「一覧」や内部）。
- 公開では `template_redirect` で DIRECTORY_MAP の list/latest へ 301するか、`noindex`。**両 URL を index しない。** 301 先は list か latest か Human 確認。default 提案: `/budo-book/` → `/publications/budo/back/`、`/tankoubon/` → `/publications/budo/books/`、`/shodou-book/` → `/publications/shodo/back/`。

Custom Post Type Permalinks: 詳細を `/publications/...` 配下に書き換えない（page と衝突する）。

---

## 5. Visual / Figma

唯一の現行 file: `d1pD6gL2Sqal8Cf6h9WLp6`（Human 2026-09-25）。下表の node-id は前 file `OtS7731mhY2oD44HSpdADo` の記録で、新 file の正本ではない。

| 面 | PC | SP |
| --- | --- | --- |
| 武道バック | `1634:10806` publications | `2608:5702` SP_publications |
| 武道号詳細 | `1637:11288` publications_detail | `2608:6933` SP_publications_detail |
| 書写一覧 | `2629:7385` publications_calligraphy | 専用 frame なし。武道 publication family の shared responsive rule |
| 書写詳細 | `2630:8447` publications_calligraphy_detail | 専用 frame なし。武道 publication family の shared responsive rule |
| 単行本一覧 | `1656:5309` hardcover | `2627:6075` SP_hardcover |
| 単行本詳細 | `1686:5574` hardcover_detail | `2628:6964` SP_hardcover_detail |

Figma の繰り返し行はフィールド追加の根拠ではない。既存 ACF/CPT/taxonomy/content owner で足りる範囲だけ描く。

注文 CTA の URL は DIRECTORY_MAP `/publications/budo/order/`（Form は Human）。現行 `/shupan/koudoku` をハードコードしない。

---

## 6. 実装順（Human 2026-09-19）

1. 武道 publication の残りを一覧 / latest / single、PC/SP、実ブラウザ QA まで完了。
2. 書写詳細・一覧を PC `2630:8447` / `2629:7385` に合わせる。SP は武道 shared publication family。
3. 単行本詳細・一覧を PC/SP `1686:5574` / `2628:6964`、`1656:5309` / `2627:6075` に合わせる。
4. 単行本一覧の最新刊自動取得、カテゴリanchor、カテゴリ全件 query、pagerなしを完成。
5. 刊行物/単行本の実ブラウザ QA と回帰 gate を全部満たした後だけ TOP。
6. TOP は旧実装→新 `OtS...` の差分 inventory を先に作り、特に `1603:7488` 大会・イベント情報を確認して mobile-first 実装。

お知らせ / 既存イベントは回帰させない。ネイティブ archive の 301/noindex は別 Human decision のまま。

---

## 7. まだ Human が決めること（実装ブロックになるものだけ）

- ネイティブ `/budo-book/` を 301 するか noindex か。
- 総索引を独立 page にするか、back に含めるか、最新号の `sousakuin` ファイルを出すか。
- 英語単行本 `/publications/budo/books-en/` と tax の対応（現行は別 page `/english/tankoubon_30`）。
- 刊行物 PC の Local Nav 有無（Figma 1カラム vs 下層 Local Nav 契約）。

それ以外の routine（part 分割、CFS→ACF、slug でテンプレ割り当て）は Agent がこの文書どおり進めてよい。
