# EXP-0001 — Baseline Responsive Product Landing

Status: READY_TO_RUN

## Purpose

最初の題材は、特定案件の見た目に寄りすぎず、Figma→AI実装で頻出する要素を1画面に含める。

この実験の目的は「最高のLPを作る」ことではなく、今後の比較用baselineを作ること。

## Reference Design Requirements

同じ内容を Desktop / Mobile で設計する。

### Sections

1. Header
   - logo
   - 3 nav items
   - primary CTA
2. Hero
   - eyebrow
   - heading
   - body
   - two CTAs
   - product visual placeholder
3. Feature cards ×3
4. Compact signup form
5. Footer

### Design constraints

- 8pt-based spacing system
- reusable Button component
- reusable Feature Card component
- semantic color variables
- text styles
- Auto Layout
- no random one-off spacing values unless visually required
- native Figma layers; do not flatten the UI

### Desktop target

- frame width: 1440
- content max width: approximately 1200
- feature cards: 3 columns
- hero: 2-column composition

### Mobile target

- frame width: 390
- feature cards: 1 column
- hero: stacked
- header navigation collapses / simplifies intentionally
- CTA hierarchy preserved

## Controlled content

Use the same fixture text and asset placeholders for every agent.

### Product

Name: `Orbit Notes`

Eyebrow: `THINK CLEARLY`

Heading: `Ideas move faster when your workspace stays simple.`

Body: `Capture rough thoughts, connect decisions, and keep the next step visible without turning your notes into another project to manage.`

Primary CTA: `Start free`

Secondary CTA: `See how it works`

Features:

1. `Capture fast` — `Save an idea before context disappears.`
2. `Connect decisions` — `Keep notes, rationale, and follow-ups together.`
3. `Find the next step` — `Turn unfinished thinking into visible action.`

Form heading: `Get product updates`

Input placeholder: `you@example.com`

Submit: `Join the list`

## Phase A — Common prompt baseline

Run Codex / Claude Code / Cursor with the same `prompts/figma-to-code.md` baseline and the same reference node.

Do not provide agent-specific tricks.

Measure:

- first-pass score
- failure categories
- repair rounds
- final score

## Phase B — Structured-context baseline

Repeat from clean code baseline, adding explicit:

- component metadata
- variables/tokens
- responsive contract
- exact screenshots

Compare against Phase A.

## Phase C — Code Connect

Once a small real component library exists, map Button / Card and repeat.

Primary question:

> Does component mapping reduce structural drift and duplicate implementation enough to lower human rework?

## First hypotheses

H1. Structured Figma context will improve Structural Fidelity more than Visual Fidelity.

H2. Exact screenshot verification will improve Visual Fidelity but can introduce visual-only hacks unless structural acceptance criteria are explicit.

H3. Explicit PC→SP invariants will reduce responsive mistakes more than simply providing two screenshots.

H4. Small staged prompts (inspect → implement → verify) will be more reproducible than one giant prompt.

H5. Agent-specific optimized prompts may outperform a common prompt, but generalizable rules should be extracted separately.

## Completion condition

EXP-0001 is complete only after at least:

- 1 fixed Figma reference
- 3 agent runs OR documented reason an agent could not run
- Desktop + Mobile + intermediate width capture for each run
- first-pass scoring
- failure classification
- at least one clean re-run using an improved instruction
- candidate lessons written down
