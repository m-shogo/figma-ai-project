# Company Policy Contract

## Purpose

案件ごとの実装判断を、agentの一般論ではなく**会社・チームの実装規約から開始する**。

Production implementation precedence:

```text
COMPANY POLICY
  ↓
EXISTING CODEBASE / EXISTING DESIGN SYSTEM
  ↓
FIGMA IMPLEMENTATION EVIDENCE
  ↓
AGENT INFERENCE
```

ただし、これは**technical implementation constraintsの優先順位**。

Visual/design source of truthは引き続きFigma reference。

会社ルールとFigmaの見た目/挙動が衝突した場合、AIは会社ルールを理由に勝手にredesignしない。`CONFLICT`として記録し、owner/company decisionへ戻す。

---

## Why a separate Company Policy exists

同じFigmaでも会社・対象環境によって正解は変わる。

例:

- Safariの最低version
- Android WebView対応
- iPhone safe-area / virtual keyboard
- iPad touch + trackpad
- Windows forced-colors
- WordPress classic / block theme
- ACF Blocksの可否
- Swiper/GSAP等のapproved library
- reset/base/environment CSS
- breakpoint
- folder naming
- image format/SVG policy
- accessibility baseline
- pixel tolerance
- browser/device QA matrix

これらをFigmaから推測しない。

---

## Dashboard position

将来DashboardではCompany Policyを最上段に置く。

推奨view:

```text
Company Policy
├ Browser Support
│  ├ Browserslist
│  ├ Minimum versions
│  ├ Required Environment Profiles
│  └ Real-device / Emulation QA
├ Stack / CMS
├ CSS Foundation
│  ├ Reset
│  ├ Base
│  └ Environment adaptation
├ Breakpoints / Viewport / Safe Area
├ Approved Libraries
├ Interaction Defaults
├ Accessibility / User Preferences
├ Figma Handoff
├ Images / SVG / Output Gamut
├ Gradients
├ Visual Tolerance
├ Folder / Section Unit
└ Update Policy

Effective Rules
├ Company
├ inherited Existing Codebase
├ Figma evidence
└ unresolved conflicts
```

各ruleは最低限:

- value
- source
- status
- evidence/reference
- last reviewed
- overridden by
- affected runs/projects

を持つ。

---

## Browser support is not only a browser list

Browser supportは次の4層で固定する。

1. Browserslist/query contract
2. explicit minimum versions / exceptional WebViews
3. Required Environment Profiles
4. actual QA browser/device matrix

Browserslist configはBabel/Autoprefixer等の複数toolで共有できるため、既存会社configがあれば最優先する。

ただしBrowserslistだけでは:

- input capability
- DPR
- safe-area
- virtual keyboard
- real-device QA
- device-specific interaction override

までは表せない。

そのためCompany Policyでは`environment_profiles`を別に持つ。

Canonical: `docs/device-environment-policy.md`

---

## Environment Profile

`PC/SP`やviewport widthだけをdevice判定に使わない。

ProfileはQA/compatibility identityとして:

- device class
- OS/version
- browser/version/engine
- WebView
- CSS viewport/DPR
- primary/any hover
- primary/any pointer
- touch
- safe-area
- dynamic viewport
- virtual keyboard
- color gamut/forced colors when relevant
- real-device/emulation policy
- environment-specific implementation overrides

を持てる。

Runtimeは原則capability/feature detection。

UA sniffingはCompany Policyで明示的に認めたbug fix等へ限定する。

---

## CSS Foundation

Deviceごとにreset.css全部を複製することをdefaultにしない。

Logical layers:

```text
reset
→ base
→ environment adaptation
→ tokens/shared primitives
```

Existing repoのfile structureがあればそれを使う。

### Reset

Cross-browser baseline差。

### Base

Project-wide body/form/media/typography semantics。

### Environment adaptation

- hover/pointer
- reduced motion
- safe area
- dynamic viewport units
- software keyboard
- touch-action
- forced colors/contrast
- color gamut
- proven browser-specific workaround

を扱う。

---

## Existing codebase rule

Company Policyに明記されていない項目は、既存codebaseを次のsourceとして確認する。

例:

- package.json / lockfile
- browserslist config
- PostCSS/Babel/Vite/Webpack config
- reset/base/environment CSS
- component library
- JS utilities
- PHP/template-part conventions
- ACF field architecture
- image helpers
- lint/format rules

既存に確立された方法がある場合、Figma MCPが別形式のコードを提案しても既存へ翻訳する。

---

## Figma implementation evidence

会社/既存で決まっていないものだけ、Figmaから実装意図を読む。

読む対象:

- Components / variants
- Variables / modes
- Auto Layout / Grid / sizing
- prototype interactions
- annotations
- dev resources
- comments when accessible
- assets/crop
- PC/SP relationship

Figma structureをそのままDOM/CSSへコピーするのではなく、design intent evidenceとして扱う。

---

## Agent inference

最後のfallback。

Inferenceした場合は:

- assumptionを残す
- visual/behavioral significanceを記録
- owner decisionが必要か判定
- clean replayで再現可能にする

Materialな仕様を「良しなに」で確定しない。

---

## Policy conflict classes

### TECHNICAL_CONFLICT

例:

- Figma prototypeはblur-heavyだが会社browser matrixで不適合
- Figmaのasset形式がcompany policyで禁止
- Figmaではhover前提だがRequired environmentはtouch-only

→ visual intentを保つ代替を提案し、勝手に決定しない。

### EXISTING_DRIFT

会社ruleと既存repoがズレている。

→ existingを自動正当化しない。Company Policy revision/dateを見てmigration対象か確認。

### FIGMA_AMBIGUITY

FigmaのPC/SP/interaction/commentsが矛盾。

→ confidenceを下げ、Conflictへ。

### ENVIRONMENT_CONFLICT

Required environment同士で同一実装が成立しない。

例:

- desktop hover stateがtouch fallbackを持たない
- fullscreen heightがmobile browser UIで破綻
- scroll lockがWebViewだけ破綻

→ environment profileごとのevidenceを残し、shared solutionまたはapproved overrideへ。

---

## Visual baseline

Screenshot/Pixels比較はenvironment identityを固定する。

最低限:

```text
browser
OS
CSS viewport
DPR
font availability
zoom/text scale
```

を固定する。

Company Policyでは`canonical_environment_profile`を選ぶ。

異なるbrowser/OS/DPRのraw pixel diffを同じ基準でrankingしない。

---

## Policy lifecycle

```text
DRAFT
→ ACTIVE
→ SUPERSEDED
```

重要runはACTIVE policyのpath + SHA-256をpinする。

ACTIVEにする前に最低限:

- browser support contract
- 1つ以上のREQUIRED environment profile
- canonical environment profile
- feature/capability detection policy
- reset/base/environment foundation policy
- update preflight

を確定する。

Company Policyが更新されたら古いrunの意味を後から書き換えない。新revisionとして扱う。

---

## Update policy

Company Policy内の技術defaultも永久固定しない。

最低retest trigger:

- supported browser policy change
- Required browser major update
- Required OS major update
- Figma/MCP major update
- WordPress/ACF major update
- approved UI library major update
- accessibility/platform API change
- repeated production failure

通常のproduction default候補は定期reviewし、old approachも履歴として残す。

Canonical:

- `docs/device-environment-policy.md`
- `docs/web-interaction-policy.md`
- `docs/update-preflight.md`
