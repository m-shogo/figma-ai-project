# 刊行物 CPT 実装進捗 — active checkpoint

更新: 2026-09-20

## 正本

- GitHub: `m-shogo/figma-ai-project` / canonical branch `so`
- Figma の唯一の現行 Visual authority: `OtS7731mhY2oD44HSpdADo`
- PC authority page: `0:1`（🎨pc）
- SP authority page: `114:5409`（🎨sp）
- 武道一覧: PC `1634:10806` / SP `2608:5702`
- 武道詳細: PC `1637:11288` / SP `2608:6933`
- 書写書道一覧: PC `2629:7385`。専用 SP frame なし
- 書写書道詳細: PC `2630:8447`。専用 SP frame なし
- 単行本一覧: PC `1656:5309` / SP `2627:6075`
- 単行本詳細: PC `1686:5574` / SP `2628:6964`
- TOP の変更確認起点: 大会・イベント情報 PC `1603:7488`
- 旧 Figma `jqYoPtusYfTeDqRegMCsx3` / `zMjOY4euPBi9T23y7ZSM6y` とそれ以前の file は historical/audit 参照に限り、最終実装値の正本にしない

## 実装順（Human Authority 2026-09-19）

1. 月刊「武道」の残りを一覧 / 最新号 / 詳細、PC/SP、実ブラウザ QA まで完了する
2. 月刊書写書道の詳細・一覧を PC Figma に合わせる。SP は専用 Figma が無いため、武道 publication family の responsive rule / 共通 CSS owner を基準に仕上げる
3. 単行本詳細・一覧を PC/SP とも新 Figma に合わせ、機能契約も完成させる
4. 上記を実ブラウザ QA まで完了した後だけ TOP へ進む。旧 TOP → 新 Figma の差分表を作成してから実装する

TOP を先に実装しない。

## 現在地

### 月刊「武道」

- `/budo-book/{slug}/`: shared `_budo-detail.php` + `the_content()`
- `/publications/budo/latest/`: single と detail part を共有
- `/publications/budo/back/`: fixed page query、最新号除外
- 一覧「詳細はこちら」は `is-style-small`
- `.publication_budo-coverLink`: 固定 box + `overflow:hidden`、img `width/height:100%`、hover/focus は img `opacity:0.7` のみ
- SP 一覧 `2608:5702` / 詳細 `2608:6933` は新 file `OtS...` 内にも存在することを LIVE 確認済み
- disposable WordPress + Playwright の publication runtime は 375/390/430/767/768/1380px を通過済み
- 残り: 新 Figma exact geometry/typography の最終照合と shared CSS blast-radius の継続確認

### 月刊書写書道

- Human 2026-09-19: 一覧・最新号・public single は実装対象
- `single-shodou-book.php` / latest / back は shared publication family を利用する production 構造あり
- ACF は `group_nbk_gekkan_shodou` を維持
- 表紙はアイキャッチ。 `topimage` / `toprensailist` は TOP 専用
- PDF はテキストリンク
- ACF file field `rensailist > rensaipdf` は template boundary で array / attachment ID / URL を正規化し、schema は変更しない
- PC visual authority は一覧 `2629:7385`、詳細 `2630:8447`
- 専用 SP Figma は無い。武道 publication family の SP と共通 CSS/component owner を基準にする。書道専用のコピペ layout CSS を作らない
- 2026-09-20: 新 Figma PC を LIVE 再取得。一覧は 1040px rail / item gap 56px / header 60px / cover 160×226 / body gap 40px / PDF row 32px icon + 15px text、詳細は 960px rail / cover 140×198 / h2 26px / summary gap 40px を authority として再確認
- `Budokan Publications Runtime` run `35449875105` は static + disposable WordPress seed + Chromium + Budo/Shodou browser QA が全 step GREEN。PDF正規化後の実出力も通過
- 残り: CI GREENだけで完了扱いせず、書道PCのFigma exact visual（特に一覧 header/order/PDF rows、詳細 typography/CTA/content spacing）を実ブラウザ computed geometry と突合。SPは武道shared responsiveで長文/空値/画像なし/PDF有無を継続回帰

### 単行本

Visual authority:
- 一覧: PC `1656:5309` / SP `2627:6075`
- 詳細: PC `1686:5574` / SP `2628:6964`

一覧の機能契約:
- 「今月のおすすめ」は最新刊を自動取得
- 「カテゴリ一覧」は下のカテゴリ別一覧の該当見出しへのページ内リンク
- カテゴリごとに `tankoubon` を自動取得し全件表示
- ページャーなし

詳細の機能契約:
- 基本仕様は現行サイト同等
- 既存 `tankoubon` CPT / ACF / `the_content()` owner を再利用
- Figmaだけを根拠に新 ACF / taxonomy / data model を発明しない

## 固定契約

- 空 ACF は wrapper ごと非表示。ダミー文字列を production 表示へハードコードしない
- `group_nbk_*.json` / `parts.php` / Form / Formidable は触らない
- 既存のお知らせ / イベントを回帰させない
- 一覧「詳細はこちら」と詳細「バックナンバー一覧」は `is-style-small`
- publication PDF はテキストリンク
- 表紙に gallery / media-text / zoom UI を載せない
- native `/budo-book/` 等を公開メニュー一覧として流用しない
- tmp / cache / `__pycache__` を commit しない
- force push / history rewrite 禁止

## TOP へ進む前の完了ゲート

1. 武道 一覧・最新号・詳細 PC/SP が新 Figma / shared contract と高精度一致
2. 書道 一覧・詳細 PC が新 Figma と高精度一致
3. 書道 SP が武道 shared publication family で破綻なく成立
4. 単行本 一覧 PC/SP が新 Figma + 自動取得/カテゴリanchor/全件/ページャーなし契約を満たす
5. 単行本 詳細 PC/SP が新 Figma + 現行仕様 owner と一致
6. cover hover layout shift 0、画像 opacity のみ変化
7. 空 ACF / 長文 / 長タイトル / 画像比率差 / PDF 有無で崩れなし
8. 375px、必要に応じ390/430px、PC1380相当、768px直前直後で横スクロール・gap崩れなし
9. shared CSS blast radius を武道/書道双方で確認
10. Git diff に重複 CSS / 不要な片方専用 override がない
11. 実ブラウザ Visual QA evidence を残し、未確認を PASS 扱いしない

全ゲートを満たすまで TOP の実装へ進まない。

## TOP 着手後

- 新 Figma `OtS7731mhY2oD44HSpdADo` を LIVE 再取得
- section inventory / content order / visibility / copy owner / image / component / spacing / typography / responsive / interaction の旧→新差分表を先に作る
- 特に大会・イベント情報 `1603:7488` を確認
- mobile-first で SP → PC
-既存 shared Header/Footer/PageTitle/Breadcrumb を正しい owner として再利用
- TOP Calendar / FullCalendar は既存 authority に従い、別指示なく data model を変更しない

## 実行契約

- 各 run 開始時と write 直前に最新 `so` / open PR / CI / authority / Figma を再取得
- Figma `OtS...` の対象 node は実装前に LIVE `get_design_context` で確認
- 実ブラウザ QA は最低 SP375px、必要に応じ390/430px、PC1380相当、768px breakpoint 前後
- 武道を直したら同 viewport の書道も確認し、その逆も行う
- 安全で高価値な作業がある限り、小さな1修正で止めず、実装 → QA → 差分修正 → 回帰 → commit/push/CI/readback まで進める
