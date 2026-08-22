# Frontend Reuse Preflight Evidence

Status: ACTIVE evidence contract for newly generated run records

Canonical reuse policy remains `docs/frontend-reuse-before-build.md`. This document only explains how a run proves that the policy was actually considered before implementation.

The goal is not to force more dependencies or more components. The goal is to stop new infrastructure from being invented before existing project code, browser/native capabilities, official tooling, design-system assets, mature OSS/patterns, and proven project patterns have been checked.

## Run lifecycle

New run records use schema v14+ and include `reuse_preflight`.

```text
PLANNED
→ reuse_preflight may be PENDING
→ inspect applicable existing/upstream solutions
→ record evidence and selected reuse
→ PASS or justified NOT_APPLICABLE
→ RUNNING / BLOCKED / COMPLETE
```

Historical schema v13 and older runs are grandfathered. Do not fabricate retroactive reuse evidence.

## Checked source classes

Use only the classes that were materially checked for the current task:

- `EXISTING_CODEBASE`
- `NATIVE_PLATFORM`
- `OFFICIAL_CAPABILITY`
- `DESIGN_SYSTEM_OR_LIBRARY`
- `MATURE_OSS_OR_PATTERN`
- `PROJECT_GOOD_PATTERN`

`PASS` requires at least one checked class and material evidence. It does not require every class on every section.

Examples of evidence:

- existing component/path search result
- Code Connect or Figma design-system lookup
- official Figma/WordPress/Playwright capability checked
- existing Storybook/component registry result
- mature OSS or external pattern evaluated
- existing project Good Pattern reused

The evidence can record that nothing suitable was found. The point is provenance, not a forced reuse outcome.

## Custom infrastructure admission

Normal page implementation is not automatically "custom infrastructure". HTML, PHP, CSS, JavaScript, section components, and project-specific presentation code remain normal implementation work.

Set `custom_infrastructure.planned: true` only when adding a reusable mechanism such as a new validator, transport bridge, visual engine, parser, component browser, generic runtime harness, or other project infrastructure.

When true, record:

```text
existing_solution_checked
why_existing_is_insufficient
smallest_missing_glue
ownership
verification
retirement_trigger
```

This operationalizes the existing Reuse-Before-Build admission test without creating a new search engine or automatic dependency selector.

## Important boundaries

- External popularity never overrides the Effective Project Contract.
- `selected_reuse` may be empty when no suitable existing solution exists.
- `NOT_APPLICABLE` requires a reason rather than fake evidence.
- The preflight does not auto-promote Evidence Index observations into ACTIVE/CORE rules.
- The preflight does not require Storybook, React, wp-env, Percy, Code Connect, or any other optional tool when the target project does not need it.
- Success is lower duplicated responsibility and lower human rework, not a higher dependency count.
