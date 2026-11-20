# 日本武道館（nipponbudokan）

- 状態: 納品済み・閉じた（2026-11-20、最終 FB コミット `ad8510c6`）
- URL: `.\wp.ps1 up nipponbudokan` → http://127.0.0.1:27247
- 案件正本: [`docs/CURRENT_AUTHORITY.md`](docs/CURRENT_AUTHORITY.md) / [`docs/THEME_RULES.md`](docs/THEME_RULES.md) / [`docs/DIRECTORY_MAP.md`](docs/DIRECTORY_MAP.md)
- 振り返り: [`LEARNINGS.md`](LEARNINGS.md)（詳細メモは `docs/IMPLEMENTATION_LEARNINGS.md` と `docs/learning-notes/`）
- 参照 Theme: `reference/現行サンプルbudokan`（Git 外・編集禁止）
- Theme intake 記録: `ref002/`

QA は `qa/`。片付けで `down -v` するので、開発 DB と別の compose 名 `nipponbudokan-qa`（ポート 27248）で動く。
