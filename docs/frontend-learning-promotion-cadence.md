# Frontend Learning Promotion Cadence

Status: ACTIVE review contract

This document closes the gap between **capturing lessons** and **actually deciding whether they become portable rules**. The evidence index remains append-only/traceable and `auto_promotion` stays `false`; the change here is that promotion review now has explicit triggers and maximum waiting windows.

Canonical evidence lives in `research/frontend-learning-evidence*.yaml`. Validation is handled by `scripts/validate_frontend_learning_evidence.py`, reusable lesson capture by `scripts/audit_frontend_learning_capture.py`, and review timing by `scripts/audit_frontend_learning_promotion_queue.py`.

## Goal

Do not let useful lessons accumulate indefinitely as notes or candidates.

```text
Implementation / QA failure or success
→ reusable lesson captured
→ evidence index
→ promotion queue trigger
→ explicit disposition
→ canonical rule OR scoped rule OR retire
```

A due review must end in a decision. “Leave it in the queue unchanged” is not a valid disposition.

## Promotion is reviewed, never automatic

The audit may say a rule is **ready for review**. It must not rewrite `promotion_state` itself.

Allowed dispositions:

- promote to `ACTIVE`
- promote from `ACTIVE` to `CORE`
- narrow or keep as `PROJECT_ONLY`
- keep as `CANDIDATE` only with materially new evidence/blocker and a new review cycle
- move to `DEPRECATED`
- move to `RETIRED`

Contradicting evidence is preserved. Promotion does not erase the history that justified an earlier state.

## When review becomes due

### CANDIDATE

Review is due at the **earlier** of:

1. supporting evidence reaches **2 distinct references**, or
2. **14 days** after the learning first entered Git history.

Expected decision:

- `ACTIVE` when cross-reference evidence really generalizes,
- `PROJECT_ONLY` when it is useful but still project-specific,
- remain `CANDIDATE` only when a concrete blocker/new test is recorded,
- otherwise `DEPRECATED` / `RETIRED`.

A candidate is therefore not a permanent parking state.

### PROJECT_ONLY

Review is due at the earlier of:

1. supporting evidence reaches **2 distinct references**, or
2. **30 days** after first appearance.

The review asks whether the rule should stay project-scoped, move back to candidate/generalization work, promote to `ACTIVE`, or retire.

### ACTIVE

A `CORE` review becomes due when support reaches **3 distinct references**.

`CORE` is intentionally harder than `ACTIVE`; it should represent a stable default that has survived multiple independent uses, not merely a repeated local pattern.

### Contradictions

For `CANDIDATE`, `ACTIVE`, or `CORE`, any new contradicting evidence makes review due **immediately**.

The decision may be:

- narrow applicability/conditions,
- demote,
- deprecate,
- retire,
- or keep the state with an explicit `promotion.contradiction_review` explaining why the contradiction does not invalidate the rule.

### DEPRECATED

At **60 days**, review whether the rule should be retired or reactivated with new evidence. Deprecated rules should not become a second permanent archive.

## Review cadence

There are two clocks.

### Event-driven

Run promotion review whenever a PR adds or changes reusable learning evidence. Evidence reaching a threshold should be dispositioned in the same workstream instead of waiting for a calendar date.

### Scheduled

A repository workflow runs the promotion queue audit weekly. This catches rules that became stale simply because nobody touched their evidence file again.

The scheduled audit uses full Git history to determine first-seen dates. If history is unavailable, date-based checks fail open, but evidence-count and contradiction triggers still run; CI must not invent dates.

## Required end-of-run behavior

When a project run produces a reusable lesson:

1. record the lesson in the run/project learning log;
2. run `scripts/audit_frontend_learning_capture.py` and index reusable fragments;
3. run `scripts/audit_frontend_learning_promotion_queue.py`;
4. if review is due, disposition it before calling the learning work complete;
5. only then perform Knowledge Promotion into canonical docs/policy when justified.

Project-specific facts stay project-specific. The point is not to promote everything; the point is to ensure every candidate eventually receives an explicit decision.

## Commands

Report the current queue without failing:

```bash
python scripts/audit_frontend_learning_promotion_queue.py
```

Make due reviews a hard gate:

```bash
python scripts/audit_frontend_learning_promotion_queue.py --fail-on-due
```

Deterministic date for tests/debugging:

```bash
python scripts/audit_frontend_learning_promotion_queue.py --today 2026-09-02
```

## Anti-patterns

- collecting `IMPLEMENTATION_LEARNINGS.md` entries forever without cross-run indexing
- keeping a `CANDIDATE` for months because nobody remembered it
- promoting after one impressive success
- counting multiple evidence files from one reference as independent references
- treating `blocked_by` as a permanent exemption from review
- deleting contradicting evidence after a rule became canonical
- auto-editing canonical policy from a scheduled job

## Relationship to project learning logs

Project logs such as Budokan `IMPLEMENTATION_LEARNINGS.md` remain useful for detailed root causes and local context. They are the intake layer, not the final home of reusable knowledge.

```text
project learning log
→ reusable evidence index
→ timed review queue
→ project rule / ACTIVE / CORE / deprecated / retired
```

This keeps detailed project history while preventing the cross-project learning layer from becoming an unreviewed backlog.
