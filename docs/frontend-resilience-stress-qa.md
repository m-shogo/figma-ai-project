# Frontend Resilience Stress QA

Status: ACTIVE / deep companion contract

この文書は、canonical Figma visualを壊さずに、将来の文言・件数・順番・optional field・CMS化・画像差し替え・runtime stateへ実装がどこまで耐えるかを意図的に検証するための契約です。

**Stress QAを毎PR全部実行することは目的ではありません。**

---

## 1. Baseline first

```text
canonical data/state
→ canonical visual PASS
→ temporary mutation fixture
→ resilience PASS/FAIL
→ production dataへmutationを残さない
```

Mutation後にFigma canonical screenshotと見た目が違うこと自体はFAILではありません。

見るのは:

- clip
- overlap
- overflow
- broken interaction
- semantic variant loss
- runtime state loss
- unreasonable CSS patch requirement
- loading/layout-shift regression

です。

---

## 2. When to run

### FAST PR GATE

Stress QAなし、または最小smokeだけ。

### TARGETED MUTATION

Section metadata/risk/runtime modelから選ぶ。

### DEEP / PERIODIC

- release
- benchmark
- research run
- architecture change
- high-risk CMS/interaction change
- foundation/font/third-party change

で実施。

---

## 3. Deterministic fuzz

Repeatable/CMS/async contentでは必要に応じて複数content shape/runtime stateを組み合わせます。

Dimensions候補:

- item count
- title length
- body length
- optional fields
- image ratio/presence
- order
- semantic variant position
- CTA presence
- metadata presence
- runtime state
- form state
- font loading state
- locale/direction
- third-party availability

Randomnessを使う場合はseedを保存します。

```text
seed=101
count=4
runtime=PARTIAL
font=FALLBACK
locale=ja-JP
A: title short / body long / image yes / CTA no
B: title 3 lines / body short / image no / CTA yes
C: title 2 lines / body long / featured yes
D: title short / body normal
```

**Uniform Lorem Ipsumだけでは見つからない組み合わせ事故**を探すのが目的です。

---

## 4. Avoid Cartesian explosion

```text
count × title × body × image × order × runtime × font × locale × viewport × browser
```

を全直積するとテストが爆発します。

Default:

- representative seeds
- pairwise combinations
- known-risk combinations
- past failure replay

を優先します。

Full Cartesianは研究上明確な価値がある時だけ。

---

## 5. Product viewport vs accessibility probe

通常Production visual stressは、**Effective Environment ContractのRequired Environment / Existing support / explicit Project contract**から対象viewportを選ぶ。

Support floor未確定時は360 CSS pxをexploratory candidateとして使えるが、通常Product support floorへ自動昇格させない。

WCAG 2.2 AA Reflowの320 CSS px equivalentは、Product support floorとは別のaccessibility stressとして扱う。

Required Environment自体が320px等なら、その幅は通常Production stressでも当然検証する。

---

## 6. Uneven content

同じcard群でも文字数を揃えません。

```text
A: title 1 line / body short
B: title 3 lines / body long
C: title 2 lines / body normal
D: title 1 line / body very long
```

確認:

- tallest itemへ自然に追従
- CTA alignmentがrelationshipで成立
- border/background/decorative treatmentが内容へ追従
- fixed height + clippingになっていない

---

## 7. Content Shape

必要なRepeater/CMS itemはrequired/optional/semantic variantを明示できます。

```text
course_item
- title: required
- body: optional
- image: optional
- cta: optional
- badge: optional
- variant: optional semantic value
```

Static/PHP/ACF/API/frameworkで同じsemantic shapeを共有できるのが理想ですが、抽象化を強制しません。

---

## 8. Cardinality

必要なcollectionでは:

```text
expected
normal_min / normal_max
zero_behavior
incomplete_row_behavior
```

を定義できます。

Targeted points:

- expected-1
- expected
- expected+1
- zero/one when supported
- normal max
- incomplete last row

Supported range外へ無理に万能化しません。

---

## 9. Reorder

Order editableな場合:

```text
A B C D
→ D B A C
```

を試せます。

確認:

- accidental `nth-child` semantic dependency
- featured/priority variant
- JS identity/key
- first/last ruleの本当の意味

---

## 10. Missing field

Optional fieldを個別に消します。

- image
- eyebrow/kicker
- body
- metadata
- badge
- CTA/link

Smell:

- empty wrapper + stale gap
- broken image
- empty control
- fixed media slotだけ残る
- `:empty` patch増殖

---

## 11. Runtime state stress

Async/external/form scopeでは必要なstateを選ぶ。

```text
DEFAULT
LOADING
EMPTY
PARTIAL
ERROR
SUCCESS
DISABLED
OFFLINE_OR_NETWORK_FAILURE
```

Check:

- state switchでlayoutが不必要に跳ねない
- emptyとerrorを混同しない
- partial dataを無意味に全捨てしない
- retry/disabled ownershipが明確
- status/focus announcementが必要なUIで失われない

全stateを全Sectionへ強制しない。

---

## 12. Form stress

Relevant formで候補:

- IME composition中Enter
- autofill
- password manager
- long validation message
- server validation error
- network error
- double submit attempt
- success without navigation

見るのは見た目だけでなくstate truth / focus / semantics。

---

## 13. CMS Stress Preview

WordPress/ACF fixture環境がある場合の候補:

```text
NORMAL
LONG_TEXT
UNEVEN_CONTENT
MISSING_OPTIONALS
FEW_ITEMS
MANY_ITEMS
REORDERED
EXTREME
```

Production editor dataを直接stress dataへ書き換えません。

全案件へPreview UIを作る必要はありません。既存fixtureがある、またはCMS事故が反復する場合に有力です。

---

## 14. CSS diff = 0 signal

単純data mutationではCSS変更不要がGOOD signalです。

```text
3→4 cards
short→2-line title
badge on→off
order change
```

でCSS diff=0なら高いresilience signalになります。

ただしabsolute KPIではありません。

新semantic variant/layout modeならCSS変更は正当です。

---

## 15. Accessibility stress

Project targetに応じて:

- Resize Text
- Reflow
- Text Spacing
- keyboard/focus
- reduced motion

を代表ケースで確認できます。

Localized/User Generated等ではtext stressと組み合わせる価値があります。

---

## 16. Font stress

Font-sensitive scopeでは必要に応じて:

- fallback only
- delayed webfont
- final font
- missing requested weight
- mixed Latin/CJK
- localized glyph fallback

を確認する。

Check:

- wrap drift
- section/card height drift
- CLS
- content loss
- canonical final typography

Font metric overrideを使う場合はRequired Browser Matrixを含めてreplay可能にする。

---

## 17. Performance / media stress

Image-heavy pageでは:

- slow image load / reserved space
- LCP image discovery
- optional image missing
- large source replacement
- below-fold media count increase
- delayed font
- late async content
- third-party embed load

等を確認できます。

Visual fidelityだけを理由に全画像をeager/high priorityにしません。

---

## 18. Third-party / embed stress

Relevant embed/vendorで:

- script blocked
- cookie/consent denied
- provider timeout/failure
- iframe delayed
- placeholder → embed transition
- unexpected aspect/content size

を必要に応じて確認する。

Primary page content/navigationがvendor failureへ巻き込まれないこと。

---

## 19. Localization / bidi stress

ProjectがLOCALIZED/RTL_REQUIRED等の場合:

- long translation
- short translation
- mixed Latin/CJK
- RTL
- `dir=auto`相当のunknown-direction data
- locale-specific number/date

を選べる。

Logical propertyを使っていること自体をKPIにせず、meaningful start/end relationshipが保たれるかを見る。

---

## 20. Ownership map

必要なら自動/半自動mapを生成できます。

| Owner | Markup/PHP | CSS | Behavior | Data | QA |
| --- | --- | --- | --- | --- | --- |
| `p-reason` | section template | `.p-reason*` | none | repeater candidate | text/count |
| `p-voice` | section template | `.p-voice*` | project hook | ACF | interaction/count |

目的はdocumentation量を増やすことではなく、**検索開始点を短くすること**です。

---

## 21. Layout Smell Score

Sectionごとのsmell可視化はdiagnostic/triage専用です。

候補:

- fixed content block-size
- unexplained absolute content
- unexplained offsets
- `!important`
- override accumulation
- patch breakpoints
- nowrap on editable content
- index-specific layout patch

0点を品質KPIにしません。

Art-directed Heroのabsolute等、justified exceptionは正常です。

---

## 22. Human change cost

厳密な時間KPIではなく、代表変更の経路を見ます。

Good:

```text
REASONを変更
→ p-reason検索
→ owner発見
→ local edit
```

Bad:

```text
20 selector hits
→ base探し
→ media override探し
→ final-fix探し
→ !important競合
```

---

## 23. Future-change questions

Relevant scopeで:

```text
文字が増えたら？
件数が変わったら？
画像が変わったら？
optional fieldが消えたら？
順番が変わったら？
翻訳/RTLになったら？
loadingが遅かったら？
fontが遅い/使えなかったら？
APIがempty/error/partialだったら？
第三者embedが落ちたら？
IME/autofillだったら？
```

全てへ万能対応する必要はありません。

対応外ならcontractが明確、対応内なら必要なmutationで壊れないことが重要です。

---

## 24. Graceful degradation stress

極端条件で全部を維持できない場合:

```text
P0 information/function/accessibility
→ P1 brand/hierarchy
→ P2 decorative geometry
→ P3 non-essential motion
```

のpriorityに反していないかを見る。

Tiny text / blanket scale / hidden informationをdefault escape hatchにしない。

---

## 25. Failure promotion

```text
failure
→ reproducible fixture/seed
→ root cause
→ minimal owner repair
→ clean replay
→ Failure Pattern
→ Good Pattern
→ CANDIDATE rule
→ repeated evidence
→ ACTIVE promotion
```

Runtime state / font / locale / vendor / environmentもconditionとして残す。

1回のfailureから永久property banを作りません。

---

## 26. Definition of Done

Deep QA対象scopeでは必要に応じて:

- canonical visual PASS
- Effective Environment ContractでRequiredなproduct viewport PASS
- support floor未確定時の360px候補をhard contractとして扱っていない
- selected text mutation PASS
- uneven repeated content PASS
- supported cardinality PASS
- reorder PASS when editable
- optional field behavior PASS
- relevant runtime state PASS
- form/IME/autofill PASS when applicable
- font fallback/loading PASS when applicable
- third-party fallback PASS when applicable
- localization/bidi PASS when applicable
- accessibility stress PASS when required
- no unintended overflow/clip/overlap
- relevant loading/layout shift PASS
- ordinary data mutation does not require coordinate patch
- fuzz failure is reproducible

を満たします。
