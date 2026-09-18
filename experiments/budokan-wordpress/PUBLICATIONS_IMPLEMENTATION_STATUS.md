# 刊行物 CPT 実装進捗 — active checkpoint

更新: 2026-09-18

## 正本

- GitHub: `m-shogo/figma-ai-project` / canonical branch `so`
- Figma の唯一の現行 Visual authority: `zMjOY4euPBi9T23y7ZSM6y`
- PC authority page/node: `0:1`
- SP authority page/node: `114:5409`
- 武道・書道 一覧 SP authority: `2608:5702`
- 武道・書道 詳細 SP authority: `2608:6933`
- 旧 Figma `jqYoPtusYfTeDqRegMCsx3` は実装漏れ監査にだけ使用し、最終実装値の正本にはしない
- 契約: `CURRENT_AUTHORITY.md` / `FOUR_FAMILIES.md` / `PUBLICATIONS_CPT_ARCHITECTURE.md`。本ファイルの 2026-09-18 Human override と矛盾する古い Figma key / 「書道 single 未確定」記述は superseded とする
- 未決事項: `PENDING_QUESTIONS.md`

## 現在地

### イベント

- `/event/` 一覧・`/event/{slug}/` 詳細は既存完了面。刊行物作業で回帰させない。

### 月刊「武道」

- `/budo-book/{slug}/` 詳細: shared `_budo-detail.php` + `the_content()` の production 構造あり
- `/publications/budo/latest/`: single と detail part を共有
- `/publications/budo/back/`: 固定 page query、最新号除外、空概要・画像なし対応あり
- 2026-09-18 `so` で SP back-list geometry を新 Figma `2608:5702` に寄せた
- `.publication_budo-coverLink`: 箱サイズ固定 + `overflow:hidden`; img `width/height:100%`; hover は img `opacity:0.7` のみ。layout shift を起こす border/padding/transform 等を hover で変更しない
- 残り: 新 Figma PC/SP との詳細 geometry/typography、`is-style-small` 契約、実ブラウザ Visual QA

### 月刊書写書道

Human override 2026-09-18: 武道と同じ publication layout family として **一覧・最新号・public single を PC/SP とも実装対象にする**。旧「PDF back のみ / single 公開未確定」は superseded。

固定契約:

- ACF group `group_nbk_gekkan_shodou` を維持。`group_nbk_*.json` は変更しない
- 表紙はアイキャッチ。`topimage` は TOP 専用で、刊行物詳細/一覧の表紙として出さない
- PDF はテキストリンク
- 空 ACF は表示しない。ダミー文字列を production 表示へハードコードしない
- 一覧「詳細はこちら」と詳細「バックナンバー一覧」は武道と同じ既存 `is-style-small` owner を使う
- 武道/書道の視覚値は共通 CSS/component owner へ寄せ、片方専用のコピペ layout CSS を増やさない

現状:

- `single-shodou-book.php` は production detail へ移行済み。shared `_budo-detail.php` を使い、書道固有の ACF field map だけを args で差し替える
- 表紙はアイキャッチを使用し、`topimage` / `toprensailist` は single に出さない。本文は `the_content()`、空本文は wrapper ごと非表示
- detail visual markup/CSS は武道と共有済みで、書道専用 layout CSS は追加していない
- 残り: 書道 back/latest を同じ shared publication family へ載せること、一覧/詳細の `is-style-small` 統一、新 Figma PC/SP geometry/typography、実ブラウザ Visual QA

### 単行本

- 既存実装を回帰させない。武道・書道 publication 完了ゲートを優先し、その途中で単行本へ飛ばない。

## 新 Figma SP で確認済みの主要 geometry

`2608:5702`（一覧 SP 375px）:

- page width 375px
- content horizontal padding 24px → content width 327px
- container top padding 48px / bottom 64px / major section gap 64px
- backnumber list gap 40px
- item internal gap 24px
- item header: vertical stack, gap 16px, padding 16px 20px
- item title 20px Zen Old Mincho, letter spacing 1px
- cover 160×226px
- cover → text 24px
- body 15px / line-height 1.6 / letter spacing .75px
- detail link 16px

`2608:6933`（詳細 SP 375px）は detail family の SP authority。cover 140×198px、情報は縦積み。実装時に node の live context を再取得して exact geometry を照合する。

## TOP へ進む前の完了ゲート

1. 武道 一覧 PC/SP が新 Figma と高精度一致
2. 書道 一覧 PC/SP が同じ共通 CSS で高精度一致
3. 武道 詳細 PC/SP が高精度一致
4. 書道 詳細 PC/SP が同じ共通 CSS で高精度一致
5. cover hover layout shift 0、画像 opacity のみ変化
6. 空 ACF / 長文 / 長タイトル / 画像比率差 / PDF 有無で崩れなし
7. SP/PC breakpoint 前後で横スクロール・gap 崩れなし
8. shared CSS blast radius を武道/書道双方で確認
9. 重複 CSS・不要な片方専用 override を増やさない
10. 実ブラウザ Visual QA evidence を残し、未確認を PASS 扱いしない

全ゲートを満たすまで TOP の実装へ進まない。

## 実行契約

- 各 run 開始時と write 直前に最新 `so` / open PR / CI / authority / Figma を再取得する
- 旧 Figma → 現行実装で実装漏れを監査した後、必ず新 Figma を最終正本として差分実装する
- SP `2608:5702` / `2608:6933` を優先。PC は新 file の PC authority `0:1` から対応 frame を毎回検索・特定し、古い node 番号を実装値として流用しない
- Visual QA は最低 SP 375px、必要に応じ 390/430px、PC 1380相当、768px breakpoint 前後
- 武道を修正したら同 viewport の書道も確認し、その逆も行う
- `parts.php` / Form / Formidable / `group_nbk_*.json` は触らない
- native `/budo-book/` を公開メニュー一覧として流用しない
- tmp/cache/`__pycache__` を commit しない
- force push/history rewrite 禁止
- 実ブラウザを操作できない環境では未確認を PASS にせず、read-only Figma/code 差分監査と次の安全な修正特定を進める
