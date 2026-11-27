# REF-001 Frontend Standard Clean Replay — Before / After Validation

## Executive verdict

**Current Final wins overall.**

The Frontend Standard Clean Replay did prove several useful improvements: it reached a semantically valid, runtime-safe page quickly, required only one implementation repair round, kept `!important` at zero, avoided a postfix override layer, and did not invent unresolved interactions.

However, the replay did **not** reproduce the production-quality REF-001 implementation from the canonical rules alone. It missed the explicit WordPress + ACF implementation target, introduced a non-owner intermediate breakpoint, left 19 exact raster slots unresolved, used materially more explicit pixel dimensions than Current Final, and remained substantially farther from the Figma page geometry.

This is therefore a useful negative result: **the prose rules contain much of the right knowledge, but the current execution path does not reliably enforce that knowledge before coding begins.**

The experiment should not be “fixed into a win” by rebuilding it after Current Final has been read. That would destroy the clean-context evidence. The correct learning is to strengthen the executable preflight/gates and run a new clean replay later.

---

## Experiment integrity

- Frozen base: `so@9285c29dbf5b01d153d4c8b9c3d76ff3777b6d32`
- Dedicated branch: `agent/ref001-frontend-standard-clean-replay`
- Draft PR: `#182`
- First Pass implementation frozen at `b6d6e3dfe49c488fbf5c128e6b901249abf08de5`
- Old/current REF implementation bodies were not read before First Pass freeze.
- Later `so` changes were not rebased into the replay; they are read-only comparison evidence.
- Current Final comparison point: `0f0aad4aec3348e02b477f14cea3e2872efaa6f8` / PR `#183`.
- Existing REF-001 latest/final, Claude Code work, V3, and unrelated REF-002 work were not modified.
- No merge is part of this experiment without explicit user approval.

Two accidental pre-freeze information exposures are recorded in `run.yaml`: an old repair description in Git metadata and aggregate historical scores in the root README. Neither old implementation body nor old repair patch was opened before freeze.

---

## Figma authority used by the replay

Structured Figma authority was read for all 12 logical owners before implementation:

1. Header
2. Main Visual
3. Reason
4. Education
5. CTA after Education
6. Student Voice
7. Messages
8. CTA before Courses
9. Courses
10. Links
11. CTA Value
12. Footer

Reference roots:

- PC: `21384:8173`, 1380 × 7714
- SP: `21376:4401`, 375 × 10817
- SP contains a 40px Figma status bar, so the effective web-content reference height is 10777px.

Variables, masks, exact-asset evidence, annotations, and motion/prototype evidence were inspected. Code Connect remained `UNDETERMINED_PLAN_SEAT_LIMIT`.

### Interaction result

The replay intentionally did **not** invent accordion/carousel behavior.

The frozen authority/reference contract leaves Student Voice and Messages behavior unresolved. Student Voice had no prototype motion evidence; Messages visually indicates `1 / 4` but does not provide the missing slide data or a complete carousel contract. Therefore static behavior is not counted as a Clean Replay interaction failure. Current Final contains additional resolved production behavior, but that is not evidence the clean agent was allowed to infer it from the frozen authority.

This part of the existing policy worked correctly and does not need another rule.

---

## First Pass result

### Speed / rework

- measured ledger → First Pass commit window: **8.45 min**
- full wall-clock time before the ledger commit: not reliably measurable
- implementation repair rounds after freeze: **1**
- human intervention: **0**
- postfix/repair CSS files: **0**
- `!important`: **0**
- tool/route strategy reversals: **2**
  - temporary Figma asset download → canonical asset-intake/pending route
  - Playwright `NODE_PATH` → temporary workspace co-location

The first browser-valid First Pass had horizontal overflow at only two widths:

- 320px: +5px
- 390px: +3px

There were no runtime errors, console errors, failed requests, broken formal images, duplicate IDs, duplicate `<main>`, or duplicate `<h1>`.

Repair 1 changed only the canonical stylesheet (`+9/-8` lines) and removed horizontal overflow at every tested width from 320 through 1380.

Residual detector overhang at 320/375 is limited to the Hero small-title element box; document scroll width is still equal to viewport width. It remains recorded as a low-severity typography-box issue rather than being hidden with an overflow patch.

---

## Five-axis comparison

| Axis | Frontend Standard Clean Replay | Current Final | Result |
| --- | --- | --- | --- |
| Visual Fidelity | Exact raster fidelity blocked; endpoint geometry PC -2.09%, SP -1.31%; significant section-local drift | Exact assets present; PC -0.48%, SP -0.04%; section spacing repeatedly remeasured against Figma | **Current Final wins clearly** |
| Responsive Structure | Runtime-safe after 1 repair, but adds an unauthorized 768–1100 intermediate rule and uses many fixed pixel dimensions | One project breakpoint at 768 plus intrinsic/fluid sizing; 17-width no-scroll validation | **Current Final wins** |
| Interaction / Runtime | 0 runtime/console errors; no invented unresolved behavior; 0 overflow after repair | 34/34 render-contract checks, no horizontal scroll, production interaction code and data substitution checks | **Runtime safety roughly tied; production completeness Current Final wins** |
| Maintainability | Small, one stylesheet, 0 `!important`, no patch layer; but wrong implementation family and more explicit geometry | Much larger codebase, but one-section/one-owner structure, FLOCSS/BEM, cascade layers, WordPress packaging, content robustness | **Mixed; production maintainability favors Current Final** |
| Human Repairability | Easy local CSS discovery, but source-only static HTML and no ACF production edit path | Section-to-code mapping documented; WordPress template + optional ACF edit path; variable-content stress proven | **Current Final wins for real production maintenance** |

---

## Visual / geometry evidence

### Full-page endpoint geometry

| Viewport | Figma web reference | Clean Replay | Clean delta | Current Final | Current delta |
| --- | ---: | ---: | ---: | ---: | ---: |
| PC 1380 | 7714px | 7553px | **-161px / -2.09%** | 7677px | **-37px / -0.48%** |
| SP 375 | 10777px | 10636px | **-141px / -1.31%** | 10773px | **-4px / -0.04%** |

Full-page height alone is not treated as a fidelity score because section errors can cancel each other. The Clean Replay shows exactly that problem.

### Clean Replay PC section drift examples

Figma → Clean runtime start positions:

- Education: 1541 → 1560 (**+19px**)
- first CTA: 2225 → 2275 (**+50px**)
- second CTA: 4783 → 4670 (**-113px**)
- Courses: 5111 → 4998 (**-113px**)
- CTA Value: 7029 → 6868 (**-161px**)
- Footer: 7357 → 7196 (**-161px**)

This shows that “page height looks close” would be an unsafe acceptance rule. Section boundaries need to be measured throughout the page.

### Clean Replay SP drift examples

Using Figma positions minus the 40px status bar:

- Hero starts correctly at 67 but is about 22px taller than the authored MV band.
- Education begins about **+61px** late.
- first CTA begins about **+54px** late.
- Messages is about **-183px** early relative to its Figma content start.
- later errors partially cancel, but CTA Value/Footer remain about **-141px** early.

Current Final PR #183 specifically remeasured section bands and reduced the final whole-page error to 4px on SP.

---

## Asset fidelity

The Clean Replay discovered exact Figma asset references but could not materialize their bytes in the execution environment. The existing canonical intake path was retained instead of building a custom bridge.

- reusable formal assets actually reused: **9**
  - 2 MV decorative SVGs
  - 7 course icons
- unresolved exact raster slots: **19**
- asset-slot reuse ratio for the identified set: **9 / 28 = 32.1%**
- overall implementation reuse rate: not reliably quantifiable with the current metric definition

Because the 19 raster slots are still pending, the Clean Replay cannot receive a true visual-fidelity PASS. Screenshot placeholders are not equivalent to exact Figma media.

Current Final has the materialized production assets, so it wins asset fidelity by construction as well as by visual evidence.

---

## CSS / structure comparison

Mechanical counts are useful diagnostics, not automatic quality scores.

| Metric | Clean Replay | Current Final |
| --- | ---: | ---: |
| CSS bytes | 29,158 | 88,287 |
| CSS lines | 370 | 2,471 |
| `!important` | **0** | 3 |
| `position:absolute` declarations | 16 | **14** |
| explicit `width:px` | 41 | **20** |
| explicit `height:px` | 42 | **2** |
| explicit width+height px | **83** | **22** |
| `clamp()` | 11 | **99** |
| `white-space:nowrap` | 2 | **0** |
| CSS Grid declarations | 47 | 48 |

The surprising result is important: the much smaller Clean CSS is **not automatically more fluid**. It actually relies on more explicit pixel geometry and slightly more absolute-position declarations than Current Final.

No mechanical count proves an `absolute` declaration is unnecessary. The experiment therefore records `16` mechanical declarations but does not falsely label all or part of them “unnecessary” without owner-level classification.

Current Final's larger size also includes production behavior the Clean Replay lacks: WordPress packaging, asset-complete fidelity, robust content handling, documented interaction behavior, and extensive visual repair history.

---

## Biggest failure: the agent chose the wrong implementation family

The canonical project already had a machine-readable implementation profile:

`experiments/ref001-wordpress-acf/implementation-profile.yaml`

It requires:

- `family: WORDPRESS`
- server-rendered PHP
- ACF enabled
- importable ACF export

The Clean Replay nevertheless produced static `index.html` + CSS.

This is not evidence that the Standard lacks the idea. `docs/implementation-target-profile.md` already says the **first implementation decision is where the Figma is being implemented**, and explicitly says not to start section code while that remains implicit. Its resolution order freezes the Implementation Profile before section execution.

Therefore the root cause is more precise:

> **The correct rule exists in prose/config, but the execution path did not make compliance fail-closed.**

The current `Section Execution Gate` verifies shared-contract lineage, breakpoint records, Figma mapping, dependencies, ownership, and worker isolation, but it does not currently fail a worker because its actual output family conflicts with the frozen Implementation Profile.

This is the strongest learning from the replay.

Rebuilding the Clean branch into WordPress after reading Current Final would hide that failure. The branch intentionally keeps the architecture miss visible.

---

## Responsive-policy failure

The frozen project contract defines one owner breakpoint:

- mobile <= 767
- desktop >= 768

The responsive policy explicitly says an AI must not invent section-specific or customary extra breakpoints without owner evidence.

The Clean Replay nevertheless contains an intermediate 768–1100 rule.

This is a second case where the prose rule is already correct but output enforcement is incomplete. Current Final eventually converged to a mobile-first implementation using the authored 768 threshold plus intrinsic responsiveness.

---

## What improved with the new Standard

1. **Patch archaeology was dramatically reduced.** One canonical stylesheet was repaired instead of stacking override files.
2. **`!important` dependence was eliminated in the replay.** First Pass and Repair 1 both remain at zero.
3. **Root-cause repair worked.** The 320/390 overflow was fixed by grid/min-content, sizing, margin, and link-grid ownership rather than `overflow:hidden` patches.
4. **Section authority lineage was explicit.** All 12 PC/SP section owners are recorded.
5. **Runtime safety came quickly.** After one implementation repair, tested widths have zero horizontal overflow and zero runtime/console errors.
6. **Unresolved interactions were not invented.** This is exactly the desired authority behavior.
7. **Tool failure did not create custom infrastructure.** Both asset and Playwright blockers changed route rather than adding permanent wrappers/bridges.

---

## What did not improve enough

1. **Figma fidelity.** The Clean result remains materially farther from Figma than Current Final.
2. **Asset completion.** Structured authority alone did not solve the exact-raster byte handoff.
3. **Typography certainty.** Exact runtime font/media fidelity is not complete; a Hero title-box overhang remains at narrow widths.
4. **Section vertical rhythm.** Local section errors accumulate/cancel even when whole-page height looks acceptable.

---

## What became worse / exposed a Standard execution problem

1. **Implementation-family selection failed.** Static HTML was built despite a frozen WordPress+ACF project target being available.
2. **Breakpoint ownership failed.** An extra intermediate breakpoint was introduced without owner evidence.
3. **Fixed geometry stayed high.** The Clean CSS contains 83 explicit width/height pixel declarations versus 22 in Current Final.
4. **Small code size was a false positive.** The replay is smaller partly because it omits production obligations rather than because it solved them more elegantly.

---

## Repair-effort comparison

The Clean Replay required only **one implementation repair round** after First Pass to become runtime-safe at the tested widths, with no human intervention.

Current Final has a long sequence of post-package refinement work across responsive continuity, fixed/absolute reduction, Figma remeasurement, section-by-section PC/SP reconstruction, Voice/Messages, Reason/Courses/Links/Footer, Header, long-text robustness, typography, speech-bubble geometry, and final section spacing. The sequence includes PRs in the #165–#183 range.

Those PRs are **not** treated as one-to-one “repair rounds”; that would be an invalid metric. They do prove that Current Final consumed substantially more iterative refinement to reach its present fidelity.

So the real tradeoff is:

- Clean Replay: **much lower rework, materially lower final quality/completeness**
- Current Final: **much higher rework, materially higher production fidelity/completeness**

The desired future state is not to choose either extreme. It is to preserve Clean's low-rework structure while enforcing the project target and section-fidelity gates early enough to reach Current Final quality with fewer iterations.

---

## Standard changes justified by this experiment

Do **not** add another large prose rule set. The missing value is enforcement of rules that already exist.

### P0 — bind Implementation Profile into the execution gate

Before any section worker can run, require:

- frozen Implementation Profile path/hash
- effective target family
- target route/template
- CMS/data-source requirement
- required delivery artifacts

Then fail closed when output contradicts the profile. Examples:

- WORDPRESS + ACF → PHP/template evidence + ACF export required
- STATIC_WEB → static entry/output contract required
- framework target → correct framework/runtime evidence required

This would have prevented the largest Clean Replay failure before any section CSS was written.

### P0 — validate actual CSS media queries against the frozen breakpoint contract

The current gate validates the breakpoint record, but the produced CSS also needs a cheap contract check.

For this project, any viewport threshold other than the owned 768 boundary should fail or require an explicit recorded exception. Intrinsic `grid`, `flex-wrap`, `minmax`, `clamp`, percentages, and container-driven sizing remain allowed.

This would have rejected the Clean 768–1100 rule immediately.

### P1 — make section geometry a First Pass evidence gate

After each logical section wave, record at least:

- authored Figma top / height
- runtime top / height
- delta
- cumulative downstream drift

Do not wait for whole-page completion. This prevents +50px and -113px section errors from canceling and looking acceptable at the final page height.

### P1 — separate `LAYOUT_COMPLETE` from `VISUAL_COMPLETE`

If exact media bytes are blocked:

- layout/runtime work may continue
- First Pass can be frozen
- but visual fidelity must remain `ASSET_BLOCKED` / incomplete

This experiment already behaved this way; make the status machine-readable so future agents cannot accidentally award a visual PASS to placeholders.

### No change — interaction invention policy

Keep the current rule. When Figma/reference evidence is unresolved, do not manufacture an accordion, carousel, or fake slide data merely because the design looks interactive.

---

## Final answer to the experiment question

> If a different AI receives Figma + project baseline + the new Standard from a clean context, does it autonomously reproduce a production-quality REF-001 better than the old/current result?

**Not yet.**

It autonomously produced a cleaner and much cheaper **layout implementation**, but it did not reliably produce the correct **production implementation**.

The biggest reason is not that the repository lacks rules. The repository already knows the implementation target and breakpoint ownership. The problem is that those decisions are still too easy for an executing agent to skip.

The next meaningful experiment should therefore be a new clean replay after the two P0 enforcement gaps are closed. If that replay selects WordPress+ACF correctly, accepts only owned breakpoints, and still keeps repair count low while approaching Current Final geometry, then the Standard can be considered reproducible across agents rather than merely well documented.
