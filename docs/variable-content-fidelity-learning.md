# Variable-content fidelity learning

This note records reusable lessons for authored UI whose content can change. The goal is not to freeze a Figma screenshot into an image; it is to preserve the authored visual identity while the semantic content remains editable and able to grow.

## Classify before implementing

Treat these classes differently:

- fixed identity — logos, standalone glyphs, authored icons and decorative punctuation: preserve the exact vector/outline or a validated canonical render;
- variable container — speech bubbles, cards, labels and content panels: separate stretchable structure from fixed adornment;
- editorial text — keep semantic Web text and validate authored wraps/bounds with the runtime font;
- composite variable UI — preserve the fixed visual pieces while allowing the content-bearing region and its parent flow to grow.

Do not rebuild a standalone decorative glyph with a merely similar font. Do not rasterize an entire variable component just to preserve its border or tail.

## REF-001 Student Voice: inspect anatomy, not the visual stereotype

The first Web implementation assumed a generic `border + shadow + diagonal tail` speech bubble. Node-level V2 Figma inspection showed that assumption was wrong:

- PC: an offset white fill plane plus an independent outline vector, with one diagonal connector on the left;
- SP: an offset white fill plane plus an outline whose left vertical edge has a gap; there is no diagonal connector;
- open and collapsed SP outlines use different heights, while the left-edge gap remains at approximately the same proportional vertical region.

Reusable rule: never map the word “speech bubble” directly to a stock CSS recipe. Inspect the authored layers and endpoint variants first.

## Experiment ledger

### A — separate pseudo-element fill + segmented outline

Result: rejected.

The fresh diff ratio decreased, but Human Review showed that the white fill layer visually covered important right/bottom outline segments. This proved that a lower machine-diff score is not sufficient evidence of improvement.

Lesson: layer order is part of fidelity. Validate the rendered image, not only geometry and the diff percentage.

### B — ordered multiple-background layers

Result: accepted and merged in PR #110.

The same element paints independent outline segments above an offset white-plane background. PC adds only the authored diagonal connector; SP has no synthetic tail. The content remains semantic HTML.

Fresh same-commit evidence improved from the pre-experiment state:

- SP Student Voice: about 7.56% to 7.50%;
- PC Student Voice: about 3.43% to 3.25%.

Human Review also confirmed that the outline anatomy moved visibly closer to Figma.

Reusable condition: multiple CSS backgrounds are useful when the authored shape can be decomposed into independently stretchable lines/planes and fixed adornments.

### C — content-driven parent chain

Result: accepted in PR #113 after stress observation exposed two different failure modes.

Observed before repair:

- SP 375: fixed speech heights produced about 237px vertical overflow in the open card and about 176px in each collapsed card, with collisions into following content;
- PC 1380: the authored endpoint `nowrap` assumption produced about 1819px horizontal overflow in the open card and about 752px in collapsed cards when copy was deliberately lengthened.

The repair did not make only the speech element `height:auto`. It relaxed the whole ownership chain while retaining authored endpoint dimensions as minimums:

`speech -> top rail -> item/content -> Student Voice section`

PC also allows the title to wrap under stress. After repair, the same stress fixture reported zero horizontal overflow, zero vertical overflow, zero local-container overflow and zero next-block collision at both 375 and 1380.

The normal authored fixture remained stable at the acceptance endpoints:

- body height: 10777px at 375 and 7714px at 1380;
- Student Voice height: 1758px SP and 1393px PC;
- fresh Section Diff remained effectively unchanged: about 7.51% SP and 3.25% PC;
- direct Human Review of the fresh Web/Figma crops showed no new material visual regression.

At 320px the normal page becomes taller because the narrower viewport legitimately wraps content; horizontal overflow remains zero. Treat safe content-driven growth below an authored endpoint as continuity behavior, not as a regression merely because total page height differs.

Reusable rule: when a variable child is allowed to grow, every fixed-height ancestor that owns its flow must be audited. Preserve exact authored dimensions as `min-height` where appropriate, then let the parent chain grow. A fixed child converted to `auto` inside fixed ancestors is not a variable-content solution.

## Variable-content QA must be separate from Figma acceptance QA

The normal Figma fixture proves fidelity for the authored content. It does not prove that longer CMS/ACF content will remain safe.

Use a separate stress probe that deliberately lengthens content and records:

- horizontal content overflow;
- vertical content overflow;
- overflow beyond the local top/container region;
- collision with the next authored block;
- PC/SP screenshots and structured measurements.

Start this probe as observation-only. Promote it to a hard CI gate only after the variable layout has been repaired and the expected limits are stable. This prevents a new validator from blocking development before the underlying contract is understood.

A stress probe is itself production tooling and must be validated. REF-001 initially missed the PC failure because descendant bounding boxes did not expose the element's full scrollable overflow. Comparing `scrollWidth/clientWidth` and `scrollHeight/clientHeight` closed that blind spot. Validate the measuring instrument before trusting a PASS.

## Candidate techniques and adoption boundary

Consider several techniques instead of defaulting to one recipe:

- multiple CSS backgrounds — strong for independently stretchable lines/planes;
- split SVG adornment + flexible HTML/CSS body — strong when a tail/corner must not distort;
- `border-image` / 9-slice — useful when authored edges can safely stretch or repeat; reject when stretching distorts a distinctive tail/gap;
- SVG overlay — useful for fixed adornment; avoid stretching a full fixed path when its distinctive geometry would deform;
- mask/clip-path — useful when the silhouette is the main contract and content remains inside a flexible box;
- emerging `border-shape` / percentage-based `shape()` — track as external E0 evidence until browser support and local runs justify production use;
- CSS Anchor Positioning — promising for keeping a fixed tail or connector aligned to a nearby avatar while the bubble grows. Treat it as E0 until the full `position-anchor` stack is sufficiently compatible with the project's browser contract; `anchor()` itself reached Baseline 2026 before every related property did.

The best technique is the one that preserves the authored invariant while allowing the intended variable dimension to change.

## Repair discipline

For experiments:

1. branch from the latest accepted V2 authority;
2. change one rendering idea at a time;
3. capture the exact PR commit;
4. compare fresh Section Diff and the actual Web/Figma crops;
5. merge only when the human-visible result improves;
6. close/revert experiments that worsen the result even if their numerical score improves;
7. record the failed mechanism and why it failed so the next generation does not repeat it.

Visual fidelity work must not reduce human editability. A repair that compresses or obscures maintainable code should be cleaned up before it becomes authority.
