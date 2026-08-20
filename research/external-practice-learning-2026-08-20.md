# External Practice Learning — 2026-08-20

Status: research evidence / adoption candidates

Purpose: learn from current first-party guidance, open-source implementations, practitioner workflows, and adjacent agent ecosystems without blindly copying them. The goal is to reduce duplicated work and repeated failure while preserving the parts that are specific to `figma-ai-project`: Figma truth interpretation, Existing Project adaptation, Human Repairability, and learning from real rework.

This document is not a higher authority than Company / Existing / Project contracts.

## 1. Strongest new confirmation: section-first is now first-party guidance

Figma's current MCP guidance explicitly recommends breaking large selections into smaller components or logical chunks when generating code.

The same guidance recommends:

- reusable Figma components for repeated UI
- Code Connect when a real production component exists
- variables for spacing/color/radius/typography
- semantic layer naming
- Auto Layout to communicate responsive intent
- annotations/dev resources for behavior that visuals alone do not explain
- resizing frames in Figma to test responsive behavior before implementation

Sources:

- https://github.com/figma/mcp-server-guide
- https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/
- https://github.com/figma/mcp-server-guide/blob/main/skills/figma-design-to-code/SKILL.md

### Implication

Our existing section-first / progressive-disclosure direction is no longer supported only by local experience and practitioner reports. It now has current first-party support.

Do not turn this into a rigid rule that every section must have the same size. The useful principle is:

```text
large reference
→ decompose by meaningful implementation/review boundary
→ retrieve only relevant Figma context
→ implement against Existing Project
→ verify that boundary
→ integrate
```

The correct boundary may be a shared component, a visual section, or a small interaction unit.

## 2. Generated Figma code is reference evidence, not production truth

Figma's current design-to-code skill explicitly says that `get_design_context` output must be adapted to the target project's framework, component library, styling system, and conventions.

The skill's evidence priority is especially useful:

```text
Code Connect mapping
→ component documentation
→ design annotations
→ design tokens
→ raw values / absolute positioning
```

It also instructs agents to use exact exported assets rather than redrawing icons/images when exact asset sources exist.

### Adoption

Keep our current rule:

- Figma visual truth stays authoritative for appearance.
- Figma structured context is implementation evidence.
- generated React/Tailwind-like reference code is not production code.
- Existing production components/tokens win when they express the same intent.
- exact Figma/Existing SVG/image assets are checked before AI recreation.

This is a `KEEP` confirmation, not a new subsystem.

## 3. Figma Simple Design System is a useful reference architecture

Figma publishes `figma/sds`, a Simple Design System repository that demonstrates Variables, Styles, Components, Code Connect, React, and Storybook working together.

Source:

- https://github.com/figma/sds

### What to learn

For projects that genuinely have a design system, the useful architecture is not "Figma generates arbitrary code". It is:

```text
Figma variables/components
↔ explicit component mapping
↔ production component library
↔ isolated component review surface
```

### What not to copy

Do not force SDS architecture onto standalone LPs, PHP templates, or projects without a shared component system.

Use it as a reference architecture for the `DESIGN_SYSTEM` implementation profile only.

## 4. Agent instruction architecture is converging across ecosystems

Current GitHub Copilot, Codex, and Claude Code guidance increasingly separates persistent rules from task-specific procedures.

Useful external pattern:

```text
stable shared rules
→ AGENTS.md / repository-level instructions

path-specific rules
→ scoped instruction files only where needed

task-specific procedures
→ Skills / prompt workflows

deterministic enforcement
→ CI / hooks / tests

specialized parallel expertise
→ subagents when isolation actually helps
```

Sources:

- https://docs.github.com/en/copilot/reference/custom-instructions-support
- https://docs.github.com/en/copilot/concepts/agents/code-review
- https://openai.com/index/unrolling-the-codex-agent-loop/
- https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more

### Implication

Do not keep growing root `AGENTS.md` into a complete handbook.

Our preferred layout remains:

```text
AGENTS.md = small universal contract / router
canonical docs = durable knowledge
skills/prompts = procedural workflows
client adapters = only client-specific differences
CI/tests = deterministic invariants
run/reference records = project/reference-specific evidence
```

This reduces instruction drift across Codex / Claude Code / Cursor / Copilot-compatible agents.

## 5. GitHub Copilot confirms AGENTS.md as cross-agent shared instruction surface

GitHub's current docs support `AGENTS.md` for cloud-agent/code-review scenarios alongside Copilot-specific instruction formats.

This is useful because it means our root `AGENTS.md` can remain the cross-agent common contract instead of creating a full independent Copilot rule copy.

If Copilot-specific behavior is ever needed:

- `.github/copilot-instructions.md` should contain only Copilot-specific/global additions
- `.github/instructions/*.instructions.md` should be path-specific
- duplicate copies of canonical frontend rules should not be created

No Copilot-specific files are required now merely because the feature exists.

## 6. Open-source Figma↔browser tooling shows recurring architecture

Several independent projects converge on the same useful primitives.

### uiMatch

Source:

- https://github.com/kosaki08/uimatch

Observed design:

- Figma render
- Playwright implementation render
- pixel/layout/style/color/text comparison
- machine-readable `report.json`
- experimental AI repair loop

Current project state is explicitly experimental / 0.x, so it is not a production dependency candidate yet.

Useful idea to retain:

**visual evidence should be machine-readable enough for the repair agent to reason about cause, not only a PNG diff.**

### visual-diff / vdiff

Source:

- https://github.com/s1awek/visual-diff

Observed design:

- Figma REST render + Playwright capture
- side-by-side / overlay / difference view
- route/view mapping
- project-agnostic configuration
- unresolved Figma comments can be surfaced in the terminal workflow

Useful idea:

**design feedback should be reachable in the same implementation/review context rather than living in a disconnected Figma tab.**

Do not create a custom comments platform. If Figma exposes comments safely through an available official/client API, evaluate a thin integration.

### FigmaDiffEngine-Playwright and similar small projects

Multiple small projects independently implement:

```text
Figma baseline
+ Playwright screenshot
+ image diff
+ report
```

This strengthens the decision that the generic screenshot/diff mechanism is commodity infrastructure. Our differentiation should remain cause classification, project adaptation, provenance, and Human Repairability.

## 7. Figwright is an interesting local fallback, not a default dependency

Source:

- https://github.com/awdr74100/figwright

Observed capability:

- local two-way Figma MCP through a plugin/WebSocket relay
- design read + canvas write
- framework-aware context
- no Figma Dev Mode seat requirement claimed by the project
- works with multiple MCP clients

### Why it matters

Official plan/seat/client availability can still create gaps. A local alternative demonstrates that "official entitlement unavailable" does not necessarily mean "we must build our own Figma bridge".

### Why it is not adopted now

- third-party Figma plugin trust boundary
- broad canvas access
- maturity/maintenance must be monitored
- official Remote MCP is currently available for our core read/asset workflow

Status: `RESEARCH_FALLBACK_CANDIDATE`.

If a future project is blocked by official MCP entitlement/client support, compare Figwright or another maintained local solution before creating new bridge infrastructure.

## 8. Other Figma-to-code projects expose useful implementation ideas without becoming dependencies

Example:

- https://github.com/gbasin/figma-to-react

Interesting ideas include:

- exact asset download
- content-hash deduplication
- semantic asset renaming
- automated visual verification
- framework/directory detection

These ideas should be compared with our existing implementation before adding anything. In particular, content-hash asset deduplication is a reusable pattern only if it reduces duplicate binaries without destroying source provenance or intentional art-direction variants.

Status: idea mining only.

## 9. New adoption rule: learn responsibility, not product branding

For every external tool/repository/article, record the smallest useful responsibility.

Bad evaluation:

```text
"Tool X looks good → adopt Tool X"
```

Preferred evaluation:

```text
What responsibility does it solve?
What evidence says it solves it well?
Do we already solve that responsibility?
Is our solution actually project-specific or just duplicated commodity code?
Can we replace only the duplicate part?
What new trust/cost/maintenance boundary appears?
How do we verify equivalence?
How do we roll back?
```

## 10. External learning pipeline

Use two lanes.

### Lane A — current authoritative capability

Sources:

- official product docs
- official release notes
- official specifications
- maintained first-party repositories

Use for current capability facts.

Existing Update Radar remains the mechanism. Do not create another official-source monitor.

### Lane B — field intelligence / idea discovery

Sources:

- OSS repositories
- issue trackers
- practitioner articles
- community discussions
- benchmarks/research papers

Use for:

- failure discovery
- operational friction
- alternative architecture
- useful metrics
- candidate experiments

Community evidence does **not** mutate Company Policy or Proven Playbook directly.

Flow:

```text
external signal
→ identify responsibility
→ check current official capability
→ compare with Existing implementation
→ disposable/real-project experiment
→ measure fidelity/rework/Human Correction Cost
→ Observation/CANDIDATE
→ independent replay
→ ACTIVE / PROJECT_ONLY / RETIRE
```

## 11. Experiments worth running next

### E-EXT-01 — instruction placement

Compare the same implementation task with:

1. oversized all-in-one AGENTS instructions
2. short root contract + task-specific skill + canonical docs

Measure:

- instruction violations
- repeated prompt corrections
- context usage
- completion time
- final Human Correction Count

### E-EXT-02 — Figma section sizing

Compare meaningful section/component progressive disclosure against larger one-shot context on the same reference.

Measure:

- first-pass visual gap
- skipped details
- asset mistakes
- context/tool calls
- repair rounds

Do not use an intentionally artificial tiny section size; preserve semantic boundaries.

### E-EXT-03 — machine-readable visual diagnosis

Evaluate whether a small structured report inspired by uiMatch can reduce blind pixel repair without adopting uiMatch itself.

Candidate output:

```text
section
viewport
layout delta
text delta
asset mismatch
computed-style delta
pixel diff artifact
likely cause category
```

Only build fields that current Playwright/Figma evidence cannot already provide cheaply.

### E-EXT-04 — Figma comments in implementation review

If an official/approved Figma comments read path becomes available, test surfacing unresolved comments for the current section during Verify/Human Review.

Goal: reduce context switching, not create another comment database.

### E-EXT-05 — local MCP fallback

Only when official Remote MCP is genuinely blocked, compare a maintained local alternative such as Figwright against the old custom bridge.

Compare:

- privacy/trust boundary
- fidelity/context coverage
- asset access
- client compatibility
- setup burden
- maintenance burden

## 12. Current conclusion

External evidence increasingly supports the architecture already emerging in this project:

```text
structured Figma context
+ semantic section decomposition
+ Existing-project reuse
+ exact assets
+ real browser verification
+ small machine-readable evidence
+ root-cause repair
+ scoped reusable instructions
```

The next improvement should not be "build a bigger AI framework".

It should be:

**continuously replace duplicated responsibility with maintained upstream capability, while making our remaining judgement/learning layer sharper.**
