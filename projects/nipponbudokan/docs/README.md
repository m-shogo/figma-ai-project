# 日本武道館 — WordPress / ACF 案件

案件名: **budokan**  
Theme slug: **nipponbudokan**  
intake: **THEME_OBSERVED**

**案件正本:** [`CURRENT_AUTHORITY.md`](CURRENT_AUTHORITY.md)  
**Theme 専用ルール:** [`THEME_RULES.md`](THEME_RULES.md)

## 実装順

```text
1. Header / Footer
2. パーツ集（parts.php 変更なし）
3. TOP
```

## Theme / 起動

```powershell
.\wp.ps1 up nipponbudokan   # http://127.0.0.1:27247
```

## Record / 検証

[`theme-intake.yaml`](theme-intake.yaml)

```bash
python scripts/validate_wordpress_theme_intake.py projects/nipponbudokan/docs/theme-intake.yaml
```
