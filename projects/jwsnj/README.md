# ニュージャージー（jwsnj）

Japanese Weekend School of NJ（ニュージャージー補習授業校）の WordPress サイト。

- 状態: ベース Theme 取り込み済み。TOP から着手予定
- URL: `.\wp.ps1 up jwsnj` → http://127.0.0.1:28000
- Figma 正本・Theme の出どころ・Human 決定: `docs/CURRENT_AUTHORITY.md`
- ページとメニュー: `docs/DIRECTORY_MAP.md`
- 仕様（管理画面で編集する項目・hover・プラグイン）: `docs/SPEC.md`
- 振り返り: `LEARNINGS.md`

## 開発

```powershell
.\wp.ps1 up jwsnj          # WordPress（repo 直下で）
cd projects\jwsnj
pnpm install               # 初回だけ
pnpm dev                   # Vite: src/images → theme/images 変換 + 自動リロード
```

構成とコミットの決まりは `projects/README.md`。
