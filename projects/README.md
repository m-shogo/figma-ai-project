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

## 新しい案件

```powershell
.\wp.ps1 new <slug>
```

1. 提供 Theme があれば `reference/` へ置く（編集しない）。作る Theme は `theme/`
2. `docs/CURRENT_AUTHORITY.md` に Figma fileKey・PC/SP の正本 node・CMS の既存契約を書く。変わったらここを直し、古い値は SUPERSEDED にする
3. 初回だけ WordPress を入れる: `PROJECT=<slug> bash runtime/wordpress/scripts/setup.sh`
4. 着手前と完了前に `docs/agent-human-fb-weak-spots.md` を回す

## コミット

- 1 つの FB は 1 コミット。件名は `fix(<slug>): …` / `feat(<slug>): …`
- 整形だけの変更は `style(<slug>): …` で別コミット。修正に混ぜない
- 一時ファイルは `.local/` へ。Theme の中にプレビュー HTML を置かない

## 経験値の貯め方

```text
案件中:   Human FB を LEARNINGS.md に 1 行ずつ（W1–W10 のどれか + 何が起きたか）
閉じる時: W ごとに件数を数え、原因と次の案件でのチェックを書く
昇格:     2 案件以上で繰り返した種類だけ docs/agent-human-fb-weak-spots.md の
          チェックへ上げる（research/frontend-learning-evidence*.yaml 経由。自動昇格しない）
```

分類は `docs/agent-human-fb-weak-spots.md` の W1–W10 に固定する。案件ごとに分類を作らないので、案件どうしで件数を比べられる。
