# ChatGPT ブラウザ操作による継続実装 — 研究正本

Status: FIGMA_SELECTION_OBSERVED / LIVE_SEND_BLOCKED
Updated: 2026-11-24 JST
Scope: ブラウザ起動・ChatGPTへの入力・実行状態管理。WordPress案件コード自体とは独立。
Authority: ../../AGENTS.md、../../docs/agent-recurring-work-preflight.md、../../docs/recurring-failure-recovery.md、../../docs/scheduled-agent-handoff.md

## 最終ゴール（Human指定）

既存のChatGPT実装チャットで真正なFigmaプラグインを選択し、「慎重に進んで」を自動送信する。毎時起動を初期値とし、前回の生成・ツール実行中なら送信しない。追加のAPI料金やAIサブスクリプションを発生させず、既存の高性能ChatGPTモデルを使い、正常時は人の操作なしで継続する。
単なるリマインダー・チャットを開く・コピー・手動送信は中間成果であり、最終ゴールではない。
ブラウザUIでの無人入力が許容されるか、真正なプラグイン選択はM5の接続済みChromeで観測済みだが、反復再現は未検証。公式の利用条件・対応手段を確認する。制限回避、非公開API、CAPTCHAや認証の回避、無許可の出力自動抽出は行わない。許容条件を確認できなければ無人送信を有効化せず、BLOCKEDと明示する。

## 研究対象

- GitHub: m-shogo/figma-ai-project / so
- 初回検証: jwsnj / 既存ChatGPT実装チャット
- Figma正本: K3SANPVHIEerfYBQtM4lXF（案件の最新authorityが優先）
- 対象チャットURLはローカル設定で指定。共有repoにセッション情報や個人識別情報を保存しない。
- 初回の調査base: 08516fa26e518c022444098f540cbd40ef525aeb
- 既存ChatGPT毎時タスクはこの研究の開始時には変更しない。実運用への移行時はHuman承認の上、片方を停止し二重起動を避ける。

## 端末別最適化

共通化は目的ではない。性能、精度、安全性、運用コストを優先し、各端末で最善の方式を実証して採用する。

| | 旧Mac | 新Mac |
|---|---|---|
| Hardware | MacBook Pro Retina 15-inch Mid 2015 / Intel i7 2.2GHz 4-core / 16GB | MacBook Pro M5 Pro / 24GB |
| OS | Monterey 12.7.6（既存記録、今回未検証） | macOS 26.4.1 / arm64（今回実測） |
| 優先 | 長時間安定・対応ブラウザ・少ない依存・低消費電力 | DOM/アクセシビリティベースの高精度判定・テスト |
| 候補 | セキュリティ更新のある対応ブラウザ、OS標準の定期起動、必要なら対応版Hammerspoon | 現行Playwright等のUIテスト技術、専用ブラウザプロファイル、OS標準の定期起動 |
| 自動送信 | 未検証・無効 | 未検証・無効 |

共通にするもの: ローカル設定の形式、状態分類、失敗ログ、起動ルール、停止条件、テストの受入基準。実際の画面認識・ブラウザ・依存バージョンは端末別に判断。ブラウザやOSのサポート状態を導入時に確認し、安全な更新が受けられない端末に業務用アカウントを置かない。旧Macはバッテリー自主回収対象外とHumanから申告あり、独立照合は未実施。膨張・異常発熱・電源状態は別途確認する。

## 管理構造

- README.md: ゴール・対象・設計の正本
- LEARNINGS.md: 失敗、観測、回復、次回試験の記録
- ACCEPTANCE.md: 実装・機種別QA・無人運用へのゲート
- 将来の実装は common/、modern/、legacy/、tests/ に必要に応じて分離する。未作成の実装ディレクトリを完成扱いしない。

## 現状

実装済み: common/ の模擬状態判定・永続化・同一端末内排他と mac/ のmock専用plist生成。実サービス送信アダプターと無人送信は未実装・無効。

実機確認済み: M5 Pro / macOS 26.4.1 / Chrome 158.0.8127.37で対象チャットを識別し、空の入力欄から `@Figma` 候補を選択。指定connectorに一致する非編集メンションが生成された。未送信の検証入力は消去済み。Node v24.15.0で既存テスト全件PASS。詳細・限界は [LEARNINGS.md](LEARNINGS.md)。

BLOCKED: 外部ツールからの無人反復送信が正式に許容される条件を確認できていない。禁止と断定する根拠とも区別する。実送信・定期起動は実施せず、既存タスクと案件コードは変更していない。
NEXT: 公式の対応経路またはOpenAIの回答で当該条件を確認し、既存タスクとownerを照合してから単発送信を検証する。許容条件が変わらない限り、模擬試験だけの追加や別の入力技術への置換でゲートを回避しない。

## 2026-11-24 追補

方式比較と根拠は [RESEARCH.md](RESEARCH.md)。MCP Appのui/messageを外部から任意チャットに送信するAPIと誤認しない。共通の模擬状態判定 common/mock-gate.mjs と再現テスト tests/mock-gate.test.mjs を追加。当初はJSによる74ケース成功のみ。今回MacのNodeでも既存テストを実行済み。CI・実送信は別判定。現時点のstatusは MOCK_GATE_VERIFIED、LIVE_SEND_NOT_VERIFIED。無人送信は引き続き無効。

## ローカル基盤の更新

common/local-runner.mjs と mac/launchagent.mjs を追加。模擬実行の状態を実ファイルへ保存し、毎時起動用のplistを生成できる。Linux Nodeで9テストとplist解析成功。実サービス送信は0回、Macのlaunchd起動は未検証。

### Macでのオフライン再現（送信なし）

Nodeが実機で動くことを確認後、本フォルダから以下を実行する。既存のv0.2通知やChatGPTタスクを自動で変更しない。

```sh
node --test tests/*.test.mjs
STATE="$HOME/Library/Application Support/JWSNJ-Browser-Mock"
node common/local-runner.mjs init-mock "$STATE"
node common/local-runner.mjs tick-mock "$STATE"
node mac/launchagent.mjs "$STATE" 5 > "$STATE/mock.plist"
plutil -lint "$STATE/mock.plist"
```

plistの生成までがこの手順の範囲。Mac実機での定期起動は別途確認。すべてmock専用であり、本物のFigmaやChatGPTへの接続・送信を行わない。完成判定はACCEPTANCE.mdの実送信・反復・実装成果の確認まで保留。
