# Image / Gradient / Visual Tolerance Policy

Company Policy / existing projectが最優先。

---

# Images

## Source priority

```text
Exact source asset
→ existing project asset/CDN/CMS attachment
→ Figma export/download source
→ approved transformed derivative
→ screenshot extraction only as last resort
```

Exact sourceが取れるのにAI再生成へ置換しない。

## Responsive images

HTML/CMS stackに応じて:

- intrinsic `width` / `height`
- `srcset` / `sizes`
- `<picture>` for art direction
- `object-fit`
- `object-position`
- loading/fetch priority

を設計する。

PC/SPで同じ画像のresolutionだけ変わるのか、crop/art direction自体が変わるのかを分ける。

### Resolution switching

同じcomposition → `srcset`/`sizes` candidate。

### Art direction

PC/SPでcrop/focal/compositionが変わる → `<picture>`またはCMS image-size/art-direction strategy candidate。

## Hero/LCP image

Below-foldと同じlazy policyを機械的に適用しない。

Priority imageはCompany performance policyと実測に従う。

## WordPress

Attachment IDを使える場合はWordPress image helperを優先し、responsive image metadataを保持する。

---

# Gradients

Gradientはスクリーンショットから目測する前に**structured Figma paint**を読む。

Record:

- gradient type
- handle/transform geometry
- ordered stops
- stop position
- color
- alpha
- layer opacity
- blend mode
- bound variable/style
- mask/background relationship

## Why this matters

同じ2色でも:

- stop位置
- transparency
- gradient angle/center/radius
- blend mode
- parent background

で見た目が大きく変わる。

「赤→青」の2値だけをpromptへ渡さない。

## CSS translation

Structured paintをCSS gradientへtranslateしたあと、exact browser captureで比較する。

Figmaのhandle geometryとCSS gradient semanticsが完全に同じとは仮定しない。

CSS color interpolation space等の新機能はCompany browser matrixを先に確認する。

古いbrowser対応が必要ならcurrent visualに近いfallbackを別に検討する。

---

# Visual tolerance

## Pixel perfect means CSS/reference fidelity, not physical pixel identity

CSS pxとdevice pixelは同じではなく、DPR/zoom/font rasterization/browser/OSでactual rasterは変わる。

そのため「画像diffで1 physical pixelでも違えばFAIL」のようなglobal ruleにはしない。

## Canonical capture environment

Company Policyで最低限:

- browser/version
- OS
- viewport CSS px
- DPR
- zoom
- font availability
- animation state
- data fixture

を固定する。

## Current tolerance candidate

### Hard geometry

Examples:

- section boundary
- container edge
- image box
- repeated grid alignment
- major spacing

Target: exact〜1 CSS px程度。

Isolated 1–2 CSS px差はroot causeとvisual impactを見て判定できる。

### Repeated drift

1pxが10個連続して10pxずれる等はFAIL。

Repeated 1–2px errorはsystemic spacing/font/box-model problemのsignalとして扱う。

### Typography

Raw pixel anti-alias diffではなく:

- font family/weight
- line break
- line count
- line-height
- text block width/height
- baseline/hierarchy

を重視する。

### Gradient / shadow / blur / raster image

Exact raw-pixel equalityだけで判定しない。

- structured values
- geometry
- perceptual diff
- local crop comparison

を併用する。

### Anti-aliasing

OS/browser rasterization由来でgeometry/typography intentに影響しないisolated diffは許容候補。

---

# Error budget is category-aware

Do not use:

```text
ALL pixels <= 2px = PASS
```

Use:

```text
Geometry
Typography
Color/Gradient
Raster/Assets
Effects
Interaction state
```

ごとに判定する。

重大な1px差と無害な2px差は存在する。

例:

- 1px border位置が全sectionでズレる → structural issue
- shadow blur edgeの1px raster差 → likely acceptable

---

# Repair rule

1–2px差を見つけた時に、その場でmagic numberを足して終わらせない。

First inspect:

1. font mismatch
2. box-sizing/reset
3. container width/gutter
4. line-height
5. image intrinsic ratio
6. Figma sizing semantics
7. token mismatch
8. browser rendering difference

Root causeがsharedならFoundation/Contractへ戻す。
