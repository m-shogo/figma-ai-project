# Budokan — Local Navigation dependency / responsive authority audit

更新: 2026-09-15

## 結論

Local Navigation の WordPress owner は **ACF `page_local_nav` + 名前接頭辞 `ローカル：` の WP メニュー**。位置 `sidebar-nav` は使わない。

- current Figma file: `jqYoPtusYfTeDqRegMCsx3`（正本は `CURRENT_AUTHORITY.md`）
- PC current Figma authority: `2108:10846`（大会・イベント標本）。旧参照 `1216:6311` は同 family
- SP dedicated Local Nav: **UNDETERMINED** → PC 以外は非表示（Human 2026-09-11）
- WordPress owner: ACF `page_local_nav`（メニュー ID。なし＝非表示）
- メニュー命名: 表示名 `ローカル：…` / slug `local-*`（日本語名は `local-menu-{id}`）
- 位置割当メニュー（`global-nav` / `mega-nav` / `sub-nav` / `footer-nav` 等）は ACF 選択肢から除外
- PHP render path: `page.php` または `templates/template-form.php` → `_local-navigation.php` → `sidebar.php` → `wp_nav_menu(menu => id)` + `Custom_Sidebar_Walker_Nav_Menu`（`local_nav_show_all`）
- markup: `.local_navigation` / `.ln_links` / `lnl_*` + `mm_*`
- CSS: `css/module/local_navigation.css`
- メニュー階層: 02 グループリンク（PC 見出し。例: 大会・イベント）→ 03 子（4列）。家族ラッパーは置かない

`parts.php` と Formidable 本体は対象外。フォーム**テンプレート**への Local Nav 出しは可（Human 指示 2026-09-15）。

## Shell / template contract

Local Nav を出すのは次だけ。

| テンプレート | 出し |
| --- | --- |
| デフォルト `page.php` | する |
| `templates/template-form.php` | する |
| `template-oneColumn.php` / `oneColumnWide` / `oneColumnLocalNav` | **しない** |

`template-oneColumnLocalNav.php` は既存割当互換で残してよいが、Local Nav 呼び出しは持たない。ACF が空ならセクション自体出ない。

## Current Figma authority（PC）

### `2108:10846`

- 幅いっぱい白帯、上下 separator
- padding `56px 110px`
- 見出し（1階層目リンク）+ 八角アイコン
- 子: 4列、gap `20px`、inset `36px`
- bullet 5px gold、current は金下線
- 2行折り返し可（`nowrap` 禁止）。同一 row は高さを揃え、下線はセル下端に揃える

### SP

専用 frame 無し → **非表示**。旧 SP specimen を current にしない。

## Owner proof

`sidebar.php`:

- ACF `page_local_nav` のメニュー ID のみ
- `local_nav_show_all => true`（ページ階層で枝切りしない）
- `Custom_Sidebar_Walker_Nav_Menu`

`inc/menu.php`:

- `nipponbudokan_is_local_nav_menu` / `nipponbudokan_get_local_nav_menu_choices`
- `acf/load_field/name=page_local_nav` で動的 choices

## Runtime fixture

`scripts/seed-budokan-local-nav-qa.php`（local only）:

- メニュー `ローカル：大会・イベント`
- 2階層 + ACF 割当
- QA ページはデフォルトテンプレート想定

## 残る authority gate

- 本番の `ローカル：…` メニュー作成と各固定ページの ACF 割当
- グループ見出しページの正式 URL（マップ上グループに path が無い場合は Human）
- SP dedicated frame が出たら再検討（現状は非表示のまま）

QA fixture を production メニューへ seed しない。

## Reuse rule

`page.php` / `template-form.php` → `_local-navigation.php` → `sidebar.php`（ACF menu）→ walker → `local_navigation.css`

ページ専用 Local Nav CSS / 別 renderer / 位置 `sidebar-nav` 再導入をしない。

## Promotion boundary

案件固有は `CURRENT_AUTHORITY.md`。hover/octagon/nowrap/row-height の再発防止は learning notes / evidence CANDIDATE。Company Policy へ自動昇格しない。
