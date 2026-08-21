# REF-001 Benchmark Clean Replay — Fresh Execution Handoff

This handoff is for a **new isolated context**. The current benchmark substrate contains no REF-001 visual implementation answer.

## Authority order

1. `experiments/ref001-benchmark-replay/implementation-profile.yaml`
2. `experiments/ref001-benchmark-replay/shared-contract.yaml`
3. current live Figma authority referenced by `references/chiba-keizai-sample.reference.yaml`
4. canonical project/frontend/runtime rules included in this sanitized workspace
5. the intentionally blank theme under `experiments/ref001-benchmark-replay/blank-theme/`

Before First Pass freeze, do **not** fetch, open, reconstruct, or copy any excluded historical REF implementation, CSS, ACF schema, comparison report, repair commit, or V3 implementation from the full repository.

## Fixed benchmark decisions

- implementation family: WordPress
- benchmark theme: isolated Classic shell; this is not a production-theme classification
- rendering: server-rendered PHP
- implementation unit: fixed Page Template
- content delivery: ACF fields with stable keys and importable ACF export JSON
- runtime baseline: WordPress 7.0.2 / PHP 8.3
- ACF PRO dependency contract: `^6.0`; record the actual installed patch version during smoke
- breakpoint ownership: mobile `<=767px`, desktop `>=768px`
- Figma acceptance endpoints: 375px and 1380px
- extra viewport thresholds are prohibited unless owner-backed evidence is explicitly added; intrinsic Grid/Flex/minmax/clamp responsiveness is allowed
- unresolved Figma interactions must not be invented

## Start gate

From the sanitized workspace, run:

```bash
python scripts/validate_ref001_benchmark_replay.py
```

The gate must prove at minimum:

- FROZEN benchmark Implementation Profile is valid and hash-bound
- static HTML output contradicting `SERVER_RENDERED_PHP` is rejected
- `1100px` is rejected as an unowned viewport threshold
- 767/768 are accepted
- the blank target contains no REF visual markup/CSS answer
- historical REF answer paths are absent from workspace selection

If the gate fails, fix the substrate/authority mismatch before implementing sections. Do not bypass it with a new bridge or alternate implementation family.

## Implementation target

Primary Page Template:

`experiments/ref001-benchmark-replay/blank-theme/page-templates/template-ref001-benchmark.php`

Clean implementation owner:

`experiments/ref001-benchmark-replay/blank-theme/template-parts/ref001/benchmark-page.php`

Create section-local PHP/CSS/JS only as current Figma/project authority requires. Keep shared code small and explicit. Do not copy old REF values.

Required ACF delivery target:

`experiments/ref001-benchmark-replay/output/acf-export.json`

The field model must be derived fresh from current authority. Do not restore the old REF learning fixture field schema from memory or Git history.

## Execution loop

For each logical section, use structured Figma authority first, then implement, render, measure, and repair. Validate PC/SP plus intermediate/boundary widths. Record strategy reversals and repair rounds rather than hiding them.

First Pass means the first complete implementation produced from this sanitized authority. Before any historical comparison:

1. commit the complete First Pass
2. capture deterministic runtime evidence
3. record PC/SP/intermediate overflow and runtime results
4. record implementation-profile/breakpoint/ACF-delivery compliance
5. freeze First Pass evidence immutably

Only **after** that freeze may the execution context read historical/current REF implementations for comparison.

## Shared Contract status

`shared-contract.yaml` intentionally remains `DRAFT` because the repository does not contain a legitimate ACTIVE Company Policy authority. Do not invent one. For this isolated benchmark, the FROZEN Implementation Profile plus `validate_ref001_benchmark_replay.py` are the executable preflight for target family and breakpoint ownership.

This limitation must remain visible in final experiment reporting; it is not permission to reinterpret the benchmark as production-ready policy.
