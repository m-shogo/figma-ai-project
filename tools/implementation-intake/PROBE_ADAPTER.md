# Existing Visual QA Probe Adapter

This adapter lets the new Fast Visual QA layer consume an existing section manifest and runtime-probe file **without editing the implementation or its existing Visual QA code**.

It exists for migration and evidence reuse, not to make REF-001 a permanent template.

## Why it matters

An authored Figma viewport and an intermediate responsive width answer different questions.

- At the authored reference width, section `top` / `height` can be compared with normalized Figma geometry.
- At intermediate widths, the adapter checks runtime health only: overflow, clipping, image failures, runtime errors, and declared primary fonts.
- It does not treat an intermediate-width layout change as a Figma mismatch when no Figma frame exists for that width.

That separation prevents false repair work such as forcing a 768px layout to match 1380px section heights.

## Figma device chrome / coordinate normalization

Some Figma references include device chrome that is not part of the implementation page. REF-001 SP is a concrete example: the live Figma root contains a 40px status bar, while the section manifest stores runtime-page geometry and declares `figma_device_chrome_px: 40`.

The adapter therefore compares runtime probes with the manifest's normalized page coordinates. It exposes `figmaDeviceChromePx` in its report for diagnosis, but does **not** add that chrome offset back to runtime section coordinates.

This avoids a false +40px drift across the entire mobile page.

## Boundary pattern diagnosis

Besides continuously growing cumulative drift, the adapter recognizes a few cheap patterns that materially change where to repair:

- `aligned` — measured authored-width boundaries match.
- `cumulative-growth` — drift grows as the page continues; inspect repeated spacing/height/shared vertical rules.
- `step-shift` — boundaries are aligned, then one section creates a stable downstream offset; inspect the first divergent section / preceding gap instead of editing every later section.
- `constant-offset` — the same non-zero offset exists from the first boundary; inspect page/shared wrapper or coordinate normalization.
- `isolated` — one boundary differs; keep the repair local.
- `mixed` — use the existing structured section reports before choosing scope.

These are repair hints, not hard fidelity thresholds.

## Command

```bash
python3 tools/implementation-intake/probe_adapter.py \
  review-dashboard/manifests/ref001-run-2.json \
  experiments/ref001-blind-clean-20260812/evidence/final/latest/runtime-probes.json \
  --output /tmp/ref001-fast-loop-adapter.json
```

The command is read-only. It produces:

- exact authored-width reference checkpoints
- per-section structured geometry diagnosis
- cumulative and boundary-pattern diagnosis
- likely repair scope from the existing Fast Loop router
- intermediate-width runtime-health summaries with `pass` / issue reasons

## Scope rule

REF-001 is only a compatibility fixture here. The adapter must remain generic:

`existing section manifest + runtime probes -> Fast Visual QA evidence`

It must not import REF-001 implementation architecture, CSS conventions, assets, or V2/V3 behavior into future projects.

## Current integration evidence

The dedicated light CI runs the adapter against the committed REF-001 manifest/probes and verifies:

- PC reference width resolves to 1380
- SP reference width resolves to 375
- SP's declared 40px Figma device chrome remains normalized out of runtime-page geometry
- both authored-width boundary patterns are `aligned`
- reference geometry comparison is restricted to authored widths
- intermediate widths remain runtime-health-only
- authored reference and intermediate runtime probes have no runtime errors/overflow/image/font failures

This gives the Fast Loop a real-data compatibility check without modifying V2/V3 or running expensive browser capture on every change.
