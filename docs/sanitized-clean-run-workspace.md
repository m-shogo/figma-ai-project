# Sanitized Clean-run Workspace

A clean run is only meaningful if the implementing agent cannot read the repaired answer from an earlier run.

A fresh Git branch is **not sufficient** when the repository already contains the previous final implementation, repair CSS, screenshot artifacts, or REF-specific validators that encode the answer.

`build_sanitized_run_workspace.py` creates a physically separate folder from an explicit allowlist and writes a hash manifest for every copied file.

## REF-001 profile

Canonical profile:

```text
experiments/ref001-clean-run/workspace.yaml
```

It keeps current workflow knowledge plus frozen Figma/reference evidence, while excluding the repaired REF-001 implementation and answer-bearing evidence.

Included classes of input:

- general workflow/config/templates/scripts
- frozen REF-001 reference manifest
- Figma structure profile and variable-mode audit
- implementation-family profile

Explicitly absent:

- `fixture-theme/` repaired PHP/CSS
- visual-preview captures/harness output
- generated REF-001 artifacts/content payloads
- REF-001-specific validators/builders that encode repaired geometry
- run-specific Figma→Web friction analysis
- REF-001 implementation regression tests

This does **not** retroactively turn the repaired REF-001 fixture into RUN A. The next controlled experiment must generate a new FIRST PASS inside a sanitized workspace and freeze it before repairs begin.

## Validate selection

```bash
python scripts/build_sanitized_run_workspace.py validate \
  experiments/ref001-clean-run/workspace.yaml
```

CI runs this selection validation so a later allowlist change cannot silently expose the previous answer.

## Build another folder

The output must be outside this repository.

```bash
python scripts/build_sanitized_run_workspace.py build \
  experiments/ref001-clean-run/workspace.yaml \
  --output ../figma-ai-ref001-clean-run
```

The generated root contains `.sanitized-run-workspace.json` with:

- workspace/reference identity
- source commit when Git metadata is available
- profile hash
- every copied path/hash/byte count
- a deterministic workspace digest
- the active forbidden path globs

## Audit before agent handoff

```bash
python scripts/build_sanitized_run_workspace.py audit \
  experiments/ref001-clean-run/workspace.yaml \
  --output ../figma-ai-ref001-clean-run
```

Audit fails on:

- missing or changed manifested files
- unmanifested files added after generation
- any forbidden path appearing in the workspace
- workspace/reference identity drift

## Safe replacement

`--replace` can regenerate an existing folder only when that folder already contains this tool's manifest with the same `workspace_id`.

It refuses to recursively build inside the source repository and refuses to delete an arbitrary directory.

## Controlled experiment sequence

```text
sanitized workspace
→ new RUN A (new optimized workflow experiment)
→ freeze FIRST PASS before any repair
→ targeted repair/final verification
→ new sanitized workspace from the same frozen coordination/treatment
→ RUN B / REPLAY with previous final code and repair diff still absent
→ compare first-pass fidelity, rework, and reproducibility
```

The same agent that has already inspected the old repaired answer should not be used as the blind RUN B implementer. A new isolated agent/context should consume the sanitized package.

The objective is to prove that workflow knowledge transfers, not that an agent can copy a previous solution.
