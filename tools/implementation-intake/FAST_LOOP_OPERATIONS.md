# Fast Loop Operations — Evidence Reuse and Strategy Learning

This CLI makes two existing Fast Loop features practical without adding a service or database:

1. reuse unchanged Figma/repo observations with a small evidence cache
2. record lightweight QA-strategy outcomes and learning after real projects

The files are plain JSON and remain project/tooling evidence, not implementation architecture.

## Evidence cache

Store an observation with the source revision/hash that made it valid:

```bash
python3 tools/implementation-intake/fast_loop_ops.py cache-put .visual-qa/evidence-cache.json \
  --key figma:hero \
  --source-hash figma-revision-or-node-hash \
  --value /tmp/hero-observation.json
```

Plan the next observation pass:

```bash
python3 tools/implementation-intake/fast_loop_ops.py cache-plan \
  .visual-qa/evidence-cache.json \
  /tmp/observation-items.json \
  --budget 3
```

The result separates `reuse`, `observe`, and `deferred`. A changed source hash invalidates reuse automatically. This is the implementation of the re-observation budget; it is not a reason to trust stale evidence.

## QA strategy / learning ledger

After a real implementation, record only the small metrics already defined by `strategy_measurement()` plus concise feedback:

```bash
python3 tools/implementation-intake/fast_loop_ops.py record .visual-qa/qa-strategy-ledger.json \
  --project project-id \
  --strategy section-first \
  --metrics /tmp/metrics.json \
  --feedback /tmp/feedback.json
```

Summarize observed runs:

```bash
python3 tools/implementation-intake/fast_loop_ops.py summary \
  .visual-qa/qa-strategy-ledger.json
```

The summary groups strategies and reports mean numeric metrics plus repeated helpful/wasted QA, late discoveries, and rework sections.

It deliberately does **not** declare a winner. Small samples, different Figma complexity, different company templates, and different runtimes are not causal A/B evidence. Promotion of Section-first, larger-block-first, or full-first-repair remains a human/AI decision based on comparable real projects.

## Kept small on purpose

The ledger accepts only the Fast Loop measurement whitelist:

- implementation seconds
- repair count
- section capture count
- full capture count
- final visual score
- issues found only at full QA
- regressions
- human adjustment count

Feedback remains:

- helpful QA
- wasted QA
- late discoveries
- rework sections

Do not turn this into a telemetry platform. The goal is to make later QA choices shorter and smarter.
