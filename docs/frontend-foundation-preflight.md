# Frontend Foundation Preflight — 案件を始める最初の共通確認

Status: **HUMAN-APPROVED WORKFLOW**（2026-11-20）
Scope: **CROSS-PROJECT / REUSABLE METHOD** — 新しい Figma → Web / WordPress / LP / React 等の**フロントエンド実装案件**。新チャットで案件を引き継ぐ場合も、最初に成果/未実施を確認する。

Canonical details: `docs/section-execution.md`（shared contract → shared foundation → verification → section implementation）、`docs/frontend-quick-contract.md`、`docs/css-strategy.md`、`docs/frontend-font-loading-policy.md`。本書は既存正本の**開始時チェックへのルーティング**であり、新たなCSS/フレームワーク統一を強制しない。

## 初回にAgentから先回りして行う判断

**個別のHeader/TOP/Sectionの見た目合わせを始める前に**、デザインの共通Foundationが「既に確立・検証済みか」「不明か」「不足しているか」を判定する。既に確立済みならやり直さず利用する。未確認や不足なら、**カラー・フォント・画像・SVG・アイコン・基本余白・breakpoint・共通部品の確認と導入を先に進める**。これがニュージャージー案件（2026-11-20）でHumanが追加した実装順の一般化された教訓。

「何のカラーを使う？」「fontを何にする？」をすべてHumanが指摘してから調べるのではなく、AgentがFigma・既存コード・会社/案件規則を読んで **根拠付きの初期設計案と導入状況** を作る。Figmaが正本である場合、そのスクリーンショットとdesign contextの両方を取得して照合し、**メタデータだけで実装しない**。

### Phase A — 現状の棚卸し

1. 案件のFigma正本/PC・SP・主要状態、Company Policy、既存テーマ/デザインシステム/サンプルの位置付け、担当Agent・open PR・変更禁止scopeを把握。
2. Figma Variables / Text Styles / Color Styles / component / icon / image asset の実態を、画面・node・exportとともに確認。色コード、役割、フォントfamily/weight/style、字間/行間、spacing、container、responsive breakpoint、hover/openの状態を採取。
3. 現行コードのCSS変数、font-face/配信、画像変換（必要な場合のWebP/AVIF）、SVG/アイコンライブラリ、既存テンプレート/ACF/共通コンポーネントを確認して **Figmaとの対応表** を作る。
4. 素材の欠落、Font Awesome Pro 等の有償ライセンス、フォント提供可否、既存資産の再利用可否、Figmaとコードの不一致を列挙。欠落を想像で代替・公開リポジトリへ無断追加しない。

### Phase B — 共通Foundation導入

1. **新しい変数/コンポーネントを増やす前に** 既存Theme/Design Systemで同じ役割のものがないか確認。既存の責務分離、命名規則、ファイル分割に合わせる。
2. プロジェクトのCurrent AuthorityとFigmaの意図に合わせ、必要なtoken/CSS変数、font load/weight、画像/SVG/アイコン、base typography、container/gutter、共通UIを導入する。**カラー表だけ作って終わりにしない**。
3. Foundationの各要素は小さくレビューできる単位でcommit/push/PR/mergeしてよい。ただし**1回の毎時実行を1単位に制限しない**。実行環境が許す限り、複数のFoundation作業と関連QAを続ける。
4. Foundation導入後に各ページ/セクションに移る。依存関係が明確なら並行で進めてもよいが、未検証の共通Foundationを完成扱いして全ページへ広げない。

### Phase C — 導入した事実のQA

- Font file / CDN の取得、font-family・weightの実適用、fallbackの意図、画像・SVGの実ファイル・寸法・Figma上の使用位置、CSS tokenの参照解決と反映を確認。
- PC/SPと必要な境界幅・状態の見た目、文字折り返し・可変コンテンツ、UI interaction・アクセシビリティ・性能への影響を、今回触ったscopeに応じて確認。共通tokenやfontを変更した場合は**影響を受ける他の画面も回帰確認**。
- WordPress/ブラウザ実機にアクセスできなければ **未検証** と明記。静的コードレビュー・build successをvisual/runtime PASSと混同しない。
- 根拠、マッピング、導入ファイル/commit、PASS/FAIL/未検証、残る課題を案件の `docs/` に記録し、次回の作業開始時に差分だけ再確認できる状態にする。

## Foundation完了判定の早見表（新しい案件で最初に使う）

色やフォントの一覧を作ることと、実際に動作するFoundationを実装することは別。既存のプロジェクト文書に**対象 / Figma根拠 / 現行コード / 導入差分 / runtime証拠 / 判定**を対応付ける。足りない情報は `UNKNOWN` または `未検証` とする。**新しい一覧表ファイルやCIを機械的に作らず、既存の文書を利用する。**

| 対象 | 調査で確定すること | 完了扱いするために見ること |
|---|---|---|
| 色・CSS変数 | Figma semantic role・既存 token owner・使用箇所 | 参照先 CSS が実際にロードされ、必要なコンポーネントの色に反映された |
| Font | family/weight/style・実ファイル/配信方式・権限・fallback | 対象ブラウザで正しいfontとweightが適用され、意図しない文字幅差がない |
| 画像・SVG・アイコン | node・export・寸法・ライセンス・crop・role | 本物のアセットが配置され、PC/SPでサイズ・位置・見え方が一致する |
| Layout | container/gap/spacing・responsive rules・Existing CSS | 画面幅の変化や2〜3行の可変テキストで通常フローが破綻しない |
| 共通UI | owner・states・hover/tap・連動パーツ | 実際に開閉/クリック等が機能し、関連ページに不具合を生まない |

**判定の段階は混同しない:** `SOURCE_CONFIRMED`（Figma・既存の根拠を取得）→ `IMPLEMENTED`（コードとアセット配置）→ `STATIC_VERIFIED`（構文/build/CI等）→ `RUNTIME_VISUAL_VERIFIED`（必要な環境で描画・操作確認）。最後ができない実行環境なら `UNVERIFIED_RUNTIME` のまま保持し、レビュー可能な証拠と次の確認手順を残す。案件・会社の既存status taxonomyがあればそれを優先する。

**重要:** Foundation全体が未検証でも、依存がない次の単位（正確なAsset整理、メニュー構造設計、独立した部品）を進めてよい。ただし未検証の基盤を完成扱いして展開しない。1つの作業単位で複数領域を安全に進めることも可能。

## 次の案件に引き継ぐもの / 引き継がないもの

| 次案件へ持ち込む | 案件ごとに再確認する（勝手に持ち込まない） |
|---|---|
| 最初にFoundationを確認・整備する**手順** | 特定案件の色コード・フォント名・weight・breakpoint・px/rem |
| Figma→既存コード→不足分→導入→実機QAの流れ | テーマがサンプルかproduction baselineか、CSS/JS/ACF規約 |
| Asset license / 正確なexport / フォント読み込み確認 | メニュー操作、個別ページURL、コンテンツ、投稿タイプ |
| 複数行テキストと可変コンテンツに耐える設計 | 特定案件の`nowrap`全面禁止・line-height=1.3・拡大QA除外などの**明示的な例外/追加指示** |

新しい案件でも `white-space: nowrap` を常に禁止する、全フォントの行間を一律1.3にする、色を `#28AC5F` にする等は**しない**。それはjwsnj固有のHuman決定。一般原則は「一行のFigma座標の写経を避け、Flow/Flex/Gridを優先し、テキストが増えても破綻しないよう設計する」。装飾・意図的なoverlapに必要なabsoluteは使用してよい。

## 新チャット/案件の開始時チェック（簡易版）

- [ ] GitHub/Figma・案件Current Authority・既存Theme/実装資産・責務ownerを確認した
- [ ] カラー、フォント、画像/SVG、アイコン、余白、breakpoint、共通部品の対応表/既存実装を照合した
- [ ] 既存Foundationの再利用と不足分の導入方針を決めた
- [ ] 同一layout boundaryのCSS/JS単位・条件、状態owner、旧サンプル処理、CMS/plugin依存、asset/cache責務を点検し、実装前に重大な懸念・改善順を共有した（quick-contract §8.1）
- [ ] CSS変数/フォント/アセットの**実際の導入とQA状況**を PASS/FAIL/未検証 で区別した
- [ ] 問題があれば小さく安全に実装し、関連する次の作業へ継続する
- [ ] Foundation未完了のままパーツに着手する場合、依存がない理由と未検証範囲を記録した

## 事例と共通ルールを混同しない

- このファイルは「**何を確認してから、どう設計・導入・検証するか**」という一般的な手順を規定する。各案件の色番号・フォント名・Figma node・素材の取得状況・導入完了条件は必ず案件のCurrent Authorityへ置く。
- **新しい失敗を見つけたらまず案件のLEARNINGSとチェックシートに記録**し、次の案件でそのルールが妥当か検証。案件特有の対応をそのまま全案件の禁止事項にしない。
- Humanが「この方法を次案件にも活かして」と希望しても、**一件の実績だけで共通の標準手順には昇格しない**。まず案件の実例と次案件での検証候補を記録し、複数run・異なる画面/案件での有効性、例外、手戻り削減効果、既存規約との重複を `docs/knowledge-promotion.md` に従いレビューする。既存の確定した共通契約を勝手に覆さず、証拠が不足する間は案件限定/候補のままにする。
- 元になった案件の実際の導入状況や変更履歴は `projects/jwsnj/docs/DESIGN_FOUNDATION.md` と `projects/jwsnj/docs/WORKFLOW_LEARNING.md` を参照する。**本書の内容だけでその案件の実装が完了したとは扱わない**。
