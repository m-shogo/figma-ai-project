# ChatGPT ブラウザ操作による継続実装 — 研究正本

Status: EXTENSION_SINGLE_SEND_CONFIRMED / FIGMA_RESULT_UNVERIFIED / RECURRING_DISABLED
Updated: 2026-11-24 JST
Scope: ブラウザ起動・ChatGPTへの入力・実行状態管理。WordPress案件コード自体とは独立。
Authority: ../../AGENTS.md、../../docs/agent-recurring-work-preflight.md、../../docs/recurring-failure-recovery.md、../../docs/scheduled-agent-handoff.md

## 最終ゴール（Human指定）

既存のChatGPT実装チャットで真正なFigmaプラグインを選択し、「慎重に進んで」を自動送信する。毎時起動を初期値とし、前回の生成・ツール実行中なら送信しない。追加のAPI料金やAIサブスクリプションを発生させず、既存の高性能ChatGPTモデルを使い、正常時は人の操作なしで継続する。
単なるリマインダー・チャットを開く・コピー・手動送信は中間成果であり、最終ゴールではない。
最新Human指示（2026-11-24）: 禁止と確認されていないことを理由に実装・実送信検証を進め、サポートへの追加問い合わせはしない。これはOpenAIの正式な許諾が確認できたという意味ではない。認証・利用上限・保護措置を回避せず、非公開APIや無許可の回答本文抽出を行わない。旧来の「明示的許容の確認待ち」は今回の作業停止条件から外し、実際の権限・安全性・重複防止をゲートとする。

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

実装済み: common/ の模擬基盤、mac/ のmock専用plist生成に加え、[modern/chrome/](modern/chrome/) にManifest V3拡張を追加。真正なFigma候補選択、限定したDOM識別、送信前intent永続化、receipt照合、結果不明時停止、単一writer、BUSYスキップ、毎時alarm、緊急停止を実装した。M5のChromeへ読み込みとchatgpt.comの任意権限付与、対象設定の保存を実施。拡張経由の送信・定期起動は未実施。

実機確認済み: M5 Pro / macOS 26.4.1 / Chrome 158.0.8127.37で、Codex接続済みChrome操作から真正なFigma選択付き「慎重に進んで」を指定チャットへ送信。送信後のFigmaリンク・本文・生成開始を確認した。これは拡張経由の成功ではない。対象チャットはFigma取得成功を報告し、実行履歴にFigma診断の記録を表示したが、取得payload自体は独立検証していない。診断フェーズAのため、案件実装は進んでいない。

NEXT: Humanの「進めて」を受け拡張を読み込み、サイト権限付与・設定保存後、送信なしprobeをクリックした。結果詳細の取得がブラウザ操作ツールのURLポリシーで拒否されたため、Humanの画面転記により `IDLE_EMPTY` を確認済み。定期送信の有効化は既存タスク・別端末との排他と切替承認後。実送信成功1回、実定期起動0回。根拠と限界は [LEARNINGS.md](LEARNINGS.md)。

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

## Chrome拡張の導入と停止

実行時にCodex/ChatGPT APIやAIモデルを呼ぶ構成はない。Chromeのservice workerとalarmだけで送信を行う。Codexは開発・修正用途のみで、定期実行へ組み込まない。

ソース: `modern/chrome/`。追加パッケージ、APIキー、Node常駐プロセスは不要。Chrome自体が終了している間は動作しない。旧Mac/Firefoxには転用・導入していない。

1. Humanが読み込み・サイト権限を承認した後、Chromeの拡張機能ページで「パッケージ化されていない拡張機能を読み込む」から `modern/chrome/` を選択する。M5への読み込みは実施済み。
2. 拡張のpopupに対象URLをローカル入力。固定のFigma connectorと本文、初期値60分を確認する。サイト権限はchatgpt.comだけを要求する。設定はstorage.localのみ、storage.syncや外部サーバーを使わない。
3. 送信なしprobeはowner未確認でも実施できる。単発・定期送信前には既存タスクと他端末の並行実装を解消してowner確認を入れる。確認checkboxは機械的な端末間ロックではなくHumanによる運用上の排他である。
4. 対象タブは既に開いたものが正確に1枚必要。未発見・複数・別チャット・人の下書き・添付/未知UI・認証要求・上限・通信障害では停止。UI言語は今回校正した英語ラベルのみ。UI変更や日本語UIを推測で操作しない。
5. 「単発送信」で実機検証した後、切替承認を得て「定期送信を開始」。開始時の即送信はせず、設定間隔後から。未実行分の連続送信はしない。最終出力時刻・次回予定・送信/skip回数・停止理由はpopupに表示する。
6. 「緊急停止」で停止。送信ボタンを押した後のメッセージは取り消せない。結果不明ならpendingを残して停止し、設定の再保存や再起動では解除しない。部分入力は消去せず確認用に残す。原因と投稿有無を人が照合するまで再送しない。

権限: storage / alarms / scripting と、任意許可の `https://chatgpt.com/*`。cookie、履歴、全サイト、webRequest、debugger、外部送信の権限は要求しない。ただしChromeのサイト権限自体は当該origin全体に及ぶ。コードが対象URLへ限定してもブラウザの権限が1チャットだけになるわけではない。

限界: 拡張の入力イベントを実ChatGPTが受理するか、添付検出、receipt照合、利用制限/認証判別、スリープ・再起動・alarm復旧は実機未検証。現時点で常用可能とは判定しない。依存なしのNodeテストはservice workerの制御・永続化をChrome APIスタブで検証し、DOM adapterの実機成功を意味しない。

## M5導入の最新到達点

設定画面を通常タブで開いた場合のsender判定を修正。自拡張のpopup.html URLからだけ内部操作を受け付け、同じ拡張IDでもChatGPTのcontent scriptや他のページからは拒否する。内部処理が無応答でも設定画面が無言で止まらず、エラーを表示する。

実機で設定保存を確認: 間隔60分、enabled=false、exclusiveOwnerConfirmed=false、pending=null、sent=0。これは拡張自身の状態であり、以前のCUA単発送信1回とは別。既存タスクは変更していない。権限付与後の送信なしprobeはクリック済みだが、AX表示が結果末尾を省略し、拡張URLの詳細取得はツールポリシーで拒否された。別経路での回避は行わず、結果確認をHumanへ依頼し、`IDLE_EMPTY` の画面転記を受領した。これは拡張自身の送信なし状態確認が成立した観測であり、送信成功ではない。単発・定期送信は押していない。

## 送信状態・コピー操作の改善（0.2.0）

- メイン画面に日本語の状態・停止理由・次の操作を表示。生のJSONは「技術情報」へ折りたたむ。送信予定と実際に確認できた最後の投稿を区別する。
- 「この内容を保存して送信」「保存して状態確認」で現在の入力を先に保存。並行実装の確認にチェックがない間は送信・定期開始を無効化し、理由を表示する。保存忘れによるOWNER_UNCONFIRMEDを避けるが、排他確認自体を省略しない。
- 「結果をコピー」で日本語の結果・送信件数・送信先・本文・次回予定・診断コードを改行付きでコピー。読み取り専用の結果欄からの選択コピーも可能。JSONの手動コピペは不要。
- 送信前の試行内容と、receiptで確認できた最後の送信先・Figma connector・本文・時刻を別々にstorage.localへ保存。後から設定URLを変えても送信済みの記録を書き換えない。結果不明を成功履歴へ入れない。更新前の履歴を推測で復元しない。
- 更新手順: Chromeの拡張機能管理で本拡張の「再読み込み」、その後に設定画面を再読み込み。追加権限はない。拡張の更新時は既存の安全仕様により定期実行が停止する。確認せず再開しない。

ローカルの架空データ画面で表示・チェック後の送信ボタン有効化・保存して状態確認・コピー完了・未知の結果での停止表示を検証済み。実拡張0.2.0の読み込みと実送信は未検証。Chrome拡張ページへの操作ツールの拒否を別経路で回避していない。

## 未確定結果の診断（0.2.1）

Humanの実機結果ではpendingが残り、state.reason=UI_TIMEOUT、送信確認0件となった。旧記録にはattemptDetailsがなく、タイムアウトの段階と送信ボタンの操作有無は不明。0.2.1では処理段階（入力/Figma選択/本文/送信ボタン/receipt）と操作試行有無を記録し、元の停止原因を再読込・reconciliationで上書きしない。

共有結果に画面とworkerの版番号を含め、版が一致しない場合は送信・設定変更を止めて拡張自体の再読み込みを案内する。旧試行の詳細不足を「試行なし」と表示せず、lastAttemptを時刻のfallbackとして「投稿の有無は不明」と表示。pendingは消さず、自動再送も行わない。実際の送信タイムアウトの根本原因・投稿有無は未確定で、Humanに対象チャットの投稿と下書き状態の確認を依頼している。

### 未投稿を確認した後の保留解除

「今回の投稿がなく、入力欄が空であることを確認しました」にチェックし、「保留を解除する（送信しない）」を押す。workerは表示時のattempt IDを照合し、対象タブがIDLE_EMPTYであることを再確認する。条件が違えば解除しない。結果はlastResolutionに記録し、lastFailure・試行詳細・送信件数・待機時刻は維持する。解除後も定期実行は停止したまま。投稿がある場合・不明な場合はこの操作を使わない。

## 未投稿確認後の待機解除（0.2.2・最新）

0.2.1までは失敗した試行にも設定間隔分の待機を残していた。ChatGPT側の制限ではない。Humanが未投稿を確認して保留解除した場合、0.2.2ではその試行の待機も解除する。すでに0.2.1で解除済みの場合も、最新試行に対応するHuman確認があり、新しい試行や成功receiptがないことを照合して待機を解除する。元の期限は監査記録に残す。この補正自体は送信も定期開始も行わない。

未確定pending、古い確認、別の試行、成功receiptがある場合は待機を解除しない。先の0.2.1節にある「待機時刻を維持」は当時の動作記録で、現在は本節を適用する。UIとworkerを0.2.2へ更新後、未投稿確認済みなら単発の再試験へ進める。実機0.2.2の更新・再送は未検証で、元のUI_TIMEOUTの根本原因も未確定。

## Figma候補の識別修正（0.2.3）

実ChatGPTの候補ボタンは、textContentでは `FigmaCreate designs, ship to code`、innerTextでは名前と説明が改行されていた。0.2.2は前者を空白区切りの名前と比較していたため一致しなかった。0.2.3はaria-label / innerTextで表示名を正規化し、一致候補が唯一の場合のみクリックする。選択後の非編集メンション・指定connector一致の検証は維持する。本文挿入時には区切りの空白を明示する。

実adapterを使うローカル回帰fixture: `tests/figma-selection-fixture.html`。本フォルダをPython等でlocalhostへ配信し、このHTMLの実行ボタンで確認する。fixtureは実ChatGPTへ接続せず、ローカルのDOMとstorageスタブのみ。Chromeでpass=trueとconnector/receipt照合を観測済みだが、実拡張0.2.3による送信は未検証。

送信ボタン操作前であることが同じattemptのadapter結果で証明される場合は、「送信前に停止（投稿なし）」としてpendingと待機を解除する。既存の0.2.2記録にもstatus確認時に同じ照合を適用。自動再送はせず定期送信オフを維持し、残った下書きは変更しない。送信ボタン操作後・結果不明・記録不足・別attemptでは従来どおり保留する。修正版の初回再試験前には残っている `@Figma` を本人が削除して空にする。

## 拡張0.2.3の初回実送信成功（最新）

Humanが0.2.3で単発送信を実施し、共有結果はCONFIRMED / VERIFY_RECEIPT、送信確認1件、pendingなし、定期送信オフ。記録された投稿時刻は2026-11-24 17:16:20 JST。送信先・Figma connector・本文は設定と一致。公式read_threadでも同じ対象会話の新しいユーザーメッセージに真正なFigma connectorメンションと「慎重に進んで」があることを独立確認した。以前のCUA代替送信と別に、Chrome拡張自身の送信成功が確認できた。

取得できた対象チャットの応答は見出し「17:16｜復旧」のみ。この記録からFigmaツール呼出・デザイン取得・GitHub案件実装の進行は確認できない。送信成功と案件の進行は別判定。実際の定期起動はまだ0回で、既存タスクも変更していない。本運用への切替には既存タスクとの排他とHumanの切替承認が必要。

結果内の「元の停止原因」は最後のエラー履歴であり、CONFIRMEDの現在結果とは別。Human提示のDRAFT_EXISTSを今回の失敗と解釈しない。
