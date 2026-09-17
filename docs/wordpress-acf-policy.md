# WordPress / ACF Implementation Policy

Company Policyとexisting projectが最優先。

「FigmaをACF化する」ではなく、**editorが変更すべきcontent/configだけをCMS fieldへ変換する**。

Design/layout valuesを無条件でACF field化しない。

---

## First identify architecture

```text
Classic theme
Block theme
Hybrid
```

次に既存projectが:

- template parts
- ACF fields
- ACF Blocks
- Flexible Content
- Repeater
- native blocks
- Block Bindings

のどれを使っているかを確認する。

この判断は `Implementation Profile` でFROZENにしてからSection実装へ進む。

---

## PHP template ownership（Human 2026-09-17）

WordPress実装では、テンプレートを **言われるまで後回しにしない**。人がファイル一覧を見て owner が分かり、実装も探しやすい形にする。

考える順:

```text
公開 IA は何か（ネイティブ archive / 固定 page + query / single）
→ WordPress template hierarchy に載るファイル名があるか
→ そのファイルを入口にする
→ 共通 markup だけ template-parts へ
```

やる:

- ネイティブ公開する CPT 一覧 → `archive-{post_type}.php`
- その taxonomy 一覧 → `taxonomy-{taxonomy}.php`
- その CPT 詳細が generic `single.php` 分岐の奥に埋まるなら → `single-{post_type}.php`
- 入口は薄く、カード等は part

やらない:

- 汎用 `archive.php` / `single.php` に CPT の `elseif` を足して済ませる
- Human に「専用テンプレにして」と言われてから作る
- シェルが同じなのに `Template Name` 付き page template を増やしてセレクトを汚す
- `has_archive` があるだけで刊行物などをネイティブ archive に寄せる（公開 IA が page なら page）

既存 Theme の hierarchy / 公開 URL を先に読む。既存と違う入口を発明しない。

---

## Do not invent fields / CPT

既存project / 案件 Current Authority が持っているフィールド契約だけを使う。

- 新しい ACF / CPT / スラッグを、Figma に見えたという理由だけで発明しない
- 開催日・募集ステータス等、現行契約にフィールドが無い UI は fail-closed
- 退役 dump / 実行用 JSON をフィールド発見に使わない（案件が「再読しない」と明示している path は読まない）
- フィールドグループ JSON は、案件が禁止していれば編集しない。ブロック見た目の markup だけ必要なとき既存 PHP を触る
- Form / Formidable は Human 担当と書かれている案件では触らない

Budokan WordPress のフィールド正本は `experiments/budokan-wordpress/CURRENT_AUTHORITY.md`。

---

## Explicit parameters for reusable parts

`is_front_page()` / `is_home()` は使ってよい。明らかにそのページ専用で変動しないもの（専用 CSS/JS、TOP sticky 等）はそれでよい。

流用しうる塊だけ、ページ身元に結びつけない。呼び出し側が明示する、変わりにくい引数にする。

- 正（流用）: `get_footer(null, array('map' => true))` → `_hasMap`
- 誤（流用）: `body.home` や CSS `.home` で地図を出す
- 正（TOP専用）: `is_front_page()` で TOP だけの CSS/JS / sticky
- パーツは default オフ。使いたいテンプレートだけ opt-in
- 引数名は機能（`map`）であり、ページ名ではない

---

## Section implementation unit

### Classic theme

Default candidate:

```text
template part
+ section-scoped PHP
+ section-scoped CSS/JS
```

WordPress標準`get_template_part()`等、既存project conventionへ合わせる。

### Block/editor-first project

Default candidate:

```text
native block / ACF Block
+ block.json
+ server render where appropriate
```

ACF BlocksはWordPress Block APIへ沿って扱う。

---

## ACF decision matrix

### Fixed section with editable copy/images

Use existing template fields/group fields when project convention matches。

### Repeated homogeneous items

Examples:

- slides
- cards
- staff
- FAQs

→ Repeater candidate。

ただし**Figmaで同型要素が繰り返されていることだけではRepeaterを採用しない**。

先に確認する:

- editorが件数を増減する必要があるか
- editorが並び替える必要があるか
- minimum/maximum件数がproduct requirementとして存在するか
- current projectがRepeaterを標準採用しているか
- ACF PROが利用可能か

件数固定・並び順固定であれば、fixed fields / existing Group構造の方がtemplate contractを強く保てる場合がある。

Repeatable UI自体のlayout/content耐性は `docs/frontend-repeatable-content.md` を参照する。Repeaterを採用しない場合でも、将来data-drivenへ移行しやすいitem shapeを検討できる。

### Editor can reorder/add different section types

→ Existing projectがFlexible Contentを採用しているなら候補。

ただし新規architectureで無条件にFlexible Contentへ寄せない。Block editor/ACF Blocksとの比較を行う。

### Reusable editor-native sections

→ ACF Blocks/native blocks candidate。

---

## Editorial capability gate

CMS field architectureはvisual patternではなく、**editor capability requirement**から決める。

```text
Figma repetition
  ↓ visual evidence only
Editor add/remove/reorder requirement?
  ├ no / unknown → fixed cardinalityを第一候補
  └ yes          → Repeater / Flexible / Blocksを比較
```

ACF PRO availabilityが未確認の段階では、Repeater/Flexible Content/ACF Blocks等のPRO依存機能をproduction contractへFROZENしない。

Learning/first-pass fixtureは必要ならbasic fieldsだけで成立させ、target repository/runtime reconnaissance後にPRO architectureへ昇格できるようにする。

---

## Field naming / searchability

Company/existing naming conventionを最優先する。

既存規約が弱い場合、field nameはPHP/CMS内で検索したときowner/contextが分かることを重視する。

Top-levelで曖昧になりやすい例:

```text
title
image
text
```

より、必要なら:

```text
student_voice_title
student_voice_image
course_intro_text
```

のようにowner/contextを持たせる。

ただしRepeater/Groupのchild fieldは親contextが十分に明確なら:

```text
title
body
image
cta
```

のように簡潔でよい。

**検索性を上げるために全field名を不必要に長文化しない。Contextが失われる場所だけnamespaceする。**

Field label、field name、PHP variable、CSS ownerを完全に同じ文字列へ揃えること自体は目的ではない。それぞれの責任範囲で人間が辿れることを優先する。

---

## Responsive media field gate

PC/SPが存在しても、無条件で:

```text
image_pc
image_sp
```

を作らない。

まずFigma implementation evidenceを確認する。

### Same source + different crop/layout

同じunderlying image/sourceをPC/SPでcrop/mask/positionだけ変えている場合:

```text
1 ACF attachment
+ responsive CSS/layout
+ WordPress image helper
```

を第一候補にする。

### Different source / real art direction

PC/SPでsource asset自体が異なる、またはdesignerが別画像を明示している場合のみresponsive別fieldを候補にする。

Evidence examples:

- Figma image hash/source identity
- component property / variable mapping
- designer annotation
- existing project image architecture

画像fieldを増やす判断もeditorの入力負担として扱う。

---

## Art-directed copy gate

Figma上のTEXT nodeだからといって全てACF化しない。

例えばcopyが:

- 複数TEXT nodeへ分割
- 文字単位でsize/color/positionが異なる
- quotation/decorative typographyと一体化
- 任意文字数でcompositionが壊れる

場合は、editor requirementが無ければcode-owned copyを第一候補にする。

編集可能にする場合は:

- maxlength
- permitted line count
- explicit CMS instruction
- PC/SP wrap QA

をfield contractへ含める。

Frontend Standardのcontent risk factorsを使い、editor-owned copyは明示single-line contractが無い限りwrap/mutation対象として扱う。

---

## What becomes ACF data

Good candidates:

- heading/body copy
- links/CTA
- images/video references
- repeatable content rows
- optional content visibility when explicitly required
- content-owned labels

Usually code/design-system owned:

- breakpoint numbers
- base spacing tokens
- font sizes purely from design system
- decorative gradient stop positions
- animation duration/easing unless editor requirement exists
- DOM structure
- accessibility mechanics

---

## ACF delivery is part of implementation

**ACFを使う案件では、PHP/templateだけ完成しても納品完了ではない。**

最低限、portableな:

```text
acf-export.json
```

を生成する。

このJSONはfield group/fieldのstable keyを保持し、別WordPress環境へimportできる構造にする。

既存projectがLocal JSONを使う場合は原則:

```text
acf-export.json
+
acf-json/*.json
```

の両方を維持する。

- `acf-export.json`: 明示的なportable/import bundle
- `acf-json/*.json`: theme/plugin内でversion control/syncする既存architecture

詳細contract: `docs/acf-json-delivery.md`

構造検証:

```bash
python scripts/validate_acf_export.py path/to/acf-export.json
```

pathを省略した場合はrepository内のcanonical ACF export artifactsを自動検出して検証する。

```bash
python scripts/validate_acf_export.py
```

さらに実WordPress test/disposable environmentでimportまたはsync smokeを行う。

Implementation Profileで許可された方法だけを使う:

- ACF Tools admin import
- ACF/WP-CLI JSON import when installed version supports it
- Local JSON sync
- ACF/WP-CLI JSON sync when supported
- explicit OTHER with evidence

Completed RunはJSON evidence + smoke PASSが揃わない限り `scripts/validate_run_deliverables.py` で失敗する。

### Stable keys

Repair/Clean Replayで`group_*` / `field_*` keyを理由なく作り直さない。

Key変更が必要ならfield migrationとして扱い、単なるvisual repairへ混ぜない。

---

## Images

ACF image fieldのreturn formatはCompany/existing projectに従う。

新規WordPress candidateはattachment IDを優先する。

理由:

- registered image sizes
- `srcset` / `sizes`
- native image attributes
- WordPress image helper stack

を維持しやすい。

Raw URLを取得して`<img src>`だけを書くことをdefaultにしない。

---

## Output escaping

Field type/contextに合わせてescapeする。

- text
- attribute
- URL
- HTML-rich content

を同じescape方法で処理しない。

`get_field()`の値を無条件にraw echoしない。

---

## ACF Blocks

Current projectでACF Blocksを採用する場合:

- `block.json` registrationを優先
- block-specific assetsをWordPress standard configへ寄せる
- render callback/template boundaryを明確にする
- editor previewとfrontend outputの差をQAする
- block API versionはcurrent project/support matrixに合わせる
- fieldsを使うならACF JSON deliveryも残す

---

## Block Bindings

Company WordPress version/ACF versionが対応していて既存architectureと整合する場合だけ候補にする。

「新しいから使う」ではなく、field→block attribute bindingが実装/運用を減らすかで判断する。

---

## Section screenshots with WordPress

Section単体QAはPHP fragmentだけを裸でrenderするのではなく、原則**実page shell内**で行う。

理由:

- inherited CSS
- global container
- header/footer CSS
- WordPress body classes
- editor-generated markup

がsection geometryへ影響するため。

必要ならfixture page/templateを用意する。

---

## CMS evidence in Section Manifest

将来Section entryへ:

```yaml
cms:
  implementation_unit: TEMPLATE_PART
  template_path: "template-parts/sections/hero.php"
  field_group: "Hero"
  field_source: ACF
  repeated_content: false
  editor_reorderable: false
```

のように記録する。

Figma構造とCMS architectureを混同しない。
