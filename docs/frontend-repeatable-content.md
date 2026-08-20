# Repeatable Content / Repeater Design Contract

Status: ACTIVE / evolving companion contract

同じformatのcontentが連続している場合、現在は直書きでも、将来WordPress/ACF Repeater/loop/API/CMS array/framework dataへ変わる可能性を考慮します。

目的は「何でもRepeater化する」ことではありません。

**現在件数・現在文言・現在順序へ偶然依存しない、将来変更しやすい繰り返しUIを作ること**です。

---

## 1. Repeatability heuristic

同じvisual/semantic formatが2件以上連続する場合、実装前に必要に応じて確認します。

```text
Could this become data-driven later?
Could count change?
Could order change?
Could titles/bodies differ in length?
Could optional media/CTA disappear?
```

対象例:

- cards
- courses
- student voices/testimonials
- FAQ
- news/articles
- staff/members
- logos
- steps/features/reasons
- gallery
- slider/carousel items
- CTA collections

CMS化/Component化そのものはCompany/Project scopeが決めます。

---

## 2. Parent owns collection layout

Collectionの列数、gap、wrap、row relationshipはparentが所有します。

```css
.p-reason__list {
  display: grid;
  gap: var(--card-gap);
}

.p-reason__card {
  /* internal card layout only */
}
```

Card childが通常layout成立のために次を所有しすぎないようにします。

- `left/top`による列位置
- itemごとの固定widthでcollectionを構築
- current indexごとの座標補正

**Parent owns collection / item owns internals** がdefaultです。

---

## 3. Stable item shape

同じformatなら可能な範囲で同じDOM shapeを保ちます。

```html
<ul class="p-reason__list">
  <li class="p-reason__card">...</li>
  <li class="p-reason__card">...</li>
</ul>
```

意味のあるvariationはmodifier/data/prop等で表現できるか検討します。

完全に別のsemantic roleなら無理に同じcomponentへ押し込みません。

---

## 4. Count independence is scoped, not infinite

「3件→4件」等のordinary count changeだけでitem-position CSS patchが必要にならないことをdefaultとします。

ただし**無限件対応を暗黙要求しません**。

必要なcollectionではCardinality Contractを持てます。

```yaml
expected: 3
normal_min: 2
normal_max: 6
zero_behavior: HIDE_SECTION
incomplete_row_behavior: START
```

supported range外は別layout/design判断が必要でも構いません。

---

## 5. Incomplete last row

PC 3 columnsで5items等、最終rowが埋まらない場合の挙動をdesign intentとして扱います。

候補:

- `START` — 左/開始位置へ寄せる
- `CENTER` — row内で中央寄せ
- `STRETCH` — 残itemが利用可能幅を使う
- `AUTHORED_VARIANT` — design上明示されたspecial treatment
- `PROJECT_DEFINED`

「現在5枚だから5枚目だけ`nth-child(5)`で座標を調整」のようなpatchへすぐ逃げません。

ただし「常に最後のitemをfeaturedにする」が仕様なら`:last-child`が意味に合う場合があります。

---

## 6. `nth-child` / first / last

Index selectorは禁止しません。

### Good reasons

- authored alternating pattern
- zebra striping
- first/last boundary treatment
- odd/even rhythm自体が仕様
- orderそのものがsemantic rule

### Suspicious reasons

- current item countだけを補正
- current 7th itemだけwidth/position修正
- semantic featured itemを偶然のindexだけで表す

意味が残るvariantなら:

```html
<li class="p-course p-course--featured">
```

等へ昇格させます。

---

## 7. Content volatility inside repeaters

全itemの文字数が同じとは考えません。

特に`EDITOR_OWNED` / `LOCALIZED` / `EXTERNAL_DATA` / `USER_GENERATED`ではuneven contentを確認します。

例:

```text
A title: 1 line / body short
B title: 3 lines / body long
C title: 2 lines / body normal
```

見るもの:

- adjacent itemへ重ならない
- card/background/borderが伸びる
- CTA alignmentが必要ならlayout relationshipで成立
- fixed height + clippingで見た目を揃えていない

---

## 8. Internal card layout

CTAをcard bottomへ揃えたい場合、固定top値よりrelationshipを使います。

例:

```css
.p-card {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}
```

またはFlex column + auto margin等、Existing architectureに合う方法を使います。

---

## 9. Content Shape Contract

CMS/data-driven可能性が高いitemは必要に応じてsemantic shapeを明示します。

```text
course_item
- title: required
- body: optional
- image: optional
- cta: optional
- badge: optional
- variant: optional semantic value
```

Static HTML / PHP array / ACF / API / React propsで同じsemantic shapeを共有できるのが理想ですが、小規模案件へ抽象data layerを強制しません。

---

## 10. Optional fields

Optional fieldがemptyのとき:

- empty wrapperだけ残らない
- broken imageにならない
- empty button/linkを出さない
- hidden media slotの固定heightだけ残らない
- spacingが不自然に二重にならない

Template側でomitする方が自然ならomitします。

---

## 11. Zero / one states

Data contract上意味がある場合:

- 0 items
- 1 item

も定義します。

例:

- Slider 1件 → navigation不要
- FAQ 0件 → hide section / empty state / invalid by contract
- Logo 1件 → 不自然なempty grid geometryを避ける

全collectionへ0件対応を強制しません。

---

## 12. Media differences

Repeater imageはsource ratio/subject/presenceが異なる可能性を考えます。

- uniform authored crop → shared ratio + cover candidate
- must-not-crop → contain candidate
- optional image → missing state確認
- item-specific art direction → semantic variant/data

Index別image size patchをdefaultにしません。

---

## 13. Reorder / stable identity

Order editableなcollectionではreorderをTargeted Mutation候補にします。

```text
A B C D
→ D B A C
```

Stateful interactionがある場合、indexだけを永続identityにしない方が良い場合があります。

候補:

- post ID
- explicit stable key/slug
- data identity
- framework key

単純表示だけなら不要です。

---

## 14. Slider/carousel conversion

横並びcardだから最初からSwiper markupへする、とは限りません。

まずcontent contractを安定させます。

```text
collection
└ item
   ├ media
   ├ body
   └ action
```

必要になった時にExisting/approved sliderへ適応できる構造を目指します。

Library都合でsemantic content markupを必要以上に汚しません。

---

## 15. WordPress / ACF migration

直書きからACF Repeaterへ移行する可能性がある場合、同じitem markupを再利用できる構造を優先します。

```text
static items / ACF rows / API data
↓
normalized semantic item
↓
shared item markup
```

ただし既存themeがsimple inline loopを正本にしている場合、不要なnormalizer層を増やしません。

ACF化するとHTML/CSS全面書き換えになる状態を避けるのが目的です。

---

## 16. Accessibility in repeated content

Relevant scopeで:

- list semantics
- repeated heading level
- duplicated IDsを生成しない
- accordion trigger/panel IDsをuniqueにする
- slider semantics/library policy
- keyboard/focus order

を確認します。

---

## 17. Mutation QA selection

毎回全パターンを実行しません。

### FAST

Canonical data + runtime/overflow。

### TARGETED

Section riskに応じて:

```text
COUNT: expected±1 / zero / one when relevant
TEXT: uneven 1/2/3 line
OPTIONAL: image/CTA/badge missing
ORDER: reorder when editable
ROW: incomplete last-row behavior
```

### DEEP

Release/benchmark/high-risk時にdeterministic fuzzやlarger supported rangeを確認できます。

全dimensionのCartesian productは原則不要です。

---

## 18. Smells

強く確認するもの:

- many `nth-child(N)` rules
- item-specific width/height/top/left
- item-specific `!important`
- fixed grid geometry that assumes exact current count
- duplicated item markup shape
- per-card unrelated class systems
- JS hard-coded count
- ACF row count encoded in CSS

これらは即FAILではありません。Project contractと照合します。

---

## 19. Definition of Done

Relevant repeatable scopeで:

- stable semantic item shape
- parent owns collection layout
- item owns internal layout
- ordinary count change does not require coordinate patch
- editable text can wrap as required by volatility
- optional fields have defined behavior
- incomplete row behavior is intentional when material
- semantic variant is not accidentally encoded only by current index
- stateful JS identity survives reorder when required
- future CMS conversion does not force unnecessary CSS redesign

を目標にします。
