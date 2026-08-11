# REF-001 Blind Clean-run Agent Handoff

You are the implementation agent for a controlled Figma → Web experiment.

This workspace is intentionally sanitized. Work **only** from the files in this package plus live Figma evidence available to you. Do not fetch the original repaired `m-shogo/figma-ai-project` checkout, old pull requests, old screenshots, old final CSS/PHP, or previous repair discussions.

The experiment is successful only if the workflow itself produces a strong first implementation without copying the previous answer.

## Objective

Reimplement REF-001 as a high-fidelity responsive WordPress fixed Page template with ACF, then measure the quality of the **first complete implementation before repair**.

A visually accurate result is not enough. The implementation must also remain understandable and safely editable by a human engineer after handoff. Read and follow `docs/human-editability.md`.

Reference identity:

- reference: `REF-001-CHIBA-KEIZAI-SAMPLE`
- Figma file key: `ZYTdtw4wCgkcBy2cVnhxVI`
- PC visible root: `21384:8173`
- SP visible root: `21376:4401`
- canonical reference manifest: `references/chiba-keizai-sample.reference.yaml`
- structure evidence: `references/chiba-keizai-sample.structure-profile.yaml`
- variable-mode audit: `references/chiba-keizai-sample.variable-mode-audit.yaml`
- implementation profile: `experiments/ref001-wordpress-acf/implementation-profile.yaml`

## Fixed owner decisions

Do not reopen these unless live evidence proves the package is internally inconsistent:

- implementation family: WordPress
- implementation unit: fixed Page template
- editable page content: ACF where ownership evidence supports it
- production breakpoint: `768px`
  - mobile: `<= 767px`
  - desktop: `>= 768px`
- exact Figma visual acceptance endpoints:
  - SP: `375px`
  - PC: `1380px`
- intermediate widths are Web runtime-safety probes, not extra pixel-perfect Figma targets

## Implementation order

Implement the page section by section rather than asking one generation step to solve the whole page at once.

Recommended sequence:

1. Header
2. Main Visual
3. Reason
4. Education
5. shared CTA
6. Student Voice
7. Messages
8. shared CTA reuse
9. Courses
10. Links
11. CTA Value
12. Footer
13. page-level integration and responsive boundary QA

This is still **one FIRST PASS**. Section-by-section implementation is allowed and encouraged; visual repair based on a completed-page comparison is not allowed until FIRST PASS has been frozen.

## Before coding: inspect, do not infer

For each section, inspect the actual Figma nodes and record what the evidence really supports.

Check independently:

- Components / instances / reuse
- Auto Layout / Grid / constraints and whether layout generation is observable
- Variables / effective modes / aliases
- typography hierarchy and explicit art-directed line breaks
- source image identity, crop/focal behavior, masks and composite groups
- vector/icon export fidelity
- repeated visual structure versus real CMS cardinality
- interaction evidence versus static visual affordance
- PC/SP evidence versus inferred intermediate responsive behavior

Do not treat Figma construction style as DOM instructions. Translate demonstrated visual intent into maintainable Web layout.

Do not invent missing Variables, interactions, carousel records, routes, links, CMS ownership, or alternate media merely to make the implementation look complete.

## Human-editable architecture — mandatory

Use the target/project-native structure first. Do not optimize only for screenshot parity.

The result must make it reasonably obvious to a human:

- which file owns each visible section
- which styles are shared versus section-local
- where the breakpoint contract is owned
- which values are design tokens/shared values versus evidenced one-offs
- which content is CMS/editor-owned versus code-owned art direction
- where a shared CTA/component should be changed once rather than copied

Do not create a component/file for every Figma layer. Do not collapse unrelated sections into one generated monolith when project conventions support meaningful section boundaries.

Raw px, absolute positioning, negative offsets, or `!important` are not automatically forbidden, but non-obvious/repeated uses must have a defensible reason. Never use global overflow hiding or specificity escalation merely to conceal a layout defect.

If project ownership is not self-evident, maintain a small section-to-code navigation map as described in `docs/human-editability.md`.

## Web translation defaults

Use the current project rules in `docs/` and `templates/`.

In particular:

- normal media defaults to `<img>`
- use `object-fit: cover` when the visual intent is an evidenced crop box
- use `<picture>` only when actual art direction or source-format requirements justify it
- preserve exact supplied assets when available instead of regenerating lookalikes
- ordinary readable text must remain reflowable unless one-line behavior is itself a real requirement
- do not use `nowrap`, clipping, negative offsets, text shrinking, or tracking distortion merely to imitate one fallback-font screenshot
- page-level horizontal overflow is a failure
- readable text escaping the viewport is a failure even when `scrollWidth` remains unchanged
- a 375/1380 fixed Figma coordinate is an endpoint result, not automatically a fixed CSS coordinate at every width

## CMS / ACF boundary

The required deliverable includes an importable ACF JSON artifact for the content that is genuinely editor-owned.

Do not assume:

- every repeated Figma card needs ACF Repeater
- every text node is editable
- every retained/hidden image layer needs a field
- every Figma component should become page-local ACF

Prefer fixed fields for fixed semantic cardinality unless evidence requires editor-controlled add/remove/reorder behavior.

Keep field schema separate from disposable fixture content. If the eventual target theme supports ACF Local JSON, prefer a version-controlled field-schema workflow that matches that target architecture; do not invent production Local JSON ownership before the target theme is known.

## Interaction boundary

If Figma/prototype/product evidence does not define an interaction, mark it unresolved rather than inventing behavior.

A static expanded/collapsed visual state does not by itself prove an accordion contract. A visible `1 / N` state does not by itself prove that all N records exist in the supplied source.

## Required runtime probes

At minimum, test:

- 320
- 360
- 375 — exact Figma acceptance
- 390
- 430
- 767
- 768
- 769
- 1024
- 1200
- 1380 — exact Figma acceptance

At 375 and 1380, compare the complete page against the supplied Figma reference.

At intermediate widths, require runtime safety and natural responsive continuity rather than pixel matching to a nonexistent Figma frame.

## FIRST PASS chronology — mandatory

Create a real run record from `templates/run-record.yaml` before implementation work.

Before first implementation work:

```bash
python scripts/controlled_run_phase.py experiments/<experiment>/<run>.run.yaml \
  --phase FIRST_PASS_BUILD
```

Build the complete page without using previous final implementation evidence.

When the first complete page is ready, stop repair work and record:

- `code.first_pass_commit`
- `captures.first_pass` for the required visual evidence
- `scores.first_pass_fidelity.total` and its component scores

Then:

```bash
python scripts/controlled_run_phase.py experiments/<experiment>/<run>.run.yaml \
  --phase FIRST_PASS_FREEZE

python scripts/first_pass_evidence.py freeze \
  experiments/<experiment>/<run>.run.yaml \
  --tooling-revision <workspace source revision>
```

Do **not** repair the implementation until the immutable snapshot exists.

### FIRST PASS Human Editability audit

After FIRST PASS is frozen, evaluate the frozen snapshot before repair.

Record in `human_editability`:

- five dimension scores (`/2` each)
- `/10` diagnostic total
- blockers
- evidence
- task-based change drills

Run at least three relevant PAGE-level drills from `docs/human-editability.md`, using a disposable branch/worktree/sandbox created from the immutable FIRST PASS commit. Do not commit those temporary drill changes back into FIRST PASS.

Recommended REF-001 drills:

1. one section-local spacing/crop adjustment
2. one genuinely editor-owned ACF content/image change with ownership identified
3. one shared CTA change that should update all intended uses
4. optionally a responsive behavior drill that preserves the owner-defined 768px breakpoint
5. optionally an asset replacement drill with a different aspect ratio

A drill must record located/changed/unexpected paths and whether unrelated visual/runtime regressions occurred.

Validate the record while working:

```bash
python scripts/validate_human_editability.py
```

A `COMPLETE` run using the new record schema requires Human Editability `PASS`, score `>= 8/10`, no blockers, and the required passing change drills.

Before the first repair commit:

```bash
python scripts/controlled_run_phase.py experiments/<experiment>/<run>.run.yaml \
  --phase REPAIR
```

After targeted repairs and final verification:

```bash
python scripts/controlled_run_phase.py experiments/<experiment>/<run>.run.yaml \
  --phase FINALIZE
```

## What to record at FIRST PASS

The comparison needs more than a final score. Record enough evidence to determine whether the workflow actually improved:

- first-pass visual / structural / robustness scores
- Human Editability score/status/blockers/change drills
- full-page 375 and 1380 captures
- runtime-safety result for intermediate widths
- first-pass implementation commit
- implementation elapsed/rework time when measurable
- number and severity of visible failures
- failure categories/root causes
- owner-blocking decisions
- assumptions made because evidence was unavailable
- asset/crop/composite uncertainty
- interaction uncertainty

Do not hide a bad FIRST PASS. A weak baseline is useful evidence if it is frozen accurately.

## Repair phase

After FIRST PASS is frozen and its Human Editability audit is recorded:

1. inspect actual browser captures, not only CI status
2. rank the largest visible/runtime failures
3. repair root causes instead of stacking screenshot hacks
4. keep exact 375/1380 geometry where evidence is hard
5. keep intermediate widths safe and natural
6. preserve or improve Human Editability; do not trade maintainability for screenshot hacks
7. rerun regression/visual/runtime QA after each meaningful repair group
8. record repair rounds and changed-file/rework metrics
9. re-evaluate final Human Editability after repair

## Completion criteria

A run can be finalized only when:

- immutable FIRST PASS evidence exists and still validates
- required endpoint captures exist
- 375/1380 acceptance has been reviewed
- intermediate runtime probes have no page overflow/readable-text escape failures
- required ACF JSON exists and validates
- unresolved interactions/content remain explicit rather than invented
- Human Editability is PASS with required change-drill evidence
- final score and rework metrics are recorded
- final browser artifacts have been visually inspected, not merely reported GREEN by CI

## Replay rule

A later RUN B / REPLAY must receive a newly generated sanitized package from the same frozen treatment/coordination baseline.

Do not give RUN B the RUN A final implementation or repair diff.

A different isolated agent/context should perform the blind replay. The agent that already inspected the repaired answer is not a valid blind replay implementer.

The questions being measured are:

> Did the learned workflow improve first-pass fidelity and reduce rework when starting again from the same design evidence?

and:

> Did it also produce code that a human can find, understand, and safely change without introducing unrelated regressions?
