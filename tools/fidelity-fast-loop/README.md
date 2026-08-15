# Fidelity Fast Loop

Small, runtime-neutral tooling for **Figma -> implementation -> fast visual feedback -> targeted repair**. It does not replace existing REF-001, WordPress, Playwright, or Implementation Intake systems and does not prescribe production architecture.

## Section contract
A section binds `figmaNodeId + selector + viewport + reference + capture + diff`. `capture-section.mjs` captures only the selected DOM section. Figma reference images/geometry are supplied or cached by the caller; the tool deliberately does not embed credentials or invent a Figma API transport.

`python fast_loop.py contract.json measurements.json --out report.json` produces geometry/category diagnosis, section-boundary drift classification, repair routing, risk/depth, repair-stop state, and an evidence fingerprint.

Missing reference geometry is reported as missing, not silently compared against zero. `capture-section.mjs` carries each section's reference data into `measurements.json`, waits for fonts, scrolls the target into view, waits for section images, and records document-relative geometry so the result can be handed directly to `fast_loop.py`.

## Real REF-001 examples
`examples/ref001-reason.pc.json` maps the live Figma `reason` node `21008:371` to the existing isolated REF-001 clean fixture selector `[data-section="reason"]`.

`examples/ref001-checkpoint.pc.json` is a read-only CHECKPOINT example spanning the existing `reason`, `education`, `student-voice`, `messages`, and `courses` sections. Their selectors were verified from the clean fixture and their reference geometry comes from the current 1380px Figma frame. These examples deliberately do **not** modify the REF-001/V2 implementation.

With the existing clean fixture served at its established `http://127.0.0.1:8765/preview.php` route:

```sh
node tools/fidelity-fast-loop/capture-section.mjs \
  tools/fidelity-fast-loop/examples/ref001-reason.pc.json \
  artifacts/fidelity-fast-loop/ref001-reason

python tools/fidelity-fast-loop/fast_loop.py \
  tools/fidelity-fast-loop/examples/ref001-reason.pc.json \
  artifacts/fidelity-fast-loop/ref001-reason/measurements.json \
  --out artifacts/fidelity-fast-loop/ref001-reason/report.json
```

Use the checkpoint contract the same way when several sections are ready. FAST remains the default development loop; CHECKPOINT is intentionally less frequent.

## QA modes and adaptive depth
- `FAST`: section capture, high frequency.
- `CHECKPOINT`: several completed sections and shared rhythm.
- `FINAL`: full-page/runtime/responsive/CMS orchestration belongs to the existing project-specific harness.

Risk depth is `QUICK/STANDARD/DEEP`; thresholds are provisional defaults, not universal quality gates. Explicit `riskSignals` can be supplied, but cheap observed facts can also be passed under `observation` and converted into the same signals. Supported observations include absolute-count, masks, image composition, overlap, special typography, responsive delta/ambiguity, slider/interaction, mixed media and unusual crop. This keeps risk estimation tied to observed Figma/repo facts rather than adding another questionnaire.

## Structured diagnosis and routing
The engine reports x/y/width/height deltas and tags typography, color, text, background, image bounds/crop where measurements exist. It also distinguishes several boundary patterns:

- `local-boundary-jump`: one section introduces a material height shift and later sections inherit that same offset. Route back to the culprit section instead of calling the whole page cumulative drift.
- `cumulative`: multiple same-direction boundary increments accumulate down the page. Inspect shared spacing/section-height rules before local pixel repair.
- `stable-offset`: boundaries carry roughly the same offset. Do not misclassify this as progressive drift.
- repeated x shift across sections: inspect the shared container/common horizontal rule.
- typography-only differences: inspect font loading or the typography root/token.

`repairRouteDetail` exposes structured `scope`, `cause`, `candidate`, and confidence fields for machine repair; `repairRoute` remains a short human-readable instruction.

## Repair stop and re-observation budget
Two consecutive low-improvement repair rounds trigger re-diagnosis rather than endless 1px tuning. `evidenceKey` hashes the contract plus source fingerprint. Supplying the previous key makes `observationAction` return `REUSE` when nothing relevant changed or `REOBSERVE` when it did.

## Scope / component mapping
`scope.py` enforces per-run allow/deny paths. Use deny paths for unrelated/legacy/V2/V3 context. Component candidates require semantic + visual + behavioral compatibility; names alone never imply reuse.

## Strategy measurement / learning
`strategy.py` records implementation time, repair/capture counts, final score, late findings, regressions and human adjustment. `compare()` reports transparent metric deltas against a chosen baseline and deliberately does **not** compute a weighted winner. Section-first remains an experiment until real-project evidence supports it.

## Deterministic capture
The Playwright helper fixes viewport/DPR, disables motion, waits for fonts/section images and captures selector-local screenshots. FINAL CI should additionally pin Playwright/Chromium/fonts/data/clock in the project-specific environment. FAST local intentionally stays lighter.

## Design principle
Spend QA where visual breakage is likely. Do not turn this into a governance framework, do not run DEEP everywhere, and do not chase tiny local improvements after the repair-stop rule says to re-diagnose.
