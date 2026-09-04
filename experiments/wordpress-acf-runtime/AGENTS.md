# WordPress + ACF Runtime — nested router

Root `AGENTS.md` の下で、この directory の runtime 正本を読む。Cursor 専用 rule ではない。

- 使い方: `README.md`
- PHP 上限: `php/conf.d/99-local-limits.ini`（wordpress / cli の両方へ mount。デフォルト 2M のまま起動しない）
- Fatal guard: `wp-dropins/fatal-error-handler.php` / `mu-plugins/00-local-runtime-guard.php`
- Local hot reload: `mu-plugins/10-local-hot-reload.php`（`WP_ENVIRONMENT_TYPE=local` のみ。compose 再作成が必要）

案件固有の ACF / Theme ルールは `experiments/budokan-wordpress/` 側の Current Authority。
