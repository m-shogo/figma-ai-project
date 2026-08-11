# Human Editability / Maintainability Contract

Figma再現が高精度でも、後から人が微調整・文言変更・画像差し替え・レスポンシブ調整を安全にできない実装はproduction品質とみなさない。

このrepoでは **Human Editability（人が見つけられる・理解できる・局所的に変更できる・変更影響を予測できる）** を、Visual Fidelity / Runtime Safetyと並ぶ必須quality gateとして扱う。

ただし、特定のCSS流派・命名規則・frameworkを全案件へ強制しない。最優先はtarget codebaseの既存architectureとcompany/project conventionである。

---

## 1. Why this is a separate gate

AI生成コードは最終スクリーンショットだけを見ると高品質でも、次のような負債を隠せる。

- Figma sectionと実装ファイルの対応が分からない
- 同じCTAやprimitiveが複製され、1箇所変更しても全部直らない
- `top`, `left`, negative margin, `transform`等のpatchが連鎖し、何を直すとどこが壊れるか読めない
- global override / high specificity / `!important`で局所修正が困難
- breakpointがsectionごとに散らばる
- CMS editable contentとcode-owned art directionの境界が不明
- Figma Variablesや既存design tokenをraw valueへflattenし、意味が消える
- 画像差し替え時にcrop/focal/composite意図が分からない

これらはpixel scoreだけでは十分に検出できない。

---

## 2. Evidence from current platform guidance

このcontractは流行のcoding styleを固定するためではなく、現在の公式platform guidanceと実務上の変更容易性が一致する部分を採用する。

### Figma

Figma Dev Modeはlayer type、component、layout/spacing、Variables、prototype interaction等をinspectでき、Code ConnectはFigma componentを実code componentへ結びつける仕組みを提供する。

Implication:

- Figma layer treeをそのままDOMへ写すのではなく、component/token/interaction evidenceを保持してcode ownershipへ変換する
- Code Connectが実際に存在する案件では既存component reuse evidenceとして使う
- Code Connectがない案件で架空のmappingを作らない

Sources:

- https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode
- https://help.figma.com/hc/en-us/articles/15023202277399-Use-code-snippets-in-Dev-Mode
- https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode
- https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect

### Native CSS

CSS Custom Properties allow a shared semantic value to be defined once and reused, which improves readability and change locality. MDN also recommends avoiding specificity escalation/`!important` as an override strategy; cascade layers can isolate precedence when multiple style sources exist. Container queries are useful when a reusable component's own available width, rather than the viewport, is the real responsive boundary.

Implication:

- semantic shared values should use the existing token mechanism or scoped Custom Properties where appropriate
- do not solve generated CSS conflicts by endlessly increasing specificity
- do not introduce container queries only because they are modern; use them when component-container width is genuinely the source of truth

Sources:

- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries

### WordPress

WordPress template parts exist to split reusable page sections and avoid duplicated template markup. Classic themes likewise support template partials.

Implication:

- use the target theme's established template-part/partial architecture
- Header/Footer/shared CTA等をpage-local copyへ複製しない when the target architecture already owns them
- do not force block-theme `/parts` structure into a classic PHP theme; first classify the target theme

Sources:

- https://developer.wordpress.org/themes/templates/template-parts/
- https://developer.wordpress.org/themes/classic-themes/basics/template-files/

### ACF

ACF Local JSON stores field definitions in files, supports version control, and supports synchronization across environments.

Implication:

- when target ownership supports Local JSON, field schema should be reviewable/versioned with code
- field schema and fixture/page content remain separate concerns
- do not invent ACF ownership merely to make every Figma layer editable

Source:

- https://www.advancedcustomfields.com/resources/local-json/

---

## 3. Human Editability dimensions — diagnostic /10

The current composite /100 is kept stable for historical experiment comparability. Human Editability is therefore a **separate /10 diagnostic plus mandatory PASS gate**. Do not silently add it to the existing 100-point composite until enough cross-reference evidence exists to recalibrate historical scores.

Each dimension is 0–2.

### A. Discoverability — /2

A human should be able to answer quickly:

- Which implementation file owns this Figma section?
- Which style file/rule owns this visual?
- Is this value shared, section-local, or CMS-owned?

Good evidence:

- semantic section/component names
- predictable project-native folder structure
- a section-to-code map when the existing architecture is not self-evident

Failure smell:

- generated names based on coordinates/layer ids only
- one giant page file with unrelated sections when the project convention supports decomposition
- excessive micro-files that make one section harder to trace

### B. Locality of change — /2

A local visual/content change should normally stay local.

Good evidence:

- section-specific spacing/crop/layout lives with that section
- shared tokens/components are changed in their shared owner
- unrelated sections do not need compensating patches

Important:

There is **no universal maximum file count or LOC threshold**. A change is judged by expected ownership and unrelated blast radius, not an arbitrary number.

### C. Intent readability — /2

The code should explain design/runtime intent through names and structure.

Good evidence:

- semantic token/custom-property names
- normal Grid/Flex/intrinsic layout before coordinate patches
- art-directed absolute positioning retained when Figma evidence actually requires it
- comments explain *why* a non-obvious workaround exists, not every obvious line

Raw values and magic-looking numbers are not automatically wrong. A one-off Figma measurement may be legitimate. The failure is an unexplained repeated workaround or a number whose ownership/intent cannot be reconstructed.

### D. Change safety / reuse — /2

Changing one shared thing should update all intended uses and only those uses.

Good evidence:

- shared component reuse
- one breakpoint contract
- low/controlled selector specificity consistent with project architecture
- no hidden global overflow/clipping workaround masking a local defect

### E. CMS / content ownership clarity — /2

For CMS implementations, a human should know which values are editor-owned and which remain code-owned.

Good evidence:

- stable ACF field names/keys and schema artifact
- Local JSON or the target project's equivalent when supported
- fixed art-directed copy stays code-owned when arbitrary editing would destroy composition
- fields are not created for hidden/alternate Figma residue without evidence

For non-CMS implementations this dimension evaluates content/data ownership clarity rather than ACF specifically.

---

## 4. Mandatory blockers

Human Editability status is `FAIL` regardless of numeric score when a material blocker exists.

Examples:

- the reviewer cannot determine the owning implementation location for a visible section without broad repository search/reverse engineering
- a local change requires unrelated section compensation because the layout was coupled by screenshot patches
- the same shared UI is independently duplicated where the target architecture provides a shared owner
- an unapproved section-local breakpoint contradicts the frozen responsive contract
- global clipping/overflow hiding is used to conceal a layout defect
- CMS/editor ownership is materially ambiguous and could cause a normal editor action to break an art-directed layout
- a change drill causes an unrelated visual/runtime regression

`!important`, absolute positioning, raw px, negative offsets, or one-off values are **not automatic blockers**. They require evidence/justification when non-obvious or repeated.

---

## 5. Change drills — test the code humans will actually maintain

Static lint alone cannot prove maintainability. Every serious PAGE/INTEGRATION result should run task-based change drills against an **immutable snapshot in a disposable branch/worktree/sandbox**, then discard the temporary change.

Do not mutate the canonical FIRST PASS while measuring FIRST PASS editability.

Choose at least three relevant drills:

### Drill 1 — Local visual adjustment

Example:

> Increase only the Student Voice section's internal gap or adjust one evidenced image crop.

Record:

- files a maintainer needed to inspect
- files changed in the disposable diff
- unrelated files touched
- whether another section regressed

### Drill 2 — Content / CMS adjustment

Example:

> Change one genuinely editor-owned heading/image and identify the field/source of truth.

Pass intent:

- content change does not require rewriting layout code
- code-owned art direction is not accidentally exposed as unrestricted CMS content

### Drill 3 — Shared component adjustment

Example:

> Change the shared CTA label/style once and verify all intended instances update without copied patches.

### Drill 4 — Responsive behavior adjustment

Example:

> Change an allowed responsive behavior while preserving the owner/company breakpoint contract.

Pass intent:

- the breakpoint/threshold owner is obvious
- no hidden local threshold is added just to repair one section

### Drill 5 — Asset replacement

Example:

> Replace one CMS-owned image with a different aspect ratio and preserve the evidenced crop box behavior.

Pass intent:

- media source and crop/layout ownership are separable
- replacing the asset does not require rediscovering mask/position rules from scratch

### Drill result

Each drill records:

- `task`
- `snapshot_commit`
- `located_paths`
- `changed_paths`
- `unexpected_paths`
- `regression_status`
- `result`: `PASS | FAIL | NOT_APPLICABLE`
- `notes`

Time-to-locate/time-to-change may be recorded when measurable, but it is not a universal hard threshold because repository size/tooling differs.

---

## 6. Figma → code navigation map

When the project's existing architecture does not make ownership obvious, generate a lightweight map.

Example:

```yaml
section_code_map:
  main_visual:
    figma_nodes: ["..."]
    markup: "template-parts/ref001/main-visual.php"
    styles: ["assets/css/ref001-main-visual.css"]
    content_owner: "mixed: ACF + code-owned slogan"
    shared_dependencies: ["page-container", "breakpoint-768"]
```

This is navigation metadata, not another source of truth for visual measurements. Keep it small enough to remain maintainable.

---

## 7. Architecture rules

### Prefer project-native structure

Order of precedence:

1. existing target codebase conventions
2. company/project coding rules
3. existing design system/component/token ownership
4. framework/CMS conventions
5. this repo's fallback defaults

Do not restructure a healthy production codebase only to make AI output look uniform across projects.

### Section-first does not mean file-per-layer

The useful boundary is a human-recognizable section/component ownership boundary, not Figma's entire layer tree.

Avoid both extremes:

- monolithic page files containing unrelated sections
- one file/component for every decorative layer

### Shared vs local values

Shared meaning → existing shared token/component owner.

One-off visual evidence → section-local value is acceptable.

Repeated raw values → token candidate, not automatic token promotion.

### CSS specificity

Use the target project's cascade strategy. Avoid specificity escalation as the default repair mechanism. If a third-party stylesheet must be controlled, cascade layers may be appropriate where the target browser/project contract supports them.

### Responsive architecture

Viewport breakpoints remain centrally governed by the frozen project/owner contract. Container queries are allowed when component-container width is explicitly the true design/runtime boundary; they must not silently replace owner-specified viewport behavior.

### Comments

Comment non-obvious constraints:

- why an art-directed absolute position is required
- why a strange crop offset matches a supplied asset
- why a value deliberately does not use a shared token
- why a browser workaround exists and its removal condition

Do not generate comments that merely restate CSS/PHP syntax.

---

## 8. Clean Replay integration

For controlled experiments:

1. Build FIRST PASS.
2. Freeze immutable FIRST PASS evidence.
3. Evaluate Human Editability against that frozen snapshot.
4. Run change drills only in a disposable copy of the snapshot.
5. Record the /10 diagnostic, PASS/FAIL status, blockers, and drill evidence.
6. Only then begin targeted visual/runtime repair.
7. Re-evaluate final Human Editability after repair.

A repair that improves screenshot fidelity but makes human editability worse is a regression, not an unqualified success.

---

## 9. Completion policy

For new run-record schema versions that adopt this contract, `COMPLETE` requires:

- Human Editability `PASS`
- diagnostic score >= 8/10
- no mandatory blockers
- at least three relevant change drills for PAGE/INTEGRATION scope, or a documented scope-specific equivalent for SECTION scope
- evidence paths/notes sufficient for another engineer to understand the ownership map

The numeric threshold is intentionally secondary to blockers and actual change drills.

---

## 10. What we are optimizing

The target is not maximum abstraction and not minimum code.

The target is:

```text
high Figma fidelity
+ safe responsive runtime
+ obvious ownership
+ small predictable change surface
+ reusable shared behavior
+ explicit CMS/code boundary
+ low repair debt
```

A 100% screenshot match produced by fragile compensating patches is worse than a nearly identical implementation that a human can safely adjust. The long-term goal is to achieve both high fidelity and high editability, and to measure regressions in either direction.
