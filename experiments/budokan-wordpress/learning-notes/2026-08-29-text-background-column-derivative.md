# Budokan Text background Column derivative — 2026-08-29

## Scope

Parts / Text specimen の「背景付きボックス」。Columns master（SP stack / PC 2-column）の子として使われる背景付き Column derivative を確認した。

## Figma authority

Canonical file: `w7SGVY63FuW6JpaQVKjxm2`.

- SP: `1399:18743`, `1399:18745`
  - 327px wide
  - padding 30px all sides
  - border 1px `#d7d4d4`, inside
  - radius 3px
  - authored fill `#ffffff`
- PC: `1157:8201`, `1157:8203`
  - 468px wide in the 960px Parts specimen
  - padding 32px all sides
  - border 1px `#d7d4d4`, inside
  - radius 3px
  - authored fill `#ffffff`

The surrounding Columns master already owns the 24px sibling gap. Do not move this inset into `wp-block-columns-style.css`.

## Existing Theme ownership

The first implementation attempt incorrectly added a new `.wp-block-group.has-background` owner in `wp-block-group-style.css`.

Real WordPress runtime rejected that assumption: the specimen still computed 24px. Inspecting the dependency chain then found the existing shared owner in `wp-block-text-style.css`:

- `div.wp-block-group.has-background`
- `div.wp-block-column.has-background`
- `p.has-background`

These previously shared `24px` SP / `32px` PC plus the correct 1px line and 3px radius.

Because the Figma specimen is specifically the child of a two-column/stacked Columns example, the safe fix is to split only `div.wp-block-column.has-background` from that selector group and change its SP inset to 30px. Group and Paragraph remain unchanged until they have their own authority.

## Runtime evidence

Disposable real WordPress + ACF PRO runtime was seeded with native `core/columns` + two native background `core/column` blocks.

Final browser probe:

- SP viewport 390 (authored SP 375 context): padding 30/30/30/30, border 1px `rgb(215,212,212)`, radius 3px, white authored background, two columns stacked with 24px gap, no positive page overflow, no page errors.
- PC viewport 1395 (authored PC 1380 context): padding 32/32/32/32, same border/radius/background, two columns side-by-side, no positive page overflow, no page errors.

Screenshots from both viewports were reviewed after the computed-style gate passed; the visual structure preserves the existing Theme shell and matches the Figma primitive contract for this derivative.

## Mistake and cause

Early in the run, an unrelated Figma file was queried before the project-local Budokan authority was re-established. Its box values did not match the previously verified Budokan dependency chain. No final implementation was based on those values; the project learning note / previous merged evidence was used to recover the canonical file key before the real fix.

A second wrong turn was semantic rather than visual: treating the box as a Group because a Group can also carry a background. Runtime evidence plus the existing Theme selector showed that this Figma specimen is better represented by the native background Column derivative.

## Reusable lesson

1. Re-establish the project-local Figma file key and node authority before interpreting a visually similar primitive.
2. Before adding a new block owner, search sibling CSS owners — especially shared selectors that may already own the state.
3. A Figma child inside a master/derivative specimen should inherit the parent semantic relationship when WordPress has a native equivalent; here that is `Columns -> Column`, not an invented Group wrapper.
4. Split a shared selector only as narrowly as the available authority supports. Do not silently propagate a Column-specific correction to Group or Paragraph.
5. Let CMS-authored background color remain content-owned when Figma only proves the specimen value; Theme owns geometry and border primitives here.
