# ニュージャージー（jwsnj）

Japanese Weekend School of NJ（ニュージャージー補習授業校）の WordPress サイト。

- 状態: ベース Theme 取り込み済み。**先にFigmaデザインの色・書体・画像/アイコン・共通CSS基盤を確認・導入・検証**し、その後ヘッダーから実装。ベースはサンプル、完成形はFigma
- URL: `.\wp.ps1 up jwsnj` → http://127.0.0.1:28000
- Figma 正本・Theme の出どころ・Human 決定: `docs/CURRENT_AUTHORITY.md`
- ページとメニュー: `docs/DIRECTORY_MAP.md`
- 実装前の色・フォント・画像・導入状況: `docs/DESIGN_FOUNDATION.md`
- 毎回の品質チェック: `docs/IMPLEMENTATION_CHECKLIST.md`
- 仕様（管理画面で編集する項目・hover・プラグイン）: `docs/SPEC.md`
- 案件内の不具合/FB: `LEARNINGS.md`
- **jwsnj固有の毎時実行の事例と原因分析**: `docs/WORKFLOW_LEARNING.md`（他案件への共通化はルート `docs/agent-recurring-work-preflight.md` / `docs/frontend-foundation-preflight.md`）

## 開発

```powershell
.\wp.ps1 up jwsnj          # WordPress（repo 直下で）
cd projects\jwsnj
pnpm install               # 初回だけ
pnpm dev                   # Vite: src/images → theme/images 変換 + 自動リロード
```

構成とコミットの決まりは `projects/README.md`。
