# Visual Diff / Human Review Policy

## Purpose

Visual Diff exists to help a human reviewer find meaningful visual mismatches quickly. It is not a requirement to drive every pixel difference to zero.

The design source of truth remains Figma. Automated review should surface likely shape, position, crop, spacing, text-layout, and asset differences, then hand the final judgement to a human reviewer.

## Cost policy

Use free / self-hosted tooling by default.

- GitHub Actions
- Playwright / Chromium
- static HTML/CSS/JS review dashboard
- repository-owned deterministic captures
- repository-owned visual-diff code

Do not make paid visual-regression SaaS a production dependency. External services such as Chromatic or Percy may be researched for workflow ideas, but their paid infrastructure is not required for this project.

## Current implementation — do now

### 1. Deterministic captures

Capture the same required viewport/environment repeatedly with the browser/runtime pinned by CI. Wait for fonts and images before capture. Disable screenshot-time animations/caret where possible so false positives do not dominate review.

### 2. Four review views

Human Review should make these complementary views available when deterministic Figma/Web captures exist:

- Live Web / Figma side-by-side
- Overlay / blink
- Perceptual Visual Diff
- normal human judgement + feedback

No one view is authoritative by itself.

### 3. Staged sensitivity

Use three explicit sensitivity levels:

- `Loose` — find large material differences quickly; suppress sparse noise strongly.
- `Standard` — normal review default; intended for shape, crop, position, spacing, and clear text-layout differences.
- `Strict` — finishing inspection only; keeps small differences and is intentionally noisy.

Strict is advisory and must not become the default automatic merge gate.

### 4. Hotspot prioritization

Visual Diff should prioritize a small number of the largest connected difference regions. The reviewer should inspect these before scanning the entire red map.

Hotspot ranking is a navigation aid, not an automatic diagnosis. Do not claim that a hotspot is a crop/typography/position bug until the actual Figma and implementation are inspected.

### 5. Review-first metrics

Useful metrics include:

- visual diff ratio
- largest difference bounding box
- top difference hotspots
- analysis scale
- runtime overflow/image/font errors

These metrics provide evidence. They are not a universal pass/fail threshold.

## Stop rule — prevent endless micro-adjustment

Automated repair should stop and hand off to Human Review when all of the following are true:

1. required runtime widths have no overflow, image failures, or runtime errors;
2. required fonts/assets are loaded;
3. PC/SP page and section geometry are materially aligned with the Figma reference;
4. `Standard` Visual Diff has no unexplained large hotspot that a reasonable reviewer would notice immediately;
5. remaining difference is predominantly text antialiasing, rasterization/subpixel behavior, or isolated small edge noise;
6. a further change would mainly optimize machine diff score rather than improve human-visible fidelity.

A human may still request a final repair after this handoff. That feedback takes precedence over the automated stop rule.

## Repair priority

When Visual Diff finds material differences, repair in this order:

1. wrong/missing asset or incorrect crop/mask;
2. missing visual shape/detail (for example a speech-bubble tail or icon);
3. section/component position and size;
4. spacing and line wrapping;
5. color/background/effect differences;
6. small typography/raster differences only when visibly meaningful.

Do not chase isolated 1–2 px antialiasing noise merely to reduce a diff percentage.

## Later — only when repeated project pain justifies it

These are intentionally deferred until multiple real runs show enough benefit to justify the complexity:

- automatic per-section sensitivity recommendations;
- long-term diff-history/trend dashboard;
- automatic visual-regression baselines for every isolated component;
- Storybook-based isolated component QA where the target stack benefits from Storybook;
- cross-browser visual baseline fleets beyond the Company Policy required environments;
- automatic visual-bug category prediction from diff shape;
- automated baseline acceptance workflows.

Promote a deferred item only when it removes repeated manual work or catches meaningful regressions that the current Section → Full Page → Human Review workflow misses.

## External research adopted as principles

The project may borrow proven ideas without adopting paid products:

- Playwright: stable screenshot environment, browser/platform-aware baselines, screenshot-time style/animation stabilization, bounded pixel-difference tolerances.
- Percy: ignore/stabilize known volatile UI only inside the visual-capture environment rather than changing production UI.
- Storybook/Chromatic workflows: review visual changes explicitly and treat baseline acceptance as a human decision.

The implementation remains repository-owned and free/self-hosted unless the owner explicitly changes that policy.
