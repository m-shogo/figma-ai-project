# Research Radar — Automation-first Figma × AI Update Research

Last revised: **2026-08-11 JST**

目的: Figma / MCP / Codex / Claude Code / Cursor / Web Platform / browser / accessibility / WordPress・ACF の変化を、人間の手動検索に依存せず検知し、**必要な実装ルールだけを再試験へ戻す**。

この文書は「毎回どんな検索語でWeb検索するか」ではなく、Scheduled Official Update Radarをproductionの入口として扱う。

## Canonical operating model

通常運用:

```text
Official source registry
→ daily GitHub Actions
→ fetch
→ normalize / relevant-subset extraction
→ canonical fingerprint
→ previous snapshot diff
→ impact / RETEST classification
→ persisted evidence
→ run-specific relevance filtering
→ preflight SHA-256 pin
→ local experiment / clean replay
→ evidence promotion
```

Canonical files:

- `config/update-sources.yaml`
- `scripts/validate_update_sources.py`
- `scripts/fetch_update_radar.py`
- `.github/workflows/update-radar.yml`
- `scripts/update_radar_issue.py`
- `scripts/apply_radar_preflight.py`
- `scripts/start_section_run.py`
- `docs/update-preflight.md`

**Manual web search is not the normal production gate.**

---

## Daily collection

`.github/workflows/update-radar.yml` runs every day at **12:17 JST**.

```text
official source fetch
→ normalized evidence
→ fingerprint comparison
→ changed / first observation / fetch error classification
→ RETEST candidate generation
→ evidence persistence when meaningful
```

No upstream change means no no-op commit merely because time advanced.

Persisted state:

- `research/update-radar/latest.json`
- `research/update-radar/latest.md`
- `research/update-radar/state.json`
- `research/update-radar/history/`

`workflow_dispatch` is recovery/debugging support, not a human daily checklist.

---

## Registry contract

`config/update-sources.yaml` is the machine-readable source registry.

`python scripts/validate_update_sources.py` rejects malformed registry state before network access, including:

- duplicate source IDs
- unsupported source kinds
- non-official authority in the production Radar registry
- non-HTTPS or malformed URLs
- missing/invalid `topics`
- missing/invalid `impacts`
- invalid `include_keywords`
- optional browser lane without explicit Company Policy profile activation

The registry validator is also part of repository readiness and CI.

Community/practitioner discovery belongs outside this production-official registry unless a future contract explicitly introduces a separate non-gating lane.

---

## Automatic source lanes

### Figma

- Figma Release Notes
- Figma MCP docs
- Figma MCP tools/prompts

Typical impact:

- `FIGMA_MCP`
- `AGENT_CONTEXT`
- `LAYOUT`
- `COLOR_GRADIENT`

### MCP

- Model Context Protocol official specification/releases

Typical impact:

- `FIGMA_MCP`
- `AGENT_CONTEXT`
- `PARALLEL_EXECUTION`

### Coding agents

- OpenAI / Codex official updates
- Claude Code official releases/feed
- Cursor official changelog

Typical impact:

- agent context/tool behavior
- MCP integration
- isolation/worktree behavior
- parallel execution assumptions

### CSS / Web Platform

- W3C WebDX `web-features`
- MDN Browser Compat Data
- Chrome/Chromium platform status when relevant

Typical impact:

- `CSS_RESET`
- `VIEWPORT_SAFE_AREA`
- `INPUT_CAPABILITY`
- `SCROLL`
- `ANIMATION`
- `LAYOUT`
- `COLOR_GRADIENT`

### Accessibility

- W3C WAI official updates

Typical impact:

- `ACCESSIBILITY`
- interaction/focus/keyboard/motion QA

### Design systems

- Design Tokens related official/specification releases

### WordPress / ACF

- WordPress releases
- WordPress Developer Blog
- ACF official releases/changelog

Typical impact:

- `WORDPRESS_ACF`

### Browser-specific lanes

Activated from Company Policy Required Environment Profiles, not viewport width:

- Safari / WebKit
- Chromium / Chrome / Edge
- Firefox / Gecko

A 390px iPhone Safari profile and a desktop Chrome profile resized to 390px do not activate the same environment evidence merely because width matches.

---

## Fingerprint noise control

Large/dynamic sources must not turn every unrelated upstream mutation into a production RETEST.

For filtered JSON sources:

```text
large upstream JSON
→ extract records/subtrees matching source include_keywords
→ canonical JSON serialization
→ subset fingerprint
```

Do **not** mix a whole-document hash back into a keyword-filtered fingerprint.

Therefore:

- unrelated Chrome Status feature update → no change for a CSS/viewport-filtered digest
- relevant viewport/safe-area feature update → fingerprint changes
- no matching record → stable empty subset until a relevant record appears

Dynamic HTML sources should follow the same principle: fingerprint the stable/relevant content rather than navigation chrome, timestamps, personalization, or unrelated page sections. Add source-specific extraction when generic visible-text filtering proves noisy.

---

## Change semantics

A source fingerprint change means:

```text
UPSTREAM_CHANGE
→ RETEST_CANDIDATE
```

It does **not** mean:

```text
NEW_BEST_PRACTICE
```

Promotion path:

```text
UPSTREAM_CHANGE
→ RETEST_CANDIDATE
→ local targeted experiment
→ clean replay
→ evidence promotion
→ Company Policy / Proven Playbook revision candidate
```

One release note does not silently rewrite Company Policy.

---

## Run-specific relevance

The global snapshot may contain changes for many stacks and browsers. A concrete production run only receives the subset relevant to that run.

`apply_radar_preflight.py` determines required lanes from:

- Figma/MCP/Web Platform/Accessibility baseline
- actual agent client
- active Company Policy Required Environment Profiles

Then:

```text
snapshot changes
→ changes_relevant_to_run
→ category union
→ rules_to_retest
```

Example:

- React + Codex + Safari run: WordPress release does not become a run RETEST solely because it exists in the global snapshot.
- WordPress/ACF run: the applicable CMS lane can participate when the run contract requires it.

This separation prevents global Radar breadth from becoming local implementation noise.

---

## Production preflight

Normal start path:

```text
python scripts/apply_radar_preflight.py <run.yaml> --apply
python scripts/start_section_run.py <run.yaml> --apply
```

Current freshness default: **36 hours**.

Preflight pins at least:

- Radar path
- Radar SHA-256
- generated timestamp
- required active lanes
- official-source completeness
- run-relevant changes
- `rules_to_retest`
- source warnings

Required official lane unavailable → **fail closed**.

Community scan missing → does **not** block production start.

---

## RETEST categories

Current registry can classify changes into categories including:

- `CSS_RESET`
- `VIEWPORT_SAFE_AREA`
- `INPUT_CAPABILITY`
- `SCROLL`
- `ANIMATION`
- `LAYOUT`
- `COLOR_GRADIENT`
- `ACCESSIBILITY`
- `FIGMA_MCP`
- `AGENT_CONTEXT`
- `PARALLEL_EXECUTION`
- `WORDPRESS_ACF`

Categories are routing metadata for experiments, not permanent truth labels.

---

## Optional manual/community discovery

Manual/community research remains useful for **finding hypotheses that official sources do not expose clearly**, especially practical failure modes.

Possible sources:

- Zenn / Qiita
- engineering blogs
- Figma Forum
- GitHub Issues/Discussions
- Reddit / Hacker News
- X / social posts
- conference talks / videos with reproducible details

Rules:

1. It is optional discovery, not the normal production start gate.
2. Community signal begins at external-signal maturity; it does not outrank official sources.
3. Record version/date/environment when it materially affects the claim.
4. Convert useful signals into measurable experiments.
5. Search counterexamples before promoting a strong claim.

Useful optional queries may include:

```text
"Figma MCP" responsive
"Figma MCP" component reuse
"Figma MCP" token
"Figma MCP" Japanese font
"Figma MCP" workaround
site:zenn.dev "Figma MCP"
site:forum.figma.com MCP
```

Do not run this query bank mechanically before every production implementation.

---

## Evidence output

The Radar should remain compact and actionable.

Prefer:

- structured source identity
- canonical fingerprint
- concise relevant excerpt/items
- matched keywords
- impact categories
- RETEST categories
- changed/first-observation/fetch-error state

Avoid:

- accumulating hundreds of undigested links
- duplicating one release announcement across many sources
- treating publication count as corroboration
- promoting rules directly from news

## Final rule

**Automation detects what may need retesting; controlled experiments decide what this repository believes.**