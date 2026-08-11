# REF-001 Visual First / Deferred Integration Rule

Status: learning rule adopted during the real REF-001 WordPress fixed-Page-template experiment.

## Why the workflow changed

Early passes mixed three different problems:

1. Figma visual/structural reproduction
2. WordPress CMS ownership / ACF field architecture
3. interaction behavior / JavaScript library selection

That made the design-to-code learning loop slower and made it harder to tell whether a First Pass failure came from visual translation or from an early CMS/interaction assumption.

## Current execution order

```text
Figma evidence
→ PHP/HTML structure
→ CSS/responsive visual reproduction
→ immutable visual First Pass
→ visual repair / section and boundary QA
→ complete page structure
→ final CMS + interaction integration
```

## Decisions explicitly deferred until the final integration pass

- whether a repeated visual collection becomes ACF Repeater, fixed fields, Group, Options, CPT/taxonomy, or another existing project source
- whether Student Voice is an accordion/disclosure and its exact open/close policy
- whether Messages is a slider/carousel and which library/primitive owns it
- actual destination URLs for visual CTA/link cards when Figma does not prove them
- global-vs-page ACF ownership for Header/Footer/shared CTAs
- production breakpoint threshold when only PC/SP acceptance frames are supplied

## Rules during the visual pass

- Do not add ACF merely because text or images exist in Figma.
- Do not add a slider/accordion library merely because the design looks interactive.
- Do not invent `href="#"`, fake destinations, missing carousel records, or missing expanded content.
- Mark unresolved behavior as `DEFERRED` and continue visual implementation where possible.
- Shared Figma components may be reproduced visually without deciding their final WordPress data source.
- Use exact Figma assets when they can be persisted safely. If exact assets cannot be persisted, keep a measured asset slot and record the blocker rather than hand-redrawing the supplied artwork.
- Keep the fixture marked `partial` until the actual visual section sequence is complete.

## Final integration pass

At the end, resolve the deferred list in one focused pass using owner direction plus the actual target theme's existing architecture. This is the point to decide ACF shape, global options, CPT reuse, URLs, slider/accordion behavior, libraries, keyboard semantics, and runtime integration.

This is a learning rule, not yet a universal project law. Promote it only after Clean Replay shows that it improves reproducibility and First Pass visual fidelity.
