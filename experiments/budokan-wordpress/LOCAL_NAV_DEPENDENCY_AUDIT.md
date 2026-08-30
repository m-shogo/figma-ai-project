# Budokan — Local Navigation dependency / responsive authority audit

更新: 2026-08-30

## 結論

Local Navigation は、現行 Figma / Theme / WordPress render path / disposable runtime / hosted Chromium QA まで一貫して確認できた。

- PC Figma authority: `1216:6311` `local_nav`
- SP Figma authority: `560:632`
- WordPress owner: `sidebar-nav`
- shell derivative: `templates/template-oneColumnLocalNav.php`
- PHP render path: `template-oneColumnLocalNav.php` → `get_sidebar()` → `sidebar.php`
- markup owner: `.local_navigation` / `.ln_links` + `Custom_Sidebar_Walker_Nav_Menu`
- interaction base: walker の `mm_*` class + `common.js` `moduleNavToggle()`
- component CSS: `css/module/local_navigation.css`
- runtime hierarchy proven in disposable WordPress: `lnl_item-02` → `lnl_item-03` → four `lnl_item-04`

以前の「SP selector の見た目から `_dropdown-navigation.php` がowner候補」「walker depth が不明」という仮説は現在は解消済み。production menu dataそのものだけは引き続き外部authorityであり、QA fixtureを本番データへ昇格しない。

`parts.php` と Form/Formidable は対象外。

## Figma authority

### SP `560:632`

Regional Training SP page `560:537` の本文後・footer直前に存在する。

- full width `375 × 176`
- light-gray background `#f2f2f2`
- padding `40px 20px`
- heading/control gap `24px`
- visible heading: `武道 振興・普及事業`
- heading: 16px medium
- selector: `335 × 50px`
- prompt: `選択してください`
- right control: `50 × 50px`, dark + white chevron

現行Figmaでauthorされているのはclosed state。open-state専用visualは作らない。

### PC `1216:6311`

Regional Training PC page `1203:4865` の960px本文後にfull-width sectionとして存在する。

- `1380 × 222`
- white background + top/bottom separator
- padding `56px 110px`
- visible subgroup heading: `指導者研修・指導法研究`
- heading: 20px medium
- heading/list gap `48px`
- child list: 4 columns, gap `20px`, inset `36px`
- child copy: 14px
- bullet: 5px gold
- current item: gold bottom rule + medium weight

Figma children:

1. `全国武道指導者研修会`
2. `地域社会武道指導者研修会`（current）
3. `中学校武道授業指導法研究事業`
4. literal placeholder `ローカルナビゲーション`

4枠目のproduction destinationは推測しない。

## Owner proof

`sidebar.php` が次を所有する。

- `<nav class="local_navigation" ...>`
- `theme_location => sidebar-nav`
- `menu_class => ln_links module_menu`
- `Custom_Sidebar_Walker_Nav_Menu`

walker はLocal Navとshared menuのclassを併記する。

- `lnl_item-* mm_item-*`
- `lnl_title-* mm_title-*`
- `lnl_link-* mm_link-*`
- `lnl_button-* mm_button-*`
- `lnl_wrapper-* mm_wrapper-*`
- `lnl_list-* mm_list-*`

`common.js` の既存 `moduleNavToggle()` が `mm_item*._hasChild` を処理するため、Local Navigation専用JSを新設しない。

`_dropdown-navigation.php` は別の `dropdown-nav` ownerで、本文前に描画される。SP Local Navigationは本文後なので別contractのまま維持する。

## Shell correction

default `page.php` はPCで本文とsidebarを2columnにするため、Figmaの「約960px本文 → global-width Local Navigation」という親layoutと一致しない。

既存 `template-oneColumn.php` のone-column content shellをmasterとし、`template-oneColumnLocalNav.php` はその薄いderivativeとして本文後に既存 `get_sidebar()` を追加する。

新しいpage-body renderer、Local Nav renderer、menu data contractは作らない。

## Runtime proof

local-only fixture `scripts/seed-budokan-local-nav-qa.php` がFigmaで確認できる構造だけをdisposable WordPressへseedする。

- broad family: `武道 振興・普及事業`
- subgroup: `指導者研修・指導法研究`
- four child slots
- 4枠目はFigma literal placeholderのまま
- QA current pageのみ `template-oneColumnLocalNav.php` をassignment
- `WP_ENVIRONMENT_TYPE=local` guardを維持

実runtimeでwalkerが次を出すことを確認した。

`lnl_item-02` broad family → `lnl_item-03` subgroup → four `lnl_item-04` child links.

これに合わせ、production CSSはlabel文字列に依存せず構造classでresponsive化した。

- SP: depth-02 broad-family heading + existing selector/toggleを表示
- PC `min-width:768px`: depth-02 headingを隠し、depth-03 subgroup headingを表示、depth-04を4 columnsへ展開

## Browser QA

hosted Chromium上のdisposable WordPressで次をPASS済み。

### SP 375px

- broad-family headingが表示
- selectorが表示
- selector height = 50px
- closed wrapperがcollapse
- background = `rgb(242, 242, 242)`

### PC 1380px

- broad-family headingが非表示
- subgroup heading `指導者研修・指導法研究` が表示
- depth-02/depth-03 selector buttonが非表示
- depth-04 childがexactly 4件
- 4件が同一rowの4 distinct columns
- `地域社会武道指導者研修会` にWordPress current-item state

これは現在authorされているSP closed state / PC stateのruntime/browser proof。production WordPress data proofではない。

## QA harnessで発見した失敗と修正

1. WP-CLI serviceへ `WP_ENVIRONMENT_TYPE=local` が継承されずfixture safety guardが拒否した。
   - 修正: fixture `eval-file` 呼出しだけにlocal envを明示し、guardは弱めない。
2. pretty permalink後に `?page_id=N` が301となった。
   - 修正: bounded redirectをfollowしfinal HTTP 200を検証。WordPress canonical behaviorを無効化しない。
3. Theme headerが `get_field()` を呼ぶためACF無しfixtureが500となった。
   - 修正: disposable runtimeへACFをinstall/activate。Themeをstubへ合わせない。

再利用可能な学び: runtime QAは対象componentだけでなく、実Themeが通るframework/plugin dependency pathを再現する。harness不足はharness側で直し、production safety guardやTheme contractをテスト都合で緩めない。

## 現在残るauthority gate

Local Navigation自体の構造実装・SP closed/runtime・PC runtimeは閉じた。残るのはproduction assignment/data authority。

- real page(s) が `template-oneColumnLocalNav.php` を使うproduction assignment
- actual production `sidebar-nav` hierarchy/menu IDs/URLs
- Figma 4枠目の正式destination
- SP open-stateの正式visual/content behavior

これらが無い状態でQA fixtureをproduction menuへseedしたり、4枠目を推測したりしない。

## Reuse rule

Local Navigation familyの次の変更では、まず次を再利用する。

`one-column shell` → `template-oneColumnLocalNav.php` thin derivative → existing `sidebar-nav` walker → shared `moduleNavToggle()` → `local_navigation.css` responsive specialization.

新しいTOP専用Local Navや別rendererを作らない。

## Promotion boundary

今回のruntime/harness lessonはプロジェクト内で再現可能になったが、Company/frontend standardへ自動昇格しない。別component familyでも同じ失敗パターンが繰り返された場合に上位evidence候補とする。
