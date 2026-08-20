# Frontend Production Runtime Contract

Status: ACTIVE production contract

Figmaのcanonical stateを忠実に実装するだけでなく、**実際のWeb運用で発生する入力・非同期状態・外部依存・多言語・劣化条件まで壊れにくくする**ための共通contract。

Authorityは `docs/frontend-authority-model.md`。Company / Existing / explicit Project contractが常に優先する。

---

## 1. Product viewport contract

通常Production QAのproduct support floorは、固定共通値ではなく次から解決する。

```text
Company Policy Required Environment Profiles
+ Existing product support matrix
+ explicit Project contract
→ Effective Environment Contract
→ resolved product viewport floor
```

Support floorがまだ未確定なresearch/early intakeでは、360 CSS pxを**CANDIDATE exploratory starting point**として使うことはできる。ただしその数値をCompany/Project evidenceなしでhard contractへ昇格させない。

WCAG Reflowの**320 CSS px equivalent**はProduct support floorとは別のaccessibility probeとして扱う。

```text
Product support floor: resolve from Effective Environment Contract
Unresolved exploratory fallback: 360px candidate
Accessibility Reflow probe: 320 CSS px equivalent when required
```

WCAG probeを理由に通常Figma design targetを発明しない一方、実際のRequired Environmentが320pxやそれ以下なら、その環境は通常Production targetとして普通に検証する。

---

## 2. Runtime state model

Figmaにcanonical/default stateしか無くても、実装sourceが非同期・form・CMS・external dataなら必要なruntime stateを確認する。

候補:

- `DEFAULT`
- `LOADING`
- `EMPTY`
- `PARTIAL`
- `ERROR`
- `SUCCESS`
- `DISABLED`
- `OFFLINE_OR_NETWORK_FAILURE`

全stateを全Sectionへ強制しない。

### Async state rule

`EXTERNAL_DATA` / async UIでは最低限:

1. 初期表示時にlayoutが予測不能に跳ねない
2. loadingが無限の空白にならない
3. emptyをerrorとして誤表示しない
4. partial successが可能なら成功データを不必要に捨てない
5. retry可能なfailureではretry ownershipを明確にする
6. state changeでfocus/announcementが必要なUIはA11y contractへ繋ぐ

Skeletonは必須ではない。静的placeholder、reserved size、progress indicator等から実要件で選ぶ。

### CMS state rule

CMSでは:

- missing optional field
- zero items
- incomplete data
- unpublished/missing media

を「JS error」ではなくcontent contractとして扱う。

---

## 3. Form / Input Contract

Formは見た目だけで完成扱いしない。

### Semantic ownership

該当時確認:

- correct `form`, `label`, `fieldset`, `legend`
- accessible name
- required / optional distinction
- help text association
- error association
- native input type
- submit ownership

Placeholderだけをlabel代わりにしない。

### Input purpose / mobile keyboard

User dataを収集するfieldでは、Company/Project contractとdata purposeに応じて:

- `autocomplete`
- `inputmode`
- `enterkeyhint`
- appropriate `type`

を検討する。

`autocomplete="off"`を一括defaultにしない。

`inputmode`はvalidationではない。Validation contractとは分離する。

### IME / composition

日本語・中国語・韓国語等のIME入力が関係するinteractionでは、`input` / `keydown`だけで確定入力を誤判定しない。

Search-as-you-type、shortcut、Enter submit、validation等でcomposition stateを考慮する。

### Autofill / password manager

Autofill後も:

- labelが読める
- text color / background contrastが壊れない
- floating labelが重ならない
- value presenceのstateとDOM stateがズレない

ことをRelevant environmentで確認する。

### Submit lifecycle

該当時:

```text
idle
→ validating
→ submitting
→ success | error
```

を1つのprimary state sourceで管理する。

二重submit防止のためにbuttonをdisabledにする場合も、loading/status communicationとkeyboard/focusを考える。

### Error / success

Errorは色だけで伝えない。

Server error / validation error / network errorを同一messageへ潰す必要はない。

成功後に画面遷移しない場合、focus/announcement ownershipを明確にする。

---

## 4. Third-party / Embed Boundary

Third-party code/contentはfirst-party componentと同じ信頼境界として扱わない。

### Classification

該当integrationを必要に応じて分類する:

- `FIRST_PARTY`
- `THIRD_PARTY_TRUSTED`
- `THIRD_PARTY_SANDBOXED`
- `CONSENT_GATED`
- `LAZY_EMBED`
- `CRITICAL_EXTERNAL`

### Review dimensions

- data/privacy exposure
- consent requirement
- CSP / SRI feasibility
- iframe `sandbox` / `allow` ownership
- `referrerpolicy`
- loading priority
- fixed intrinsic/reserved size
- CLS impact
- external failure/fallback
- vendor update/change risk
- accessibility/title/keyboard behavior

Third-party scriptを「package dependencyと同じだから安全」と見なさない。

### Embed layout

YouTube/Map/SNS等のembedは:

- aspect ratio / reserved space
- lazy-loading eligibility
- consent placeholder
- blocked/cookie-disabled fallback
- mobile overflow

を確認する。

### Failure mode

External serviceが失敗しても、ページ全体のnavigation/primary contentまで破綻させない。

---

## 5. Internationalization / Directionality

`LOCALIZED`は単に文字数増加だけを意味しない。

該当時:

- language/script
- punctuation
- line breaking
- font fallback
- text expansion/contraction
- LTR / RTL
- mixed-direction content
- locale-specific date/number formatting

を考慮する。

### `lang`

Document/content languageをsemantic HTMLとして持つ。

### `dir`

Directionalityはpresentationではなくcontent semanticsとして扱う。

- known LTR: `dir="ltr"`
- known RTL: `dir="rtl"`
- user/external dataでdirection unknown: `dir="auto"` candidate

RTL対応案件で`left/right`を機械的にlogical propertyへ全面変換することを目的にしない。

Use logical properties when:

- bidirectional layoutがreal requirement
- Existing/Company conventionが許す
- semantic start/end relationshipがある

Art-directed physical left/rightはphysical propertyが正当な場合がある。

---

## 6. Graceful Degradation Contract

極端条件ですべてのFigma geometryを同時に維持できない場合、AIが勝手に文字や機能を犠牲にしない。

Default priority:

### P0 — must preserve

- information access
- primary functionality
- semantic/source order
- keyboard/focus access
- readable text
- no unintended clipping/overflow

### P1 — preserve strongly

- brand identity
- primary hierarchy
- important content relationship
- critical imagery meaning

### P2 — may adapt when necessary

- exact decorative position
- non-critical crop
- ornamental spacing
- authored phrase-wrap position when not semantic

### P3 — first candidate to reduce/remove

- non-essential animation
- decorative motion
- non-critical effects

Project/Owner can override these priorities.

Do not solve impossible fit by default with:

- unreadably small font
- blanket `transform: scale()`
- hidden information
- inaccessible horizontal clipping

Degradation choice should be explicit and replayable.

---

## 7. Dependency-driven QA selection

QA scopeはdiff line countではなくdependencyから決める。

Input signals:

- changed section
- shared component dependencies
- token dependencies
- font dependencies
- foundation/reset dependency
- runtime state type
- content risk factors
- third-party dependency
- implementation family

Candidate selector:

```text
changed owner
+ dependency graph
+ section risk
+ runtime contract
→ required QA slices
```

Examples:

```text
Section local copy/layout
→ section + relevant boundary + selected mutation

Shared Button
→ known Button dependents + interaction states

Shared font/fallback metrics
→ typography-sensitive sections + representative full page

Reset/base
→ representative semantic content + forms + embeds + full page

Third-party embed wrapper
→ embed states + relevant page integration
```

Automatic selectorはCANDIDATE。最初からhard universal CI gateにしない。

---

## 8. SEO / Metadata ownership

SEOを全frontend section workerへ強制しない。

SEO_REQUIRED案件ではpage/integration ownerが必要に応じて:

- document title
- meta description
- canonical
- robots policy
- Open Graph / social metadata
- structured data
- heading outline
- crawlable primary links/content

を管理する。

FigmaからSEO metadataを発明しない。

CMS/SEO pluginが正本なら重複生成しない。

---

## 9. Native Web API Adoption Radar

新しいWeb APIを「新しいから採用」しない。

Candidate examples:

- Popover API
- `<dialog>` / `inert`
- View Transition API
- Scroll-driven Animations
- CSS Anchor Positioning
- Container Queries

Adoption order:

```text
Existing proven solution
→ actual product need / Figma evidence
→ Company browser matrix
→ native platform candidate
→ accessibility / reduced-motion / input QA
→ specialist library only when native does not satisfy contract
```

Native APIでcustom JS/libraryを安全に減らせるかを、major browser/tool update時に再評価する。

Feature availabilityだけで既存implementationをmigrationしない。

---

## 10. Optional project capabilities

次はCORE必須ではない。Project/Companyが必要な時だけactivateする。

- `PRINT_REQUIRED`
- `PDF_OUTPUT_REQUIRED`
- `OFFLINE_REQUIRED`
- `PWA_REQUIRED`
- `REDUCED_DATA_REQUIRED`
- `RTL_REQUIRED`
- `SEO_REQUIRED`
- `SHARE_METADATA_REQUIRED`
- `EMBED_SECURITY_REVIEW_REQUIRED`

### Print / PDF

Required時だけ`@media print` / `@page` / print interaction fallbackを設計する。

### Offline / PWA

Service Workerを「production qualityだから」と自動導入しない。

### Reduced data

Network/data reductionはbrowser capabilityとProject needを確認し、unsupported signalへ依存したhard behaviorを作らない。

---

## 11. Learning loop

Runtime failureもPattern/Playbookへ戻す。

```text
runtime failure
→ environment/state reproduction
→ root cause
→ minimal owner repair
→ replay
→ pattern / candidate rule
→ cross-run validation
→ applicable knowledge selection
```

Record useful dimensions:

- viewport/environment
- runtime state
- locale/direction
- form/input type
- external vendor
- network condition
- font state
- agent/tooling version

一度のvendor/browser issueから永久banを作らない。

---

## 12. Definition of Done

該当scopeでのみ確認する:

- Effective Environment ContractでRequiredなproduct viewport/layoutが成立
- support floor未確定時の360px候補はexploratory evidenceとして扱い、hard contract化しない
- WCAG Reflow required時は320 CSS px equivalentを別試験
- form semantics/state/input behavior
- loading/empty/error/success behavior
- third-party fallback/security boundary
- localization/RTL behavior
- font loading/fallback stability
- degradation priorityを守る
- dependency blast radiusに応じたregression
- optional project capabilities when activated

**全部を全Sectionへ強制することではなく、real runtime ownershipを見落とさないことが目的。**
