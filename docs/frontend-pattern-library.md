# Frontend Pattern Library

この文書は、Frontend Implementation Standardを抽象ルールだけにせず、実案件で学んだ**失敗パターン / 良いパターン**をBefore/Afterで蓄積する教材です。

Patternは永久固定ではありません。再現実験、Human Review、Company Policy、新しいCSS仕様により更新できます。

---

## Failure Patterns

### FP-CSS-001 — Figma Coordinate Recreation

**Symptom**

```text
section fixed height
+ child fixed width/height
+ many absolute top/left positions
+ overflow hidden
```

**Why it fails**

Figma上の結果座標をWeb layout constraintへ翻訳せず、そのまま再現しているため、文言・フォント・CMS内容・viewport変化で破綻します。

**Repair**

- copyはNormal Flow/Flex/Gridへ戻す
- art-directed mediaだけを必要に応じてabsolute化
- section block-sizeをcontent-drivenへ戻す
- Visual Authorityは最終renderで再確認する

---

### FP-CSS-002 — Override Accumulation

**Symptom**

```css
.p-reason__card { ... }
/* later */
.p-reason__card { ... }
/* final tweaks */
.p-reason__card { ... !important; }
```

**Why it fails**

どのruleがownerか分からず、source order/specificityが実装仕様になります。

**Repair**

canonical ownerへ戻って修正します。恒久的な`final fixes`領域を作りません。

---

### FP-CSS-003 — Duplicate Selector Ownership

同一Blockのbase selectorが複数の遠い場所に存在する状態。

**Signal**

人間がselectorを検索したとき、どこを直せばよいか判断できない。

**Repair**

base ownerを1箇所へ統合し、state/conditional ruleはowner近辺へco-locateします。

---

### FP-CSS-004 — Patch Breakpoint Proliferation

崩れたviewportごとにbreakpointを足す。

```text
873
947
1032
...
```

**Repair**

- layout modeそのものを見直す
- intrinsic sizing / Flex / Gridを再評価
- Company Policy breakpointを確認
- breakpointはlayout boundaryとして追加する

---

### FP-CSS-005 — CMS Text Clipping

**Symptom**

- fixed text block height
- `white-space:nowrap`
- `overflow:hidden`
- absolute CTA immediately below text

**Repair**

1→2→3行mutationで確認し、content blockがblock axisへ伸びられる構造へ戻します。

---

### FP-CSS-006 — Property-ban Workaround

`absolute`禁止を守るために巨大negative marginやtranslateで同じ座標配置を再現する等。

**Why it fails**

property countを改善しただけでlayout intentは改善していません。

**Repair**

propertyではなくintentを評価します。art directionならabsoluteへ戻す方が明確な場合があります。

---

### FP-CSS-007 — Generic Class Search Noise

```text
.inner
.card
.title
.text
.item
```

がrepo全体で大量に使われる。

**Repair**

owner付きBEM classへ置換します。

```text
.p-reason__card
.p-reason__title
```

---

### FP-CSS-008 — Deep DOM-dependent Nesting

```css
.p-section {
  .inner {
    .list {
      .item {
        h3 { ... }
      }
    }
  }
}
```

**Risk**

- specificity escalation
- markup changeでCSS破損
- owner検索性低下

**Repair**

BEM selectorをflatにします。

---

### FP-CSS-009 — Premature Universal Component

見た目が似ているだけの複数Sectionを`.c-card`へ統合し、modifierが増殖する。

**Repair**

same semantic role / structure / interaction / reason-to-changeを満たすか再評価します。

---

### FP-CSS-010 — Token Dumping Ground

一度しか使わない値まで`:root`へ移し、意味のないcustom propertyが大量に増える。

**Repair**

Global tokenとSection-local valueを分けます。

---

### FP-CSS-011 — z-index Arms Race

```text
10 → 100 → 999 → 99999
```

**Repair**

stacking context / isolation / global overlay layer contractを設計します。

---

### FP-CSS-012 — Hidden Overflow as Repair

横にはみ出した原因を直さず`overflow:hidden`で消す。

**Risk**

focus、dropdown、decorative media、contentまで切る可能性があります。

---

### FP-CSS-013 — nowrap as Visual Lock

Figmaが1行だからCMS headingへ`white-space:nowrap`を追加。

**Repair**

1行がsemantic contractなのか単なるreference resultなのか確認します。

---

### FP-JS-001 — Styling Class as Behavior API

CSS renameでinteractionが壊れる。

**Repair**

`data-js-*`等のbehavior hookとstyling classを分離します。

---

### FP-JS-002 — Giant Page Script

すべてのinteractionを巨大な1 blockへ詰める。

**Repair**

interaction ownerごとにsmall initへ分割します。ただし小規模案件で過剰分割しません。

---

### FP-WP-001 — Data Fetch Scattered Through Markup

ACF/get_field/condition/fallbackがHTML中へ散在し、変更範囲が追えない。

**Repair**

可能な範囲でread → normalize → escape → renderを整理します。

---

## Good Patterns

### GP-CSS-001 — Content-driven Section

```css
.p-reason {
  padding-block: var(--section-space);
}
```

Sectionの高さはcontent + spacingで決まり、文言変更へ追従します。

---

### GP-CSS-002 — Flat BEM Ownership

```css
.p-reason {}
.p-reason__inner {}
.p-reason__head {}
.p-reason__list {}
.p-reason__card {}
```

検索とownershipが一致します。

---

### GP-CSS-003 — Responsive Rule Co-location

```css
.p-reason__list {
  display: grid;
  gap: var(--card-gap);

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

selectorのSP/PC behaviorを1箇所で追えます。

---

### GP-CSS-004 — Art-directed Absolute Hero

Hero人物はcopy flowへ参加させずabsoluteで配置し、copyはFlow/Flex/Gridで安全に伸ばします。

Absoluteを避けるためのhackよりintentが明確です。

---

### GP-CSS-005 — Intrinsic Responsive Media

- HTML intrinsic width/height
- CSS responsive sizing
- authored aspect ratio when needed
- object-fit chosen by crop intent

rendered Figma coordinatesとasset contractを区別します。

---

### GP-CSS-006 — Equal-height by Layout Relationship

Grid/Flex stretchでrow内cardが最も長いcontentへ合わせて伸び、個別fixed heightを持ちません。

---

### GP-CSS-007 — Local Custom Property

```css
.p-course {
  --course-color: ...;
}
```

Section-only variableをglobal rootへ漏らしません。

---

### GP-CSS-008 — Intentional Exception

```text
owner: p-mv
selector: .p-mv__person
technique: position:absolute
reason: art-directed photography, independent from copy flow
resilience: copy may grow to 3 lines without image overlap
```

Exceptionを減らすのではなく、説明可能にします。

---

### GP-HTML-001 — Meaningful Source Order

CSSを外してもheading、body、list、actionsが意味のある順序で読めます。

---

### GP-JS-001 — Separate Behavior Hook

```html
<button class="p-voice__trigger" data-js-accordion-trigger aria-expanded="false">
```

Styling refactorとinteraction refactorを分離できます。

---

### GP-WP-001 — Section Ownership

大きいWordPress pageで、人間がSection名からtemplate/ACF/CSS/JSへ一意に辿れます。

ファイル分割数ではなくownershipの明確さを評価します。

---

## REF-001 learning seed

REF-001で重要だった学び:

```text
Before
Figma geometryを固定height/width + absolute座標へ直接転写
→ Visual patchを後段へ追記
→ duplicate selector / !important / breakpoint patchが増える

After
l-/c-/p- ownership
+ BEM
+ content/intrinsic sizing
+ Flow/Flex/Grid中心
+ justified art overlays
+ canonical owner repair
+ multi-viewport QA
```

このBefore/Afterを、今後のclean replayで比較教材として使います。
