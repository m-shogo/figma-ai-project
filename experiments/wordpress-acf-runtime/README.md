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
