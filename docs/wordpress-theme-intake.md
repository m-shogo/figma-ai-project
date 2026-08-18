# WordPress Supplied-Theme Intake

## Purpose

実案件のWordPress Themeは**発注側/会社側から提供される**ことがある。

そのとき最大の失敗は、Themeが届く前にAI側が「一般論のTheme構造」を先に完成させ、
到着後にそれを捨てられずに引きずることである。

このcontractは、Theme到着前に**準備だけ**を進め、
Theme到着後は**提供Themeを正本として観測してから**bindするための境界を定義する。

Precedence:

```text
COMPANY POLICY
→ SUPPLIED THEME (existing codebase / design system)
→ FIGMA IMPLEMENTATION EVIDENCE
→ AGENT INFERENCE
```

提供Themeは`EXISTING CODEBASE`の位置にある。Figma evidenceより上、Company Policyより下。

---

## Do not (Theme到着前)

- 本番Theme構造を発明して完成させる
- CSS命名規則 / JS構造 / PHP directory構成を確定する
- Header/Footer/template-partsのfile pathを確定する
- build環境 / breakpoint / functions.php構造を確定する
- form pluginを選定する
- Custom Post Type slugをCanon化する
- Theme代用品(placeholder theme)を作って本番前提にする

Theme代用品が必要になった時点で、それは`BLOCKED`であり、`Themeをください`で止まる。

既存の`experiments/wordpress-acf-pro-standalone-lp`は**disposable validation fixture**であり、
Theme代用品ではない。production Theme構造をここから継承しない。

---

## Intake states

Intake recordは1本のstate machineで進む。

```text
AWAITING_THEME     Themeが未提供。準備と境界定義だけ。
THEME_SUPPLIED     Themeを受領したが、まだ観測していない。
THEME_OBSERVED     scan/runtime evidenceでTheme構造を観測済み。
FROZEN             実装開始のためにownershipをbind済み。
```

`theme_delivery.state`は`NOT_SUPPLIED` / `SUPPLIED_UNOBSERVED` / `OBSERVED`。

`THEME_OBSERVED`未満では、Theme-relativeな具体pathやslugをrecordへ書けない(validatorがfail-closed)。

---

## Epistemic states

repository共通ruleに従う。

- `UNKNOWN` — まだ調査していない
- `NONE` — 調査した結果、存在しない
- `UNDETERMINED` — 調査したが現在のtool/権限/情報では確定不能

`UNDETERMINED`を`NONE`扱いしない。

`NONE`を主張するblockは`evidence`が空であってはならない。調査していないなら`UNKNOWN`か`UNDETERMINED`。

---

## Theme observation checklist

Theme受領後、bindの前に観測する項目。

既存toolを使う。新しいscannerを作らない。

```bash
python scripts/scan_wordpress_target.py /path/to/supplied-theme-repo \
  --output /tmp/wordpress-target-recon.json
```

実WordPressがある場合:

```bash
python scripts/coordinate_wordpress_target_readiness.py \
  /path/to/supplied-theme-repo \
  --wp-path /path/to/wordpress \
  --output /tmp/wordpress-target-readiness.json
```

観測項目(intake recordの`theme_delivery.observation`):

| id | 観測対象 |
| --- | --- |
| `theme_family` | Classic / Block / Hybrid のcode evidence |
| `theme_json` | `theme.json`の有無と内容 |
| `template_inventory` | 既存template file一覧とtemplate hierarchy対応 |
| `template_parts` | template part / partials の構造とnaming |
| `global_header_footer` | Header/Footerのownershipと出力経路 |
| `style_architecture` | CSS/SCSS/CSS Modules/build pipeline |
| `js_architecture` | JS entrypoint / bundler / module形式 |
| `breakpoints` | Theme側で既に定義されているbreakpoint |
| `naming_convention` | class命名規則 / prefix |
| `acf_evidence` | ACF Local JSON / PHP field registration |
| `block_support` | block editor support / `theme.json` settings / block templates |
| `enqueue_convention` | asset enqueueの既存関数と依存関係 |
| `form_evidence` | 既存form pluginやform template |
| `cpt_evidence` | 既存CPT/taxonomy登録 |
| `image_pipeline` | registered image sizes / attachment helper使用 |

観測できなかった項目は`UNDETERMINED`のまま残す。埋めない。

`scan_wordpress_target.py`の`family_is_inference: true`はそのまま保持する。
filesystem evidenceはcompany authorizationではない。

---

## Template coverage matrix

「TOPだけ実装して終わる」ことを防ぐための面(surface)一覧。

各entryは以下を持つ。

- `surface` — WordPress template hierarchy上の役割
- `required` — この案件で必要か (`REQUIRED` / `OPTIONAL` / `UNDETERMINED`)
- `theme_provides` — 提供Themeが既に持っているか (`UNKNOWN` / `YES` / `NO` / `UNDETERMINED`)
- `ownership` — 実装責任 (`THEME` / `PROJECT` / `SHARED` / `UNDETERMINED`)
- `target_path` — 実file path。**Theme観測前は必ず空**

必須surface(このrepositoryのpolicy定数):

```text
FRONT_PAGE      front-page.php
POSTS_INDEX     home.php
PAGE            page.php
SINGLE          single.php
ARCHIVE         archive.php
CATEGORY        category.php
TAXONOMY        taxonomy.php
SEARCH          search.php
NOT_FOUND       404.php
CPT_ARCHIVE     archive-{post_type}.php
CPT_SINGLE      single-{post_type}.php
PAGE_TEMPLATE   custom page template
PART            共通parts
```

`required: UNDETERMINED`は正当な状態である。案件要件が未確定なら、そのまま残す。

**file名は提供Themeの規約が優先**する。上表はtemplate hierarchy上の役割名であり、
提供Themeが別のfile構成を採用していればそちらへ合わせる。

---

## Content decision matrix

Figmaの各sectionを「誰が所有するか」へ分類する。

2軸で分ける。混ぜない。

### 軸1: reuse — component lineage

```text
REUSE          既存Theme/design systemのcomponentをそのまま使う
ADAPT          既存componentを変更して使う
NEW            新規component
UNDETERMINED   Theme未観測 / 要件未確定
```

### 軸2: content_ownership — 誰がcontentを変更するか

```text
STATIC         code-owned。CMSで変更しない
ACF_FIELD      ACF fieldでeditorが変更する
ACF_BLOCK      ACF Blockとしてeditorが配置する
CORE_BLOCK     WordPress core blockで足りる
UNDETERMINED   editor requirement未確認
```

### 判断順序

```text
Figma上の見た目
  ↓ これだけでは決めない
editor capability requirement
  ├ 変更しない          → STATIC
  ├ 決まった場所を変更   → ACF_FIELD
  ├ 任意の場所へ配置     → ACF_BLOCK / CORE_BLOCK
  └ 不明                → UNDETERMINED
```

Figmaの繰り返しは`ACF_FIELD`+Repeaterの根拠にならない。
`editor_capability.add_remove` / `reorder`が`YES`であることがRepeater採用の前提。

1ページに1回しか出ない複雑designを汎用Blockへ抽象化しない。
逆に複数ページで安定利用されるcomponentをページごとにコピペしない。

### implementation_unit

```text
TEMPLATE_PART  get_template_part() 等
ACF_BLOCK      block.json + render
CORE_BLOCK     core block
PAGE_TEMPLATE  page template直書き
OTHER          提供Theme固有の単位
UNDETERMINED   Theme未観測
```

`implementation_unit`は提供Themeの規約に従う。Theme観測前は必ず`UNDETERMINED`。

---

## CPT / Taxonomy boundary

Custom Post Typeは**実サイト要件が判明してから**設計する。

Figmaに「News」sectionがあることは、`news` CPTが必要な証拠ではない。
core `post` + categoryで足りる場合がある。

state:

```text
UNDETERMINED   要件未確認
NONE           調査した結果、CPTは不要(evidence必須)
DEFINED        要件確定。entriesを持つ
```

`candidates`はhypothesisとして書いてよいが、Canonではない。
`entries`は`DEFINED`のときだけ持てる。

`DEFINED`へ進む前に確認する:

- 対象contentのeditor運用主体
- archive/single route要件
- taxonomy/relationship要件
- ordering / query / pagination要件
- 既存Theme/pluginの登録と衝突しないか

---

## Form boundary

form pluginは**提供Theme・会社ルール・案件要件を確認してから**選定する。

現時点で決めてよいのは「formがどこへ挿入されるか」という**境界だけ**。

state:

```text
UNDETERMINED   plugin未選定
NONE           formは不要(evidence必須)
SELECTED       選定済み。evidence必須
```

`candidates`(Contact Form 7 / MW WP Form / Snow Monkey Forms / Gravity Forms / 独自 等)は
比較検討用の列挙であり、選定ではない。

境界として記録するのは:

- form挿入点のtemplate/section
- 送信後の遷移先(thanks page等)の有無
- validation/error表示のmarkup所有者
- 個人情報を扱うかどうか(policy要件)

これらが未確定なら`UNDETERMINED`のまま残す。

---

## QA reuse

新しいQA基盤を作らない。既存の層を再利用する。

| 層 | 既存資産 | REF-002での使い方 |
| --- | --- | --- |
| WordPress runtime | `experiments/wordpress-acf-pro-standalone-lp` | disposable runtimeとして再利用。theme mountだけ差し替える |
| ACF PRO resolution | 同fixtureの`scripts/setup.sh` | `ACF_PRO_LICENSE_KEY` secret境界をそのまま使う |
| CMS mutation QA | 同fixtureの`fixtures/*.json` + `tests/runtime.mjs` | 0/1/8/多数・長文・改行・空・画像なし・並び替えの形をREF-002 fieldへ写す |
| Visual diff | 同fixtureの`tests/visual-diff.mjs` | 参照が揃うまで`MEASURE_ONLY`。universal toleranceを入れない |
| Typography metrics | `docs/ref001-typography-runtime-metrics-learning.md` | `font-size`/`line-height`/`letter-spacing`/`font-weight`をcomputed styleで検証 |
| Asset lineage | `tools/implementation-intake/visual_truth_guard.py` | `ASSET_PENDING`/`ASSET_READY`/`ASSET_CORRUPT`をそのまま使う |
| Target readiness | `scripts/coordinate_wordpress_target_readiness.py` | Theme到着時のread-only preflight |

`ACF_PRO_LICENSE_KEY`はsecret。Gitへcommitしない。

Visual QA viewportは`1380` PC / `375` SPを優先し、中間幅は必要になった時に追加する。
`QA_VIEWPORTS`で上書きできる既存の仕組みを使う。

---

## Asset lineage

Figma実assetは`asset slot` / `PC node` / `SP node` / `local path` / `SHA-256` / `dimensions`を追跡する。

一時Figma URL(`https://www.figma.com/api/mcp/asset/...`)をGitへ保存しない。
`scripts/validate_no_figma_mcp_asset_urls.py`が既に拒否する。

durable bytesが無い状態を`ASSET_READY`へ昇格させない。

---

## Interaction classification

interactionは以下へ分類する。存在しないstateを生成しない。

```text
AUTHORED           Figmaに実際にreaction/変数が存在する
STRONGLY_INFERRED  複数のevidenceから強く推測できる
PRODUCT_DECISION   人間のproduct判断が必要
CONTENT_PENDING    contentが未確定
STALE_REJECTED     古い/破棄されたreaction
```

`final instance → mainComponent → reaction → destination → component lineage → semantic validation`
まで辿ってから実装する。reactionの存在だけでは実装根拠にならない。

---

## Validation

```bash
python scripts/validate_wordpress_theme_intake.py
```

pathを省略するとrepository内のcanonical intake record(`**/theme-intake.yaml`)を検証する。

machine-enforceされる主なrule:

1. `status`と`theme_delivery.state`の整合
2. Theme未観測時のfail-closed(具体path/slug/`implementation_unit`/`freeze.ready`を禁止)
3. `NONE`宣言はevidence必須
4. reference sectionのcoverage(evidence docから機械抽出したsectionを過不足なく持つ)
5. 必須template surfaceのcoverage
6. secret / ephemeral Figma URLの混入拒否
7. `SELECTED` / `DEFINED`はTheme観測 + evidence必須
8. `freeze.ready`は残存`UNDETERMINED`がゼロのときのみ

このvalidatorはToolを固定するためではなく、
**Theme到着前に架空のTheme構造がCanon化されるのを防ぐため**にある。
