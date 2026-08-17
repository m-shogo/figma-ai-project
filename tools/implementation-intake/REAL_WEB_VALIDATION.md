# Independent Real-Web Validation — REF-002 Budokan

This document records transferable evidence from an independent Web Figma benchmark. The temporary fixture itself is not a product deliverable and must not be merged into `so`.

## Authority

- Figma file: `RfAQQ28V1HGaeIcpgRmQq1`
- structured PC: `839:4676` — `1380 × 6181`
- structured SP: `446:10020` — `375 × 8400`
- final visual truth PC: `2270:4565`
- final visual truth SP: `2270:5570`
- SP contains 40px authored device/status chrome, so Web runtime coordinates normalize to `8400 - 40 = 8360`.
- calendar requirement: real FullCalendar JS, not a hand-built static month table.

Evidence domain: `web-page`.

Transfer scope:
- portable: browser measurement, geometry, render stability, CSS visibility, selector/instrumentation safety.
- Web-only: responsive section placement, breakpoint content parity, page-boundary repair.
- library-scoped: FullCalendar private-DOM behavior and v7 integration details unless reproduced with another library.

## Final runtime evidence

The independent benchmark reached exact authored outer geometry at the measured endpoints:

### PC

- document width: `1380`
- body height: `6181`
- horizontal overflow: `0`
- Header: `y=0 h=100`
- Hero: `y=100 h=640`
- Events: `y=740 h=948`
- SNS: `y=1688 h=200`
- Purpose: `y=1888 h=808`
- About: `y=2696 h=1179`
- News: `y=3875 h=652`
- Partner: `y=4530 h=380`
- Instagram: `y=4910 h=545`
- Banner: `y=5455 h=160`
- Footer: `y=5614 h=567`

### SP runtime (40px device chrome normalized out)

- document width: `375`
- body height: `8360.125`
- horizontal overflow: `0`
- Header: `y=0 h=60`
- Hero: `y=60 h=518`
- Events: `y=578 h=1834`
- SNS: `y=2160 h=252`
- Purpose: `y=2476 h=1668`
- About: `y=4144 h=1053`
- News: `y=5197 h=975`
- Partner: `y=6172 h=781`
- Instagram: `y=6953 h=684`
- Banner: `y=7637 h=200`
- Footer: `y=7837 h=467.125`
- terminal Purpose menu: `y=8304.125 h=56`

FullCalendar final endpoint checks:
- `dayGridMonth`
- 18 events
- PC/SP ready
- Calendar/List switching and prev/next were exercised earlier in the same benchmark.

The final artifact digest for the full-page runtime capture was:

`sha256:8fa0c0dd1642346b8ef635056d7147409bf246885713665fd340ad6ca7c470fa`

## Honest incompleteness boundary

Final geometry/runtime QA is not the same as final visual completeness.

The benchmark still reported `35` `ASSET_PENDING` slots at both PC and SP because the current connector boundary did not provide a safe route to persist short-lived Figma MCP image bytes into Git without persisting the temporary URL itself. The repository leak gate correctly rejects those URLs.

Therefore:
- geometry/runtime evidence is valid;
- visual completeness must remain `false` while `assetPending > 0`;
- placeholder gradients must never be treated as successful image fidelity;
- short-lived Figma URLs must not be committed as a workaround.

## Repair evidence and failures that must transfer

### 1. Repair the first divergent owner, not every downstream section

SP initially had a uniform `+40px` downstream offset. The root cause was that device chrome had already been normalized at the top of the runtime, while the Hero wrapper still retained the extra 40px.

Repair:
- SP Hero `558px → 518px`

Result:
- Events, Event list, Calendar, SNS, Purpose and later section starts all aligned without downstream compensation.

This independently validates the existing `constant-offset → coordinate-normalization → first divergent owner` route.

### 2. Re-observe the exact Figma node before locking geometry

Earlier ancestor/summary readings produced incorrect values for some section dimensions. Re-reading the exact implementation target corrected them, e.g. PC About is `1380 × 1179`.

Rule:
- before implementation or geometry repair, pin the exact Figma node ID and re-observe that node;
- ancestor summaries, screenshots and earlier notes are discovery evidence, not higher authority than the current exact node.

### 3. Responsive content parity is not guaranteed

Observed authored differences:
- About: PC has 6 cards; SP authored subtree has 3 cards in a horizontal scroller.
- Instagram: PC has 5 thumbnails; SP has 4.
- SNS: PC is a separate strip after Events; SP places the same semantic SNS content at the bottom of the Events region.

Rule:
- do not duplicate or delete content merely to force parity;
- observe PC/SP authored subtrees independently, then decide whether the same semantic component is reused, repositioned, reduced or replaced.

### 4. Third-party library QA must not depend on private DOM

Failed assumptions in the real FullCalendar v7 run included private selectors such as `.fc-daygrid` and assumptions about table structure. Functional state was available through public API/render hooks.

Rule:
- third-party integration QA should prefer documented public API and project-owned render hooks;
- private library classes are visual implementation details, not stable QA contracts.

### 5. Namespace project-owned instrumentation

A generic `data-calendar-view` project hook collided with library-generated DOM. The project-owned hook was changed to a namespaced attribute (`data-ref002-calendar-view`).

Rule:
- project QA/control hooks must be namespaced and must not be assumed unique until collision evidence is checked.

### 6. CSSOM visibility can be partial

FullCalendar CDN CSS applied successfully but cross-origin CSSOM inspection raised `SecurityError` for external stylesheets.

Rule:
- readable local CSS plus blocked external CSS is `partial` evidence;
- do not claim complete CSS ownership from partial CSSOM visibility;
- lower root-cause confidence and combine computed style, library hooks and source inspection.

### 7. Playwright browser context is not a Node lexical closure

A real QA script referenced a Node-side `name` variable inside `page.evaluate`. In the browser it resolved differently, causing the SP run to measure a hidden PC control with a zero rectangle. The UI implementation was correct; the QA was wrong.

Repair:

```js
await page.evaluate((viewportName) => {
  // use viewportName here
}, name)
```

Rule:
- pass Node-side values explicitly as `page.evaluate` arguments;
- hidden/zero-size rectangles are not successful geometry evidence;
- when multiple selector matches exist, record visibility/count and disambiguate the intended target.

## Benchmark selection rule

A prior candidate was a fixed graphic ticket layout. It was intentionally rejected as the main website-learning benchmark before unique implementation evidence was promoted.

Rule:
- learn Web section structure, responsive behavior, component reuse and page repair from actual Web-page Figma projects;
- non-Web graphic artifacts may contribute only portable low-level rendering evidence unless explicitly scoped to their own domain.

## Stop condition

Do not add more abstract Fast Loop infrastructure merely because this benchmark exposed a project-specific detail. Promote a finding only when it is:

1. reproducible from evidence;
2. correctly scoped (`portable`, `web-only`, or `library-scoped`);
3. useful for preventing a future incorrect diagnosis or repair;
4. implementable without forcing one designer/company architecture onto all projects.
