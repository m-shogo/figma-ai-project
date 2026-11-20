# WordPress + ACF Runtime

案件を問わない **使い捨て WordPress + ACF PRO 実行環境**。  
本番 Theme でも、Figma 実装の正本でもない。

旧 `experiments/wordpress-acf-pro-standalone-lp` は残置。こちらが新規の共通 runtime。

## 案件の載せ方

案件は `projects/<slug>/` に置く（`theme/` `qa/` `runtime.env`）。この runtime は案件ファイルを持たない。案件専用の QA / seed をこの `scripts/` へ置かない。

```powershell
.\wp.ps1 up nipponbudokan        # repo 直下から。runtime.env の compose 名・ポートで起動
.\wp.ps1 snapshot nipponbudokan  # DB + uploads を projects/<slug>/.local/ へ（Git 外）
```

```bash
PROJECT=nipponbudokan make smoke   # bash / CI
```

解決順:

1. `THEME_SOURCE_DIR`
2. `PROJECT=<slug>` → `projects/<slug>/theme`
3. なければ `theme/sample-theme`（smoke 用サンプルのみ）

コンテナ内では runtime が `/fixture`、案件フォルダが `/project`（どちらも read-only）。案件の seed は `wp eval-file /project/qa/<seed>.php`。

QA スクリプトは片付けで `down -v` するので、開発 DB とは別の compose 名（例 `nipponbudokan-qa`）で動かす。

## 境界

含むもの: WordPress / MariaDB / WP-CLI / ACF PRO 取り付け経路 / smoke / 任意の CMS・visual QA 基盤

含まないもの: 本番 Theme 構造、案件固有の section / CSS / ACF 設計（Theme 観測後に決める）

## コマンド

```bash
make smoke          # secret 不要の runtime smoke
make setup          # WP +（sample時）ACF fixture
make qa             # ACF PRO + browser QA（要 ACF_PRO_LICENSE_KEY）
make status
make reset
```

`.env.example` を `.env` にコピーし、必要なら `ACF_PRO_LICENSE_KEY` を入れる。鍵は Git に入れない。

## ローカル隔離

HTTP は `127.0.0.1` のみ。`blog_public=0`。案件は `projects/<slug>/runtime.env` の Compose project / port で分離する。`PROJECT` 未指定なら worktree ごとに自動分離。

## ローカル ホットリロード

`WP_ENVIRONMENT_TYPE=local` のときだけ、Theme の CSS / PHP / JS / images を監視してブラウザを reload する。本番 Theme には入らない（runtime mu-plugin）。

- `mu-plugins/10-local-hot-reload.php`
- Theme 静的ファイルは `Cache-Control: no-store`（`@import` CSS が残らないようにする）
- PHP は `opcache.revalidate_freq=0`

compose を取り直す:

```bash
docker compose up -d
```

CSS を保存すると、開いているフロントが約 1 秒で再読込される。

## ローカル PHP limits / Fatal guard

新規でも既存 runtime の再構築でも、管理画面のプラグイン ZIP / メディア / ACF 画面が php.ini 天井に当たらないようにする。**デフォルト 2M のまま起動しない。**

正本 ini: `php/conf.d/99-local-limits.ini` を wordpress と cli の両方へ mount（`compose.yml` 済み）。新しい WP を別経路で作るときも同じ値を入れる。

プラグイン ZIP でサイト全体を落とさない。`wp-dropins/fatal-error-handler.php` と `mu-plugins/00-local-runtime-guard.php` を mount する。ACF PRO の `vendor/autoload.php` 欠落は自動補完し、それ以外の Fatal は原因プラグインを無効化して復旧する。

- `upload_max_filesize` / `post_max_size`: 256M
- `memory_limit`: 512M
- `max_execution_time` / `max_input_time`: 300
- `max_input_vars`: 10000
- `WP_MEMORY_LIMIT` 256M / `WP_MAX_MEMORY_LIMIT` 512M（`compose.yml` の `WORDPRESS_CONFIG_EXTRA`）

## メニューのみ インポート/エクスポート

WP に上げる ZIP:

[`plugins/menu-only-import-export.zip`](plugins/menu-only-import-export.zip)

説明: [`plugins/README.md`](plugins/README.md)
