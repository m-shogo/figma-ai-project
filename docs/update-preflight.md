# Update Preflight — Automated Official Update Radar

Last revised: **2026-08-11 JST**

AI/Figma/Web Platform tooling changes quickly. Production must not depend on a human remembering to search release notes before every run.

## Core rule

**Manual web search is not the normal workflow.**

The repository continuously maintains a machine-readable Update Radar:

```text
Official upstream sources
→ scheduled fetch
→ normalized fingerprint
→ previous snapshot diff
→ impact / RETEST category
→ persisted evidence
→ planned Run preflight pin
→ experiment / replay before rule promotion
```

Company Policy and Proven Playbook are **not** silently rewritten from news alone.

---

## Scheduled collection

Canonical workflow:

- `.github/workflows/update-radar.yml`

Default schedule:

- daily at 12:17 JST
- manual `workflow_dispatch` remains available for debugging/recovery, not ordinary use

If upstream fingerprints did not meaningfully change, do not create a no-op repository commit.

When meaningful changes or fetch failures exist, maintain the rolling Update Radar issue and preserve machine-readable evidence under:

- `research/update-radar/latest.json`
- `research/update-radar/latest.md`
- `research/update-radar/state.json`
- `research/update-radar/history/` for changed snapshots

---

## Source registry

Canonical registry:

- `config/update-sources.yaml`

Current automatic lanes include:

### Figma

- Figma Release Notes
- Figma MCP docs
- Figma MCP tools/prompts

Watch for:

- MCP tools
- design context / metadata / screenshot semantics
- Code Connect
- Variables / Components
- Auto Layout / Grid
- code ↔ canvas workflows
- image/font handling
- Dev Mode / annotations
- Skills / agent workflows

### MCP

- official Model Context Protocol specification releases
- current official specification

### Coding agents

- OpenAI/Codex official release information
- Claude Code official releases/feed
- Cursor official changelog

### CSS / Web Platform

- W3C WebDX `web-features`
- MDN Browser Compat Data
- browser platform release/status sources

Watch especially:

- reset/base assumptions
- `dvh/svh/lvh`
- safe-area / VisualViewport / virtual keyboard
- hover/pointer/touch
- scroll / Scroll Snap / sticky
- animation / View Transitions / scroll-driven animation
- Grid/Flex/Container Queries/Subgrid
- color spaces / gradients
- forms / native controls

### Browser/device lanes

When active Company Policy contains those environments, include vendor-specific evidence such as:

- Safari / WebKit
- Chromium / Chrome / Edge
- Firefox / Gecko

Do not classify device behavior from viewport width alone.

### Accessibility

- W3C WAI updates

Track WCAG/ARIA/focus/keyboard/target-size/contrast/motion guidance that can affect implementation or QA.

### Design systems

- Design Tokens specification/community-group releases

### WordPress / ACF

- WordPress releases
- WordPress Developer Blog
- ACF official releases
- ACF official changelog

This lane is collected automatically because CMS/ACF work is part of the intended implementation scope.

---

## Run preflight without manual searching

For a planned Run:

```text
python scripts/apply_radar_preflight.py <run.yaml> --apply
python scripts/start_section_run.py <run.yaml> --apply
```

`apply_radar_preflight.py` verifies that:

- Radar snapshot is fresh enough
- Figma release source succeeded
- Figma MCP docs succeeded
- MCP lane succeeded
- CSS/Web Platform lane succeeded
- Accessibility lane succeeded
- the actual agent lane succeeded
- browser/device-specific required lanes succeeded when active

It then pins:

- snapshot path
- snapshot SHA-256
- generated timestamp
- required active lanes
- relevant upstream changes
- RETEST candidates
- non-blocking source warnings

`start_section_run.py` re-checks the pinned snapshot hash and freshness immediately before changing `PLANNED → RUNNING`.

A human does not check four booleans manually in the normal path.

---

## Freshness policy

Current default planned-run maximum age:

- **36 hours**

This tolerates scheduled-run timing while ensuring a production run cannot silently depend on an old Radar snapshot.

The value is a current operational default, not a permanent web-platform truth.

---

## Source failure policy

Do not solve a broken official source by silently pretending it was checked.

If every source for a required lane fails:

```text
Run start = BLOCKED
```

Fix/replace the source adapter or wait for the official source to recover.

One redundant source failing is a warning if the required lane still has trustworthy official evidence.

---

## Change semantics

An upstream change is **not** an automatic best-practice change.

```text
UPSTREAM_CHANGE
→ RETEST_CANDIDATE
→ targeted local experiment
→ clean replay
→ evidence promotion
→ optional Company Policy / Playbook revision
```

Examples:

- Figma Auto Layout semantics change → retest layout translation assumptions
- Safari viewport change → retest environment compatibility rules
- MDN/BCD support data change → retest CSS feature adoption against Required Environment Profiles
- Claude/Codex/Cursor context or worktree changes → retest agent-specific execution assumptions
- ACF Blocks change → retest CMS implementation rule only where applicable

Old evidence remains history; it is not deleted.

---

## Community information

Community/practitioner sources can be automatically added as discovery lanes later, but they are never higher authority than official sources.

They are **not a production start gate**.

A community signal may create a hypothesis; an experiment decides whether it becomes a rule.

---

## Noise control

The Radar must avoid becoming a news archive.

Rules:

- store fingerprints, structured items, compact excerpts and impact categories
- do not persist duplicate announcements as independent evidence
- do not commit only because the fetch timestamp changed
- prefer affected-domain filtering
- keep one rolling actionable issue rather than one issue per release
- keep raw upstream facts separate from promoted rules

---

## Completion criterion

The update system is doing its job when a production agent can begin with:

```text
current Company Policy
+ current Environment Contract
+ current official Update Radar snapshot
+ relevant RETEST candidates
```

without asking the user to search the web or manually verify release-note checkboxes.
