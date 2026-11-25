# jwsnj — ローカルWordPress・ブラウザ検証 後日実施リスト

Status: **DEFERRED_ENV / 検証未着手**（Human決定 2026-11-20）
Scope: **ニュージャージー補習授業校だけ**。詳細の技術仕様は `CURRENT_AUTHORITY.md` / `SPEC.md` / `DESIGN_FOUNDATION.md` / `IMPLEMENTATION_CHECKLIST.md` を優先する。

## なぜ今は実施しないか / いつ再開するか

- Human: **現在はローカルWordPress環境を操作できない**。この実行レーンから `127.0.0.1:28000` やHumanのPC上のWordPressへアクセスできるとは限らない。**今回実際に接続/ブラウザ確認をしていない**。CLIやGitHub CIの静的成功をローカル表示確認と混同しない。
- 現段階での優先作業は **GitHub + Figmaでできる調査、共通Foundation導入、テーマ/ACFの既存契約に沿ったコード、静的検査、CI、PR/merge**。ローカル環境が利用できないことだけでこの作業を停止しない。ローカル実機を毎時無意味に再試行しない。
- **再開トリガー**: HumanがローカルPC/Work/Codex等を操作可能と示した、または実際に接続できるWordPress/ブラウザ実行環境が提供された時。
- **優先順位**: 再開トリガーが成立した最初の作業回で、このファイルを**作業開始時に読む**。まず下記 `ENV-01` → `P0` を新規ページ実装より優先し、関連する不具合を修復する。P1以降は実装完了範囲/変更時点に応じて順次実行。実行できないものは `DEFERRED_ENV` のまま残す。
- ここに記した **「後で確認する」≠「確認済み」「不具合がある」**。実機アクセス不可以外の事実（Figmaにないnode、未決URL等）を勝手に埋めない。未実装パーツのQAは `NOT_READY_IMPLEMENTATION` と区別する。

## Status・証拠の記録ルール

- `DEFERRED_ENV`: 実装の有無にかかわらず現在のレーンで実行不可 / 未検証
- `NOT_READY_IMPLEMENTATION`: 対象パーツがまだ未実装のため時期尚早
- `READY_LOCAL`: 実装済みかつローカル環境で実行可能になったが未実行
- `FAIL`: 実際に実行して不合格。症状、再現方法、原因・関連PRを記録
- `PASS`: 対象の正確なコミットSHA・ブラウザ/幅・操作・スクリーンショット/ログに紐づく実測結果あり
- `N/A`: 適用不要と判断した理由が明示されている

最初の状態はすべて**未実施**。HTML/CSSの静的レビューやGitHub CIが成功してもこのチェックをPASSにしない。後で新しいCSS・font・共通部品の変更が入ったら、その依存範囲の既存PASSは再検証する。

## 0. 環境・編集の再現性（復旧時最優先）

| ID | 優先 | 状態 | 確認内容・実施時の受入条件 |
|---|---|---|---|
| ENV-01 | P0 | DEFERRED_ENV | repoの最新 `so` を取得、`./wp.ps1` ではなく **Windows PowerShellの `.\\wp.ps1 status jwsnj` / `.\\wp.ps1 up jwsnj`** で案件の実行状態を確認。ローカル `http://127.0.0.1:28000` が実際に表示され、PHP Fatal/404がない。起動できなければコマンド出力を記録 |
| ENV-02 | P0 | DEFERRED_ENV | WordPress管理画面ログイン、テーマ `jwsnj` の有効化、必要なプラグイン（特にACF PRO / Formidable Pro）の有効状態とバージョン、`Asia/Tokyo`、Web表示に必要な固定ページ・メニューの割当を**実際に確認**。認証情報/有料ライセンスはGitへ保存しない |
| ENV-03 | P0 | DEFERRED_ENV | `projects/jwsnj/` で `pnpm install`（必要な場合のみ）/ `pnpm build`、必要なら `pnpm dev`。Vite画像変換とホットリロードが機能するか、生成物が期待パスかを確認。実行できたコマンド・終了コード・ログを記録 |
| ENV-04 | P0 | DEFERRED_ENV | QA用DB/uploadsの `.\\wp.ps1 snapshot jwsnj` の可否、既存データ保護、空/長文/画像なし等のテストデータを安全に再現できるseedの有無を確認。作業前に**破壊操作を行わない**。スナップショットは `.local/` でGit外 |

## 1. 共通Foundationのローカル実装・描画確認

| ID | 優先 | 状態 | 確認内容・実施時の受入条件 |
|---|---|---|---|
| FOUND-01 | P0 | DEFERRED_ENV | Figma `114:28` 由来の10色が、`theme/css/style.css`→ `global/variables.css` の読み込み経路でCSS Custom Propertiesとして解決し、**実際に使用するパーツのcomputed styleへ反映**されている。CODIAサンプル色の残存で想定外の青/橙表示にならない |
| FOUND-02 | P0 | DEFERRED_ENV | Figmaの各テキストに必要な `Zen Kaku Gothic New` / `Roboto`、レイヤーにあれば `Noto Serif JP` / `Roboto Condensed` のfamily・weight/style・実際の配信・fallbackをブラウザ上で確認。Font Awesome Pro/Brandsは正規利用権限とCSSの読み込みを確認し、不正なフォント/代用品を加えない |
| FOUND-03 | P0 | DEFERRED_ENV | Figmaの正確な画像・ロゴ・SVG・アイコンが `theme/` の意図したパスで表示される。404/一時Figma URL/不適切なcropや伸縮がない。SP/PCで必要な画像の切替・見え方を確認 |
| FOUND-04 | P0 | DEFERRED_ENV | 通常テキストの自然な2〜3行折返し（日本語・英語混在・長いCMS文言）・基本行間`1.3`・中間幅・横スクロール/overflowを確認。**150〜200%の専用文字拡大テストは本案件では要求しない**。新規テキストへの`white-space: nowrap`は不可 |
| FOUND-05 | P0 | DEFERRED_ENV | 共通Font/CSS/asset変更によって他の実装済みページを破壊していないか、影響範囲のPC/SPを再検証。CSS lint/build PASSだけでは代替不可 |

## 2. ページ/状態ごとの後日UI・CMS QA

現段階で未実装のページは `NOT_READY_IMPLEMENTATION`。着手・完成後にlocalが使えなければ `DEFERRED_ENV` へ移し、**登録し忘れを防ぐ**。

| ID | 優先 | 初期状態 | 参照Figma・完了条件 |
|---|---|---|---|
| PAGE-HEADER | P0 | NOT_READY_IMPLEMENTATION | PCメニュー `599:2726`、SP `480:3954`。PC hover 展開・SP click/tap 開閉、focus/keyboard・close状態、重なりとレイアウト、ナビ管理画面の編集/反映、横スクロール。**1079/1080/1081px** でPC/SP状態・`inert`・操作対象がCSSと一致すること、SPでボタン・閉じる・overlay・Escape・幅跨ぎの全閉鎖経路で `_contentFixed` が解除され元のスクロール位置に戻ることを確認。PR #518 のNode静的テスト成功は実機PASSではない |
| PAGE-FOOTER | P1 | NOT_READY_IMPLEMENTATION | Figma Footer `221:335` とPC/SP全体 `0:1` / `263:12`。WordPress管理画面で**フッターメニュー位置 `footer-nav` に設定したメニューだけが、1回だけ**出力されること（Header用 `sub-nav` が重複しないこと）。メニュー未割当時にCODIAサンプルや別メニューが表示されないこと、長いメニュー名・日本語英語混在・リンクキーボードフォーカス・nav landmark・PC/SP/中間幅を確認。ロゴ、SVG装飾、Instagram、ページトップ、hover、住所等の許諾済み情報、フッター下帯の視覚一致も確認。PR #519 の静的テスト/CIはブラウザ・WordPress実機PASSの代替にならない |
| PAGE-ARCHIVE | P1 | NOT_READY_IMPLEMENTATION | 記事一覧 `390:666` / `478:2615`。投稿0/複数件、カテゴリ表示、長いタイトル、日付、ページ送り、正しいリンク（URL確定後） |
| PAGE-PARTS | P1 | NOT_READY_IMPLEMENTATION | パーツ集 `339:23` / `433:2015`。共通部品のPC/SP geometry、状態、画像・hover動作と他テンプレートへの適用 |
| PAGE-SINGLE | P1 | NOT_READY_IMPLEMENTATION | 記事詳細 `392:1279` / `480:3566`。本文・画像・見出し・空欄・関連記事等の構造をFigmaと実データで確認（URL未確定部分は別途保留） |
| PAGE-STATIC | P1 | NOT_READY_IMPLEMENTATION | 固定ページ `384:1046` / `445:3245`。PC SideNavigation `476:1741`、長文/画像、管理画面の編集のしやすさ |
| PAGE-TOP | P1 | NOT_READY_IMPLEMENTATION | TOP `114:28` / `279:2136`、実装指示 `294:852`。MV、CTA、Notice、Course、各hover、空欄/非表示、ACF編集、画像比率・動き。コース紹介**下層**はHuman指示まで実装しない。公式 SVG / WebP は #600 で `images/top/` に保存済みだが `front-page.php` 未接続。接続と表示確認が残作業。詳細は `DESIGN_FOUNDATION.md` の「残作業」 |
| PAGE-SHARED | P1 | NOT_READY_IMPLEMENTATION | 共有Header/Footer変更後の全実装済み画面（PC/SP）でレイアウト・動作回帰。固定要素・オーバーレイ・スクロールロック、横幅境界 |

## 3. 実行結果を残すときの形式

各項目を以下の形式で更新（仮のPASS禁止）:

`ID / status / tested_sha / environment(ブラウザ/バージョン/幅) / data(試験内容) / evidence(ローカル screenshot/log path or PR) / failure_or_remaining / next_action`

- Figma素材はスクリーンショットを実装アセットに流用しない。
- 必要な画像・ファイル・ページURLなど現時点で不明な値は**未確定**と書く。想像で埋めない。
- ローカル検証で見つかった問題は、`../LEARNINGS.md` と関連する実装チェックシートへ反映し、小さな修正PRで対応。復旧後は最新 `so` SHAから再テストする。

## 4. 今できる作業 — local復旧を待たず進める

- FigmaのデザインFoundation（画像/フォント/変数/共通UI）とCODIAベースを照合して必要な改修を実装。
- GitHubで可能な差分レビュー・lint・CI結果の確認、PHP/JSの静的な安全性・ACF既存構造・テンプレートの保守性を検証。
- PC/SPのFigmaデザイン情報を取得し、Header/Footerなど個別パーツを作業ブランチで実装。画面表示未検証の範囲はこの台帳へ登録。
- 既存PRを安全にマージし、`READY`の次の作業へ進む。ローカルWP実機がないこと自体をGitHub/Figma作業の全面停止理由にしない。

### PAGE-PARTS — H4 / separator blossom (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC/SP/intermediate widths, long Japanese/English and linked H4, editor/frontend parity, adjacent block margin collapse, official blossom loaded and centered with native SVG aspect ratio, native hr semantics and no horizontal overflow. Compare Figma PC 344:901 / 344:1135 and SP 442:2766 / 442:3204. No actual browser PASS claimed.

### FOOTER — PC sitemap official bullet (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC top-level menu links display 5.41839px official dot with 12px gap, correct type, multiline and focus, unchanged link/child disclosure behavior. Compare PC 114:523 and SP 506:1632; PC column grouping and SP sitemap visibility remain separate review. No real browser PASS claimed.

### PAGE-PARTS — H2 two-color bottom stroke (2026-11-25)
- DEFERRED_RUNTIME_QA (#523): PC 344:907 / SP 445:3207; compare 3px bottom-only border, horizontal sharp 16% main/84% lightgreen stroke, natural multiline wrapping and unchanged surrounding spacing in editor/frontend at PC/SP/intermediate widths. No actual browser PASS claimed.
