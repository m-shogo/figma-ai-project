# Recurring failure recovery — executable operating contract (2026-11-22)

Status: HUMAN-REQUESTED, PROPOSED; not proven until replay and CI evidence. Scope: recurring agents in this repository. Complements `docs/agent-recurring-work-preflight.md`, `docs/agent-execution-policy.md`, `docs/knowledge-promotion.md`; no automatic promotion of project-specific design rules.

## Per-run recovery loop

1. Read latest base SHA, open PR/CI, active owners, current phase, last handoff and recent failure fingerprints; avoid duplicate work.
2. Probe only capabilities needed for the next READY. Record each probe as `capability / operation / result / error class / evidence / timestamp`. Never infer missing capability from an empty discovery list.
3. On failure, classify `AUTH_PERMISSION | RESOURCE_LOOKUP | TRANSIENT | RATE_LIMIT | BAD_INPUT | ENV_UNAVAILABLE | CODE_REGRESSION | UNKNOWN`. Do not invent a root cause from a generic error.
4. Compute a fingerprint from tool + operation + target + normalized error (exclude ephemeral session IDs). If the same fingerprint recurs with no changed prerequisite, do not replay the identical failing call. Use a documented alternative, or mark that READY BLOCKED with its owner and explicit unblock condition.
5. Continue an independent READY inside the authorized phase; no downstream work as a fallback. If no safe READY remains, stop with the evidence and exact reason.
6. Record observed outcome in existing project LEARNINGS/handoff or PR; include fingerprint, attempted recovery, what actually passed, what remains unverified, and next retest trigger. Do not add a new log file for each run.
7. On the next run, read the previous outcome before attempting the same operation. Two repeated same-cause failures trigger a process-review item and a testable change to the recovery path, not another exhortation.
8. A fix is VERIFIED only after a fresh-session replay demonstrates the recovery and no critical regression; CI passing alone does not prove remote tool availability or browser QA. Unproven fixes stay CANDIDATE.
9. Before any rule is generalized to other projects, follow `docs/knowledge-promotion.md`. Human-approved cross-project operating principles may apply immediately, but project values and technical constraints do not propagate automatically.

## FIGMA-SKILL-001 — specific recovery case

- Failure: `skills__read(skills://plugins/figma/figma-design-to-code/skill.md)` reported `Resource not found` in a previous run; root cause UNKNOWN. A prior empty `skills__list` was wrongly treated as proof of absence.
- Successful recovery observed 2026-11-22: direct `skills__read` of `figma-design-to-code` and `figma-use`, `mcp__Figma__create_session`, Footer `221:335` metadata/design context, PC `599:2726` and SP `263:12` / menu `480:3954` screenshots. This proves availability in that session, not permanent uptime.
- First action each new run: direct read of the design-to-code skill. If successful, create a fresh session and use connected Figma tools with the documented node IDs. If not, capture the exact error; do NOT call `get_design_context` without the mandatory skill guidance.
- A failed skill read is NOT equivalent to a failed Figma connection. Do not assert a specification change without authoritative release evidence. Work on an independent Header/Footer READY that does not require unread guidance, or report all blockers.
- Acceptance replay: a fresh run demonstrates direct skill read + session + high-fidelity node context and screenshot, or correctly classifies the failure and completes an independent in-phase READY. Capture actual tool evidence and outcome.

## Audit assertions (fail closed where machine-checkable)

- Every reported PASS links to actual execution evidence. `STATIC_VERIFIED` and `RUNTIME_VISUAL_VERIFIED` are separate.
- Each repeated failure has a stable fingerprint and a different recovery path or a documented changed prerequisite.
- Each blocked item has a concrete unblock condition and owner; READY never crosses the Human-controlled phase boundary.
- PR/CI and latest base are reread before merge; no blind force merge.
- A run that only rewrites instructions without testing an actionable recovery must be reported as DOCUMENTATION_ONLY, not FIXED.
- If the scheduler cannot be edited from the current environment, explicitly report SCHEDULER_NOT_UPDATED; repository changes do not silently update scheduled prompts.

## Verification backlog

- [ ] Fresh scheduled run follows this contract and records fingerprint/outcome.
- [ ] Injected/mocked `Resource not found` scenario exercises safe fallback without violating skill prerequisite.
- [ ] Repeated-failure scenario proves no identical retry loop.
- [ ] Existing CI can check phase boundaries and regressions; add narrow automated assertions only where repository tooling supports them.
- [ ] Scheduler instructions updated and independently reread; until then SCHEDULER_NOT_UPDATED.
