# Budokan Implementation Learnings

更新: 2026-09-11

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
- メニューは3階層。ACF `page_local_nav` + 名前 `ローカル：`。位置割当4本は選択肢に出さない
- 完了前に対象行の上下 gap を測り、見出しを hover して枠が残るか見る

**一般化候補**

CANDIDATE evidence: `research/frontend-learning-evidence-local-nav-octagon-nowrap-2026-09-11.yaml`

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
- Local Nav なら ACF `page_local_nav` / `ローカル：` 接頭辞 / 3階層 / SP 非表示を守っているか

## 昇格ルール

このファイルの学びをすぐ全案件の絶対ルールにはしない。

- 1案件固有: このファイルに保持
- 複数セクションで再現: `THEME_RULES.md` 候補
- 複数案件で再現: Frontend Standard / Figma-to-Web Learningへ昇格

これにより、反省を増やすだけのgovernanceではなく、**再発したものほど上位の知識へ昇格する**運用にする。
