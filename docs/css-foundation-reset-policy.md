# CSS Foundation / Reset Selection Policy

Status: ACTIVE / evolving technical policy

`reset.css` をどの案件でも同じものへ固定するための文書ではない。

目的は、**Company / Existing Codebase / browser support / framework / CMS / accessibility requirements に合わせて、最小副作用で予測可能なCSS foundationを選ぶこと**。

Canonical authority:

- `docs/frontend-authority-model.md`
- `docs/company-policy-contract.md`
- `docs/css-strategy.md`

---

## 1. Foundation responsibilities

CSS foundationは最低でも次の責務を区別する。

```text
RESET / NORMALIZATION
→ BASE
→ ENVIRONMENT ADAPTATION
→ TOKENS / SHARED PRIMITIVES
```

### Reset / normalization

Browser UA stylesheet差や、projectが意図的に消したい既定値を扱う。

### Base

Project-wide semantic defaultsを扱う。

例:

- `body` typography/background/color
- link behavior
- form font inheritance
- responsive media defaults
- selection/focus defaults when project-owned

### Environment adaptation

必要なenvironmentだけに適用する。

- hover / pointer capability
- reduced motion
- forced colors / contrast
- safe area
- dynamic viewport
- virtual keyboard
- proven browser-specific workaround

### Tokens / shared primitives

Design decisionsを扱う。Resetへone-off design tokenを混ぜない。

---

## 2. Decision order

新規resetを追加する前に:

1. Company Policyのreset/base ruleを確認
2. Existing repoのreset/base/framework foundationを確認
3. framework/libraryが自動で注入するpreflight/resetを確認
4. Required browser/environment matrixを確認
5. Figma実装に必要なsemantic/browser defaultを確認
6. accessibility / form / native controlへの副作用を確認
7. それでも未解決なら最小のfoundationを選ぶ

**既にresetが存在するprojectへ、別resetを上乗せすることをdefaultにしない。**

---

## 3. Supported selection profiles

### `EXISTING_FIRST`

Productionの第一候補。

Use when:

- 既存Theme/Appにreset/baseがある
- design systemがfoundationを所有している
- legacy behaviorとの互換性が必要

Do not replace only because another reset is newer/popular.

### `FRAMEWORK_NATIVE`

Framework/toolchain側のfoundationをそのまま利用する。

Examples:

- Tailwind Preflight
- existing design-system base layer
- framework starter/base stylesheet

導入前に、何をresetするかを確認する。

### `TAILWIND_PREFLIGHT`

Tailwindが既存primary styling architectureの場合の候補。

Preflightは単なるnormalizeではなくopinionatedで、代表的に:

- default margin/paddingの除去
- border baseline変更
- heading visual defaultsの除去
- list markerの除去
- responsive media baseline

等を行う。

したがって、**既存WordPress Themeやthird-party widgetへ無条件に追加しない。**

Tailwindを使わない案件へPreflightだけ導入することもdefaultにしない。

### `MODERN_NORMALIZE`

最新Chrome/Firefox/Safari中心の新規案件で、軽量なbrowser normalizationが必要な場合の候補。

Current project/browser policyとmaintainer support範囲を照合する。

### `NORMALIZE`

より広いhistorical normalization behaviorが既存project/company contractと一致する場合の候補。

「有名だから」ではなく、Required browser matrixとExisting architectureから選ぶ。

### `CUSTOM_MINIMAL`

Company/Projectがfoundation責務を明示的に所有したい場合の候補。

例:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

img,
picture,
video,
canvas,
svg {
  max-inline-size: 100%;
}
```

これは例であり、全projectへそのままcopyするcanonical resetではない。

`appearance: none`、list marker removal、outline removal等の強いresetは必要性を確認してから追加する。

### `NONE`

Browser defaultsまたはexisting component stylesを意図的に利用する場合。

`NONE`は「base CSSも不要」という意味ではない。

---

## 4. Reset aggressiveness

Resetは強さを区別する。

```text
NORMALIZE
< MINIMAL RESET
< OPINIONATED RESET / PREFLIGHT
```

強いresetほど悪いわけではない。

ただし強いresetほど:

- semantic heading/list default
- form/native control behavior
- third-party widget
- CMS generated content
- editor content

への影響範囲が大きくなるため、QA scopeも広げる。

---

## 5. Box sizing

`box-sizing: border-box` は通常layoutの予測可能性を高める有力default。

ただし「全要素border-boxだから正しい」ではなくExisting contractを優先する。

Common pattern:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

Resetを変更してbox sizing semanticsが変わる場合はlayout regressionとして扱う。

---

## 6. Forms / native controls

Form controlはbrowser/OS差が大きいため、resetで過剰にflattenしない。

最低確認候補:

- font inheritance
- box sizing
- button/input/select/textarea sizing
- native date/range/color/file controls
- disabled/read-only states
- `appearance`
- focus ring
- forced colors
- zoom/text scale

`appearance: none` をglobal defaultにしない。

Native affordanceを消す場合はcomponent側でaccessibility/interaction contractを持つ。

---

## 7. Focus must survive foundation changes

Global:

```css
*:focus { outline: none; }
```

のようなresetを禁止方向の強いsmellとして扱う。

Focus visualを置換する場合は `:focus-visible` 等で同等以上の識別可能性を提供する。

Reset変更後はkeyboard navigationとFocus Not ObscuredをRelevant scopeで確認する。

---

## 8. Lists / headings / semantic content

Visual resetとHTML semanticsを混同しない。

例:

- headingのdefault font-sizeを消してもheading semanticsは残る
- list markerを消すと、CMS本文やrich textでは情報表現が変わる可能性がある

LP componentとCMS rich textで同じreset impactとは限らない。

CMS/editor-generated areaにはscopeされたbase typographyを持つことを検討する。

---

## 9. Media baseline

Responsive media defaultは有力だが、asset roleを壊さない。

例:

```css
img,
picture,
video,
canvas,
svg {
  max-inline-size: 100%;
  block-size: auto;
}
```

ただしcanvas/SVG/videoやart-directed absolute assetではproject-specific sizingが必要な場合がある。

HTML intrinsic `width/height` はCSS fixed rendered sizeとは別概念として維持できる。

---

## 10. Third-party / embedded UI

Reset変更は次を壊し得る:

- maps
- payment widgets
- form embeds
- sliders
- date pickers
- CMS plugin markup
- browser extension-like embeds

Global resetを変更する場合、known embedded surfacesをdependency blast radiusへ含める。

必要ならcascade layer / scoped exceptionを使う。

---

## 11. WordPress-specific rule

WordPressでは特に:

- existing Theme reset/base
- block editor/front-end generated styles
- plugin CSS
- classic editor content
- ACF block/component CSS

を確認してからfoundationを変える。

Standalone LPであっても、Theme内でrenderされるならTheme foundationとの二重resetを確認する。

完全isolated LP shellなら独立foundationを持てるが、Header/Footerやplugin UIを共有する場合は影響範囲を再評価する。

---

## 12. Framework-specific rule

### CSS Modules / native CSS

Company/Existingが無ければ `CUSTOM_MINIMAL` または適切なnormalizeを比較候補にできる。

### Tailwind

Tailwind Preflightが既にbase layerへ入るか確認する。二重resetを避ける。

### Component library / design system

Libraryがassumeするglobal foundationを確認する。

Component stylesheetだけ見てresetを発明しない。

---

## 13. Foundation QA

Reset/base変更はSection-local変更よりblast radiusが大きい。

最低候補:

- typography/wrap regression
- list/heading semantics + visual
- form controls
- focus-visible
- media sizing
- image/layout shift
- third-party/embed surfaces
- CMS rich text
- required browser/environment profiles
- representative full-page capture

Foundation changeを「CSS数行だからlocal QAで十分」と扱わない。

---

## 14. Learning / promotion

Reset choiceもportable knowledge loopへ入れる。

```text
Observed reset/foundation problem
→ affected environment/component
→ root cause
→ minimal repair
→ clean replay
→ Candidate
→ cross-project evidence
→ Proven / Company default candidate
```

記録する:

- selected reset profile/version
- browser matrix
- framework/CMS
- third-party impact
- known limits
- last verified date
- retest triggers

Reset package/versionを永久best practiceにしない。

---

## 15. Practical default

新規projectでCompany/Existing contractが無い場合の判断:

```text
Is there already a framework/design-system reset?
├─ YES → reuse and audit it
└─ NO
   ↓
Need only current-browser normalization?
├─ YES → compare MODERN_NORMALIZE vs CUSTOM_MINIMAL
└─ NO
   ↓
Need broader legacy normalization?
├─ YES → evaluate NORMALIZE against required matrix
└─ NO → CUSTOM_MINIMAL or NONE + explicit BASE
```

Tailwind primary project:

```text
Tailwind Preflight already active?
├─ YES → do not stack another global reset by default
└─ NO → confirm why it is disabled before adding another reset
```

The goal is not to pick the most fashionable reset. The goal is a **known, minimal, testable foundation whose ownership and blast radius are clear**.
