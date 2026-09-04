# WordPress + ACF Runtime

案件を問わない **使い捨て WordPress + ACF PRO 実行環境**。  
本番 Theme でも、Figma 実装の正本でもない。

旧 `experiments/wordpress-acf-pro-standalone-lp` は残置。こちらが新規の共通 runtime。

## Theme の置き方（編集対象）

正本 Theme は外パスまたは別 repo が基本。この runtime では次のどちらかで載せる。

```bash
# A. 差し込み（1 Theme だけ）
cp -R /path/to/your-theme theme-dropin/budokan
make smoke
```

```bash
# B. 外パスを指す（おすすめ）
THEME_SOURCE_DIR=/absolute/path/to/your-theme make smoke
```

解決順:

1. `THEME_SOURCE_DIR`
2. `theme-dropin/` 内の単一ディレクトリ
3. なければ `theme/sample-theme`（smoke 用サンプルのみ）

`theme-dropin/` は gitignore。client Theme をこの repository へ commit しない。

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

HTTP は `127.0.0.1` のみ。`blog_public=0`。worktree ごとに Compose project / port を自動分離。

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
