# Frontend Pattern Library

Status: ACTIVE learning library

実案件のBefore/Afterから学ぶためのGood/Failure Pattern集。

Patternは「このpropertyは禁止」という辞書ではない。**どのintentで壊れ、どう直すと再利用可能な学びになるか**を記録する。

---

## FP-CSS-001 — Figma coordinate recreation

### Smell

```css
.section {
  height: 559px;
  position: relative;
  overflow: hidden;
}

.section__title {
  position: absolute;
  top: 48px;
  left: 102px;
}
```

Figma frame寸法/x-y座標をそのままWeb layoutへ写している。

### Failure mode

- copy 2行化で衝突
- CMS更新でclip
- intermediate widthで破綻
- 修正がtop/left patch増殖へ進む

### Better direction

Content relationshipをFlow/Flex/Gridへ翻訳し、artworkだけ必要に応じてabsoluteにする。

---

## GP-CSS-001 — Content-driven section + art-directed artwork

```css
.p-mv {
  display: grid;
}

.p-mv__copy {
  align-self: center;
}

.p-mv__person {
  position: absolute;
}
```

Copyはcontent flow、人物はart direction。

**absoluteが存在することは問題ではない。責任分離されていることが重要。**

---

## FP-CSS-002 — Override accumulation

```css
.p-reason__card { ... }

/* 600 lines later */
.p-reason__card { ... }

/* final fix */
.p-reason__card { ... !important; }
```

### Failure mode

- authoritative owner不明
- cascadeを読まないと修正不能
- Visual QAのたびにtechnical debt増加

### Better direction

Canonical ownerを修正する。Media/container/state等の正当なcontextはowner relationshipが追える位置へ置く。

---

## FP-CSS-003 — Property-ban workaround

「absolute禁止」に合わせるため:

```css
margin-top: -260px;
transform: translateX(83px);
```

へ置換する。

### Failure mode

Property countだけ改善し、layout intentはさらに分かりにくくなる。

### Better direction

Propertyを禁止せず、intentional overlayならabsoluteを普通に使う。

---

## GP-CSS-002 — Intent-based exception

```text
owner: p-mv
technique: absolute
intent: art-directed hero photography
resilience: copy can grow without collision
```

非自明な例外は理由と守るべきresilienceを説明する。

---

## FP-CSS-004 — Current-count layout patch

```css
.p-course:nth-child(7) {
  grid-column: 2;
  width: 560px;
}
```

「現在7件」の偶然をlayout contractにしている。

### Failure mode

6件/8件/並び替えで破綻。

### Better direction

- incomplete-row behaviorをcontract化
- semantic featured itemならmodifier/data
- order ruleそのものなら`:last-child`等意味に近いselector

---

## GP-CSS-003 — Parent-owned collection

```css
.p-course__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--course-gap);
}
```

Parentがcollection layoutを所有し、itemは内部layoutだけを持つ。

---

## FP-CSS-005 — Fixed equal-height by clipping

```css
.p-card {
  height: 360px;
  overflow: hidden;
}
```

### Failure mode

一部title/bodyが長いと情報消失。

### Better direction

Grid/Flex stretch、`1fr`、auto margin等でrelationshipを作る。

Asset/UI-owned fixed heightなら例外。

---

## GP-CSS-004 — Uneven content resilience

```css
.p-card {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}
```

Card A 1行、B 3行でもCTA relationshipが保たれる。

---

## FP-CSS-006 — Generic searchable names only

```css
.inner {}
.title {}
.card {}
```

### Failure mode

Repo検索でownerが分からない。

### Better direction

```css
.p-reason__inner {}
.p-reason__title {}
.p-reason__card {}
```

Class nameをrepository navigation APIとして使う。

---

## FP-CSS-007 — Deep nesting / specificity inflation

```css
.page {
  .section {
    .list {
      .card {
        h3 {}
      }
    }
  }
}
```

### Failure mode

- DOM location dependency
- override cost増加
- native nestingではparent selector listのspecificity影響も受ける

### Better direction

Flat BEM owner。

```css
.p-reason__card-title {}
```

Nestingはpseudo/state/condition co-location中心。

---

## FP-CSS-008 — `&` cargo cult

```css
.p-reason {
  & .p-reason__list {
    & .p-reason__card {}
  }
}
```

`&`を付けること自体が目的になっている。

### Better direction

BEM selectorをflatにする。Parent自身を参照するpseudo/state等で`&`を使う。

---

## FP-CSS-009 — Breakpoint patch proliferation

```text
873px fix
947px fix
1032px fix
```

### Failure mode

崩れた地点ごとにpatchし、layout modeの設計が見えなくなる。

### Better direction

Company/Existing breakpointを優先し、必要なlayout mode changeとしてbreakpointを設計する。

Breakpoint数が少ないこと自体はKPIにしない。

---

## FP-CSS-010 — `nowrap` as screenshot lock

Editable heading/buttonへ`white-space: nowrap`を入れてFigmaの1行を固定。

### Failure mode

CMS/localizationでhorizontal overflow。

### Better direction

明示single-line contractでなければwrap可能にし、content risk factorsに応じてmutationする。

---

## FP-HTML-001 — Manual `<br>` as Figma line-wrap lock

```html
<h2>
  学びを未来へ<br>
  つなげる学校
</h2>
```

Figma screenshotで2行だからという理由だけでeditable copyへ手動改行を埋め込む。

### Failure mode

- CMSで文言変更すると不自然な位置で必ず改行
- localizationで極端な短行/長行になる
- responsive widthが変わっても改行位置だけ固定
- editorがHTML改行を意識しないと修正しにくい

### Better direction

通常editable copyはbrowser wrapへ任せる。

`<br>`が正当な例:

- address/poem等、改行自体がsemantic content
- fixed editorial typography
- project-authorized art-directed copy

**`<br>`は禁止ではなく、line breakがcontent contractかを確認する。**

---

## FP-HTML-002 — Duplicate PC/SP DOM for the same content

```html
<div class="only-pc">同じCTA...</div>
<div class="only-sp">同じCTA...</div>
```

同じsemantic contentをPC/SPで丸ごと二重管理する。

### Failure mode

- CMS copy更新漏れ
- duplicated IDs
- hidden側focusable control
- JS event binding/state二重化
- analytics tracking二重化
- accessibility tree/DOM ownershipが複雑化

### Better direction

まず同じsource/markupをCSS layout、responsive image、art directionで適応できるか検討する。

Separate markup/sourceが正当な例:

- PC/SPで情報構造が本当に異なる
- interaction自体が異なる
- source asset/contentが明示的に別contract

その場合もhidden focus、ID、JS、CMS ownershipを明確に管理する。

---

## FP-JS-001 — Styling class is accidental JS API

```js
document.querySelector('.p-button--blue')
```

Visual renameでbehaviorが壊れる。

### Better direction

Styling/behavior hookを分離。ただし`data-js-*`形式自体はExisting Projectへ合わせる。

---

## FP-JS-002 — Multiple independent state truths

```text
is-open = true
aria-expanded = false
data-state = closed
```

### Failure mode

Visual/A11y/logicの状態がズレる。

### Better direction

Primary state sourceを1つ決め、他表現を同期/派生させる。

---

## FP-MEDIA-001 — HTML width/heightをCSS固定寸法と混同

Intrinsic image dimensionsまで「固定値禁止」で消す。

### Failure mode

Image load前のspace reservationを失い、CLSを増やし得る。

### Better direction

HTML intrinsic `width/height` と CSS rendered sizeを別概念として扱う。

---

## FP-MEDIA-002 — Loading attribute cargo cult

全画像:

```html
loading="lazy" fetchpriority="high"
```

### Failure mode

Priority hintが競合し、Hero/LCP image discoveryを遅らせる場合がある。

### Better direction

Hero/LCP候補、below-fold、carousel hidden slide等のroleと計測に応じてloading priorityを選ぶ。

---

## FP-A11Y-001 — 200% zoom = Accessibility全部PASS

### Failure mode

Resize Text / Reflow / Text Spacingは別のfailure modeを持つ。

### Better direction

Project WCAG targetに応じてそれぞれ選択的に検証する。

---

## GP-QA-001 — Risk-based mutation

```text
STATIC_AUTHORED → canonical visual中心
EDITOR_OWNED → text/optional field
LOCALIZED → expansion/wrap
REPEATABLE → count/order/incomplete row
HERO_OVERLAY → long-copy collision
IMAGE_HEAVY → CLS/LCP
INTERACTION_HEAVY → state/INP
```

全テストを全Sectionへ強制しない。

---

## GP-QA-002 — CSS diff = 0 as signal

Card +1やcopy変更でCSS diffが0ならGood signal。

ただし新semantic variant/layout modeならCSS変更は正当。

**0をKPI化しない。**

---

## Pattern promotion rule

```text
Observation
→ reproducible failure/success
→ clean replay
→ cross-run evidence
→ CANDIDATE
→ repeated evidence
→ ACTIVE
```

Pattern Libraryは経験を残すためのもの。一度の失敗を永久禁止ruleへしない。
