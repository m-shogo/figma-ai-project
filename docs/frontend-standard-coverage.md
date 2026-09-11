# Frontend Standard Coverage Map

Status: ACTIVE audit map

「このアイデアは正本のどこへ入っているか」を追跡する。説明を複数docsへ無秩序にコピーせず、topic ownerを明確にする。

## Entrypoint / authority

| Topic | Canonical owner |
| --- | --- |
| Frontend authority interpretation | `frontend-authority-model.md` |
| Short rules agents read first | `frontend-quick-contract.md` |
| Detailed implementation rules | `frontend-implementation-standard.md` |
| Reuse-before-build / custom admission | `frontend-reuse-before-build.md` |
| External integration / fallback / retirement status | `frontend-external-integration-matrix.md` |
| Decorative implementation mechanism / Complexity Escape | `frontend-decorative-pattern-cookbook.md` |
| Section visual repair / root-cause learning loop | `frontend-visual-repair-learning-loop.md` |
| Human FB categories as AI weak spots; run without being asked | `agent-human-fb-weak-spots.md` |
| CSS technology/architecture selection | `css-strategy.md` |
| CSS reset/base/environment selection | `css-foundation-reset-policy.md` |
| Font loading/metrics | `frontend-font-loading-policy.md` |
| Production runtime states/forms/third-party/i18n | `frontend-production-runtime-contract.md` |
| Delivery/security/analytics/cache/error boundary | `frontend-delivery-security-contract.md` |
| Company/Existing/Explicit contract roles | authority model + `AGENTS.md` |
| Portable knowledge lives in Git, not client adapters | `AGENTS.md` Knowledge placement + `agent-adapters.md` |
| Figma visual authority | authority model + `AGENTS.md` |
| Figma delivery format (WebP photos / outlined SVG logos) | `image-gradient-visual-tolerance.md` + `config/frontend-raster-asset-export-policy.yaml` |
| Explicit Figma instruction vs inferred structure | authority model + `figma-instruction-evidence.md` |
| Frontend Standard is decision framework, not higher authority | authority model + policy |
| Rule lifecycle CORE/ACTIVE/CANDIDATE | standard + policy |
| Policy invariants in CI | `validate_frontend_implementation_policy.py` |

## Naming / owner

| Topic | Canonical owner |
| --- | --- |
| owner/searchability is CORE | quick contract + policy |
| global CSS `l-/c-/p-/is-` + BEM default | quick contract + standard |
| CSS Modules/Vue scoped/SFC may use local names when scope is unambiguous | quick contract + policy |
| Existing naming architecture wins | authority model + quick contract |
| generic global owner-less classes are a smell | standard + policy |
| class name as repository navigation API | standard |
| one authoritative base owner | standard + QA |
| legal selector repetition across contexts | standard + QA |
| no permanent final-fix zone | standard + policy |

## CSS foundation / layout / sizing / positioning

| Topic | Canonical owner |
| --- | --- |
| reset vs base vs environment responsibility | reset policy + company policy |
| Existing reset/theme foundation first | reset policy |
| Tailwind Preflight/framework-native reset detection | reset policy |
| avoid double reset | reset policy |
| form/focus/media reset side effects | reset policy |
| Property-banしない | quick contract + standard + policy |
| Flow/Flex/Grid/overlap/absolute decision | standard |
| Content/Asset/UI sizing ownership | standard + policy |
| `width/height/min-*` not globally banned | standard + policy |
| Hero/MV artwork absolute is valid | standard + pattern library |
| absolute/translate/negative margin family review | standard + policy |
| Figma rendered coordinates != Web constraints | authority model + standard |
| hover/focus must not introduce border-width or box metrics | quick contract + standard + interaction policy + policy |
| reserve hover border at rest; transition 0.3s / Existing token including pseudos | quick contract + interaction policy |
| invert hover keeps rest border; text-link hit is text width; disabled has no enabled hover box | quick contract + interaction policy |
| clip-path/octagon hover must not eat stroke | quick contract + decorative cookbook |
| clamp/auto-fit are tools, not universal | `css-strategy.md` + standard |
| breakpoint is layout boundary | standard + device policy |
| product support floor resolves from Effective Environment Contract; 360px is unresolved CANDIDATE only | quick contract + runtime contract + policy |
| WCAG Reflow 320 CSS px equivalent is separate probe | runtime contract + QA + policy |
| breakpoint boundary continuity | quick contract + policy + Section Manifest |
| modern CSS candidate adoption | standard + `css-strategy.md` |
| Cascade Layers are tool, not goal | `css-strategy.md` |
| z-index/local stacking/isolation | `css-strategy.md` |
| overlay dim is full viewport; panel on top; do not clip a hole; cover header chrome | quick contract + interaction policy + `css-strategy.md` |
| sticky header stacking: dim in same SC as panel; do not unstick header | quick contract + `css-strategy.md` |
| overlay close keeps open layout and shared duration | quick contract + interaction policy |
| Existing Browserslist as shared browser-target source when present | reuse-before-build + external integration matrix |
| Existing Stylelint/PostCSS before new regex CSS parser | reuse-before-build + external integration matrix |

## Native nesting / specificity

| Topic | Canonical owner |
| --- | --- |
| global BEM selector flat by default | standard + `css-strategy.md` |
| scoped CSS uses existing convention | quick contract + policy |
| `&` parent reference usage | standard |
| native nesting specificity trap | standard + pattern library |
| parser/AST-aware duplicate/specificity lint | standard + policy + reuse-before-build |
| `!important` reason-based | standard |

## HTML / DOM / responsive source

| Topic | Canonical owner |
| --- | --- |
| semantic HTML | standard |
| CSS-off meaning | standard |
| heading/list/button-anchor semantics | standard |
| DOM source order / visual order | standard + QA |
| wrapper budget | standard |
| avoid duplicate PC/SP DOM by default | quick contract + standard + policy |
| materially different PC/SP structure can justify separate markup | quick contract + standard |

## Content resilience / line strategy

| Topic | Canonical owner |
| --- | --- |
| multiple content risk factors can coexist | quick contract + standard + policy |
| STATIC_AUTHORED / EDITOR_OWNED / LOCALIZED / EXTERNAL / USER GENERATED | QA + policy |
| 1/2/3 line mutation | QA |
| uneven content | QA + stress |
| long Japanese/Latin | QA |
| font fallback | QA + font policy |
| nowrap/fixed text block/line-clamp review | standard |
| viewport-only typography warning | standard + policy |
| NATURAL_WRAP | quick contract + policy |
| PHRASE_WRAP | quick contract + policy + pattern learning |
| AUTHORED_BREAK | quick contract + standard |
| TRUNCATION | quick contract + standard + policy |
| screenshot line break != automatic contract | quick contract + policy |
| phrase wrapping must not be mechanically applied to CMS/localized copy | quick contract + policy |
| optional Section line strategy metadata | `templates/section-manifest.yaml` |

## Repeatable content

| Topic | Canonical owner |
| --- | --- |
| same-format sequence review | repeatable contract |
| parent owns collection | repeatable contract |
| item owns internals | repeatable contract |
| stable item DOM/semantic shape | repeatable contract |
| ordinary count change without coordinate patch | repeatable contract |
| supported cardinality range | repeatable contract |
| incomplete last-row behavior | repeatable contract |
| `nth-child` not globally banned | repeatable contract |
| semantic variant vs accidental index | repeatable contract |
| optional field behavior | repeatable contract |
| zero/one state | repeatable contract |
| reorder QA | repeatable contract + stress |
| stable identity for stateful list | repeatable contract |
| static → ACF/API/loop migration | repeatable contract |

## JavaScript / state / forms

| Topic | Canonical owner |
| --- | --- |
| styling/behavior hook separation | standard + policy |
| `data-js-*` is not mandatory | standard + policy |
| Existing project hook convention first | policy |
| one primary state source | standard + policy |
| ARIA/data/component state sync | QA |
| small interaction owner/safe no-op | standard |
| form semantic labeling | runtime contract + policy |
| autocomplete/inputmode/enterkeyhint | runtime contract + policy |
| IME composition safety | runtime contract + policy |
| autofill layout/state | runtime contract + policy |
| submit lifecycle | runtime contract + policy |
| error not color-only | runtime contract + policy |

## Runtime async states

| Topic | Canonical owner |
| --- | --- |
| DEFAULT/LOADING/EMPTY/PARTIAL/ERROR/SUCCESS | runtime contract + policy |
| empty vs error distinction | runtime contract + policy |
| offline/network failure when relevant | runtime contract + policy |
| CMS missing/zero data behavior | runtime contract + repeatable contract |
| state mutation QA | runtime contract + Section Manifest |

## WordPress / PHP / ACF

| Topic | Canonical owner |
| --- | --- |
| Existing architecture first | authority model + standard + WP policy |
| read→normalize→escape→render | standard |
| avoid scattered fetch logic | standard + policy |
| Repeater is editor-capability decision, not visual repetition alone | `wordpress-acf-policy.md` |
| ACF Repeater content shape/cardinality | repeatable contract + WP policy |
| ACF optional fields | repeatable contract + WP policy |
| field naming/searchability | `wordpress-acf-policy.md` |
| art-directed editable copy constraints | `wordpress-acf-policy.md` |
| importable JSON requirement | implementation targets + `acf-json-delivery.md` |
| ACF 6.8+ official `wp acf json` before custom import/export | `acf-json-delivery.md` + external integration matrix |
| official `@wordpress/env` before new generic WP Docker fixture | reuse-before-build + external integration matrix |
| native attachment responsive image pipeline first | reuse-before-build + WP policy |
| Local WP PHP upload/memory limits + fatal guard | `experiments/wordpress-acf-runtime/README.md` + `php/conf.d/99-local-limits.ini` |
| Reusable template parts take explicit feature args | `wordpress-acf-policy.md` |
| Budokan ACF / CPT / directory map / menu gate | `experiments/budokan-wordpress/CURRENT_AUTHORITY.md` |

## Accessibility / i18n

| Topic | Canonical owner |
| --- | --- |
| semantic control/keyboard/focus | standard + QA |
| Resize Text | standard + QA |
| Reflow 320 CSS px equivalent | standard + QA + policy |
| Text Spacing | standard + QA + policy |
| 200% zoom is not catch-all QA | standard + pattern library |
| Focus Not Obscured | quick contract + standard + QA + policy |
| source/visual/focus order | standard + QA |
| reduced motion | standard + environment policy |
| localized != text expansion only | runtime contract + policy |
| `lang` semantics | runtime contract + policy |
| `dir=ltr/rtl/auto` | runtime contract + policy |
| logical properties from actual bidi need | runtime contract + policy |
| ARIA snapshots as selective semantic regression evidence | visual repair loop + reuse-before-build |
| axe-core/project detector before custom accessibility engine | reuse-before-build + external integration matrix |

## Font loading / typography runtime

| Topic | Canonical owner |
| --- | --- |
| font is shared layout dependency | font policy + policy |
| family/source/weight/axes/fallback contract | font policy |
| fallback → final render stability | font policy + QA |
| `font-display` reason-based | font policy + policy |
| metric overrides/`size-adjust` measured use | font policy + policy |
| CJK/glyph coverage | font policy |
| font change expands regression scope | font policy + policy |

## Media / performance / third-party

| Topic | Canonical owner |
| --- | --- |
| HTML intrinsic dimensions != CSS fixed size | standard + pattern library |
| CLS reservation | standard + QA |
| responsive images/srcset/sizes candidate | standard + QA + reuse-before-build |
| picture for real art direction | standard + reuse-before-build |
| LCP/Hero not mechanically lazy | standard + policy |
| below-fold lazy candidate | standard + policy |
| fetchpriority measured/limited | standard + policy |
| oversized image delivery | QA |
| INP/interaction responsiveness when relevant | quick contract + standard + QA + policy |
| third-party trust boundary | runtime contract + policy |
| consent/sandbox/SRI/CSP review when relevant | runtime contract + delivery security contract |
| embed reserved size/CLS | runtime contract |
| third-party failure fallback | runtime contract + policy |
| exact SVG source before redraw | reuse-before-build + decorative cookbook |
| SVG optimization + post-optimization visual verification | reuse-before-build + decorative cookbook |
| Lighthouse/Lighthouse CI/project RUM before custom performance engine | reuse-before-build + external integration matrix |

## Decorative fidelity

| Topic | Canonical owner |
| --- | --- |
| CSS-only is not a success condition | decorative cookbook + quick contract + policy |
| compare CSS / CSS+SVG / SVG / raster / exact export | decorative cookbook + policy |
| Complexity Escape Rule | decorative cookbook + policy |
| live content vs decorative geometry ownership | decorative cookbook |
| exact Figma/export asset checked before redraw | decorative cookbook + reuse-before-build |
| responsive shape/text/crop behavior | decorative cookbook |
| REF-001 Student Voice exact-SVG observation | decorative cookbook + `research/ref001-v2-v3-frontend-learning-2026-08-20.md` |
| decorative pattern promotion requires repeated evidence | decorative cookbook + policy |

## Delivery / security / operations

| Topic | Canonical owner |
| --- | --- |
| frontend vs server/deployment security responsibility | delivery security contract |
| no private secret in client bundle/HTML | delivery security contract + policy |
| CSP/security headers owner | delivery security contract + Company/deployment policy |
| output escaping/sanitization ownership | delivery security contract + WP/framework policy |
| JS failure/progressive enhancement | delivery security contract |
| 404/500/error route recovery | delivery security contract |
| analytics event ownership / duplicate firing | delivery security contract + policy |
| consent lifecycle / gated integrations | delivery security contract + runtime contract |
| form abuse/spam is not frontend-validation-only | delivery security contract |
| cache busting / asset versioning | delivery security contract |
| source maps/debug artifacts | delivery security contract |
| staging/production noindex/canonical drift | delivery security contract + runtime SEO ownership |
| RUM/client error reporting when required | delivery security contract, PROJECT capability |

## Graceful degradation / native capability / optional capabilities

| Topic | Canonical owner |
| --- | --- |
| information/functionality before decorative geometry | runtime contract + policy |
| do not default to tiny text/blanket scale/hidden content | runtime contract + policy |
| project can override degradation priority | runtime contract + policy |
| Native Web API adoption uses Existing→Need→Browser Matrix | runtime contract + policy |
| feature availability alone does not force migration | runtime contract + policy |
| Popover/Dialog/ViewTransition/etc. are candidates, not mandates | runtime contract + interaction policy |
| print/PDF/offline/PWA/reduced-data/RTL/SEO are optional capabilities | runtime contract + policy |
| analytics/consent/cache/error-route/RUM are optional capabilities | delivery security contract + policy |

## Change Impact / Regression Scope

| Topic | Canonical owner |
| --- | --- |
| QA scope follows dependency blast radius | quick contract + policy |
| Section-local change → section + relevant boundary | quick contract + policy |
| shared component change → known dependents + integration | quick contract + policy |
| shared token/font/foundation → broader/global regression | quick contract + policy + font policy |
| changed line count is not impact proxy | policy |
| reuse existing dependency maps | policy + Section Manifest |
| dependency-driven QA selector | runtime contract + policy, CANDIDATE |
| optional Section change-impact metadata | `templates/section-manifest.yaml` |

## QA strategy

| Topic | Canonical owner |
| --- | --- |
| FAST PR GATE | standard + QA |
| TARGETED MUTATION | standard + QA |
| DEEP/PERIODIC | standard + stress QA |
| deterministic fuzz | stress QA |
| pairwise/representative combinations | stress QA + policy |
| avoid Cartesian explosion | stress QA + policy |
| CMS Stress Preview | stress QA |
| CSS diff=0 as Good signal | stress QA |
| Layout Smell Score diagnostic only | stress QA |
| Human change cost | stress QA + QA + visual repair loop |
| Playwright screenshot primitives before custom engine | reuse-before-build + visual repair loop |
| arbitrary Figma/runtime image-pair diff uses mature library + thin glue | external integration matrix + tooling audit |
| Trace before blind rerun | reuse-before-build + visual repair loop |
| visual diagnostic priority Layout→Typography→Asset→Color→Decoration→subpixel | visual repair loop + policy |
| endpoint fidelity and runtime resilience are separate axes | visual repair loop + existing candidate evidence |
| Percy direct Figma-design comparison is a conditional high-value external trial | external integration matrix + tooling audit |
| hosted visual review is conditional, not common core | external integration matrix + tooling audit |

## Reuse / external tooling

| Topic | Canonical owner |
| --- | --- |
| Existing/native/official/design-system/OSS before custom | reuse-before-build + policy |
| integration status `USE_NOW/USE_WHEN_PRESENT/CONDITIONAL/CLEAN_REPLAY_CANDIDATE/KEEP_SMALL_GLUE/RETIRE_AS_DEFAULT` | `frontend-external-integration-matrix.md` |
| custom implementation admission test | reuse-before-build + external integration matrix |
| Figma `download_assets` before fallback bridge | reuse-before-build + external integration matrix |
| Code Connect template path after 2026-08-17 | reuse-before-build + tooling audit |
| Code Connect entitlement failure uses thin fallback, not clone | component resolution + external integration matrix |
| Figma design-system search when available | component resolution + external integration matrix |
| DTCG 2025.10 stable Community Group format, not W3C Standard | reuse-before-build + tooling audit |
| existing Storybook surface before custom preview harness | reuse-before-build |
| Playwright before custom browser/trace/ARIA engine | reuse-before-build + visual repair loop |
| mature image-diff library before custom pixel algorithm | external integration matrix + tooling audit |
| Browserslist / Stylelint ecosystem before duplicate browser/CSS lint machinery | reuse-before-build + external integration matrix |
| WordPress `@wordpress/env` clean replay candidate | external integration matrix + tooling audit |
| ACF official CLI adoption | `acf-json-delivery.md` + tooling audit |
| Percy Figma comparison trust boundary / trial | external integration matrix + tooling audit |
| external Figma-diff OSS maturity gate | reuse-before-build + tooling audit |
| external releases/capabilities tracked by existing Update Radar | `config/update-sources.yaml` + external integration matrix |
| current external research evidence | `research/frontend-existing-tooling-audit-2026-08-20.md` |

## Learning / repair

| Topic | Canonical owner |
| --- | --- |
| Fix canonical owner instead of symptom | standard + visual repair loop |
| repeated patch = review signal, no hard count | standard + policy |
| Failure Pattern Library | pattern library |
| Good Pattern Library | pattern library |
| Before/After learning | pattern library |
| one failure does not create permanent ban | standard + pattern library + visual repair loop |
| evidence promotion | standard + existing evidence maturity + visual repair loop |
| repeated user feedback triggers root-cause learning | visual repair loop + policy |
| frequent Human FB types are AI weak spots; do not wait to be asked | `agent-human-fb-weak-spots.md` + `AGENTS.md` + execution policy |
| root-cause taxonomy | visual repair loop + run record |
| Human Correction Count/Minutes diagnostic | visual repair loop + run record |
| reuse-rate observations are diagnostic, not hard KPI | reuse-before-build + run record + policy |
| duplicated responsibility retirement | external integration matrix + tooling audit |
| V2→V3 learning record | `research/ref001-v2-v3-frontend-learning-2026-08-20.md` |
| runtime/form/font/vendor failures return to playbook | runtime contract + font policy + playbook |
| delivery/security/cache/analytics incidents return to playbook | delivery security contract + playbook |

## Coverage maintenance rule

新しいFrontend ideaを採用するとき:

1. Existing canonical ownerへ入るか確認する。
2. `AGENTS.md`へ詳細ruleを大量複製しない。
3. Human judgementが必要なものは文章standardへ置く。
4. Staticに安全に判定できるinvariantだけmachine policyへ落とす。
5. project固有値をcommon ruleへ昇格させない。
6. 数値thresholdは十分なevidenceが無ければCANDIDATEにする。
7. 既存dependency/Section metadataを再利用し、新しいmanifest familyを増やしすぎない。
8. upstream external capabilityを調べ、`frontend-external-integration-matrix.md`で採用/fallback/退役責務を解決する。
9. このmapへcanonical ownerを追加する。
10. Detail docが増えたらQuick Contractの可読性を優先し、AI entrypointを肥大化させない。