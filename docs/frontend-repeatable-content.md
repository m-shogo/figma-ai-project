# Repeatable Content / Repeater Design Contract

Status: ACTIVE

同じフォーマットのcontentが連続している場合、現在は直書きでも、将来 WordPress / ACF Repeater / loop / API / CMS array に変わる可能性を考慮します。

対象例:

- cards
- courses
- student voices
- FAQ
- news/articles
- staff/members
- logos
- steps
- features/reasons
- gallery
- slider/carousel items
- CTA link collections

目的は「何でもRepeater化する」ことではありません。

**繰り返しUIを、件数・順番・文言・optional fieldの変更に耐えられる構造で実装すること**です。

---

## 1. Repeatability heuristic

同じvisual/semantic formatが2件以上連続する場合、実装前に次を確認します。

```text
Could this become data-driven later?
Could the count change?
Could the order change?
Could one item's title/body/image be longer or missing?
```

YESの可能性が現実的なら、現在直書きであってもloop-friendly markup/layoutを優先します。

ただしCMS化やComponent化そのものを勝手に行いません。Company/Project scopeを優先します。

---

## 2. Parent owns collection layout

Collectionの列数、gap、wrap、row relationshipはparent list/gridが所有します。

```css
.p-reason__list {
  display: grid;
  gap: var(--card-gap);
}

.p-reason__card {
  /* card自身はcollection全体の列位置を知らない */
}
```

Card childへ次の責任を持たせすぎません。

- `left/top`で自分の位置を決める
- itemごとの固定widthで列を構築する
- indexを見て通常layoutを成立させる

Collection layoutは親、内部layoutはitem owner、という責任分離を基本にします。

---

## 3. Count-independent by default

通常Repeater候補では:

```text
3 → 4
4 → 5
7 → 6
```

のような件数変更だけでCSS追加を要求しないことをdefaultとします。

例:

```css
.p-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}
```

ただし`auto-fit`を万能defaultにはしません。

Designが明確に:

```text
PC = 3 columns
SP = 1 column
```

ならexplicit columnsで構いません。

重要なのは**件数そのものを座標でハードコードしないこと**です。

---

## 4. nth-child / first / last rules

Index selectorは全面禁止ではありません。

### Good reason

- alternating visual treatment自体がdesign rule
- zebra striping
- first/last boundary treatment
- odd/even authored rhythm

### Suspicious reason

```css
.p-course:nth-child(7) {
  width: 560px;
  grid-column: 1 / -1;
}
```

「現在7件だから最後を中央に置く」というだけなら、将来件数が変わる可能性を確認します。

意味を持つitemなら:

```html
<li class="p-course p-course--featured">
```

のようにsemantic modifier/dataへ昇格します。

つまり**indexではなく意味があるなら意味をmarkup/dataへ持たせる**。

---

## 5. Repeater-ready HTML

同じformatの繰り返しは可能なら同じDOM shapeにします。

```html
<ul class="p-reason__list">
  <li class="p-reason__card">...</li>
  <li class="p-reason__card">...</li>
  <li class="p-reason__card">...</li>
</ul>
```

itemごとにwrapper階層やclass structureがバラバラになるのを避けます。

例外的なvisual itemにはmodifier/dataを追加し、完全に別のDOMへ分岐させる前に同じbase structureで表現できるか検討します。

---

## 6. Same format = same CSS contract

同じカード群で:

```text
card1だけheight: 320px
card2だけmargin-top: 17px
card3だけposition:absolute
```

のようなitem-specific correctionが必要になった場合、まずlayout root causeを疑います。

個別content lengthやimage cropが異なる場合も、card contract内で自然に吸収できることを目標とします。

---

## 7. Text length diversity inside repeaters

Repeaterでは全itemが同じ文字数になることを前提にしません。

Mutation例:

```text
Card A title: 1 line
Card B title: 2 lines
Card C title: 3 lines

Body:
short / normal / long
```

確認:

- title/bodyが隣itemへ干渉しない
- button/link位置が不自然に重ならない
- equal-height要求がある場合は最長contentへ追従する
- 固定height + clippingで見た目を揃えない（明示仕様を除く）

---

## 8. Internal card layout

Buttonをcard bottomへ揃えたい場合は、固定top/heightではなくlayout relationで成立させます。

例:

```css
.p-card {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}
```

またはFlex column + `margin-block-start:auto`等、既存architectureに合う方法を使います。

「本文が2行増えてもactionが下端へ自然に残る」設計を優先します。

---

## 9. Image differences

Repeater imageは素材比率/主題が変わる可能性を考えます。

- authored uniform crop → shared `aspect-ratio` + `object-fit:cover`
- must-not-crop image → `contain`
- optional image → image無しstateを確認
- itemごとにart directionが必要 → data/modifierとして明示

画像サイズをitem indexごとにCSS patchしません。

---

## 10. Optional fields

CMS化可能なcardでは、以下がemptyでも壊れないか必要に応じて確認します。

- eyebrow/kicker
- title
- body
- image
- link/button
- badge
- metadata

空要素を出力して余白だけ残すより、template側でsemanticにomitする方が自然な場合があります。

ただし既存CMS contractに従います。

---

## 11. Zero / One states

Repeater候補では、意味がある場合:

- 0件
- 1件

も考えます。

例:

- Slider 1件ならnavigation不要
- FAQ 0件ならSection自体を隠すcontractかempty stateか
- Logo 1件でも不自然な4-column empty geometryにならないか

全案件で0件対応を強制するのではなく、data contractに応じて決めます。

---

## 12. Slider/carousel conversion

横並びcardsが将来sliderになる可能性がある場合でも、最初からSwiper markupへする必要はありません。

まずcontent/item contractを安定させます。

```text
collection
└ item
   ├ media
   ├ body
   └ action
```

必要になった段階でexisting/approved slider wrapperへ適応できる構造が理想です。

JS libraryの都合でcontent markupを必要以上に汚しません。

---

## 13. PHP / WordPress / ACF Repeater

直書きからACF Repeaterへ移行する可能性がある場合、同じitem markupを維持できる構造を優先します。

Conceptual flow:

```text
static items
or
ACF rows
or
API data
↓
normalized item shape
↓
shared item markup
```

ただし小規模案件に抽象data layerを強制しません。

重要なのは「CMS化するとHTML/CSSを全面書き換える」状態を避けることです。

---

## 14. Stable data identity

JS interactionを伴うRepeaterでは、indexだけを永続identityとして扱わない方がよい場合があります。

候補:

- post ID
- ACF row stable key where available
- explicit slug/id
- semantic data attribute

並べ替えでindexが変わってもinteraction/state mappingが壊れない設計を検討します。

単純表示のみなら不要です。

---

## 15. Accessibility in repeated content

- list semanticsが自然なら`ul/ol/li`
- repeated headingsのlevelを揃える
- duplicated IDsを生成しない
- accordion trigger/panel IDsをloopでuniqueにする
- carousel slide labelingをlibrary/policyに従って管理

Repeater化で同じ`id`が複製される事故を防ぎます。

---

## 16. Visual exception items

Figmaに1件だけ大きいfeatured card等がある場合、それを「7番目だから」ではなくvisual/semantic roleとして扱えるか検討します。

```text
base item
+ featured variant
```

件数が変わってもfeaturedという意味は残ります。

ただしFigmaが本当に「最後のitemは常にfeatured」という仕様なら`:last-child`が自然です。

**意味に一番近いselectorを選ぶ**のが原則です。

---

## 17. Mutation QA for repeated content

Relevant collectionで次を組み合わせて確認します。

```text
COUNT
0 / 1 / expected-1 / expected / expected+1

TEXT
short / normal / long / 2-line / 3-line

MEDIA
normal / different ratio / missing optional

ORDER
first/last swap when order is editable
```

PASS:

- CSS patch不要
- overlapなし
- horizontal overflowなし
- grid/flex relationship維持
- featured/semantic variantsがindex変更で壊れない
- JS counter/navigationが件数へ追従

---

## 18. Smells

Repeater candidateで強く確認するsmell:

- `nth-child(N)` が多数
- individual item `width/height/top/left`
- item-specific `!important`
- `:first-child`/`:last-child`が意味ではなく現データ数を補正している
- fixed grid geometry that assumes exact count
- duplicated markup shape
- cardごとに別class体系
- slider count hard-coded in JS
- ACF row count hard-coded in CSS

これらは即FAILではなく、将来件数変更可能性と照合します。

---

## 19. Definition of Done for repeatable content

Repeater/loop候補は、対象scopeに応じて:

- same format uses stable item structure
- parent owns collection layout
- item owns internal layout
- ordinary count change does not require item-position CSS patch
- editable text can wrap
- optional fields have defined behavior
- semantic variant is not accidentally encoded only by current index
- JS count/state follows actual DOM/data
- future CMS conversion does not require unnecessary CSS redesign

を満たすことを目標にします。
