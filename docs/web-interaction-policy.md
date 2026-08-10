# Web Interaction Implementation Policy

Company Policy / existing projectが優先。以下は**未指定時のcurrent production candidate**であり永久ルールではない。

## Decision order

```text
Company approved implementation
→ Existing project/library
→ Native platform primitive
→ Approved specialist library
→ Custom implementation only when justified
```

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

これは「ページ全体へ慣性scroll engineを入れる」こととは別。

Lenis等のscroll-jacking/inertial scrollingは標準装備にしない。Reference/Company Policyで必要な時だけ別評価する。

---

## Reset / base CSS

Universal packageを無条件導入しない。

Priority:

1. existing project reset/base
2. company house reset
3. company browser matrixに合うmodern normalize/reset
4. minimal local reset

最低候補:

- box-sizing policy
- body margin
- media max-inline-size policy where appropriate
- form typography inheritance where company standard
- button/input baseline
- reduced-motion handling
- visually-hidden utility if required

Reset自体がvisual driftを生むため、Reference実装開始後に勝手に差し替えない。

---

## Hover

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

Hover styleは原則`@media (hover: hover)`等でhover-capable primary inputへ限定する。

Interactive elementにはkeyboard focus equivalentを持たせる。Hoverだけに重要情報を置かない。

Touchではhoverを必須状態としない。

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

### Complex carousel

既存/approved libraryを優先する。

Current candidate example: Swiper when company allows it.

必要moduleだけimportする。

Custom implementationをdefaultにしない。

### Autoplay

Default `false`。

Reference/requirementで必要な場合:

- stop/start control
- focus enters → pause
- hover → pause
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

### Performance

- unnecessary layout-thrashingを避ける
- transform/opacity等、自然に効率的な表現を優先候補にする
- `will-change`を常時大量付与しない
- 実測無しのpremature optimizationをしない

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
