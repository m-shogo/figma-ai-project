# Production Dry-run Audit — Reference → First Pass → Final → Clean Replay

Last revised: **2026-08-11 JST**

実Referenceが今すぐ来たと仮定し、production flowが「文書では正しいが実行時に抜ける」状態になっていないか確認するためのfinal readiness audit。

Canonical measurement protocol:

- `docs/first-pass-final-clean-replay.md`

## End-to-end path

```text
Scheduled Official Update Radar
→ Company Policy ACTIVE
→ Reference Freeze
→ Existing Codebase Reconnaissance
→ Effective Environment Contract
→ Figma Capability / Section Discovery
→ Shared Foundation / Contract Freeze
→ SECTION execution
→ BOUNDARY / CLUSTER
→ INTEGRATION / FULL PAGE
→ FIRST PASS freeze
→ Targeted Repair
→ FINAL
→ Root Cause / reusable improvement
→ fresh CLEAN REPLAY
→ RUN A vs RUN B First Pass comparison
→ Knowledge Promotion
```

## FIRST PASS freeze is machine-enforced

FIRST PASSを採点したら、repair前に必ずfreezeする。

```bash
python scripts/first_pass_evidence.py freeze path/to/run.yaml \
  --tooling-revision <figma-ai-project-commit-or-version>
```

Requirements before freeze:

- `code.first_pass_commit` exists
- `captures.first_pass` is non-empty
- `scores.first_pass_fidelity.total` exists
- exact figma-ai-project/tooling revision is supplied

The command creates, next to the Run Record:

```text
run.first-pass.json
```

The sidecar pins:

- run / experiment identity
- tooling revision used for RUN A First Pass
- Reference Manifest SHA-256
- Company Policy SHA-256
- Required Environment ids
- code starting commit
- FIRST PASS commit
- canonical hash of FIRST PASS captures
- FIRST PASS fidelity score

The sidecar is write-once by the freeze command. CI recomputes the pinned fields from the Run Record; changing FIRST PASS captures, score, or commit after freeze fails validation.

Repository validation:

```bash
python scripts/first_pass_evidence.py validate
```

A `COMPLETE` run, or a run with `code.first_pass_commit`, must have valid frozen FIRST PASS evidence.

## Clean Replay preparation is machine-enforced

Do not turn a normal candidate run into REPLAY by manually copying RUN A values.

First generate a fresh candidate run from the intended clean baseline/isolation. Its `coordination.isolation_ref` must differ from RUN A.

Then:

```bash
python scripts/prepare_clean_replay.py prepare \
  path/to/run-a-run.yaml \
  path/to/run-b-run.yaml \
  --apply
```

The preparer pins:

- RUN A path
- RUN A file SHA-256
- RUN A run id
- fresh-isolation declaration
- explicit no-leakage declarations
- treatment-change list

The pair validator checks at least:

- RUN B is `run_class: REPLAY`
- RUN A is not itself REPLAY
- same frozen Reference Manifest SHA-256
- same run scope and Section id
- same Required Environment profile set
- same target repository
- different isolation ref
- exact RUN A path + SHA-256 still match
- `fresh_isolation: true`
- RUN A FINAL code was not exposed
- RUN A repair diff was not exposed
- project-specific magic values were not exposed
- RUN A FIRST PASS snapshot exists
- RUN B FIRST PASS snapshot exists before replay result/final completion

Repository validation:

```bash
python scripts/prepare_clean_replay.py validate
```

## Automated Update Radar / community discovery

`AUTOMATED_UPDATE_RADAR` mode does **not** require `community_scan_checked=true` to enter or complete a production run.

Required official Radar lanes remain fail-closed. Community/practitioner discovery remains optional E0 hypothesis input, not a production start gate.

`LEGACY_MANUAL` keeps the old explicit community-check requirement for legacy experiments.

## COMPLETE run minimum evidence

A COMPLETE Run Record must contain at least:

- First-pass Fidelity score
- `code.first_pass_commit`
- non-empty `captures.first_pass`
- valid immutable `run.first-pass.json` snapshot

Final quality cannot erase or substitute FIRST PASS evidence.

## Repository-level gate

```bash
python scripts/check_repository_readiness.py
```

The readiness command and GitHub Actions now include:

- Update Radar registry
- schema/semantic records
- Company Policy / Environment Contract
- Figma profiles / resolution / breakpoints / discovery
- parallel isolation
- run lineage
- FIRST PASS snapshot validation
- Clean Replay pair validation
- capture environment validation
- full unit test suite

## Remaining non-synthetic proof

This audit can prove the contracts and validators are wired, but it cannot prove visual/rework performance without a real frozen Figma Reference.

Once the real Reference arrives, do not add more abstract infrastructure first. Execute the production path, preserve RUN A FIRST PASS, repair to FINAL, then run a fresh RUN B Clean Replay and compare the two First Pass results.
