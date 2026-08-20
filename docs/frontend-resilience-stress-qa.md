# Frontend Resilience Stress QA

Status: ACTIVE / evolving companion contract

この文書は `docs/frontend-implementation-standard.md` / `docs/frontend-maintainability-qa.md` / `docs/frontend-repeatable-content.md` を補完し、**「今のFigmaに合っている」だけではなく、将来の文言・件数・順番・optional field・CMS化・画像差し替えに耐えられるか**を意図的に壊して検証するための契約です。

ルールを増やすこと自体が目的ではありません。Productionで現実的に起こる変更を先回りして、安易な固定寸法・座標配置・index依存・override accumulationを見つけることが目的です。

---

## 1. Stress QA principle

通常QAはcanonical dataを確認します。

Stress QAは、canonical visualを壊さずに実装耐久性だけを検証するため、一時的なfixture/data mutationを使います。

```text
canonical Figma data
→ baseline visual PASS
→ temporary mutation fixture
→ resilience PASS/FAIL
→ fixtureをproduction dataへ残さない
```

MutationでFigmaとの差分が出ること自体はFAILではありません。見るのはlayout failureです。

---

## 2. Deterministic Fuzz QA

Repeater/collection/CMS contentでは、固定した1ケースだけでなく複数のcontent shapeを組み合わせるFuzz QAを候補にします。

Mutation dimensions:

- item count
- title length
- body length
- optional field presence
- image ratio/presence
- order
- semantic variant position
- link/button presence
- metadata presence

例:

```text
seed 101
count=4
item1 title=short body=long image=yes cta=no
item2 title=3-lines body=short image=no cta=yes
item3 title=2-lines body=long image=yes cta=yes featured=yes
item4 title=short body=normal image=yes cta=no
```

Randomnessを使う場合も再現可能なseedを保存し、FAILを再現できること。

**ランダムに壊すことが目的ではなく、均一なLorem Ipsumでは見つからない組み合わせ事故を検出すること**が目的です。

---

## 3. Uneven content matrix

同じカード群でもcontent量を揃えません。

例:

```text
Card A: title 1 line / body short
Card B: title 3 lines / body long
Card C: title 2 lines / body normal
Card D: title 1 line / body very long
```

確認:

- tallest itemへ自然に追従するか
- CTA位置の整列が必要ならlayout relationで成立するか
- border/background/decorationsが内容へ追従するか
- fixed height + clippingで見た目を揃えていないか
- 一部の長文だけ隣card/rowへ干渉しないか

---

## 4. Content Shape Contract

Repeater/CMS候補は必要に応じてitem shapeを明示します。

例:

```text
course_item
- title: required
- body: optional
- image: optional
- cta: optional
- badge: optional
- variant: optional semantic value
```

Required/optionalを曖昧にしないことで、template側のempty handlingとCSS layoutを一致させます。

Content ShapeはCMS field設計そのものを強制するものではありません。Static HTML / PHP array / ACF / API / React propsのどれでも同じsemantic shapeを共有できることが理想です。

---

## 5. Supported Cardinality Contract

「無限件対応」を暗黙要求にしません。

必要なcollectionは以下を区別できます。

```text
expected: 3
normal_operating_range: 2..6
stress_supported_range: 1..12
zero_behavior: hide-section | empty-state | invalid-by-contract
```

Design/Business/CMS制約で上限が決まる場合はそれを使います。

確認対象:

- 0
- 1
- expected - 1
- expected
- expected + 1
- normal max
- stress max when meaningful

件数増加だけでitem-specific CSS patchを要求しないことをdefaultとしますが、明示的supported range外まで無理に万能化しません。

---

## 6. Reorder QA

並び替え可能なcollectionでは順序を変更して確認します。

```text
A B C D
→ D B A C
```

見るもの:

- `nth-child(N)`が現在データの意味を誤って所有していないか
- featured/priority/variantがindexではなくsemantic dataへ紐づいているか
- JS state/key/idが並び替えで壊れないか
- first/last treatmentが本当にorder ruleなら正しく追従するか

---

## 7. Missing Field QA

Optional fieldを個別に消します。

候補:

- image
- eyebrow/kicker
- title when optional by contract
- body
- metadata
- badge
- CTA/link

FAIL smell:

- 空wrapperだけ残ってgapが二重になる
- empty link/buttonが残る
- broken image
- fixed media heightだけ残る
- hidden contentのためのmargin/paddingが残る
- `:empty` hackを大量追加しないと成立しない

Template側でomitする方が自然ならomitします。

---

## 8. CMS Stress Preview

WordPress/ACF等でfixture環境を持てる案件では、将来次のpreview data setを用意する候補があります。

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

これは全案件への必須UIではありません。

既にWordPress Runtime Fixture / Preview環境がある、または実運用でCMS mutation事故が繰り返される場合に有力です。

Stress Previewはproduction editor dataを書き換えずfixture/preview modeで行うこと。

---

## 9. CSS Diff = 0 as a resilience signal

単純なcontent/data変更では、CSS変更が不要であることを強いGOOD signalとして扱います。

例:

```text
3 cards → 4 cards
short title → 2-line title
optional badge on → off
order change
```

理想:

```text
HTML/PHP/fixture/data diff only
CSS diff = 0
```

ただし **CSS diff=0自体を絶対KPIにしません**。

新しいsemantic variantや新しいlayout modeなど、本当にstyle contractが変わるならCSS変更は正当です。

見るべきなのは「単純なデータ変更なのに座標パッチが必要になったか」です。

---

## 10. Ownership Map

人間が画面からownerへ辿れるよう、必要に応じて自動/半自動Ownership Mapを生成できる形を目指します。

例:

| UI owner | Markup/PHP | CSS owner | JS hook | Data/CMS | QA |
| --- | --- | --- | --- | --- | --- |
| `p-reason` | template/section | `.p-reason*` | none | repeater candidate | mutation |
| `p-voice` | template/section | `.p-voice*` | `data-js-*` | ACF candidate | interaction + mutation |

自動化する場合の入力候補:

- `l-/c-/p-` owner class
- template/file path
- `data-js-*`
- ACF field group / data source
- test/fixture names

目的はdocumentation量を増やすことではなく、**検索開始点を1つにすること**です。

---

## 11. Layout Smell Score is diagnostic only

Section単位でsmell countを可視化してもよいですが、0点を目標にしません。

候補:

```text
fixed content block-size
absolute content children
unexplained offsets
!important
duplicate owner selectors
patch breakpoints
nowrap on editable content
index-specific layout patches
```

Hero artworkのabsoluteなど正当なものはreason付きで正常です。

Scoreは「危険そうなSectionを先に読む」ためのtriage signalであり、property count optimizationには使いません。

---

## 12. Human Repair Time / Change Cost

厳密な時間KPIにはしませんが、代表的な変更で作業経路を評価します。

Good:

```text
画面上のREASONを変更したい
→ p-reason検索
→ canonical owner発見
→ 1箇所変更
```

Bad:

```text
selector検索20件
→ baseを探す
→ media overrideを探す
→ final-fixを探す
→ !important競合を調べる
```

特に次をHuman Repair Scenarioとして使えます。

- heading文言変更
- card +1
- card順番変更
- card gap変更
- image差し替え
- optional CTA削除

---

## 13. Future-change questions

FINAL前に最低限、対象に応じて次を問います。

```text
1. 文言が増えたら？
2. 件数が変わったら？
3. 画像が変わったら？
4. optional fieldが消えたら？
5. 順番が変わったら？
```

すべてへ万能対応する必要はありません。

「対応外ならその理由・contractが明確」「対応内ならmutationで壊れない」が重要です。

---

## 14. Failure capture and promotion

Stress QAで失敗したら:

```text
failure
→ reproducible fixture/seed
→ root cause
→ minimal owner repair
→ clean replay
→ Failure Pattern分類
→ Good Pattern更新
→ CANDIDATE rule
→ repeated evidenceでACTIVE昇格
```

1回の失敗から永久禁止propertyを作りません。

---

## 15. Definition of Done

Relevant scopeで:

- canonical visual PASS
- editable text 2/3-line mutation PASS
- uneven repeated content PASS
- supported cardinality mutation PASS
- reorder PASS when editable
- optional field behavior defined
- no unintended horizontal overflow
- no clipping/overlap caused by content growth
- ordinary data mutation does not require coordinate patch
- exception reason is clear
- failure fixture is reproducible when fuzzing is used

を満たすことを目標にします。
