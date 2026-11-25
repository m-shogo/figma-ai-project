# Device / Browser Environment Policy

## Purpose

`PC / SP`だけで実装分岐を決めない。

Production implementationは、Company Policyで対象環境を明示したうえで:

```text
Company target environment
+ browser / OS / WebView
+ viewport / DPR
+ input capability
+ user preference
+ output capability
```

を分離して扱う。

重要: **device profileはQA/compatibility contractであり、runtimeで端末名を大量UA sniffingするための表ではない。**

Runtimeは原則:

```text
capability / feature detection
→ target-browser compatible CSS/API
→ proven browser-specific bug fix only
```

の順。

---

# Why width-only PC/SP is insufficient

同じviewport widthでもinput環境は異なる。

例:

- iPad touch only
- iPad + trackpad/mouse
- Surface touch + mouse
- desktop narrow window
- mobile landscape
- foldable / WebView

したがって:

- `hover` / `pointer` = primary input
- `any-hover` / `any-pointer` = secondary inputを含むavailable input

を必要に応じて分ける。

`@media (min-width: ...)`だけでhover有無を推論しない。

---

# Environment Profile

Company Policyの`browser_support.environment_profiles`が正本。

各profileは最低限:

- REQUIRED / SUPPORTED / BEST_EFFORT
- device class
- OS/version
- browser/version/engine
- WebViewか
- canonical CSS viewport/DPR
- primary/any hover + pointer
- touch
- safe-area
- dynamic viewport
- virtual keyboard
- color gamut / forced colors when relevant
- real-device/emulation QA policy
- environment-specific implementation overrides

を持てる。

Profile例:

```text
mac-safari-mouse
iphone-safari-touch
ipad-safari-hybrid
android-chrome-touch
android-webview
windows-edge-mouse
windows-edge-forced-colors
```

会社に必要なものだけ定義する。機種カタログを作ることが目的ではない。

---

# CSS Foundation layers

Deviceごとにreset.css全体を複製するのをdefaultにしない。

Logical foundation:

```text
reset
→ base
→ environment adaptation
→ tokens / shared primitives
```

実ファイル構成は既存repo/Company Policyに従う。

## Reset

Cross-browser baseline差を整える。

候補:

- box-sizing
- body margin
- form baseline
- inherited font where company policy requires
- sensible element defaults

Existing reset/company resetが最優先。

`normalize.css` / `modern-normalize`等はbrowser matrix確認後の候補であり永久defaultではない。

## Base

Project-wide semantics/typography/media primitives。

## Environment adaptation

端末・入力・platform差はこちらへ寄せる。

Examples:

- hover/pointer media queries
- reduced motion
- safe area
- dynamic viewport units
- virtual keyboard handling
- touch gesture policy
- forced colors / contrast
- color gamut where material
- proven browser-specific compatibility rule

---

# Mobile viewport policy

## `vh` is not enough for every case

Mobile browser chromeやsoftware keyboardがあるため、height-sensitive UIでは:

- `svh`
- `lvh`
- `dvh`

をtarget matrixに応じて使う。

Company Policyでviewport unit policyを固定する。

Typical candidate:

```text
content that must never hide behind browser UI → svh candidate
fullscreen/current visible viewport → dvh candidate
maximum expanded viewport reference → lvh candidate
```

既存projectが別fallbackを持つ場合はそれを優先。

## Safe area

`viewport-fit=cover`やedge-to-edge layoutを使う場合、notch/rounded displayを考慮する。

Use environment variables such as:

```css
padding-top: env(safe-area-inset-top, 0px);
padding-right: env(safe-area-inset-right, 0px);
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-left: env(safe-area-inset-left, 0px);
```

Figmaの固定paddingをそのままsafe-area込みの最終paddingだと仮定しない。

## Virtual keyboard

Form/modal/fixed CTA等でsoftware keyboardが重要な場合はVisualViewport/viewport policyをQAする。

`layout viewport`と`visual viewport`は同一ではない。

Viewport meta `interactive-widget`を変える場合はCompany Policy + browser supportを確認する。

---

# Smooth scroll by environment

Anchor navigationのcurrent baseline candidate:

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

ただし:

- user agentがduration/easingを決める
- fixed header offsetを別途処理
- Company Policy profileでdisable可能
- unsupported targetにJS polyfillを自動追加しない
- full-page inertia/scroll-jackingとは別機能

Device profileで`INHERIT / ENABLED / DISABLED / CUSTOM`を持てる。

---

# Touch / gestures

Browser native gestureをdefaultで保つ。

`touch-action: none`をslider/dragへ機械的に追加しない。

Reason:

- browser pan/pinch behaviorを無効化し得る
- pinch zoom accessを阻害し得る
- custom gesture ownershipはcomponent単位で証明する必要がある

Sliderはvertical page scrollとhorizontal gestureの競合もreal touch QAする。

---

# Hover / pointer

Use primary capability when behavior depends on the main input:

```css
@media (hover: hover) and (pointer: fine) {
  /* precise primary pointer hover */
}
```

Use `any-hover` / `any-pointer` only when secondary devices should enable the behavior.

Example:

iPad + trackpadではtouch device classificationだけでhoverを無効化しない。

Hover-only critical contentは禁止。Keyboard focus/touch fallbackを用意する。

---

# Reset details that are environment-sensitive

## text-size-adjust

Some smartphone/tablet browsers perform text inflation.

`text-size-adjust` support/behavior is not uniform enough to make a blind global rule.

Company/Existing resetを先に確認し、mobile target profileに必要な時だけ明示する。

## appearance

Form controls are OS/browser-native UI and vary across platforms.

`appearance: none`を全controlへresetとして撒かない。

Component styling requirementがあるcontrolへ限定し、keyboard/accessibility behaviorを別途QAする。

## scrollbar layout

Classic scrollbarとoverlay scrollbarではlayout effectが異なる。

`scrollbar-gutter`はlayout shift対策候補だが、older target browserを含む場合はsupport matrixで判断する。

---

# Scroll lock / overscroll

Modal/drawer open時のscroll lockはenvironment-sensitive。

Do not assume:

```css
overscroll-behavior: none;
```

alone solves every target.

Current policy:

1. reuse existing proven project strategy
2. test target browser/OS
3. preserve keyboard/focus/viewport behavior
4. use `overscroll-behavior` only when target support is acceptable
5. record Safari/WebView-specific workaround as compatibility evidence, not universal rule

---

# User preference environments

Device profileと別軸で以下も確認する。

- `prefers-reduced-motion`
- `prefers-contrast`
- `forced-colors`
- `prefers-color-scheme` when relevant

Accessibility preferenceをdevice modelへ固定しない。

同じWindows/Edge profileでもforced-colors runを別stateとしてQA可能にする。

---

# Output capability

Gradients/imagesでmaterialなら:

- `color-gamut`
- optionally `dynamic-range`

を考慮する。

P3-capable deviceだけ見てsRGB targetの色を壊さない。

Figma structured paintがsourceで、output gamutはdelivery/QA dimension。

---

# Visual baseline

Pixel comparisonはenvironmentを固定する。

Minimum identity:

```text
browser
OS
CSS viewport
DPR
font availability
zoom/text scale
input state where material
```

Company Policyで`canonical_environment_profile`を1つ選ぶ。

REQUIRED environmentごとにbaselineを持つ必要がある案件は`environment_specific_baselines_allowed`で許可する。

Raw screenshotを別OS/browser間でpixel-perfect rankingしない。

---

# QA ladder per required environment

For each REQUIRED environment:

```text
Section
→ Boundary
→ high-coupling Cluster when needed
→ Full Page
→ interaction state
```

を必要範囲で確認する。

Real device required/preferrredか、emulationでよいかもCompany Policyに記録する。

---

# Cross-engine practical verification（2026-11-25）

Required profilesを先に確定し、Chromium系・Firefox/Gecko系・Safari/WebKit系を対象範囲で選ぶ。会社/案件が指定する実機・旧versionは代替しない。PlaywrightのChromium/Firefox/WebKitはengine差の先行検出に有効だが、Playwright WebKitはApple Safariそのものではなく、iOS実機のブラウザUI/keyboard/OS font/gestureを証明しない。実機未実施なら明記する。

| よくある差分 | 先に疑うもの・実際に見るもの |
|---|---|
| 文字幅、アイコンのずれ、行高 | font file/weight/合成、baseline、font metrics、OS fallback、DPR。computed sizeと実描画を分離 |
| Flex/Gridのはみ出し | intrinsic minimum、min-inline-size:0、minmax(0,1fr)、長文、画像/表。意図に応じて選び一律resetしない |
| Sticky/fixed/overlay | scroll container、overflow、transform/contain、stacking context、viewport、scrollbar、scroll-lock復帰 |
| 画像・SVG・mask・clip | intrinsic ratio、viewBox、object-fit/position、stroke、透明余白、CSS feature対応 |
| FormとSP | native appearance、入力font、autofill、focus、IME、virtual keyboard、safe area、hover/pointer |
| 1px線や端の欠け | fractional layout、device pixel ratio、rounding、overflow、隣接辺、border。装飾の描画差と機能的な欠けを分離 |

新しいCSS/API採用前は対象versionのMDN compatibility等と実環境を確認。必要時だけ既存fallback、feature detection/CSS @supportsを用い、@supportsがtrueでも挙動の正しさを保証しない。prefixは既存build/対象browser設定から解決、UA分岐やSafari専用補正は再現した根拠がある場合のみ。

QAは同一data/state/viewport/font準備条件で、各engineの代表画面と変更部品を比較。各環境固有の正常なAA差を強引にpixel-perfectへ寄せない。読み順・操作・情報・意図された整列が崩れる差は修正する。既存のPlaywright設定/実機経路を再利用し、試していないbrowserをPASSにしない。記録: browser/engine/version/OS/viewport/DPR/real-or-emulated、比較画像、観測差、修正と再確認。

公式参照: [Playwright browsers](https://playwright.dev/docs/browsers)、[MDN feature queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Using_feature_queries)。

---

# Current web-platform signals to re-check

Significant run/release triggerで再確認する候補:

- hover / pointer / any-hover / any-pointer
- reduced motion / contrast / forced colors
- viewport units (`svh/lvh/dvh`)
- safe-area env variables
- VisualViewport / software keyboard behavior
- viewport meta / interactive-widget
- touch-action
- overscroll-behavior
- scrollbar-gutter
- text-size-adjust
- form appearance
- color gamut / dynamic range

Current documentation can change. Company Policy stores the approved decision; Update Preflight determines whether it needs retesting.

---

# References

Primary/current documentation should be re-checked before production changes:

- MDN Media Queries: hover/pointer/any-hover/any-pointer
- MDN prefers-reduced-motion / prefers-contrast / forced-colors
- MDN CSS values & units (`svh/lvh/dvh`)
- MDN `env()` safe-area variables
- MDN VisualViewport
- MDN viewport meta
- MDN `touch-action`
- MDN `overscroll-behavior`
- MDN `scrollbar-gutter`
- MDN `text-size-adjust`
- MDN `appearance`
- Browserslist official documentation
