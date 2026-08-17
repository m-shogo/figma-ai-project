# Implementation Intake / Preflight

This tool turns implementation assumptions into an adaptive machine-readable contract before and during implementation. It is runtime-agnostic: HTML, WordPress, React, standalone LPs, and existing company themes can all use the same decision layer without standardizing their implementation architecture.

## Core principle

Do not ask a human every possible question, and do not freeze the first answer forever.

```text
Figma + repo + requirements
        ↓
AI reconnaissance
        ↓
profile: value + source + confidence + evidence + state
        ↓
only unresolved / provisional / low-confidence human decisions
        ↓
preflight + question budget
        ↓
Definition of Done + QA router
        ↓
implementation
        ↓
new evidence / requirement change
        ↓
impact graph → scoped re-question → scoped QA
        ↓
reverse audit + learning feedback
```

## Progressive decisions

Answers may move through `unknown`, `provisional`, `observed`, `confirmed`, and `superseded`. Changing a decision is normal. Decision Lock is a drift detector, not a ban on changing requirements.

Each answer can preserve value, source, confidence, evidence, decider and state. Supported evidence sources are `human`, `figma-observation`, `repo-observation`, `requirement`, `policy`, and `unknown`.

## Browser review UI

```bash
python3 tools/implementation-intake/render_form.py profile.json --output implementation-intake.html
```

The self-contained form shows unresolved/provisional/low-confidence decisions first, resolved decisions with provenance/confidence, per-collection CMS ownership, human overrides, and local `implementation-profile.json` export.

## CMS ownership

Visual repetition is not CMS ownership evidence. Each collection explicitly chooses `fixed`, `repeater`, `post-type`, `relationship`, `flexible-content`, or `undetermined`.

## Main commands

```bash
# base intake
python3 tools/implementation-intake/intake.py validate profile.json
python3 tools/implementation-intake/intake.py questions profile.json
python3 tools/implementation-intake/intake.py preflight profile.json
python3 tools/implementation-intake/intake.py compile profile.json --output definition-of-done.json
python3 tools/implementation-intake/intake.py lock profile.json --output implementation-profile.lock.json
python3 tools/implementation-intake/intake.py check-lock profile.json --lock implementation-profile.lock.json

# adaptive decisions
python3 tools/implementation-intake/adaptive.py report profile.json
python3 tools/implementation-intake/adaptive.py budget profile.json --limit 3
python3 tools/implementation-intake/adaptive.py impact profile.json --changed cms.acf
python3 tools/implementation-intake/adaptive.py evolve profile.json --question cms.acf --value acf-pro --state confirmed --evidence 'Owner decision' --reason 'Requirement clarified' --output profile.v2.json
python3 tools/implementation-intake/adaptive.py recon profile.json observations.json --output observed-profile.json
python3 tools/implementation-intake/adaptive.py overlay profile.json company-overlay.json --output overlaid-profile.json
python3 tools/implementation-intake/adaptive.py route profile.json
python3 tools/implementation-intake/adaptive.py reverse-audit profile.json observed-implementation.json
python3 tools/implementation-intake/adaptive.py complexity implementation-complexity.json
python3 tools/implementation-intake/adaptive.py learn learning.json --question assets.pcSp --kind late-discovery --output learning.json

# adaptive governance
python3 tools/implementation-intake/governance.py decay profile.json --as-of 2026-08-14T00:00:00Z
python3 tools/implementation-intake/governance.py learned-budget profile.json learning.json --limit 3
python3 tools/implementation-intake/governance.py ownership ownership-map.json
python3 tools/implementation-intake/governance.py recheck profile.json --changed cms.acf --ledger learning.json

# latent delivery risks that Figma alone cannot answer
python3 tools/implementation-intake/risk_registry.py profile.json project-facts.json --output risk-report.json

# profile safety / concurrent editing
python3 tools/implementation-intake/profile_ops.py sanitize profile.json --output sanitized.json
python3 tools/implementation-intake/profile_ops.py compat profile.json --output compatibility.json
python3 tools/implementation-intake/profile_ops.py merge base.json left.json right.json --output merge-result.json
```

## Implemented adaptive ideas

### AI reconnaissance, Question Budget and Learning Feedback

AI/repo/Figma observations can prefill non-confirmed decisions. Only high-impact unknowns are asked. Historical outcomes (`prevented-rework`, `late-discovery`, `no-value`) alter later question priority so the intake can become smaller rather than continually accumulating questions.

### Change Impact Graph and Scoped Recheck

When requirements change, dependent questions and required QA are recalculated. Only impacted areas need re-questioning/re-QA where safe.

### Evidence Coverage, Confidence Decay and Assumption Expiry

The system scores evidence coverage. Volatile observations can age out using `observedAt`, `halfLifeDays`, or explicit `expiresAt`, becoming review debt instead of permanent truth.

### Human Override, Company Overlay and CMS Ownership

Human overrides preserve actor/reason. Company defaults fill gaps without overriding project decisions. Repeated content gets explicit CMS ownership rather than automatic Repeater conversion.

### Definition of Done, QA Router, Ownership Map and Reverse Audit

Accepted decisions compile into required QA/deliverables. Ownership maps bind sections/code/assets/interactions/CMS to actual owner paths. Reverse Audit compares expected directives/checks with observed implementation.

### Complexity Alarm

Over-abstraction is flagged by comparing implementation files, abstractions and branches against Figma structural evidence.

## Systemic safeguards added after adversarial review

### Latent Delivery Risk Registry

Figma and source code cannot answer every shipping requirement. `risk_registry.py` explicitly surfaces risks such as:

- Figma reference not pinned while design continues to change
- unfinished/placeholder content hiding real wrapping problems
- accessibility contract missing
- supported browser/device contract missing
- performance budget unknown
- form UI with no backend/error/spam ownership
- analytics/tracking without privacy/consent contract
- unapproved third-party scripts
- image/font license provenance missing
- missing non-Figma edge-state inventory
- deployment/runtime target unknown
- WordPress staging/production indexing ownership unknown
- localization strategy missing for multilingual content

These are intentionally not all mandatory intake questions. They are latent checks activated by project facts so the human questionnaire does not become enormous.

### Profile Secret Safety

Implementation profiles may contain evidence and notes, so they are a potential accidental secret sink. `profile_ops.py sanitize` detects/redacts sensitive key names (secret/token/password/license key/API key/private key/etc.) and URLs containing embedded credentials. Profiles are not a storage location for ACF Pro licenses or any other secrets.

### Concurrent Decision Merge

Two developers or AI agents can change an intake in parallel. `profile_ops.py merge` performs a three-way merge:

- independent decisions merge automatically
- append-only history/override ledgers are unioned
- the same decision changed differently on both sides becomes an explicit conflict
- the tool does not silently choose one person's architecture decision

### Schema Compatibility Boundary

Profiles carry an explicit schema version. Unsupported versions return `migration-required`; profile tooling must preserve unknown fields rather than silently dropping newer metadata.

## Important remaining reality checks

The intake engine deliberately cannot prove production correctness without real project evidence. The first real LP should still exercise actual Figma freshness, real fonts/assets/licenses, real content, target browsers, forms/tracking if present, deployment constraints, ACF Pro if used, and human editing behavior. The purpose of this system is to make those unknowns visible and localize rework—not pretend they can be solved before the project exists.

## Deliberately not standardized

This tool does **not** define a permanent HTML/PHP/CSS/JS structure, component granularity, ACF field tree, slider library, breakpoints, company theme architecture, accessibility target, browser matrix, performance budget, analytics policy, or deployment environment. Those remain project evidence and project decisions.

## Desired behavior

A project can start with unknowns, make provisional decisions, learn from implementation, change requirements safely, merge concurrent human/AI decisions without silent loss, detect latent shipping constraints, re-check only affected areas, and finish with stronger evidence than it started with. The questionnaire should become smaller and smarter over time, not larger.
