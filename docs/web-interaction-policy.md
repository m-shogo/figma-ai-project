# Web Interaction Implementation Policy

Company Policy / existing projectが優先。以下は**未指定時のcurrent production candidate**であり永久ルールではない。

Canonical environment model: `docs/device-environment-policy.md`

## Decision order

```text
Company approved implementation + Required Environment Profiles
→ Existing project/library
→ Native platform primitive
→ Approved specialist library
→ Custom implementation only when justified
```

Runtime判定は原則:

```text
capability / feature detection
→ Required Environment QA
→ proven browser-specific fix
```

UA sniffingを一般的なdevice classificationへ使わない。

---

## Smooth anchor scrolling

通常のanchor navigationではnative CSSを第一候補にする。

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

Fixed/sticky headerがある場合はtarget側の`scroll-margin-top`またはscroll containerの`scroll-padding-top`で隠れを防ぐ。

### Important distinction

Native smooth scrollのduration/easingはuser agent側が決める。

したがって:

```text
ordinary anchor navigation
!=
Figma-specified cinematic/controlled scroll choreography
```

後者をnative smooth scrollで「再現済み」と扱わない。

Device/Environment Profileごとに:

- `INHERIT`
- `ENABLED`
- `DISABLED`
- `CUSTOM`

を持てる。

Unsupported targetのためだけにJS polyfill/libraryを自動追加しない。Company Policyが必要とした時だけ選定する。

Lenis等のinertial/full-page scroll behaviorは標準装備にしない。Reference/Company Policyで必要な時だけ別評価する。

---

## Reset / base / environment CSS

Universal packageを無条件導入しない。

Priority:

1. existing project reset/base/environment
2. company house foundation
3. company browser matrixに合うnormalize/reset
4. minimal local foundation

Logical layers:

```text
reset
→ base
→ environment adaptation
→ tokens/shared primitives
```

### Reset candidate responsibility

- box-sizing policy
- body margin
- form baseline
- project-approved normalization

### Base candidate responsibility

- body/typography baseline
- media baseline
- form font inheritance where required
- semantic utility baseline

### Environment adaptation responsibility

- hover/pointer
- reduced motion
- safe area
- svh/lvh/dvh
- virtual keyboard
- touch-action
- forced colors/contrast
- color gamut when material
- proven browser-specific fixes

**Deviceごとにreset全文を複製することをdefaultにしない。**

Reset/Foundation自体がvisual driftを生むため、Reference実装開始後にworkerが勝手に差し替えない。

---

## Feature detection

CSS feature supportは`@supports`等を優先候補にする。

ただしfeature queryは:

- browserがdeclarationをparseできるか

を主に判定するもので、partial implementationやbrowser bugを完全には検出できない。

したがってRequired Environment QAを省略しない。

---

## Hover / pointer

Hoverは理解可能なinteraction evidenceとして扱う。

Strong evidence:

- Figma prototype interaction/reaction
- interactive component/variant
- annotation
- explicit company/design instruction
- accessible comment mapped to the node

Weak evidence:

- visual convention only
- agent inference

### Primary input

```css
@media (hover: hover) and (pointer: fine) {
  /* primary precise pointer */
}
```

### Any available input

Secondary mouse/trackpad等を考慮する必要がある場合だけ`any-hover`/`any-pointer`を使う。

例:

- touch-first tablet + trackpad

を単純なSP widthでtouch-onlyと決めない。

Interactive elementにはkeyboard focus equivalentを持たせる。Hoverだけに重要情報を置かない。

Touchではhoverを必須状態としない。

### Geometry

hover / focus / active で初めて `border-width` を足さない。rest から同じ太さの border（`transparent` または塗りと同色）を置き、状態では色と塗りを変える。位置は `transform`。transition が無ければ Existing token、無ければ `0.3s`（pseudo 含む）。

Figmaの「hoverで枠が付く」は visual result であり、CSS で hover 時に border を新設する指示ではない。正本は `docs/frontend-quick-contract.md` 節4。

ネガポジ反転は塗りと文字の反転。rest の枠は残す。テキストリンクの当たりは、Figma が全幅ヒットを示さない限り文字幅。disabled / inert に enabled の hover 箱を出さない。`clip-path` 差し替えで八角 stroke を消さない。

---

## Touch gestures

Browser native pan/pinchをdefaultで守る。

`touch-action: none`はcustom gesture ownershipが明確なcomponentに限定する。

理由:

- browser scrollingを奪う可能性
- pinch zoomを阻害する可能性
- accessibilityへ影響し得る

Slider/dragはreal touch environmentで:

- horizontal gesture
- vertical page scroll
- nested scroll
- pointer cancellation

をQAする。

---

## Mobile viewport / keyboard

Fixed CTA / modal / full-height hero / formsではlayout viewportとvisual viewportの差を考慮する。

Required mobile environmentで:

- browser toolbar expansion/collapse
- `svh/lvh/dvh`
- safe area
- software keyboard
- orientation

を必要範囲でQAする。

`100vh`だけをfullscreen solutionとして固定しない。

Viewport meta `interactive-widget`を変更する場合はCompany Policyで明示する。

---

## Scroll lock / overscroll

Hamburger overlay/modal等のbody scroll lockはenvironment-sensitive。

Priority:

1. existing proven project strategy
2. target browser/OS QA
3. preserve focus/keyboard/viewport behavior
4. specialist workaround only when evidence exists

`overscroll-behavior`単体を万能なscroll-lock solutionとして扱わない。

SupportはRequired Environment Matrixで確認する。

---

## Hamburger navigation

Typical website navigationのdefaultはDisclosure Navigation。

- semantic `<button>`
- `aria-expanded`
- optional `aria-controls`
- semantic `<nav>` + links/list
- Escape close where open overlay/drawer behavior exists
- close後はtriggerへfocus restore
- open時のbody scroll policyを固定

ARIA `menu` / `menubar` roleは通常のsite navigationへ安易に使わない。

Full-screen modal drawerで背景を完全に操作不可にする必要がある場合はCompany browser matrixを確認したうえでnative `<dialog>`/`inert`等を候補にする。

Mobile environmentではsoftware keyboard/visual viewport/scroll lockも併せてQAする。

Figma の open-state が暗幕 + パネルなら、詳細判断は `docs/frontend-quick-contract.md` 節4。要約:

- 暗幕は viewport 全体。パネル外形に合わせて欠けるな
- ヘッダークロームは消さず覆う。閉じるコントロールの位置は Figma
- sticky header を open で `relative` にするな
- 閉じは開いた形のまま transform。open class は transition 後に外す
- 暗幕とパネルの duration を揃える（Existing、無ければ `0.3s`）

---

## Carousel / slider

### Simple horizontal content strip

Candidate:

```text
native overflow-x
+ CSS Scroll Snap
+ semantic content
+ optional previous/next buttons
```

Use when:

- no infinite loop
- no sophisticated autoplay
- no thumbs/controller synchronization
- no complex virtualized behavior

Touch environmentではgesture conflictを必ずQAする。

### Complex carousel

既存/approved libraryを優先する。

Current candidate example: Swiper when company allows it and its supported-browser baseline satisfies Company Policy.

必要moduleだけimportする。

Custom implementationをdefaultにしない。

### Autoplay

Default `false`。

Reference/requirementで必要な場合:

- stop/start control
- focus enters → pause
- hover-capable environment → pause on hover
- reduced motion → initial autoplay disabled
- keyboard operation
- accessible current slide/controls

をbaselineにする。

---

## Animation

### Level 1 — simple state animation

CSS transition/keyframes。

Examples:

- opacity
- transform
- simple hover/focus
- simple accordion/reveal

### Level 2 — ordinary application motion

Framework/projectに既存motion layerがあれば再利用。

React projectで未指定の場合、Motionはcurrent candidateとして比較対象にできる。

### Level 3 — complex scroll choreography

Pin/scrub/multi-element timeline/scrollytelling等は既存採用があるか、GSAP/ScrollTrigger等のspecialist libraryを明示的に選択する。

「全部GSAP」「全部Motion」にはしない。

### Reduced motion

Non-essential animationは`prefers-reduced-motion`を必ず設計に含める。

Device Profileではなくuser-preference stateとして扱う。

### Performance

- unnecessary layout-thrashingを避ける
- transform/opacity等、自然に効率的な表現を優先候補にする
- `will-change`を常時大量付与しない
- 実測無しのpremature optimizationをしない

---

## Forms / platform-native appearance

Form controlsはOS/browser差がある。

`appearance: none`をresetとして全controlへ一律適用しない。

Custom designが必要なcomponentだけ明示的にstylingし、Required Environmentで:

- keyboard
- focus
- native picker/input behavior
- zoom/text sizing

を確認する。

`text-size-adjust`もmobile-specific behaviorのため、Company/Existing resetまたはEnvironment Profileで扱う。

---

## Accessibility preference states

Deviceとは別軸で:

- reduced motion
- higher/lower contrast
- forced colors
- color scheme when relevant

を扱う。

同一device/browser profileでもpreference stateを変えたQAを持てる。

---

## Interaction evidence record

Section Profileへ最低限:

```yaml
interactions:
  - id: nav-open
    source: FIGMA_PROTOTYPE
    trigger: CLICK
    target_state: OPEN
    confidence: HIGH
    evidence: []
```

を将来追加できる構造にする。

Unknown interactionは見た目から勝手に補完しない。
