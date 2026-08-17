# Figma Fidelity Fast Loop

Status: **provisional / real-project experiment**. This is a thin layer over the repository's existing Playwright, PNG diff, section execution, and REF-001 visual evidence. It is not a new application framework and it does not make Section-first QA mandatory.

## Goal

Keep the common loop short:

```text
Figma section evidence + existing repo context
        ↓
implement
        ↓
FAST: one section capture → diff → structured diagnosis
        ↓
repair the likely cause, not random pixels
        ↓
CHECKPOINT only when several sections need relationship/drift review
        ↓
FINAL PC/SP full-page and runtime QA only when appropriate
```

The default bias is **QUICK / STANDARD**, not DEEP. Heavy checks are activated by actual visual fragility or an explicit project decision.

## Section contract

`section-visual-qa.example.json` is the minimal contract. A section binds:

- Figma `fileKey` + `nodeId` + optional observed revision/hash
- implementation URL + selector + optional repeated-element index
- deterministic viewport + DPR
- materialized Figma reference image
- small reference measurement JSON
- optional risk signals, probes, and repair history

Figma metadata is evidence, not a mechanical CSS translation rule. A Figma component, Auto Layout, absolute position, or visual repetition does not by itself decide the web architecture.

## One-command FAST loop

When Playwright and Pillow are available in the existing visual-QA runtime:

```bash
python3 tools/implementation-intake/fast_visual_qa.py run path/to/hero-pc.json --output .visual-qa/hero-pc
```

The command validates the section contract, launches the small Playwright section capture, fixes viewport/DPR/locale/timezone, disables animation/transitions, captures only the selector, records geometry/style/image probes, reuses `scripts/diff_png.py`, and writes `report.json` with structured diagnosis and Repair Stop advice.

The Figma reference is intentionally materialized ahead of the local command. This avoids adding Figma credentials/API coupling to project runtime and allows evidence reuse while the observed Figma revision/hash is unchanged.

For diagnosis-only CI or development without browser/Pillow, `--skip-capture --skip-pixel` uses an already-produced `actual.measurement.json`. Core diagnosis is stdlib-only.

## Structured diagnosis

The report classifies differences into actionable groups where evidence exists:

- position (`x` / `y`)
- width / height and section boundary
- spacing (`gap`, margin, padding)
- typography (family, size, weight, line-height, letter-spacing)
- color / background
- image bounds / `object-fit` / `object-position`
- text content
- pixel diff ratio

It deliberately avoids heavyweight computer vision. Geometry and computed-style evidence usually answer the first repair question faster and more deterministically.

## Diagnosis router and cumulative drift

`detect_cumulative_drift()` compares ordered Figma/reference and implementation section bottoms. Growing same-direction drift such as `+2 → +4 → +12 → +27px` routes first to cumulative spacing/height instead of repeatedly editing the lowest section.

`route_diagnosis()` also recognizes lightweight patterns:

- repeated horizontal delta → shared container/common rule
- repeated typography mismatch → root token/font loading
- PC-only categories → desktop rule
- SP-only categories → mobile rule
- otherwise localized difference → section repair

`aggregate` consumes a checkpoint JSON with `boundaries[]` and `reports[]` and returns cumulative drift plus the shared/local repair route.

## FAST / CHECKPOINT / FINAL

- **FAST** — section screenshot, geometry, pixel diff, structured diagnosis. Used frequently.
- **CHECKPOINT** — completed-block relationships, section boundaries, cumulative drift, shared-rule routing. Used occasionally.
- **FINAL** — PC/SP full page, structured diagnosis, responsive/runtime checks, scoped repair, final full-page verification. Used near completion, not after every edit.

These are routing modes, not score gates. Existing project Visual QA remains authoritative for full runtime evidence.

## Adaptive depth and Visual Risk

Risk estimation accepts only cheap signals already observed during implementation: absolute positioning, mask, image composition, overlap, special typography, PC/SP structural gap, slider/interaction, raster/vector mix, unusual crop, and responsive ambiguity.

The estimator intentionally resists automatic DEEP escalation. A high score normally stays STANDARD unless multiple high-fragility signals combine, or the project explicitly requests DEEP.

## Repair stop

`repair_stop()` watches recent diff ratios. Two consecutive improvements below the provisional minimum improvement trigger **re-diagnosis**, not more 1px tuning. The next hypotheses are shared rule, wrong asset, typography/runtime, or wrong Figma interpretation. Thresholds remain experiment data, not global fidelity policy.

## Evidence cache / re-observation budget

`EvidenceCache` keys an observation by source hash/revision. Unchanged Figma nodes or repo observations are reused. `reobservation_plan()` spends a small budget only on stale/changed evidence and defers unrelated reads.

This is a speed feature, not a source-of-truth replacement: changed Figma revision or changed owning code invalidates affected evidence.

## Context scope filter

`filter_context()` accepts project-specific `include`, `exclude`, and `protected` globs. Protected files are reported separately rather than silently read/edited. For the current work, V2/V3 paths are protected by the caller's scope; other projects can use different rules.

Do not turn this into one universal company-template ignore list.

## Existing component mapping

`map_component()` ranks supplied repo candidates using **visual + semantic + behavioral compatibility**. Name similarity alone is not enough. The decision is `reuse`, `adapt`, or `new`; candidate discovery should use the project's component inventory/Code Connect/repo reconnaissance instead of scanning the whole repository every loop.

## QA strategy measurement

`strategy_measurement()` keeps only a small comparable record: implementation seconds, repair count, section/full capture count, final visual score, full-QA-only issues, regressions, and human adjustments. This supports Section-first vs larger-block-first vs full-first-repair experiments without making instrumentation the product.

## Learning feedback

`learning_feedback()` records helpful QA, wasted QA, late discoveries, and rework sections. The next project should increase checks that prevented rework and decrease checks that produced no value. Learning should make intake/QA **shorter and smarter**, not permanently larger.

## CI boundary

`.github/workflows/section-visual-qa.yml` is intentionally light: Python syntax, stdlib unit tests, example-contract validation, and Node syntax only. It does **not** install browsers or run full visual diff on every push/PR.

Full Playwright/PNG/Figma-reference work stays on-demand or in existing deterministic visual-QA workflows. That keeps implementation latency and CI cost under control.

## Current scope safety

This feature lives under `tools/implementation-intake/` plus its dedicated workflow. It does not modify REF-001 V2/V3 implementation, V2/V3 assets, their Visual QA, the WordPress/ACF fixture, or company template architecture.
