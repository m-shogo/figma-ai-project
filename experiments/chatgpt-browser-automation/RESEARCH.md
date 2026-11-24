# 方式選定 — 2026-11-24

Status: SOURCE_REVIEWED / MOCK_GATE_VERIFIED / LIVE_SEND_NOT_VERIFIED

## 調査した一次資料

| 方式 | 確認できたこと | 不明点・判断 |
|---|---|---|
| [OpenAI MCP Extensions](https://github.com/openai/mcp-extensions/blob/main/docs/spec.md) (spec blob b976cc89855ce0adc28169276a0cc419523ffff4) | MCP Appのui/messageはactive/newを対象にでき、送信/下書きを指定できる。Web対応表はWorkのWebを指し、classic ChatGPTを除外する。Composer mentionsはDesktop/Work Web対応。 | 外部スケジューラから任意の既存ChatGPT会話を指定するAPIではない。Figma選択、無人運用、Plusでのカスタムアプリ利用は未確認。正式な候補だが採用保留。 |
| [AI Prompt Macro](https://github.com/tomoponz/ai-prompt-macro-public) (README blob 90df97cab9f9a4b32a2927b0d88dd3ca9457e07d) | 0.4.4はChrome/Edge限定、最大50送信、同一会話の競合防止、回答本文非収集、結果不明時再送なし。 | 作者の[検証記録](https://github.com/tomoponz/ai-prompt-macro-public/blob/main/docs/verification.md)では0.4.4の模擬UI CIは成功、実ChatGPT最終確認は未実施。Figma選択やブラウザ終了状態から起動する機能は確認できない。設計のみ参考、未導入。 |
| [PromptQueue](https://github.com/hanx-777/PromptQueue) | READMEで可視DOMとローカルキューによる順次送信を説明。 | UI変更に弱いと明記。ライセンスファイルの取得が404のためコード流用はしない。 |
| [Agent Continue](https://github.com/1235357/agent-continue) | 既存会話へのスケジュール送信を説明。 | 現在の3.2.1はWindows-enabled release candidate。不要な端末権限を含む構成は採用しない。 |
| [Firefox WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts) | 背景スクリプトのイベント再起動を公式資料で確認。 | Monterey上での最新版サポート、実機、拡張の配布・署名、Figma選択は別途確認。旧Mac候補。 |

公式参照:
- https://openai.com/policies/terms-of-use/ — 自動データ/出力抽出、リミット・保護措置回避は禁止。UIへの入力すべてが禁止と断定しないが、無人反復の正式な許容範囲は未確認。
- https://developers.openai.com/plugins/build/extensions — current/new conversationへのMCP App内メッセージ送信。
- https://help.openai.com/en/articles/10291617-tasks-in-chatgpt — 公式の定期実行機能。利用枠に従う。
- https://github.com/openai/openai-apps-sdk-examples/issues/227 — ui/messageで投稿されてもモデル呼出に至らないという報告。自分たちの環境で再現した証拠ではない。

## 残す設計

1. まず公式経路を確認。M5はMCP Appの機能適用範囲を調べ、使えないなら通常ブラウザの許容される操作を検討。旧Macはサポート中のブラウザと軽量なWebExtensions候補を優先。正式に許容されない場合は採用しない。
2. UI方式を決める前に、状態判定は純粋関数として模擬入力で検証する。チャットの応答本文を取得しない。ローカル状態、単一owner、結果不明時再送禁止、明示的な停止を優先。
3. 実際の送信が成功した方式だけLIVE_VERIFIEDへ昇格する。第三者のREADME、CI、模擬テストはLIVEの証拠ではない。
4. 今回は既存OSSをインストール、フォーク、コード転載していない。既存タスクや案件Themeは変更しない。

## 実証結果

common/mock-gate.mjs は通信もDOM操作も送信も持たない純粋関数。正しい模擬状態のみMOCK_READY。
2026-11-24、JS実行環境内で関数を実際に評価: 初版17件成功。その後、通信・認証・利用制限の状態が欠落していても初版は許可しうるとコードレビューで発見。全入力フラグの欠落・不正値を拒否するよう修正し、正常/停止14件＋欠落/不正値60件＝74件成功・0失敗。保存後に両ファイルの内容一致を再取得確認した。
tests/mock-gate.test.mjs は再現用Nodeテスト。実Nodeランナー/CIは未実行。実際のロック、状態永続化、各端末のアダプター、Figma選択、送信は未実装。この結果は模擬判定の成功に限る。

再現（ローカルNode環境）: node experiments/chatgpt-browser-automation/tests/mock-gate.test.mjs

## 次のREADY

- 正式な利用条件と対応するPlus/端末での機能を確認する。
- ローカル模擬UIでIDLE/BUSY/UNKNOWNと遷移、単一owner、永続化、タイマーをテストする。
- 各Macの実機で真正なFigma選択と本人送信を確認。正式な手段が確認できたら管理下の単発送信、次いで反復送信の受入試験へ。
