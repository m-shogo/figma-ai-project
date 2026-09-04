# Frontend Quick Contract

Status: ACTIVE entrypoint

Frontend実装時に最初に読む短い契約。

- Authority: `docs/frontend-authority-model.md`
- Detail: `docs/frontend-implementation-standard.md`
- Reuse before build: `docs/frontend-reuse-before-build.md`
- External integration / retirement: `docs/frontend-external-integration-matrix.md`
- Decorative patterns: `docs/frontend-decorative-pattern-cookbook.md`
- Visual repair / learning: `docs/frontend-visual-repair-learning-loop.md`
- CSS / Reset foundation: `docs/css-foundation-reset-policy.md`
- Font loading: `docs/frontend-font-loading-policy.md`
- Production runtime: `docs/frontend-production-runtime-contract.md`
- Delivery / Security / Operations: `docs/frontend-delivery-security-contract.md`
- Repeater: `docs/frontend-repeatable-content.md`
- QA: `docs/frontend-maintainability-qa.md`
- Images / Figma delivery format: `docs/image-gradient-visual-tolerance.md`

## 1. Authorityの役割を混ぜない

```text
Company hard constraints
↓
Existing Codebase / Design System = baseline
↔ Explicit authorized Project/Owner override
↓
Effective Project Contract

Visual truth = Figma
Implementation evidence = actual Figma structure/annotation/interaction
Decision framework = Frontend Standard
Last inference = Agent
```

Existingを無視してgeneric best practiceへ飛ばない。一方、Company/security/protected scopeに反しない明示Current Authorityはstale Existing baselineを更新できる。

StandardはEffective Project ContractやFigma visual truthを上書きしない。Figma内部構造もWeb mechanismへ直写ししない。

## 2. Property-banしない

`absolute`、`width/height/min-*`、negative margin、transform、nowrap、`nth-child()`等は禁止ではない。

通常contentのFigma座標写経は避け、art direction・asset・UI等で理由がある場合は普通に使う。

## 3. Layoutはintentから選ぶ

Flow / Flex / Grid / relational overlap / intentional absolute・fixed・sticky / constrained sizingを候補にする。

順番や使用件数をKPIにしない。

## 4. 状態変化で箱をずらさない

Figmaに「hoverで枠が付く」と書いてあっても、Webでは rest から同じ太さの枠を確保する。Company / Existing / 明示Projectが別契約ならそちらが勝つ。

- hover / focus / active / open で初めて `border-width`・`padding`・寸法を変えて箱をずらさない。見える枠が rest に無いなら同じ太さの `transparent` か同色 border を先に置く
- 位置は `transform`。状態変化に transition が無ければ Existing token、無ければ `0.3s`（`::before` / `::after` 含む）
- 外寸・font・gap が近くても、子の線と hover を見てから閉じる

## 5. Owner/searchabilityを守る

Existing namingを最優先する。

Global CSSでは `l-/c-/p-/is-` + BEMをdefault候補にする。

CSS Modules/Vue scoped/SFC等でcomponent/file scopeがownerを明確にする場合、local class名を無理にBEM化しない。

流用しうる塊はページ身元（`body.home` 等）で出さず、呼び出し側の明示パラメーターにする。ページ専用で変動しないものだけ `is_front_page()` / `is_home()` でよい。詳細は `docs/wordpress-acf-policy.md`。

## 6. Canonical ownerを直す

1 Block/Elementにauthoritative base ownerを持たせる。

Visual修正を末尾`final-fix`へ積まず、ownerへ戻して直す。合法なmedia/container/supports ruleはduplicate扱いしない。

## 7. Mobile First + contextual at-ruleをownerへ同居させる

新規/明示的に再設計するCSS authoringは**Mobile Firstをdefault**にする。

- smallest supported mobile layoutを素のbase declarationとして書く
- PC / tablet / wide layoutはshared breakpoint contractの `min-width` overrideを使う
- 同じowner selectorの `@media` / `@container` / `@supports` は、authoring環境が対応する限りそのselector block内へco-locationする
- PC用media queryをstylesheet末尾へまとめる「breakpoint bucket」方式をdefaultにしない
- breakpoint値自体はCompany / Existing / Effective Environment Contractから解決し、AIが`768px`等を勝手に標準化しない
- Required EnvironmentがCSS nesting非対応でtranspileも無い場合だけ、Project contractに明示した例外方式を使う

Preferred authoring:

```css
.sample {
  display: block;
  padding: 24px 16px;

  @media (min-width: 768px) {
    display: flex;
    padding: 64px 40px;
  }
}
```

ここで`768px`は説明用の例。実装では案件のapproved breakpointを使う。

BEM selector自体をDOM構造どおり深くnestすることとは別問題。`.p-block__item`はflat ownerとして保ち、そのownerのresponsive/state/contextだけを近くへ置く。

### Mobile Firstは実装順・QA順まで含む

Mobile FirstはCSS authoring styleだけではない。Company / Project contractが別順序を明示しない限り、Figma-to-Web production executionのdefaultを次で統一する。

```text
Per section:
SP evidence
→ SP implementation
→ SP visual/runtime stabilization
→ PC adaptation
→ PC visual/runtime verification

Final integration:
SP full-page / relevant interaction verification
→ PC full-page / relevant interaction verification
```

PC側の修正がshared CSS、shared component、DOM、JS、asset、token、container等の**SPにも影響し得るowner**を変更した場合、そのsectionまたはfinal integrationの確認順は無効になる。PCだけ再確認して完了せず、影響scopeを**SPから再確認し、その後PC**を確認する。

PC/SPを同時に観測・比較することは禁止しない。重要なのは、実装・stabilization・FINAL acceptanceの基準順を `SP → PC` に固定し、PC修正によるSP regressionを未確認のままFINALにしないこと。

## 8. Production viewportはEnvironment Contractから解決する

通常mobile visual/regression targetの下限は、**Company PolicyのRequired Environment Profiles / Existing product support / 明示Project contract**から解決する。

未確定時に360 CSS pxをexploratory starting pointとして使うことはできるが、共通hard minimumにはしない。数値thresholdはevidenceなしでCORE化しない。

WCAG 2.2 AA Reflowの**320 CSS px equivalent**はProduct support floorとは別のaccessibility probeとして必要時に残す。

## 9. Content riskは複数持てる

`STATIC_AUTHORED / EDITOR_OWNED / LOCALIZED / EXTERNAL_DATA / USER_GENERATED`

例: CMS編集 + 多言語なら `[EDITOR_OWNED, LOCALIZED]`。

Riskに応じてtext/overflow/fallback QAを選ぶ。

## 10. 改行方法もcontractとして選ぶ

- `NATURAL_WRAP`
- `PHRASE_WRAP`
- `AUTHORED_BREAK`
- `TRUNCATION`

Figma screenshotの改行位置だけを理由に`<br>`/nowrapを固定しない。

Phrase単位spanは有力だが、CMS/翻訳文言へ機械適用しない。

## 11. 同一contentのPC/SP DOM二重化をdefaultにしない

同じsource/markupをCSS/layout/art directionで使えるか先に見る。

本当に構造・interaction・sourceが違う場合は分けてよい。その場合はfocus/ID/JS/analytics/CMS重複を確認する。

## 12. Repeatable contentは現在件数へ依存させない

Parentがcollection layout、itemが内部layoutを所有する。

通常件数変更・reorder・optional field・incomplete last rowを必要なsupported rangeで考える。CMS化そのものは強制しない。

## 13. Runtime state / Form / Font / Third-partyを該当時に見る

Figmaの完成stateだけでProduction完成扱いしない。

Relevant scopeでは:

- loading / empty / partial / error / success
- form semantics / autocomplete / IME / autofill / submit state
- fallback font / loading / metric drift
- third-party privacy/security/loading/failure
- localization / language / directionality

を必要な分だけ選ぶ。

全Sectionへ全stateを強制しない。

## 14. Delivery / Security責務を曖昧にしない

Relevant scopeでは:

- private secretをclientへ配送しない
- output/HTML injectionのownerを明確にする
- CSP/security headersはserver/deployment ownerと整合する
- JS failure/error routeにrecovery pathを持つ
- analytics二重発火を避ける
- consent/cache/versioningをProject contractへ従わせる

Section workerがserver policyを勝手に再設計しない。

## 15. JSはvisual classとbehavior/stateを混同しない

Existing hook conventionを使う。`data-js-*`固定ではない。

複数状態表現がある場合、primary state sourceを決める。

## 16. Accessibility / PerformanceもRelevant scopeでFINAL条件

必要に応じて:

- semantic/keyboard/focus/Focus Not Obscured
- Resize Text / Reflow / Text Spacing
- LCP / CLS / INP
- responsive image/loading priority

を確認する。

## 17. QAはrisk-based + blast-radius-based

```text
FAST PR GATE → TARGETED MUTATION → DEEP / PERIODIC
```

全Fuzzを毎PR強制しない。

Breakpoint変更では必要に応じて境界直前/境界/直上も見る。

```text
Section local → section + relevant boundary
Shared component → known dependents + integration
Shared token/font/foundation → broader/global regression
```

既存dependency mapを再利用する。

## 18. Graceful degradationは情報/操作を先に守る

極端条件で全部のgeometryを維持できない場合、文字を極小化・全体scale・情報clipでFigmaへ押し込まない。

Default priority:

```text
情報/機能/A11y
→ brand/hierarchy
→ decorative geometry
→ non-essential motion
```

明示Project contractがあればそちらを優先する。

## 19. Reuse-Before-Build

新しいcomponent/helper/validator/visual engine/asset transportを作る前に:

```text
Effective Project / Existing
→ native Web
→ official Figma / Playwright / WordPress capability
→ Existing Design System/library/Storybook
→ mature OSS / established service
→ project Good Pattern
→ smallest missing custom adapter
```

を確認する。

`docs/frontend-external-integration-matrix.md`でupstreamの採用statusと既存custom pathの退役条件を確認する。

特に、upstreamが重いmechanismを既に解決している場合は**そのmechanismを自作しない**。Project固有のprovenance、authority interpretation、root-cause、repair、learning等の薄いglueだけ残す。

「全部自作」も「外部toolを入れること」もKPIにしない。Human correction/reworkと重複責務を本当に減らす最小構成を選ぶ。

## 20. DecorativeはCSS-onlyを成功条件にしない

吹き出し・不規則線・texture等は最初から:

```text
CSS / CSS + SVG / SVG / raster / Figma exact export
```

を比較する。

Figma/Existingに正しいassetがあるなら描き直さない。pseudo-element/clip/transform/breakpoint patchがshape再現のために増殖するならmechanismを再評価する。納品形式（写真・ラスター fill → WebP、ベクター logo/icon → アウトライン SVG）は `docs/image-gradient-visual-tolerance.md`。

## 21. Visual repairはroot cause + learningへ戻す

Visual差分は原則:

```text
Layout → Typography → Asset → Color → Decoration → subpixel
```

の順で原因を絞る。

Runtime/interaction failureはblind rerunよりTrace等の既存evidenceを先に使う。修正はcanonical ownerへ戻す。

「前にも言った」「また同じ」等のfeedbackは単発bugで閉じず、failure category → root cause → detection → Observation → replay → promotion/demotionへ戻す。

Human correction count/timeはdiagnosticとして記録し、現時点で全案件共通の固定分数gateにはしない。

## 22. FINAL

Visual Fidelityに加えてRelevant scopeで:

- owner/searchability
- content/repeater/responsive resilience
- runtime/form/font/third-party resilience
- delivery/security responsibility clarity
- interaction/A11y
- performance/loading responsiveness
- reuse-before-build / external integration decision quality
- duplicated responsibility avoidance
- decorative mechanism/source appropriateness
- dependency-appropriate regression
- human repairability / correction cost awareness
- no unexplained override accumulation

を満たす。

目標はCSS propertyを減らすことでもAIだけで100%一致させることでもなく、**Figmaを高精度に再現し、既存の優れた仕組みを積極的に使い、同じやり直しを減らしながら、未来の人間が安全かつ短時間で変更できるProduction Webを最初から作ること**。