# Budokan Implementation Learnings

更新: 2026-09-15

このファイルは、完成形の仕様ではなく **失敗・手戻り・レビュー指摘から得た再発防止知識** を残す。
`CURRENT_AUTHORITY.md` / `THEME_RULES.md` が正本仕様、ここは判断理由と学習ログ。

## 学習の残し方

各学びは次の順で扱う。

1. 何が起きたか
2. なぜ起きたか
3. 次回の判断ルール
4. どこまで一般化できるか

案件固有の内容はここに残し、複数案件で再現したものだけ Frontend Standard / Figma-to-Web Learning 側へ昇格する。

---

## 2026-09-17 通常ページ上下余白を `_normalPage` オプトインにすると抜ける

**起きたこと**

刊行物一覧・詳細など新規テンプレが `.global_inner._content` だけで、`._normalPage`（PC 上 64 / 下 100）が無く本文が帯とパンくずに張り付いた。

**原因**

共通リズムを local-nav 実証ページだけの class に閉じ、テンプレ作者が毎回思い出す前提にした。

**次回ルール**

`.global_inner._content` が固定ページ・CPT 詳細・今後の一覧／詳細の上下 owner。ページ差はローカルナビの有無だけ。詳細だから抜かない。News / Event だけタイトル帯 family として掛けない。

**一般化候補**

ページシェルの余白は opt-in class にしない。忘れると全ページで欠ける。

---

## 2026-09-15 刊行物は CPT archive と公開一覧が別物

**起きたこと**

CPT に `has_archive` があるので「一覧 = archive.php、詳細 = single」と短絡した。現行 Theme は固定ページが CPT を query し、ネイティブ `/budo-book/` はナビ非使用の二重 URL。DIRECTORY_MAP も最新号・バック・単行本を page path に置いている。

**原因**

データ層（CPT）と公開 IA（マップ path）を同じ「一覧 URL」として扱った。現行は最新号レイアウト、バック（最新 skip）、単行本の tax 1ページ、書写書道 PDF 行が、どれも標準 archive ループではない。

**次回ルール**

- 刊行物着手前に `PUBLICATIONS_CPT_ARCHITECTURE.md` を読む。
- お知らせ `/news/` だけ archive。刊行物一覧は DIRECTORY_MAP の page + query。
- 現行 `budokan` からクラスを移植しない。query 契約と既存 ACF 名だけ継承する。

**一般化候補**

`has_archive` があることと、公開メニューの一覧 URL が一致するとは限らない。既存 Theme の page template query を先に読む。

---

## 2026-09-17 ネイティブ CPT archive は `archive-{post_type}.php`

**起きたこと**

イベント一覧が汎用 `archive.php` の `elseif` 分岐の奥にあり、owner が分かりにくかった。Human は `archive-event.php` を正本にすると決定した。

**原因**

「archive は1ファイルで分岐すれば足りる」と寄せた。WP の template hierarchy を捨てていた。

**次回ルール**

- ネイティブ公開する CPT 一覧は `archive-{post_type}.php`。taxonomy は `taxonomy-{taxonomy}.php`。
- 汎用 `archive.php` に CPT 分岐を増やさない。
- カード等の中身は part で共有してよい。
- 刊行物のように公開一覧が固定 page の CPT には適用しない。

**一般化候補**

WordPress が用意しているテンプレート階層を、案件の公開 IA がネイティブ archive であるときに使う。

---

## 2026-09-17 イベント詳細の下端は News single と同じ chrome

**起きたこと**

イベント詳細は `single.php` を入口にしていたが、区切り線は `post` だけ出力、pager 余白は Event だけ 48px、パンくず 100px は `.single-post` だけだった。Human は `/news/888/` と Figma `1632:10382` が同じなのに違う、と指摘した。

**原因**

「同じ `single.php`」でも CPT 分岐で下端 chrome を外し、CSS も family 別に弱めていた。入口ファイルを共有したことと、News と同じ部品契約を守ることは別。

**次回ルール**

- ネイティブ公開する CPT 詳細は `single-{post_type}.php`。`single.php` に event 分岐を残さない。
- 下端の Parts `wp-block-separator` + `module_pager-02` 一覧へ戻る + パンくず余白は、Figma が同じなら News の数値を共有する。Event 用に 48px / パンくず 0 を作らない。

**一般化候補**

見た目 family が同じなら shared module。入口ファイルは CPT ごとに分ける。

---

## 2026-09-17 月刊「武道」は「時間をかけて丁寧に」を測らずに完了扱いした

**起きたこと**

Human が時間をかけて丁寧に、と何度も言ったあと「完璧？」と聞かれた時点でも、Figma と runtime の差が残っていた。数ラウンドの測り直しのあと、初めて「良い感じ」になった。最後の微差（パンくず行間、総索引の gap 二重、lead の gap 削除、関連表紙 hover、特別寄稿の wrap）は Human が見ないと決められない種類だった。

**最初からできたはずで、Human 待ちするべきでなかった差**

- 表紙 140×198 / 一覧 160×226、おすすめ画像 800 中央、h3 間 72、h3→h4 24、ピックアップ 468/24/100、関連 5 冊、一覧行間 56、ご注文 rest 白円 20px、詳細 ArrowS 26/18。いずれも Figma node に数字がある
- `--color-white` は Theme に無い。ご注文 rest が透明になった（W3 rest 塗り）
- `.block-editor_wrap .publication_budo h3` は当たらない。wrap と module は **同一要素** `class="block-editor_wrap publication_budo"`。Parts の `.block-editor_wrap * + h3`（40px）が勝ち、72px が死んだ。書いただけの CSS を computed で見ていなかった
- `.is-style-small` の詳細リンクが Parts btn-02 金八角のまま。module のほうが specificity が低かった
- 一覧は最新号も含める、詳細関連 5 は現在 ID 除外、`_content` 上下は共通。契約はあったのに最初の実装が外れた

**なぜ起きたか**

1. 「丁寧に」をスクリーンショット目視と DOM 組み立てに使い、**パーツ単位の Figma 数値 vs getComputedStyle** を完了ゲートにしなかった
2. Parts 流用のあと、module override が当たったかを測らず「markup が Parts なら見た目も Parts / Figma」とみなした
3. descendant combinator（空白）を、同じ要素の複数 class に使った
4. 「完璧？」を、残差リストなしの自己申告にした

**次回ルール（「完璧？」の第一声でここまで）**

完了 / 「完璧？」の前に、対象ページの **塊ごと** 次を表にする。数字は Figma node と live computed。目視だけで PASS にしない。

| 塊 | 測る |
| --- | --- |
| 表紙 / 画像 | 幅・高さ・object-fit・中央寄せか |
| h2/h3/h4 | サイズ、直後 gap。`*` + heading が module を殺していないか |
| CTA / ご注文 / 詳細 | rest 塗り・枠・形（円 vs 八角）、hover invert、specificity |
| リスト / カード / gallery | gap、列数、件数（除外ルール含む） |
| アコーディオン | 閉じと開き |

selector は `.block-editor_wrap.publication_budo`（同じ要素）か、本当に子孫かを先に見る。当たっていなければ直してから完了。

Parts に無い塗りは `--color-secondary`（白）。無い token を发明しない。

**Human に残す（最後の FB 種。第一声の必須にしない）**

パンくず `line-height` の 1 → 1.6、flex `gap` と Parts `margin-top` のどちらを残すかの味、関連表紙に hover opacity を足すか、プレーンテキスト節を div wrap するか。契約と Figma 数字から一意に決まらないものは聞かないが、勝手に「完成」と上書きもしない。測った残差を短く出す。

**一般化候補**

Gutenberg `block-editor_wrap` と page module を同じ要素に載せる Theme では、空白 combinator は未適用の indirection。完了ゲートは computed。W7 に近い。


**起きたこと**

号詳細を独自 dl / 独自見出し / 独自リンク矢印で組み始めて、Parts の h2/h3/h4・リスト・btn-03/btn-02・details・gallery と二重になるところがあった。

**原因**

Figma フレームを page-specific CSS に直写すると、既存 Gutenberg 契約を後回しにしやすい。

**次回ルール**

- `parts.php` にある要素は markup を流用するか、既存 class を足して改良する。
- Parts に無い塊（表紙下ラベル、ピックアップカード、一覧の見出し帯+ご注文）だけ `module_publicationBudo.css`。
- `現行サンプルbudokan` は参照専用。編集しない。

**一般化候補**

Theme に Parts がある案件では、page module を増やす前に Gutenberg マークアップで足りるか見る。

---

## 2026-08-28 News 全体再監査

### 1. TOPだけを先に完成扱いしない

**起きたこと**

TOP Newsを先に独立実装した後で、通常のお知らせ一覧にもほぼ同じ記事・カテゴリ構造があることを再確認した。

**原因**

「今見ているセクション」を局所的な実装単位として捉え、Figmaファイル全体で同じUI familyがどこに存在するかを先に調べ切らなかった。

**次回ルール**

- 新しいセクションに着手する前に、Figma内で同じ名称・同じ記事カード・同じナビ・同じCTAを検索する。
- `通常ページ / archive / TOP / sidebar / card` のどれが情報構造のマスターかを先に決める。
- TOPは原則として「特別な別実装」ではなく、共通部品の派生候補として疑う。
- 見た目が違っても、データ構造・意味・リンク先が同じなら markup/data contract の共有を優先する。

**一般化候補**

Reuse-Before-Build / Component Family Discovery として他案件にも昇格候補。

### 2. 共通化はCSSの見た目ではなく、情報構造から行う

**起きたこと**

TOPには表示用カテゴリ6個、ArchiveにはWordPress categoryという別経路があり、放置するとカテゴリ定義が二重化する状態だった。

**原因**

最初の実装で「見た目を合わせること」を優先し、データソースとnavigation contractまで共通部品として設計していなかった。

**次回ルール**

- 記事1件は shared item component を先に作る。
- category/tab navigationも shared markup を使い、TOP/Archiveの差は `context` とCSSで表現する。
- hard-coded labelsはFigma照合用fallbackに限定し、本番WordPress taxonomyと混同しない。
- taxonomy運用が未確定なら勝手にJS filterなど新しい契約を作らない。

### 3. Mobile-firstは「SPもある」ではなく、CSS cascadeまでSP正本にする

**起きたこと**

SPで正しい罫線・カテゴリ表現が、PC側へ不要に残るケースがあった。PCのNews八角、active/inactive bullet、記事先頭罫線なども個別修正が必要になった。

**原因**

SP→PCの見た目差分を確認していても、cascade上でどのSP ruleがPCへ継承されるかの監査が不足していた。

**次回ルール**

- base rule = SP。
- PCは `@media screen and (min-width: 768px)` の追加・明示的解除だけにする。
- SPの `border / display / pseudo-element / nth-child / positioning` は、PCへ漏れる前提で全て確認する。
- PC確認時は「追加するCSS」だけでなく「SPから残ってはいけないCSS」をチェックする。

### 4. Figma差分をCSSで無理に補正する前に、グローバル環境を確認する

**起きたこと**

Linux Chromiumの `scrollbar-gutter: stable` により15pxが予約され、375/1380の比較値がずれた。

**原因**

コンポーネント固有差分に見えたが、実際は既存global CSSとブラウザ環境由来だった。

**次回ルール**

- width差が一定値で全体に出る場合は、component CSSを触る前に `body/html/scrollbar/min-width/global_inner` を確認する。
- QA環境由来の補正を本番component CSSへ入れない。
- CI上のauthored viewportとouter viewportを分けて記録する。

### 5. Visual QAはフォント名ではなく、実測された文字幅まで見る

**起きたこと**

日付数字が日本語sansではFigmaより広く見え、Themeの英数字用Roboto 12pxへ寄せることで整った。

**原因**

font-sizeだけ合わせれば近づくと見ていたが、数字のglyph metrics差が大きかった。

**次回ルール**

- 文字位置のズレはpaddingだけで直さず、font family / weight / letter-spacing / glyph widthを確認する。
- Figmaフォントを無理に追加せず、Theme既存tokenで最も近いものを先に探す。
- Typography差を座標のmagic numberで隠さない。

### 6. QA selectorは位置ではなく意味で選ぶ

**起きたこと**

WordPressのdefault categoryやfixture順序が入ると、`nth-child` / 「最初のカテゴリ」のような位置依存QAは誤判定し得る。

**原因**

fixtureが常に同じ順で並ぶという暗黙前提を持った。

**次回ルール**

- category確認は表示名/slug/semantic classで選ぶ。
- WordPress default data（Hello world / Uncategorized等）はfixture作成時に明示的に処理する。
- QAはDOM順序を仕様にしない限り `nth-child` を契約にしない。

### 7. Runtime QAの失敗は「製品バグ」と「テストハーネスバグ」を分離する

**起きたこと**

一時QA workflowでshell quote errorやroute/locator timeoutが発生したが、Themeの表示ロジック自体とは別問題だった。

**原因**

実装検証とfixture/route/selector構築を同時に変更したため、failure sourceが混ざった。

**次回ルール**

- PHP lint → runtime起動 → fixture投入 → route HTTP確認 → selector存在確認 → screenshot/metric assertion の順で段階化する。
- screenshot timeoutだけでVisual implementationを壊れていると判断しない。
- workflow失敗時は最初に「実装 / fixture / route / selector / CI環境」のどこかを分類する。

### 8. 一時QA資産は証拠を取ったら最終diffから外す

**起きたこと**

Runtime証拠取得用のtemporary workflowがPR差分に入り得る。

**次回ルール**

- temp workflowは検証専用。
- merge前に削除し、最終PR diffを再確認する。
- 実装ファイルと永続的な標準だけを残す。

### 9. 親コンポーネントの寸法PASSだけではVisual QA完了ではない

**起きたこと**

Archive全体の幅、記事数、pagerの存在、HTTP、overflowがすべてPASSした後に、FigmaのSP pager子node `560:4260` を再取得したところ、実装がPC風のunderline page numbers / 赤八角矢印のままで、SP正本の「円形page numbers + 薄灰色の丸矢印」と異なることを発見した。

**原因**

Archive親frameのdesign contextとruntime geometryを確認したことで安心し、見た目が独立して切り替わる子componentのvariantを個別に取得・比較していなかった。テストもpagerの存在数しか見ていなかった。

**次回ルール**

- 親frameを取得したら、`pager / tabs / card / CTA / slider control / modal control` など独立したvariantを持つ子componentを洗い出す。
- SP/PCで形が変わる子componentは、親のscreenshotだけでなく子nodeのdesign contextを取得する。
- Runtime QAは「存在する」だけでなく、重要な子componentの `size / shape / background / border / state` まで最小限assertする。
- geometry PASSをVisual PASSと呼ばない。最後に必ず実captureとFigma子nodeを目視比較する。

**一般化候補**

Section Visual QA / Progressive Disclosure の実務ルールとして、他セクションでも再現すればFrontend Learningへ昇格候補。

### 10. variantが大きく違うときはspecificity戦争をしない

**起きたこと**

News pagerをSP/PC向けに作り直した後も、後から読み込まれるgeneric `module_pager-01` のnested `:not(...)` selectorがcurrent state、prev/next width、icon content/colorを部分的に上書きした。最初はNews側selectorを強くしてcurrent stateだけ直したが、実captureではSPの「前のページ」が縦に潰れ、PC矢印も黒いchevronへ戻っていた。

**原因**

見た目が根本的に別variantなのに、generic baselineを受けたまま個別propertyごとに上書きしようとした。

**次回ルール**

- variantの構造・shape・stateが大きく違う場合、まず「generic baselineを本当に継承すべきか」を判断する。
- 継承不要ならmodifier/variant classでdefault selector対象から明示的に外し、variant側にvisual contractを集約する。
- specificityを上げ続ける、import順だけで直す、`!important`を足す、の順で対処しない。
- 修正後はcomputed styleだけでなく実captureで文字折返し・icon glyph・stateを確認する。

**一般化候補**

CSS Cascade / Component Variant IsolationとしてFrontend Standard候補。別componentでも再現してから昇格する。

### 11. archive条件は画面種別より先にデータ種別を絞る

**起きたこと**

News masterへ通常投稿archiveを寄せる際、`is_date()` をOR条件で直接足すと、custom post typeの日付archiveまでNews layoutへ入る可能性があることを最終diff監査で発見した。

**原因**

`category / tag / date` という画面条件を先に足し、現在のpost typeとの積条件を十分に考えなかった。

**次回ルール**

- archive分岐はまず `post_type / taxonomy` というデータ種別を確定し、その内側でdate/category等のview条件を見る。
- WordPress conditional tagsをORで増やす前に、別post typeでもtrueになり得るか確認する。
- 0件archiveでは `get_post_type()` がfalseになり得るため、Theme既存のfallback helperも含めて確認する。

---

## 2026-09-11 Overlay / hover Human FB

詳細: `learning-notes/2026-09-11-overlay-drawer-human-fb.md`。案件正本: `CURRENT_AUTHORITY.md`。次案件の自動判断: `docs/frontend-quick-contract.md` 節4。

**起きたこと**

PC メニュー暗幕をパネル外形に合わせて欠ける、ヘッダーを `visibility: hidden`、パネルを header-height 分下げる、open で sticky を外す、閉じ開始で open class を外す、hover で枠や 100% 幅の箱が出る、という直しを繰り返した。

**原因**

閉じ Header の DOM 都合（sticky stacking、ハンバーガーが ×、パネルがヘッダー子孫）を、開いた Figma より先に最適化した。

**次回ルール**

- 暗幕は全面。パネルはその上。ヘッダーは消さず覆う
- sticky を relative にしない。閉じは開いた形のまま transform。duration は揃える
- hover は rest 枠・文字幅ヒット・disabled に箱を出さない・clip で stroke を食べない

**一般化候補**

PATTERN_LEVEL CANDIDATE。888px 等の数値は持っていかない。

## 2026-09-11 Local Nav ACF / octagon / row gap

詳細: `learning-notes/2026-09-11-local-nav-acf-hover-spacing.md`。

**起きたこと**

Local Nav を ACF 選択メニューで出したあと、(1) nowrap で1行固定、(2) 見出し八角 hover を clip+inset にして枠消失（再発）、(3) 親 `height: 34px` が次行 gap を約13px まで潰した。

**原因**

screenshot lock と、既に Theme 内で SVG chip 解決済みの family を見なかったこと。完了前に実測しなかった。

**次回ルール**

- nowrap しない。八角 invert は SVG chip。親の固定 height で padding/border をクリップしない
- メニューは2階層（見出し + 子）。ACF `page_local_nav` + 名前 `ローカル：`。位置割当4本は選択肢に出さない
- 完了前に対象行の上下 gap を測り、見出しを hover して枠が残るか見る

**一般化候補**

CANDIDATE evidence: `research/frontend-learning-evidence-local-nav-octagon-nowrap-2026-09-11.yaml`

## 2026-09-15 イベント一覧のリズムを News archive の gap に任せない

**起きたこと**

開催イベント PC（1619:9554）は `64`（月ナビ / 見出し塊 / カード行 / pager）の中に、見出し行とタブだけ `40` がある。`.news_archive` の一列 gap にタブを載せると見出し→タブが 64 になり、カード最終行の罫線も News 一覧の「末尾行は消す」に引きずられた。

**原因**

同じタブ部品（`news_tabs_archive`）と pager を再利用したあと、親の余白契約まで News のままにした。Event SP 専用 frame が無いので News SP の3列罫線タブも黙って継承していた。

**次回ルール**

- イベント一覧の見出し＋タブは内側 40 の塊。カード行は Figma どおり最終行も下罫線。
- SP は1カラム＋PC pill タブの折返し。`SP_archive` のニュース3列は流用しない。
- 募集チップ・日付 `～`・「開催日：」プレフィックスは出さない。

**一般化候補**

共有部品を流用しても、親の rhythm / SP グリッドは面の Figma owner を先に取る。

---

## 今後の実装前チェック

新セクション開始前に最低限これを確認する。

- Figma SP nodeを先に取得したか
- 同じcomponent familyが他ページ/TOP/archiveにないか検索したか
- 親frame内でSP/PC variantが変わる子componentを洗い出したか
- 既存Themeに再利用できるPHP/CSS/moduleがないか確認したか
- データのマスターはどこか決めたか
- SP base → SP Runtime QA → PC extension → PC Runtime QAの順になっているか
- 固定width/height/absoluteを使う前にflow/flex/gridで成立しない理由を説明できるか
- Visual差がcomponent由来かglobal/browser/font由来か切り分けたか
- QA selectorがDOM位置依存になっていないか
- 重要な子componentを存在確認だけでPASSにしていないか
- variantがgeneric CSSを本当に継承すべきか確認したか
- archive分岐で別post typeを巻き込んでいないか
- 一時fixture/workflowを最終diffに残していないか
- 開いた Figma の暗幕は全面か、パネル外形に合わせて欠けるデザインか
- overlay 開で sticky header を relative にしていないか、閉じで open layout を崩していないか
- hover 当たりが文字幅か、disabled に enabled 箱が出ていないか
- 八角 invert を clip+inset にして枠を消していないか（SVG chip か）
- 行親の固定 height が次行 gap を食っていないか、nowrap で1行固定していないか
- Local Nav なら ACF `page_local_nav` / `ローカル：` 接頭辞 / 2階層 / SP 非表示を守っているか

## 2026-09-17 書写は武道と同じ見た目でも ACF 名を流用しない

**起きたこと**

月刊書写書道は武道 Figma を流用するが、フィールドは `group_nbk_gekkan_shodou`。`size` は版型とページ数の1本、`rensailist` が PDF。武道の `budo_backcontent` やおすすめ wysiwyg は無い。

**原因**

見た目 family が同じだと、同じ part に CPT 分岐を足したくなる。

**次回ルール**

chrome class（`publication_budo`）は共有してよい。入口は `single-shodou-book.php` / `page-publications-shodo-*.php` と `_shodou-*`。無いフィールドは出さない。現行バックの「その他」は発明しない。

**一般化候補**

同じ Visual family でも CMS 出力が違うならテンプレ owner を分ける。

---

## 2026-09-17 表紙 hover を Parts の zoom/gallery に載せない

**起きたこと**

バックナンバー表紙を media-text / gallery に載せ、hover で `opacity: 0.7` を足すと、zoom `::after` と gallery の下側オーバーレイが先に動いた。リンク全体に opacity を付けると箱の高さが内寸に戻り、下半分が紙地（白）に見えた。

**原因**

Parts のリンク画像 hover はズームボタンと caption scrim の owner。表紙は「薄くするだけ」で、同じ markup に例外セレクタを積み上げても specificity で負ける。

**次回ルール**

表紙は `.publication_budo-coverLink`。gallery / media-text / zoom に入れない。箱サイズは `<a>` で固定し、hover は `img { opacity: 0.7 }` のみ。`transition` は opacity に限定する。

**一般化候補**

Parts のリンク画像 hover と「ただ薄くする」表紙リンクは markup を分ける。例外 CSS で同居させない。

## 昇格ルール

このファイルの学びをすぐ全案件の絶対ルールにはしない。

- 1案件固有: このファイルに保持
- 複数セクションで再現: `THEME_RULES.md` 候補
- 複数案件で再現: Frontend Standard / Figma-to-Web Learningへ昇格

これにより、反省を増やすだけのgovernanceではなく、**再発したものほど上位の知識へ昇格する**運用にする。
