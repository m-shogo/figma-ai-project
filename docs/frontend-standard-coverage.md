# Frontend Standard Coverage Map

Status: ACTIVE audit map

この文書はFrontend Standardで扱う論点がどこに正本化されているかを追跡するためのmapです。

目的:

- 「このアイデアは入っているか」を曖昧にしない
- 同じruleを複数文書へ重複させない
- 将来ruleが進化してもownerを追えるようにする

---

## Core philosophy

| Topic | Canonical owner |
| --- | --- |
| Human-first AI implementation | `frontend-implementation-standard.md` |
| Figma座標をCSSへ写経しない | `frontend-implementation-standard.md` |
| Property禁止を目的化しない | `frontend-implementation-standard.md` / policy |
| Company / Existing code first | `AGENTS.md` / company policy / frontend standard |
| Good implementationを件数削減目的で壊さない | `frontend-implementation-standard.md` |
| Rule lifecycle CORE/ACTIVE/CANDIDATE/etc | `frontend-implementation-standard.md` / policy |

## CSS layout / sizing / positioning

| Topic | Canonical owner |
| --- | --- |
| Normal Flow / Flex / Grid / overlap / absolute decision | `frontend-implementation-standard.md` |
| Content-owned / Asset-owned / UI-owned sizing | `frontend-implementation-standard.md` |
| `width/height/min-*` are not globally banned | standard / policy |
| Absolute is intent-based | standard / policy |
| Hero/MV artwork absolute is valid | standard / pattern library |
| Offset family: absolute/translate/negative margin | standard / policy |
| `clamp()` is a tool, not universal | standard / pattern library |
| `auto-fit` is a tool, not universal | standard / repeatable contract |
| breakpoints are layout boundaries | standard / device policy |
| container query | CANDIDATE in standard/policy |
| logical properties | policy / standard |
| overflow/nowrap review | standard / policy / maintainability QA |
| z-index / stacking context discipline | standard |

## Naming / searchability / CSS structure

| Topic | Canonical owner |
| --- | --- |
| `l- / c- / p- / is-` stable naming | standard / policy |
| BEM owner naming | standard |
| generic `.inner/.title/.box` avoidance | standard / policy |
| class name as repository navigation API | standard |
| One Block = one canonical location | standard / maintainability QA |
| no permanent final-fix/hotfix override zone | standard / policy |
| duplicate selector ownership review | maintainability QA |
| low specificity / single class preference | standard / policy |
| `!important` reason-based exception | standard / policy |
| Native CSS nesting: BEM flat by default | standard |
| `&` mainly parent reference/pseudo/state | standard |
| responsive/state co-location | standard / maintainability QA |
| section ownership boundary comments | standard |
| comments explain WHY | standard |

## HTML / JS / PHP / WordPress / ACF

| Topic | Canonical owner |
| --- | --- |
| semantic HTML / CSS-off meaning | standard |
| wrapper budget | standard |
| DOM source order semantics | standard |
| JS styling class vs `data-js-*` hook separation | standard / policy |
| small interaction owners / safe no-op | standard / policy |
| PHP/ACF read → normalize → escape → render | standard / policy |
| WordPress existing architecture first | AGENTS / WP policy / frontend policy |
| Repeater migration without markup/CSS redesign | repeatable contract |
| unique IDs in repeated interactions | repeatable contract / policy |

## Content resilience

| Topic | Canonical owner |
| --- | --- |
| editable text is dynamic by default | standard / policy |
| 2-line safety | maintainability QA |
| 3-line / long text mutation | maintainability QA / stress QA |
| body 0.5x–2x mutation | maintainability QA |
| long Japanese/Latin token | maintainability QA / policy |
| font fallback / zoom where relevant | maintainability QA / policy |
| absolute artwork must preserve copy-safe area | maintainability QA |
| CSS diff=0 for simple data mutation as GOOD signal | resilience stress QA / resilience policy |

## Repeatable content / Repeater

| Topic | Canonical owner |
| --- | --- |
| same-format sequence triggers repeatability review | repeatable contract / policy |
| parent owns collection layout | repeatable contract |
| item owns internal layout | repeatable contract |
| stable repeated DOM shape | repeatable contract |
| ordinary count change should not need CSS patch | repeatable contract / policy |
| `nth-child` is not banned, but meaning must be real | repeatable contract |
| semantic modifier/data instead of accidental index | repeatable contract |
| mixed title/body length | repeatable contract / stress QA |
| optional field behavior | repeatable contract / stress QA |
| zero/one states | repeatable contract |
| slider count follows actual DOM/data | repeatable contract |
| static → ACF/API/loop migration | repeatable contract |
| stable identity for stateful repeated items | repeatable contract |
| reorder QA | repeatable contract / stress QA |
| supported cardinality range | resilience stress QA / resilience policy |
| Content Shape required/optional contract | resilience stress QA / resilience policy |
| deterministic Fuzz QA | resilience stress QA / resilience policy |
| CMS Stress Preview | resilience stress QA / resilience policy |

## Maintainability / Human repair

| Topic | Canonical owner |
| --- | --- |
| Findability | maintainability QA |
| Locality | maintainability QA |
| Human repair scenarios | maintainability QA / stress QA |
| future-change questions | stress QA |
| Layout Smell Score is diagnostic only | stress QA / resilience policy |
| exception reason/intent/resilience | maintainability QA / implementation policy |
| cleanup budget: temporary/debug/final-fix | maintainability QA |
| CSS line count is not quality score | standard / policy |
| Ownership Map | resilience stress QA / resilience policy |

## Learning system

| Topic | Canonical owner |
| --- | --- |
| Failure Pattern Library | `frontend-pattern-library.md` |
| Good Pattern Library | `frontend-pattern-library.md` |
| Before/After learning examples | pattern library |
| failure → root cause → clean replay → promotion | maintainability QA / stress QA |
| one failure does not create permanent ban | standard / stress QA |
| rule evolution via evidence | standard / AGENTS evidence maturity |

---

## Coverage rule

新しいFrontend実装アイデアを採用する場合:

1. 既存canonical ownerへ入るか確認する。
2. 同じ説明をAGENTS/CLAUDE/複数docsへコピーしない。
3. Human judgementが必要なruleは文章正本へ置く。
4. 静的検出可能なruleだけmachine-readable policyへ落とす。
5. project固有値はcommon standardへ昇格させない。
6. 一度の成功/失敗ではCORE化しない。
7. このmapへownerを追加し、「どこに入ったか」を追跡可能にする。
