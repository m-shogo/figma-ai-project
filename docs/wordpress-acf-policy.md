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
