# Frontend Reuse-Before-Build Contract

Status: ACTIVE / evolving reuse contract

目的は「自前で全部作る」ことではない。Figma-to-Webで同じ問題を何度も解き直さず、既存のproduction code・browser capability・official tooling・成熟したOSS・過去のGood Patternを先に使い、`figma-ai-project` 独自実装は不足部分だけに限定する。

2026-08-20の外部tooling監査は `research/frontend-existing-tooling-audit-2026-08-20.md`、具体的な接続・退役判断は `docs/frontend-external-integration-matrix.md` を参照する。

## 1. Reuse order

新しい仕組み・helper・validator・asset処理・QAを作る前に、原則として次を確認する。

```text
1. Effective Project Contract / Existing codebase
2. Browser / native HTML / CSS / JS capability
3. Figma / WordPress / Playwright等のofficial capability
4. Existing project library / design system / Storybook / component registry
5. Mature OSS / established practitioner pattern
6. figma-ai-project Good Pattern / clean replay evidence
7. 足りない差分だけcustom implementation
```

「custom codeが少ないこと」自体をKPIにしない。既存手段を無理に組み合わせるより、小さいcustom adapterが明快な場合は普通に作る。ただし既存で解ける重いmechanismを再実装しない。

## 2. Figma input quality before implementation

実装後の修正量を減らすため、利用可能なら実装前に次を確認する。

- component / instance / variant
- Variables / Styles / code syntax / alias chain
- Auto Layout / sizing / constraints
- Annotation / measurement / Ready for dev
- Prototype / interaction intent
- detached instance / duplicated component / obvious hard-coded style drift
- asset source / exportability

FigmaLint / Design Lintのようなdesign-side lintは有力な外部evidence。ただし全案件へPlugin導入を強制しない。既存Figma構造から同等の問題を観測できる場合はそれを再利用する。

## 3. Structured design context + official asset retrieval first

ScreenshotだけをAI contextにしない。利用可能ならFigma MCP / Dev Mode等からstructured contextを取得する。

```text
visual reference
+ component identity
+ variables / styles
+ layout structure
+ annotations / measurements
+ prototype intent
+ exact asset source
```

Figma MCPはfinal code generatorではなくcontext bridgeとして扱う。AgentはそのcontextをExisting codebase / Project contractへ適応する。

生成されたframework-specific reference codeをproductionへそのまま貼らない。target stack、Existing components、tokens、asset ownershipへ変換して使う。

Durable assetが必要な場合、Remote MCPで利用可能ならFigma `download_assets` をcustom transportより先に使う。取得候補は:

- nodeのrendered export
- subtree内のoriginal raw image bytes
- exact SVG/vector assets

```text
get_design_context / get_screenshot
→ download_assets
→ durable bytes + provenance/hash
→ production asset
```

古いclient制約のために作ったmulti-hop bridgeを新規案件のdefaultにしない。`download_assets`が使えないclient / plan / private-file conditionだけfallback transportを使い、制約をrun evidenceへ残す。

## 4. Production component reuse

Figma Componentを見つけたら、Web Componentを新規作る前にproduction ownerを検索する。

```text
Figma component
→ existing Code Connect map / suggestions when available
→ Figma design-system search / Storybook / component registry / repo search
→ existing production component
→ variant/property mapping
→ reuse
```

Code Connectを使う場合、2026-08-17以降はframework-specific parserではなくtemplate filesをactively maintained pathとして扱う。新しいparser workflowを独自に作り込まない。

Code Connectはplan/seat/library条件があるため、利用不可なら `docs/component-resolution.md` の薄いfallbackへ戻る。**Code Connect clone、独自parser、独自component browserを作らない。**

Code Connect導入自体はDesign System / shared-component scopeでのみ候補にする。Standalone LPへ強制しない。

## 5. Design tokens: standard format before custom schema

Token pipelineが実在する案件では、独自JSON形式を先に作らない。

DTCG Design Tokens Format 2025.10はstableなinterchange format候補。Figma Variables / Tokens Studio / Style Dictionary等がDTCG互換で接続できる場合は既存pipelineを優先する。

DTCG 2025.10はstableなCommunity Group specificationだがW3C Standard/Recommendationではない。authority表現を誇張しない。

```text
shared design decision
→ versioned token source
→ standard/interoperable representation
→ existing transform/build
→ production code
```

One-off LPやtoken systemが無い案件へtoken infrastructureを強制しない。

## 6. Visual QA: Playwright primitives before custom engine

Visual Regression基盤を一から作らない。既存Playwrightを正本候補にする。

再利用候補:

- element / section screenshot
- full-page screenshot
- `toHaveScreenshot()`
- image/binary `toMatchSnapshot()` where appropriate
- threshold / `maxDiffPixels` / `maxDiffPixelRatio`
- masks / deterministic visual setup
- trace capture
- DOM snapshots
- console / network evidence
- expected / actual / diff attachments

Figma parity固有で不足するlayout/style/text comparisonだけを小さいadapter/report layerとして追加する。

Screenshot renderingはOS/browser/version/font/environment差を受けるため、baselineとcomparison environmentを揃える。全案件共通の1px thresholdをAIが勝手に作らない。

既存のdirect `pixelmatch` / `pngjs` wrapperがPlaywright snapshotと責務重複する場合は、同じreference/actual pairでclean replayしてから置換する。Playwrightが必要なartifact/thresholdを保持できるならdirect wrapperをdefaultから退役させる。

## 7. Failure evidence: Trace before rerun guessing

Interaction/runtime failureでは、同じテストを闇雲にrerunする前にPlaywright Traceを候補にする。

Traceから次を一緒に見られる。

```text
before/after DOM snapshot
+ screenshot
+ action / locator
+ console
+ network
+ source location
+ browser / viewport metadata
```

目的は再現時間と「何が起きたか分からないrerun」を減らすこと。

Traceで `implementation / transient environment / test assumption / external dependency` を分け、原因不明のrerun成功を修正完了の唯一の根拠にしない。

## 8. Semantic regression / accessibility: existing detectors first

Semantic structureが重要なshared component / navigation / form / dialog等では、Playwright ARIA snapshotを候補にする。

Visual screenshotと別に、role / accessible name / state / heading/list structureのdriftを検出できる。

Automated accessibility detectorが必要なら、target projectにあるaxe-core / `@axe-core/playwright` / Storybook a11y等を先に利用する。新しいaccessibility rule engineを作らない。

ARIA snapshotやaxeは全Sectionへ必須にしない。Static LPの装飾Sectionなど費用対効果が低いscopeでは使わない。

Automated checkはfirst-line detectorでありHuman/keyboard/manual reviewを置き換えない。

## 9. Shared components: existing Storybook / visual service first

StorybookまたはEquivalentが既にある場合、shared componentの新しい独自preview/test harnessを作らない。

既存Storyを利用して:

- state / variant isolation
- interaction tests
- accessibility checks
- visual regression
- long content / missing media cases

を必要に応じて追加する。

Visual review serviceも既存Project契約を優先する。Storybook/Chromatic、Playwright対応のChromatic、Argos等はhosted review候補だが、privacy / repository visibility / screenshot upload / cost / approval workflowをProject Contractで確認する。

Standalone LP / one-off sectionへStorybookやSaaSを強制しない。既存Human Review Dashboardをhosted serviceへ置き換える場合も、Figma reference/provenance/section repair workflowが失われないclean replay evidenceを先に取る。

## 10. CSS / browser compatibility: ecosystem config first

Target projectにNode/CSS toolchainが存在する場合、browser supportを複数validatorへ独自記述しない。

```text
Effective Environment Contract
→ Existing Browserslist
→ Autoprefixer / Babel / Stylelint / compatible tooling
```

CSS source lintは既存Stylelint/PostCSS stackを優先し、新しいregex CSS parserを作らない。Custom Stylelint ruleが必要でも、既存rule/config/pluginで解けるか先に調べる。

`stylelint-no-unsupported-browser-features` / doiuse等のbrowser-feature lintはfallbackの存在まで理解できないため、原則warning/evidenceとして扱い、単独でuniversal CI hard gateにしない。

ProjectにNode toolchainが無い場合、このStandardのためだけに巨大なfrontend build stackを追加しない。

## 11. WordPress runtime / ACF / media: native path first

WordPress案件ではExisting会社/案件環境を最優先する。汎用test environmentを新規構築する場合は、official `@wordpress/env` をbespoke Dockerより先に評価する。

```text
Existing WordPress environment
→ @wordpress/env candidate
→ ACF PRO / worktree isolation / theme drop-in / seed等の不足adapterだけcustom
```

現在のcustom WordPress fixtureを即置換しない。`wp-env`で同じworktree isolation、supplied-theme、ACF PRO secret injection、seed/mutation、Playwright routeが成立するかclean replayしてから退役判断する。

ACF 6.8+ + WP-CLI 2.0+のProjectでは、official `wp acf json status/sync/import/export` をcustom import/export logicより先に使う。Project validatorはportable structure / stable keys / evidenceを検証してよいが、ACFのimport/export engineを再実装しない。

Responsive mediaはnative image APIを先に使う。

候補:

- attachment IDを保持
- registered image sizes
- `wp_get_attachment_image()`
- generated `srcset` / `sizes`
- WordPress loading optimization attributes

独自`<picture>`はreal art direction、異なるPC/SP source等の要件がある場合に追加する。

## 12. SVG: exact source + proven optimizer

Figma / production repoに正しいSVGがある場合、AIが近似pathを描き直さない。

```text
existing SVG / exact Figma vector export
→ visual truth保存
→ 必要ならSVGO等でWeb optimization
→ overlay / screenshot QA
```

SVG optimizationは見た目・ID/defs・mask/clip・viewBox等を壊す可能性があるため、最適化後のVisual QAを残す。

SVGO v4では`removeViewBox`/`removeTitle`がdefaultから外されている。これはscalability/accessibilityを守る方向の改善だが、optimizer defaultを盲信せず案件assetを確認する。

## 13. Decorative implementation: hybrid is first-class

吹き出し・あしらい等ではCSS単独を前提にしない。

候補を最初から比較する。

```text
CSS
CSS + SVG
SVG
PNG/WebP
Figma rendered/export asset
```

複雑なshapeをpseudo-element、clip-path、transform、breakpoint patchで無理に再構築し始めたら、CSS + SVG / asset方式を再評価する。

内容はHTML、layout/responsiveはCSS、複雑形状はSVGというhybridを有力候補にする。

実案件Pattern判断は `docs/frontend-decorative-pattern-cookbook.md` を使う。

## 14. Performance: existing measurement stack first

Performance validatorを独自開発する前に、既存Project metrics / RUM / Lighthouse / Lighthouse CI / browser performance toolingを候補にする。

Lighthouse CIはPR reports、resource regression、budgets/assertionsの既存手段として利用可能。ただし全案件へ新しいscore gateを強制しない。

Production field data/RUMが存在する場合はsynthetic scoreだけより優先する。

## 15. External Figma-diff OSS: inspect before adopt

Figma↔browserの比較を行うOSSも再調査対象にする。

2026-08-20時点では`uiMatch`等がFigma/browser structured diffの有力な研究材料だが、maturity / maintenance / project fitを確認してから採用する。

```text
外部に近い解決策がある
→ maturity / maintenance / project fitを確認
→ 実案件trial
→ custom adapterよりHuman Correction Costが下がるなら採用
```

「外部にあるから必ず入れる」でも「experimentalだから無視する」でもない。成熟したらcustom layerを置換できる設計を保つ。

## 16. Custom implementation admission test

新しいcustom infrastructureを作る場合、最低限次を説明できること。

```text
What existing solution was checked?
Why is it insufficient here?
What is the smallest missing adapter/capability?
Who owns it?
How will it be tested/retired?
Does it reduce human correction/rework?
```

これに答えられないcustom infraは実装を止めてreuse候補を再調査する。

実際の採用/退役statusは `docs/frontend-external-integration-matrix.md` を使う。

## 17. Learning goal

成功指標は「自作機能数」でも「外部dependency数」でもない。

観測候補:

- same feedback repeated count
- major rework count
- first-pass visual gap
- human final correction count/cost
- wrong implementation-strategy reversals
- existing component/asset/pattern reuse rate
- time lost to flaky/rerun-only debugging
- duplicated responsibility retired count

学習は:

```text
external proven pattern
→ Project Observation / CANDIDATE as evidence allows
→ real implementation
→ clean replay
→ human correction cost比較
→ repeated success
→ ACTIVE / keep CANDIDATE / RETIRE
```

で行う。

外部tool名はauthorityではない。Company / Existing / Effective Project Contract / Figma visual truthが常に上位。

## External evidence baseline

- Figma Remote MCP: structured design context, screenshots, `download_assets`, design-system search, Code Connect tools when plan supports them
- Figma Code Connect: design ↔ production component mapping; template files are the maintained path after 2026-08-17
- DTCG Design Tokens Format 2025.10: stable Community Group interoperability specification, not W3C Standard
- Storybook / Chromatic / project-equivalent: isolated states, interaction, visual and accessibility tests for shared components
- Playwright: screenshots, image snapshots, Trace Viewer, DOM/network/console evidence, ARIA snapshots
- axe-core / Storybook a11y: automated first-line accessibility detection
- Browserslist + Stylelint/PostCSS ecosystem: shared browser targets and source lint when target toolchain uses them
- `@wordpress/env`: official WordPress development/test environment candidate
- ACF 6.8+ `wp acf json`: official Local JSON import/export/sync CLI
- WordPress `wp_get_attachment_image()`: native responsive media/loading behavior
- SVGO: established SVG optimization pipeline
- Lighthouse CI: existing performance/regression/budget tooling
- uiMatch / similar OSS: structured Figma↔browser comparison research candidate; maturity gate required

External evidenceは固定依存ではない。Toolがdeprecated/sunsetした場合は原理だけ保持し、現在maintainedな手段へ置き換える。