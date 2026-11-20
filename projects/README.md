# projects/

納品する案件を 1 案件 1 フォルダで置く。共通の Docker 実行環境は `runtime/wordpress/`、全案件共通のルールは `AGENTS.md` と `docs/`。

```text
projects/<slug>/
  README.md        入口: 状態・URL・Figma 正本・起動
  runtime.env      compose 名・ポート・theme slug（案件ごとに別 DB・別ポート）
  theme/           納品する Theme（Git 追跡）
  qa/              この案件専用の Playwright / seed / runtime QA
  docs/            CURRENT_AUTHORITY / THEME_RULES / DIRECTORY_MAP など案件正本
  LEARNINGS.md     案件中の FB 記録と、閉じるときの振り返り
  reference/       提供された参照 Theme（Git 外・編集禁止）
  .local/          DB スナップショット・キャプチャ・一時ファイル（Git 外）
```

## 起動（repo 直下、PowerShell）

```powershell
.\wp.ps1 list                         # 案件と URL
.\wp.ps1 up <slug>                    # 起動（DB は案件ごとに別）
.\wp.ps1 status <slug>
.\wp.ps1 snapshot <slug>              # DB + uploads を .local/snapshots/<日時>/ へ
.\wp.ps1 restore <slug> <日時>
.\wp.ps1 down <slug>                  # 停止のみ。DB は消さない
```

bash / CI は `PROJECT=<slug>` を付けて `runtime/wordpress/scripts/runtime-env.sh` を読む。

メニュー・ACF の保存値・投稿・固定ページは DB にしかない。Theme ファイルを上げても移らない。手で作った状態は `snapshot` で残し、再現が必要なものは `qa/seed-*.php` にする。

## 定期実装・新しいチャットへの引き継ぎ

新案件で「毎時実装」を開始するときや、別チャットから定期タスクを引き継ぐときは、`AGENTS.md` に加えて **`docs/agent-recurring-work-preflight.md` を作業開始時に読む**。定期スケジュールの「毎時」は起動頻度であり1回50分稼働の保証ではない。「1単位」はコミット/QAの小さい区切りで、1時間につき1単位の上限を意味しない。直近の実行時間と実成果を確認し、必要なら**最初にHumanへその違いを指摘**する。安全に複数単位進められるなら次の実装・検証へ進み、CI待ちだけで早期終了しない。案件ごとのCurrent Authority/保護範囲/有効なランタイムを優先する。

FigmaからWeb/WordPress/LPを新規実装する際は、**`docs/frontend-foundation-preflight.md` でデザインFoundationの状態を確認**。まずカラー・フォント・アセット・既存テーマの変数/部品を照合し、必要な基盤を実装・QAしてから個別パーツへ進む（既存で確認済みなら再導入しない）。数値・フォント名・会社テンプレートは案件ごとに再判定し、jwsnjの値を流用しない。

## 新しい案件

```powershell
.\wp.ps1 new <slug>
```

1. 提供 Theme があれば `reference/` へ置く（編集しない）。作る Theme は `theme/`
   - **Theme受領・ベースThemeの変更時に一度、ルールの適用先を確認**: `python scripts/scan_wordpress_target.py projects/<slug> --compare-projects-dir projects --scope-brief`。出力された **共通 / 現Theme / 現案件** の読み先を確認してから実装。`reference/` は比較用であり稼働する `theme/` と混同しない。コードやThemeを変更していない毎時実行では再実行不要。CLIが使えないAgentはGitHub上の `theme/style.css`・`inc/`・`css/style.css` と案件 `CURRENT_AUTHORITY.md` を照合し、**未実行のスキャンをPASSと記録しない**。詳細が必要なときだけ `--output .local/theme-recon.json`（Git外）で記録する。作者欄・構造の一致は参考候補で、**Company Policyや他案件のTheme固有ルールを自動適用しない**。正本: `docs/wordpress-theme-intake.md`。
   - **会社C/CODIA制作Themeの参考**: 日本武道館とニュージャージーの `style.css` はともに `Author: Codia Inc.` だが、前者はオリジナル改修Theme、後者はViteサンプル取込の別系統。会社が同じ候補でも、CSS/JS/PHP/ACF・breakpoint・Figmaは**その案件のThemeから再確認**。
2. `docs/CURRENT_AUTHORITY.md` に Figma fileKey・PC/SP の正本 node・CMS の既存契約を書く。変わったらここを直し、古い値は SUPERSEDED にする
3. 初回だけ WordPress を入れる（Git Bash。ACF PRO はローカルのコピーを Windows 形式のパスで渡す）:
   `PROJECT=<slug> MSYS_NO_PATHCONV=1 ACF_PRO_PLUGIN_DIR=C:/htdocs/figma-ai-project/runtime/wordpress/.runtime/acf-pro-composer/wp-content/plugins/advanced-custom-fields-pro bash runtime/wordpress/scripts/setup.sh`
   その後、案件のプラグインを入れて `.\wp.ps1 snapshot <slug>`。wordpress.org の最新版が runtime の WordPress より新しい版を要求するときは `--version=` で対応版を入れる
4. 着手前と完了前に `docs/agent-human-fb-weak-spots.md` を回す

## コミット

- 1 つの FB は 1 コミット。件名は `fix(<slug>): …` / `feat(<slug>): …`
- 整形だけの変更は `style(<slug>): …` で別コミット。修正に混ぜない
- 一時ファイルは `.local/` へ。Theme の中にプレビュー HTML を置かない

## 自動で止める仕組み（project guard）

`scripts/project-guard.mjs` が、AI が読み忘れても次を機械的に止める。

| どこで | 何をする |
|---|---|
| `git commit`（全 AI 共通。`.githooks/commit-msg`、`wp.ps1` が初回に有効化） | 止める: 整形と修正の混在 / Theme 内の一時ファイル・プレビュー / ACF JSON の無断変更と未来の `modified` / `guard.json` の凍結ファイル。警告: 固定寸法・`nowrap`・`body.*`・`!important`・`nth-child(数字)` |
| Cursor / Claude の作業終了時（`.cursor/hooks.json`、`.claude/settings.json`） | Theme が未 push で変わっていたら、完了前チェックを AI に突きつけて続けさせる（同じ変更には 1 回だけ） |
| GitHub CI（`project-guard.yml`） | hook を飛ばしたコミットも同じ基準で落とす |

Human が指示した例外は、コミットメッセージの末尾に書く:

```text
Human-Approved: acf-json
Human-Approved: frozen
```

凍結ファイルは `projects/<slug>/guard.json` の `frozen`（Theme からの相対 glob）。Human が「触らない」と言ったらここへ足す。

## 経験値の貯め方

```text
案件中:   Human FB を LEARNINGS.md に 1 行ずつ（W1–W10 のどれか + 何が起きたか）
閉じる時: W ごとに件数を数え、原因と次の案件でのチェックを書く
昇格:     2 案件以上で繰り返した種類だけ docs/agent-human-fb-weak-spots.md の
          チェックへ上げる（research/frontend-learning-evidence*.yaml 経由。自動昇格しない）
```

分類は `docs/agent-human-fb-weak-spots.md` の W1–W10 に固定する。案件ごとに分類を作らないので、案件どうしで件数を比べられる。

## 案件を閉じるとき（AI がやる）

1. コミット履歴とチャットの Human FB を W1–W10 で数え、前の案件の `LEARNINGS.md` と件数を比べる
2. 減らなかった種類は、チェックの書き方か guard が弱い。`docs/agent-human-fb-weak-spots.md` の文言を直し、機械で拾えるものは `scripts/project-guard.mjs` の検査に足す
3. guard の警告が多すぎて無視されたものは、条件を絞るか消す
4. 次の案件の着手前に読むことを `LEARNINGS.md` の最後に 3 つまで書く
