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

同じFigmaでも会社によって正解は変わる。

例:

- Safariの最低version
- Android WebView対応
- WordPress classic / block theme
- ACF Blocksの可否
- Swiper/GSAP等のapproved library
- reset CSS
- breakpoint
- folder naming
- image format/SVG policy
- accessibility baseline
- pixel tolerance
- browser QA matrix

これらをFigmaから推測しない。

---

## Dashboard position

将来DashboardではCompany Policyを最上段に置く。

推奨view:

```text
Company Policy
├ Browser Support
├ Stack / CMS
├ CSS / Reset / Breakpoints
├ Approved Libraries
├ Interaction Defaults
├ Accessibility
├ Figma Handoff
├ Images / SVG
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

## Browser support

Browser supportは「最新2versionぐらい」の口約束ではなく、次の3層で固定する。

1. Browserslist/query contract
2. explicit minimum versions / exceptional WebViews
3. actual QA browser/device matrix

Browserslist configはBabel/Autoprefixer等の複数toolで共有できるため、既存会社configがあれば最優先する。

Baseline/MDNは機能の一般的な普及度を見る補助情報。会社固有のtarget browserの代替にはしない。

---

## Existing codebase rule

Company Policyに明記されていない項目は、既存codebaseを次のsourceとして確認する。

例:

- package.json / lockfile
- browserslist config
- PostCSS/Babel/Vite/Webpack config
- reset/base CSS
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

→ visual intentを保つ代替を提案し、勝手に決定しない。

### EXISTING_DRIFT

会社ruleと既存repoがズレている。

→ existingを自動正当化しない。Company Policy revision/dateを見てmigration対象か確認。

### FIGMA_AMBIGUITY

FigmaのPC/SP/interaction/commentsが矛盾。

→ confidenceを下げ、Conflictへ。

---

## Policy lifecycle

```text
DRAFT
→ ACTIVE
→ SUPERSEDED
```

重要runはACTIVE policyのpath + SHA-256をpinする。

Company Policyが更新されたら古いrunの意味を後から書き換えない。新revisionとして扱う。

---

## Update policy

Company Policy内の技術defaultも永久固定しない。

最低retest trigger:

- supported browser policy change
- Figma/MCP major update
- WordPress/ACF major update
- approved UI library major update
- accessibility/platform API change
- repeated production failure

通常のproduction default候補は定期reviewし、old approachも履歴として残す。
