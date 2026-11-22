# Scheduled WordPress agent → Codex/Cursor handoff

Status: HUMAN-APPROVED OPERATING INTENT (2026-11-22). Scope: recurring Figma-to-WordPress work. Project authority and phase gate always take precedence.

## Roles and single source of truth

- Scheduled ChatGPT: primary planner and implementer for work possible through connected Figma/GitHub tools; inspect source, implement scoped changes, verify PR/CI, merge only when safe.
- Codex or Cursor: execute tasks requiring local checkout, WordPress/PHP/Vite, browser, real device, licensed assets or hands-on visual comparison. Either tool can fulfill a task; do not assign both the same write scope.
- GitHub: canonical code, issue/PR state, project docs and evidence. The schedule's prompt is a launcher, not an independent copy of project truth.
- CI: static evidence and phase guard; cannot certify a live WordPress/browser check.
- No tool automatically controls another merely because this document exists. Handoff is actionable only when an issue is created and an agent explicitly takes it.

## Every scheduled run

1. Read `AGENTS.md`, `docs/agent-recurring-work-preflight.md`, `docs/recurring-failure-recovery.md` and project authority using diffs/targeted reads. Check latest `so` SHA, relevant open PR/CI, active owner and previous handoff.
2. Use connected Figma, loading mandatory skills first. A skill-list discovery failure is not proof of Figma unavailability. Preserve exact error evidence and choose an independent in-phase READY if needed.
3. Select 3–5 READY candidates **inside the Human-approved phase only**. Never select downstream tasks when the Header/Footer gate is closed.
4. Implement and verify what the current tool environment can actually do; continue through multiple safe units rather than stopping after a successful connection or one PR.
5. If a task needs local runtime/browser or other unavailable capability, create or update **one** GitHub Issue (deduplicate by task scope) with the handoff fields below. Mark `DEFERRED_RUNTIME_QA` as needed, not PASS. Keep working on independent READY.
6. On next run, consume the existing issue's state and PR evidence. Do not redo Codex/Cursor-owned files, repeat failed calls without changed prerequisites, or auto-close an issue on CI-only evidence.
7. At exit, record base SHA, completed work, PR/CI, real verification level, remaining READY/BLOCKED, handoffs and next action. If scheduler edits fail, record `SCHEDULER_NOT_UPDATED` and do not claim the launcher was changed.

## Handoff Issue minimum fields

- `Scope/phase`: e.g. `jwsnj / COMMON_UI_HEADER_FOOTER`
- `Owner`: exactly one of `Codex`, `Cursor`, or `UNCLAIMED`; include write paths. Never infer ownership merely from an agent name in a comment.
- `Why scheduled agent cannot complete`: concrete missing capability and observed error/evidence
- `Source authority`: Figma fileKey/node IDs, GitHub base SHA and relevant PRs
- `Task`: exact files/components and expected behavior; no speculative URLs, ACF/CPT, content or assets
- `Acceptance`: commands to run, WordPress/browser PC/SP states and screenshot comparison where applicable
- `Evidence`: CI URLs, screenshots/logs, PASS/FAIL/DEFERRED with timestamps and tested SHA
- `Unblock/return`: conditions for scheduled agent to resume, PR URL, and review/merge ownership

Issue lifecycle: `UNCLAIMED → CLAIMED → PR_OPEN → VERIFIED → CLOSED`. `BLOCKED` and `DEFERRED_RUNTIME_QA` are explicit statuses, not success. Only one active writer per path; conflicting claims require resolution before edits. Use existing issue labels/boards if present; don't create parallel trackers by default.

## Scope-specific jwsnj boundaries

- Figma `K3SANPVHIEerfYBQtM4lXF`; PC `0:1`, SP `263:12`, menu `599:2726`/`480:3954`, Footer `221:335`.
- Header/Footer phase remains closed until the Human-controlled gate passes. Do not merge downstream work as a fallback.
- Foundation worker owns variables/fonts/assets; Header/Footer worker must not edit those paths concurrently. Request the asset through a scoped handoff rather than racing edits.
- Runtime QA on a developer's machine requires actual Codex/Cursor execution and evidence; remote CI is not a substitute.

## Validation and improvement

A useful handoff is one that a fresh Codex/Cursor session can execute without asking the Human to restate context. Review repeated unclaimed/blocked handoffs, duplicate investigations, and rework after each run. Record incident fingerprints and tested recoveries via `docs/recurring-failure-recovery.md`; only promote cross-project rules under `docs/knowledge-promotion.md`. Do not declare full integration until a real scheduled run creates/updates a handoff, Codex/Cursor executes it, and the scheduled agent consumes the verified result.
