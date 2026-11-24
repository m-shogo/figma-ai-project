# 学習・失敗記録

## 2026-11-24 — 自動タスクと手動Chatの環境差

- 観測（自動実行の保存済みレポート）: 12:35 JST、Figma必須skill取得が Resource not found、skill一覧は空。GitHub so HEAD取得成功。Figmaの実ファイル読み取りはそのrunでは未実行。
- 観測（手動Chatのツール結果）: 12:42 JST、新規Figma session、Footer 221:335の高精細context、1380×551のスクリーンショット、so HEAD取得が成功。必須skillの読み取りも成功。
- 原因: 自動実行環境のskill提供差が有力だが、正式な根本原因は未確定。認証・ファイル権限・skill露出を区別する。手動起動成功を通常の定期実行成功に読み替えない。
- 過去の武道館: 9/24の保存済み報告にも必須ガイダンス取得不能の記載あり。9/28にはmetadataとスクリーンショット取得の報告あり。生ツールログの全件検証は未実施。
- 対策: 既存タスクは別に診断中。ブラウザ操作は独立研究として扱う。公式の利用条件が許す経路のみ採用。

## 2026-11-24 — ゴール取り違え

- Humanのゴール: Figmaを選択し、既存チャットへ「慎重に進めて」を毎時自動送信する。実装そのものは高性能ChatGPTを使う。
- 過去の補助ツールv0.1/v0.2はチャット起動・通知・手動送信補助を中心としており、ゴールの無人送信は未実装と説明されていた。ZIPの内容・テスト結果はこのGit作業で独立確認していない。
- 修正: 手動補助を完成扱いしない。自動送信、真正なFigma選択、実行中のスキップ、再起動後の重複防止の証拠を必須にする。
- 共通化は目的でない。Intel MontereyとM5で最適な方式を別々に評価する。片方のPASSを他方のPASSに転用しない。
- 次回: ACCEPTANCE.mdに従い、公式許容条件・実機確認・安全なテストから進める。同じ失敗を無変更で繰り返さない。

## 記録フォーマット

日付(JST) / 端末・OS・ブラウザ・バージョン / 起動種別 / 実際の操作 / 観測された結果・エラー / 原因の確度 / 変更点 / 再現試験 / 証拠の所在 / 次のREADY・BLOCKED。ログには認証情報・Cookie・短期素材URL・顧客デザインや会話全文を残さない。

## 2026-11-24 — 方式の一次資料再読と模擬判定

- MCP ExtensionsはApp内向けであり、外部から任意のChatGPT会話へ送信するAPIと確認できない。Webの対応範囲はWorkで、classic ChatGPTを除外。前回の候補評価を修正。
- APM作者は最新版の実ChatGPT確認を未実施と明記。公開CIのみで採用しない。詳細は RESEARCH.md。
- 13:35の既存自動タスクの保存レポートでは操作の存在確認のみ、skill・Figma・GitHubの実呼出は未実行。原因の進展なし。この研究からタスク変更しない。
- 模擬ゲート初版17件成功後、offline/authRequired/limit欠落が許可されうることをレビューで発見。全入力フラグの欠落・不正値を拒否して74件成功、Git readback一致。Nodeランナーと実機は未検証。自動送信成功ではない。

## 2026-11-24 14:03 — 定期送信の再現性（第2段階）

Humanの明示受入条件: 既存JWSNJチャットへ真正なFigma選択付き「慎重に進んで」を、手動介入なく定期送信し、実際に案件実装が進むこと。以前の「慎重に進めて」も意味は同じだが送信本文はローカル設定の最新Human指定を優先。案件名はニュージャージー/JWSNJ。
- 13:35の既存タスク結果は実操作未実行でBLOCKED、次回14:35。今回はタスクを変更していない。
- 今回の手動Figma陽性対照: skill読込、create_session、whoamiは成功。Footer 221:335のget_design_contextは INVALID_ARGUMENT / An unexpected error occurred. / Figma Debug UUID dae14f1e-a317-4557-ab0d-08033b350cc5、get_screenshotも同エラー（UUID b3f1f1a2-5a3c-44b2-a1fe-5b0bef78b3dd）。GitHub so HEADは08516fa26e518c022444098f540cbd40ef525aeb。認証成功とデザイン取得成功を分ける。原因未確定。以前の手動成功を今回の成功としない。
- common/mock-recurring.mjs / tests/mock-recurring.test.mjs を追加。仮想24時間（24回の時刻入力、確認済みreceipt、各回のJSON再読込、同一slot再入力）およびBUSY、スリープ相当の時刻ジャンプ、clock rollback、結果不明、権限/制限/通信等の停止をJS内で評価し121 assertions PASS。実時間24時間の試験ではない。Gitの保存と再取得一致を確認。
- 保存した状態を入力に使う純粋な模擬ロジックのみ。OSタイマー、実ディスクへのatomic保存、端末間排他、実ブラウザadapter、真正なFigma選択、実際の自動送信は未実装。Node runner/実機未検証。現在のChat環境に別会話へ送信する正式操作がないため、実サービス送信0回。モック成功を送信成功として扱わない。
- 次の実証条件: 実行可能な正式経路・Mac実機での送信を1回確認→複数の定期起動で実送信/skip/停止を確認→GitHub成果とFigma実測を別々に照合する。既存タスクとの二重writer禁止。

## 2026-11-24 — ローカル実行基盤（送信は未実装）

- v0.2 ZIP実ファイルを確認。common/runner.shは毎時通知とコピー、modern/prepare.mjsは校正済みselectorを用いるFigma選択・入力補助（送信は本人操作）、legacy/check.commandはFirefox確認・起動補助。どれも自動送信の実装ではない。
- 現在のChatからブラウザ接続確認を実際に試みた結果、UNKNOWN: Browser access requires the originating browser context. Open ChatGPT in the browser with the connected extension and try again. 既存チャットへの実送信は今回も0回。Work移行はHumanが以前拒否済み。無断で移行しない。
- OpenAI公式利用規約 https://openai.com/policies/terms-of-use/ および https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt を確認。出力等の自動抽出・利用制限回避は禁止。一般Chatへの無人反復入力と真正なFigma選択の正式な経路はまだ確定していない。
- common/local-runner.mjs は実ディスクへの一時ファイルfsync/rename、同一ディレクトリのmkdirロック、初期化・時間帯の重複防止、結果不明時の停止を実装。永続化はローカル模擬実行に限る。電源断耐性・端末間排他・実送信receiptは未検証。残留ロックは自動解除しない。
- mac/launchagent.mjs は毎時指定分のmock-only LaunchAgent plistを生成。インストールや起動はしない。対象の旧Mac/新Macの実機、Nodeの対応バージョン、launchctlによる起動は未検証。
- Linux / Node v22.16.0 で tests/local-runner.test.mjs と tests/launchagent.test.mjs を実行、9テスト成功・0失敗。実プロセス・ディスク、仮想24時間のslot、壊れた状態、ロック、停止を検証。Python plistlibで生成plistの引数・時刻・RunAtLoadを解析しPASS。保存した4ファイルのGit blob SHAは実際にテストしたファイルと一致。
- 次の最優先は真正なFigma選択・既存チャットへの送信ができる許容経路の実機検証。ローカル基盤の追加テストだけを増やして無人運用の成功と主張しない。既存タスク・案件Themeは変更しない。

## 2026-11-24 — M5実機でFigma選択を観測、送信ゲートは未解除

- 基準: GitHubから明示fetchしたso `08516fa26e518c022444098f540cbd40ef525aeb`、既存PR #592はopen/未merge、head `e068b413bac490c11bde3811a058693e0c8f7953`。PRコメント一覧は空。研究ブランチを引き継ぎ、変更は本フォルダのみ。
- 実測環境: Apple M5 Pro、メモリ25769803776 bytes、macOS 26.4.1 build 25E253、arm64、Chrome 158.0.8127.37、Node v24.15.0。旧Macは今回アクセスしていない。
- 実操作: Codexのcua_replで接続済みChromeからHuman指定URLを開いた。タイトル「ニュージャージー毎時実装」とURL一致。入力欄は空。Add files and moreにFigmaが初期表示されなかったため、入力欄へ `@Figma` と入力して候補を表示し、`Figma Create designs, ship to code` をクリック。通常文字列からFigmaアイコン付き非編集メンションへ変化した。
- 選択根拠: 入力欄のDOMに `app-mention-name="figma"`、`app-mention-path` と `data-prompt-link-href` がHuman指定connectorと一致するspan、`contenteditable="false"` を観測。これは選択成立の単発観測であり、Figmaツール呼出・取得成功の証拠ではない。DOM全文・画像の署名URL・会話全文はrepoへ保存しない。以後のprobeでは必要な属性のみのallowlistで取得する。
- 安全な終了: Sendは押さず、本文「慎重に進んで」も送信せず、自分が作った検証入力を空へ戻したことをAX stateで確認。ユーザーの既存下書きの上書きなし。既存スケジュール変更なし、launchd未導入、ソフト追加インストールなし。
- 以前の `Browser access requires the originating browser context` は今回発生しなかった。接続不可を現在のブロッカーとして持ち越さない。ただしCodexの接続済みUI操作が可能なことと、独立した毎時サービスとして使えることは別。
- Git取得の注意: このcheckoutのremote.origin.fetchは別の単一branchに限定されていた。通常fetchだけではsoを更新できず、明示refspecでsoと研究branchを取得した。`git switch --track origin/...` は追跡対象判定で失敗しindex/worktreeのみ切り替わったため、同じrefへ `git switch --no-track -c` でbranch/HEADを整合させた。最終的に既存の未追跡 .DS_Store / cku.zip以外はclean。Git/SSH設定・元ファイルを変更していない。
- GitHub CLI: `gh pr view` はHTTP 401 / AUTH_PERMISSION。認証設定を変えずGitHubコネクタのget_pr_infoでPR状態取得に成功。fetch_pr_commentsは引数名をrepo_full_nameへ訂正して成功。
- 実行検証: `node --test experiments/chatgpt-browser-automation/tests/*.test.mjs` がMacで11 tests / 11 pass / 0 fail。内訳は既存9テストと74ケース・121 assertionsのスクリプト。模擬基盤の再検証であり新しいモックは追加していない。証拠は本Codex実行のコマンド出力（2026-11-24 14:13 JST）。
- BLOCKED / UNDETERMINED: RESEARCH.md記載の一次資料を再確認したが、外部UIからの無人反復入力の正式許容条件は確認できない。入力が全面禁止という結論ではない。Humanが指定したGate 0により実送信アダプター・定期起動へは進めない。解除条件は公式根拠またはOpenAI回答。問い合わせは送信していない。
- 今回の実サービス送信成功0回、実定期起動0回、Figma取得・JWSNJ実装成果は未検証。選択UIの到達点と安全な停止を記録し、完成宣言しない。
