# REF-001 Chiba Keizai sample — reconnaissance notes

Captured: 2026-08-11 JST

This is the first real Figma reference used to exercise the production workflow. The design is the source of truth; these notes describe observed implementation evidence and do not redesign it.

## Source

- PC/SP page: `https://www.figma.com/design/ZYTdtw4wCgkcBy2cVnhxVI/sample?node-id=21376-1600&p=f&t=zduaKdUu0MIWPh7D-0`
- Components page: `https://www.figma.com/design/ZYTdtw4wCgkcBy2cVnhxVI/sample?node-id=280-2&p=f&t=zduaKdUu0MIWPh7D-0`
- File key: `ZYTdtw4wCgkcBy2cVnhxVI`

## Top-level responsive frames

| Role | Node | Name | Size |
|---|---|---|---|
| SP | `21376:4401` | `Top_sp@2x` | 375 × 10817 |
| PC | `21376:5162` | `Top@2x` | 1380 × 7714 |

Both are visible top-level Frames on the same `AI` page. Other page frames are mostly hidden, which makes these two the current high-confidence top reference pair.

Same-page placement is useful evidence for PC/SP discovery in this run, but it remains a provisional convention rather than a permanent project rule.

## Inspected section pairs

### Header

- PC: `21376:5757`
- SP: `21376:4918`
- Pair confidence: HIGH
- Provisional implementation strategy: `STRUCTURE_FIRST`

Evidence: semantic names are clear, component-like structures are present, and the same logo/token semantics are visible across PC/SP.

### Main Visual

- PC: `21376:5723`
- SP: `21376:4886`
- Pair confidence: HIGH
- Provisional implementation strategy: `HYBRID`

Evidence: masks, exact image crops, decorative vectors, and absolute positioning materially contribute to fidelity. The SP context also exposes large internal dimensions inherited from the composition. Production code should preserve the visual relationship without blindly copying every Figma coordinate.

### Reason

- PC: `21376:5690`
- SP: `21376:4852`
- Pair confidence: HIGH
- Provisional implementation strategy: `STRUCTURE_FIRST`

Evidence: the same three semantic cards change from a horizontal PC presentation to a vertical SP stack. This is a strong candidate for natural responsive layout translation.

## Component evidence

The supplied components page contains observable reusable definitions/patterns including:

- Header / Header_sp
- Footer / Footer_sp
- breadcrumb PC/SP
- button default/hover
- pager default/hover
- page-send PC/SP
- category variants
- export assets

Do not assume the whole page is systematically componentized until remaining sections are inspected.

## Variable evidence

Figma variables are present. Examples observed through MCP:

- `color/foreground/main--colorpurple = #8473aa`
- `color/foreground/sec--colorblue = #38a1db`
- `color/foreground/sec--colororange = #f5971a`
- `color/background/base--light-beige = #f6f5ef`
- `content-width/contents--100% = 375`
- `content-width/contents--top = 343`
- `radius/max = 999`
- `font/Poppins`
- `font/Zen Kaku Gothic New`

These are mapping evidence, not permission to create a new token architecture before the target repository is inspected.

## Code Connect

State: `UNDETERMINED`.

The MCP Code Connect lookup returned a Figma plan/seat limitation. Therefore this run cannot conclude `NONE`; implementation must fall back to structured Figma context plus target-code inspection. Code Connect is not a blocker.

## Material gate before production code

The target implementation repository has not yet been supplied. Until it is known, the workflow must not guess React/Next/Vite/WordPress/PHP, package manager, styling architecture, existing components, breakpoints, or target route.

Once the target repository URL is available, continue with:

1. Existing Codebase Reconnaissance
2. resolve the code baseline and production breakpoint contract
3. upgrade the Reference from `DRAFT` only when freeze conditions are satisfied
4. build/verify Shared Foundation
5. implement Header → Main Visual → Reason → remaining sections with section-specific strategy
6. render/compare/repair and record first-pass fidelity
