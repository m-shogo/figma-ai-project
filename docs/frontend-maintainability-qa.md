# Frontend Maintainability QA

Status: ACTIVE / risk-based QA contract

「Figmaと一致した」だけでは検出できない、**人間が後から変更した時・実runtime stateが発生した時の壊れやすさ**を検証する。

Visual QAを置き換えない。Visual FidelityとMaintainability/Runtime/Accessibility/Performanceを組み合わせてProduction Qualityを判断する。

---

## 1. QA selection

全Sectionへ全stress testを強制しない。

Sectionごとに必要なriskを見る。

- content risk factors
- repeatability/cardinality
- interaction complexity
- runtime state model
- form/input ownership
- intentional overlay
- image/loading weight
- font/loading sensitivity
- third-party dependency
- localization/directionality
- environment/browser differences
- accessibility target
- change dependency blast radius

Content risk factorは複数同時に持てる。

```yaml
risk_factors: [EDITOR_OWNED, LOCALIZED]
```

---

## 2. Viewport contract

通常Production visual/regression targetは、**Effective Environment ContractのRequired Environment Profiles / Existing support matrix / explicit Project contract**から解決する。

Support floor未確定時は360 CSS pxをexploratory candidateとして使えるが、Company/Project evidenceなしでhard minimumへ昇格させない。

WCAG 2.2 AA Reflowは別軸で、Vertical scrolling contentに**320 CSS px equivalent**のprobeを必要時に実施する。

```text
Product support floor = resolved Effective Environment Contract
Unresolved fallback = 360px CANDIDATE
WCAG Reflow probe = 320 CSS px equivalent when required
```

Product supportとAccessibility probeを同じものとして扱わない。

---

## 3. QA tiers

### FAST PR GATE

Changed scope中心に:

- syntax/static contract
- runtime errors
- canonical visual
- horizontal overflow
- relevant interaction smoke
- obvious owner/override smell

### TARGETED MUTATION

Riskに応じて:

- text mutation
- cardinality/incomplete-row mutation
- optional field missing
- reorder
- copy/overlay collision
- loading/empty/partial/error/success
- form validation/submit/IME/autofill
- font fallback/delayed load
- third-party failure/blocked state
- localization/directionality
- keyboard/state/focus
- loading/layout shift
- interaction responsiveness
- Resize Text / Reflow / Text Spacing
- graceful degradation

### DEEP / PERIODIC

Release/benchmark/research/high-risk changeで:

- deterministic fuzz
- representative viewport/environment matrix
- pairwise/representative combinations
- cross-browser where required
- font/network/runtime state combinations where material
- full-page integration

全mutation dimensionのCartesian productを毎PR実行しない。

---

## 4. Findability

画面上のSection名/owner classからrepo内ownerへ短い検索で辿れるか。

```text
search p-reason
→ Markup/PHP owner
→ authoritative CSS owner
→ relevant JS/data/QA
```

Smell:

- `.title` `.card` `.inner`等だけへ依存
- base ownerが不明
- stylesheet末尾overrideを追わないと結果が理解できない

---

## 5. Locality / authoritative ownership

1 Component/Sectionについて:

- base
- responsive
- state
- exception

のrelationshipをownerから追えること。

同じselector文字列が1回しか出ないことは要求しない。

Media/container/supports/theme/state等の正当なcontextを区別し、Visual patchでbase ownerが分裂していないかを見る。

Static lintはDOMを完全には理解できないため、parser/AST-aware checkを優先し、warningをHuman/Agent judgementへ戻せること。

---

## 6. Content risk factors

### `STATIC_AUTHORED`

- canonical visual中心
- 明示fixed copyへ過剰mutationを強制しない

### `EDITOR_OWNED`

- 1/2/3-line heading
- body length mutation
- optional fields

### `LOCALIZED`

- text expansion/contraction
- button/nav wrapping
- forced line break assumption
- language/font fallback
- RTL/writing direction when project requires

### `EXTERNAL_DATA`

- loading/empty/partial/error
- missing/fallback
- long/unbroken values when realistic
- variable item count where relevant

### `USER_GENERATED`

- unpredictable length
- wrap/overflow
- directionality when unknown
- missing/fallback/sanitized output behavior as project requires

複数factorを組み合わせる。Taxonomy自体を過剰architectureの理由にしない。

---

## 7. Text mutation

Relevant editable textで候補:

| Mutation | Purpose |
| --- | --- |
| heading 1→2 lines | normal wrap |
| heading 1→3 lines | longer CMS/localized title |
| body 0.5x | short content |
| body 1.5x | added explanation |
| body 2x | stress |
| uneven repeated content | realistic cards |
| long Japanese | wrap behavior |
| long Latin token | URL/code/etc when realistic |
| font fallback | different metrics |

PASS:

- clipなし
- unintended overlapなし
- horizontal overflowなし
- adjacent content/controlが自然に押し出される
- content-owned blockが必要に応じて伸びる
- absolute artworkがcopyを覆わない

Logo/短いUI label等、明示single-line/truncation contractは例外化できる。

---

## 8. Runtime state mutation

Async/CMS/external-data scopeでは必要なstateだけ選ぶ。

候補:

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

PASS:

- emptyとerrorを混同しない
- loadingが無限空白にならない
- state changeでlayoutが不必要に大きく跳ねない
- retry/disabled/partial ownershipが明確
- external failureがunrelated primary contentを壊さない

全Sectionへ全stateを強制しない。

---

## 9. Form / input QA

Relevant formで:

- label / fieldset / legend / accessible name
- required/optional
- help/error association
- autocomplete
- native type
- inputmode / enterkeyhint when useful
- keyboard
- IME composition
- autofill/password manager
- submit lifecycle
- server/network error
- success state

を見る。

`inputmode`をvalidationとして扱わない。

Placeholderだけをlabelにしない。

Errorを色だけで伝えない。

Japanese IME中のEnter/keydownを確定submitと誤判定しない。

---

## 10. Accessibility resizing / spacing

Company Policy/WCAG targetに応じて別々に確認する。

### Resize Text

Target要件に応じtextを200%まで拡大してcontent/functionalityを失わない。

### Reflow

Vertical scrolling contentでは320 CSS px相当で、原則2方向scrollを要求せずcontent/functionalityを失わない。

これは通常Product support floorとは別のaccessibility probe。

Data table、map、diagram等、2D layout自体に意味がある例外がある。

### Text Spacing

Applicable language/scriptでuserがline-height/letter/word/paragraph spacingを上書きした場合にcontent/functionalityが失われない。

### Fluid typography

`vw`だけ等、viewport変化でuser enlargementを実質相殺していないか確認する。

**200% browser zoomだけで全部PASS扱いしない。**

---

## 11. Focus / overlay QA

Relevant WCAG target/interactionsで:

- keyboard focusがsticky header/footer/fixed CTA等に完全に隠れない
- focus indicatorが`overflow:hidden`等で不用意に切れない
- modal/menu/dialogのfocus behaviorがproject contract通り
- visual overlayがDOM focus orderを不自然にしない

を確認する。

---

## 12. Source order / visual order

Grid/Flex `order`、arbitrary placement、CSS visual reorderingを使う場合:

- reading order
- keyboard order
- screen reader semantics
- visual sequence

が意味的に矛盾しないか確認する。

Figma visual順を再現するためだけにDOM source orderを壊さない。

---

## 13. Repeater/cardinality mutation

詳細は `docs/frontend-repeatable-content.md`。

Targeted候補:

```text
expected - 1
expected
expected + 1
zero / one when contract allows
normal max
incomplete last row
optional field missing
reorder when editable
```

PASS:

- ordinary count changeだけでcoordinate CSS patch不要
- incomplete rowがcontract通り
- semantic featured variantがaccidental indexで壊れない
- slider control/countがactual DOM/dataへ追従

---

## 14. Media / loading resilience

Relevant images/mediaで:

- intrinsic dimensions
- source ratio change
- missing optional image
- PC/SP art direction difference
- responsive image selection
- slow image load reservation

を見る。

PASS:

- unintended CLSを避ける
- must-not-crop assetが切れない
- intentional cropがcritical subjectを失わない
- missing mediaがlayoutを壊さない

---

## 15. Font loading / metrics QA

詳細は `docs/frontend-font-loading-policy.md`。

Font-sensitive scopeでは必要に応じて:

- fallback only
- delayed webfont
- final font loaded
- missing weight
- mixed Latin/CJK
- localized glyph coverage

を見る。

PASS:

- fallback中もcontentを失わない
- severe wrap/section jumpを避ける
- final fontでcanonical fidelityへ戻る
- metric overrideを使う場合は測定理由/browser supportがある

Font declaration/metrics変更はshared dependencyとしてregression scopeを広げる。

---

## 16. Third-party / embed QA

Relevant integrationで:

- consent state
- blocked/cookie-disabled state
- external failure
- reserved size/aspect ratio
- lazy-load eligibility
- iframe title/keyboard
- sandbox/allow/referrer/CSP/SRI等のrisk review
- privacy/data exposure

を見る。

Third-party failureでprimary navigation/contentまで失わない。

---

## 17. Localization / directionality QA

LOCALIZED/RTL_REQUIRED等のscopeで:

- text expansion/contraction
- locale punctuation
- font fallback/glyph coverage
- `lang`
- `dir=ltr/rtl/auto`
- mixed direction content
- logical/physical layout semantics

を見る。

RTLを全案件COREにしない。

User/external dataで方向不明の場合は`dir="auto"`候補を確認する。

---

## 18. Performance QA

### LCP / loading

Image-heavy/Hero scopeで:

- likely Hero/LCP resourceが十分早くdiscoverableか
- LCP candidateを機械的にlazy-loadしていないか
- high-priority resourceを乱用していないか
- oversized sourceを配送していないか

### CLS / visual stability

- intrinsic `width/height` / aspect reservation
- font/media loading
- late content injection
- third-party/embed loading

を見る。

### INP / interaction responsiveness

Interaction-heavy scopeで:

- event handlerが長時間main threadを占有していないか
- unnecessary JS work
- large rendering update
- synchronous layout thrashing
- repeated expensive state update

をRelevant QAへ入れる。

Lighthouseだけでfield INPを直接再現できない場合があるため、available tooling/field data/local interaction profilingをProjectに合わせて使う。

---

## 19. Responsive mutation

通常candidateはEffective Environment ContractのRequired Environmentから代表点を選ぶ。

候補:

- narrowest required/supported width
- SP canonical
- breakpoint before/at/after
- intermediate width
- PC canonical
- wide supported width

Support floor未確定時は360pxをexploratory candidateにできるが、それを通常support contractへ自動昇格させない。

WCAG Reflow probeは別途Section 10で扱う。

目的はviewport数を増やすことではなく、layout transitionの断崖とoverflowを検出すること。

---

## 20. Browser/environment resilience

Relevant profileだけ:

- hover/pointer
- touch
- safe area
- dynamic viewport
- virtual keyboard
- reduced motion
- forced colors/contrast
- browser-specific proven fixes

を既存Environment Contractから選ぶ。

---

## 21. JS state integrity

Interactive componentでは:

- semantic control
- keyboard
- focus
- primary state source
- ARIA/state synchronization
- disabled/expanded/selected
- reduced motion when animated

を確認する。

`aria-expanded`、`data-state`、`is-open`を別々のtruthとして更新して不整合にしない。

---

## 22. Graceful degradation QA

極端なcopy/state/zoom/locale等でFigma geometryを完全維持できない場合、default priority:

```text
P0 information/function/accessibility
→ P1 brand/hierarchy
→ P2 decorative geometry
→ P3 non-essential motion
```

を守る。

Smell:

- unreadably small font
- blanket `transform: scale()`
- hidden information
- accessibilityを犠牲にしたnowrap/clip

Project-defined priorityがある場合はそちらを使う。

---

## 23. CSS smell audit

単独propertyは即FAILにしない。

WARN candidate:

- absolute/fixed positioning
- fixed width/height/min-*
- negative margin
- transform placement
- `!important`
- nowrap
- `overflow:hidden`
- deep nesting
- ID styling
- arbitrary breakpoint
- high z-index
- current-index-specific layout patch

Strong combination例:

```text
fixed content block-size
+ overflow hidden
+ many absolute content children
+ repeated x/y offsets
+ override accumulation
```

Figma coordinate recreationを疑う。

---

## 24. Repair review

Visual差分修正後:

1. canonical ownerを特定したか
2. root constraintを直したか
3. file末尾patchで隠していないか
4. 同一ownerへpatchが繰り返されるならlayout/design reviewしたか

固定「2回でFAIL」は使わない。Repeated patchはreview trigger。

---

## 25. Human repair scenarios

### Heading edit

Long copyへ変更 → CSS変更不要またはowner内だけで成立。

### Add/reorder card

Supported range内ならdata/markup変更中心でlayoutが再計算し、semantic variant/stateが壊れない。

### Hero image replacement

Art direction ownerが明確で、copy flowを壊さずposition/cropを調整可能。

### Optional CTA removal

Empty control/spacing artifactが残らない。

### Font replacement

Shared font ownerからfallback/metrics/known dependentsへ辿れる。

### Third-party outage

Embedだけfallbackし、page primary contentは維持される。

---

## 26. Cleanup QA

FINAL前にactive scopeで:

- temporary
- final-fix
- visual-fix
- debug
- stale selector/class
- unexplained `!important`
- owner duplication
- production behaviorを変える未解決TODO

を確認する。

---

## 27. Suggested scorecard

```text
Visual Fidelity:          PASS / WARN / FAIL
Findability:              PASS / WARN / FAIL
Authoritative Ownership:  PASS / WARN / FAIL
Content Mutation:         PASS / WARN / FAIL / N/A
Runtime State:            PASS / WARN / FAIL / N/A
Form/Input:               PASS / WARN / FAIL / N/A
Font Loading:             PASS / WARN / FAIL / N/A
Third-party/Localization: PASS / WARN / FAIL / N/A
Responsive Resilience:    PASS / WARN / FAIL
Interaction/A11y:         PASS / WARN / FAIL / N/A
Performance/Loading/INP:  PASS / WARN / FAIL / N/A
Override Accumulation:    PASS / FAIL
```

Visual FidelityがPASSでも重大なMaintainability/Runtime/A11y/Performance failureがあればProduction FINALではない。

---

## 28. Knowledge feedback

```text
failure
→ reproducible evidence
→ root cause
→ minimal owner repair
→ clean replay
→ pattern classification
→ CANDIDATE
→ repeated evidence
→ ACTIVE
```

Runtime/form/font/vendor/locale条件もevidenceへ残す。

一度の案件から過剰なCORE ruleを作らない。
