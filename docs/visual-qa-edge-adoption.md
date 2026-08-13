# Visual QA Edge Adoption

Mature visual QA products such as Chromatic and Percy are prior art, not dependencies.

Adopt an external workflow idea only when a real project pain exists, a small self-hosted implementation solves it, Human Review remains final, and the maintenance cost is justified.

Already adopted for REF-001:
- deterministic visual capture;
- Figma vs Web visual diff;
- Human-approved Web baseline regression;
- section-local comparison;
- staged diff sensitivity;
- commit-bound fresh PR capture and Section Diff evidence.

Candidates are promoted only after repeated need:
- branch-aware baseline selection;
- capture only affected sections when runtime becomes expensive;
- DOM-linked ignore/layout regions for genuinely dynamic UI;
- broader browser fleets when required by the target;
- isolated component-state testing when the target is component-oriented.

Do not recreate a paid visual-testing platform. Extract only the edge that improves generation fidelity, review speed, or regression safety.

Every reusable visual correction should record: mismatch, category, Figma evidence, same-run Web evidence, root cause, minimal fix, result, and the generalized lesson for future Figma-to-Web generation.
