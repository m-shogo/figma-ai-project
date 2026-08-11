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

## Full top-level section pairing

The visible website-content sections can now be paired with HIGH confidence using direct-child order plus semantic/text/component evidence:

| Section | PC | SP | Important evidence |
|---|---|---|---|
| Header | `21376:5757` | `21376:4918` | matching Header instances |
| Main Visual | `21376:5723` | `21376:4886` | matching MV content/composition |
| Reason | `21376:5690` | `21376:4852` | same three reasons |
| Education | `21376:5559` | `21376:4720` | same semantic name/order |
| CTA 1 | `21376:5558` | `21376:4719` | corresponding CTA instances |
| Student Voice | `21376:5457` | `21376:4650` | shared profile/question text anchors |
| Messages | `21376:5437` | `21376:4629` | `# MESSAGES`, same profile copy/indicator |
| CTA 2 | `21376:5436` | `21376:4628` | corresponding CTA instances |
| Courses | `21376:5211` | `21376:4403` | seven matching course groups/text anchors |
| Links | `21376:5164` | `21376:4919` | same semantic name/end-page position |
| CTA Value | `21376:5187` | `21376:4942` | same semantic name/end-page position |
| Footer | `21376:5163` | `21376:4402` | matching Footer instances |

The SP-only `Status-Bar_W` node (`21376:4966`) is reference/device chrome and is not automatically treated as website content. Its production inclusion must come from target requirements.

### Important discovery result: names are not enough

This real file immediately validates multi-signal discovery:

- PC Student Voice is named `voice`, but the corresponding SP group is just `Group 338`.
- PC Messages is named `messages`, but the corresponding SP group is misleadingly named `voice`.
- PC Courses is misspelled `cources`, while the corresponding SP group is `Group 339`.

Text anchors and page order recover the correct mappings. A name-only algorithm would pair at least one of these sections incorrectly.

## Inspected implementation strategies

### Header

- PC: `21376:5757`
- SP: `21376:4918`
- Provisional strategy: `STRUCTURE_FIRST`

Semantic names are clear, component-like structures are present, and the same logo/token semantics are visible across PC/SP.

### Main Visual

- PC: `21376:5723`
- SP: `21376:4886`
- Provisional strategy: `HYBRID`

Masks, exact image crops, decorative vectors, and absolute positioning materially contribute to fidelity. The SP context also exposes large internal dimensions inherited from the composition. Production code should preserve the visual relationship without blindly copying every Figma coordinate.

### Reason

- PC: `21376:5690`
- SP: `21376:4852`
- Provisional strategy: `STRUCTURE_FIRST`

The same three semantic cards change from a horizontal PC presentation to a vertical SP stack. This is a strong candidate for natural responsive layout translation.

The remaining sections are mapped but intentionally remain `INSPECT_BEFORE_IMPLEMENT`/component-first candidates until their detailed design context is inspected. This keeps discovery separate from implementation assumptions.

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
