# ローカル WordPress プレビュー

起動手順と URL のみ。認証情報はチャット / 手元 `.env` 側で扱う（このファイルにパスワードを書かない）。

| | |
| --- | --- |
| フロント | http://127.0.0.1:27247/ |
| 管理画面 | http://127.0.0.1:27247/wp-admin/ |
| Theme | `nipponbudokan` |
| Compose project | `figma-ai-wp-acf-1c4fe7db`（worktree 由来で変わることあり） |

止める:

```bash
cd experiments/wordpress-acf-runtime
source scripts/runtime-env.sh
docker compose down
```

再起動:

```bash
source scripts/runtime-env.sh
docker compose up -d db wordpress
```
