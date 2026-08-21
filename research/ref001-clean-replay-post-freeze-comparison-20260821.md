# REF-001 Clean Replay — Post-Freeze Comparison / Learning (2026-08-21)

## Scope and evidence integrity

Historical comparison was opened only after the new First Pass had been frozen.

Verified before comparison:

- frozen First Pass source commit: `59002424921623275e600eaf1df431d808e61c0a`;
- `experiment/ref001-clean-replay-first-pass-20260821` is byte-identical to that commit (`ahead=0`, `behind=0`);
- independent freeze evidence commit: `30d4b4ea9aaef63f910547199aab31cacff9f2e2`;
- `experiment/ref001-clean-replay-first-pass-freeze-20260821` is byte-identical to that evidence commit;
- observer PRs #187, #188, #189 and #191 were closed without merge;
- PR #191 materialized the frozen source with `git archive 590024...` rather than editing it;
- historical comparison was explicitly recorded as not performed during the freeze phase;
- protected negative experiment PR #182, V3 PR #92 and REF-002 PR #142 remain unmerged/untouched.

Current Figma authority was re-read from file `ZYTdtw4wCgkcBy2cVnhxVI`: PC root `21384:8173` is 1380×7714; SP root `21376:4401` is 375×10817 and includes a 40px design status-bar region. Structured context and variables remain authoritative; the PC root has no motion nodes. The status-bar convention matters when comparing old reports that used 10777px as the effective SP web-content height.

## Comparison summary

| Dimension | New Clean Replay First Pass (`590024...`) | Current Final (`so`, PR #183 lineage) | Old Frontend Standard Clean Replay (#182) | Blind Clean Replay (`20260812`) |
| --- | --- | --- | --- | --- |
| Target family | **WORDPRESS / Classic / PHP + ACF** | WordPress production-oriented implementation | **Wrong: static HTML** | WORDPRESS + ACF clean fixture |
| Breakpoint ownership | **Only 767/768 contract; one `min-width:768px` query** | Project breakpoint at 768 with intrinsic/fluid behavior | Added unauthorized intermediate ~1100px behavior | Correct family; exact endpoints 375/1380 plus runtime probes |
| ACF portability | 40 stable fields, portable export, image IDs | ACF-capable production handoff | None because wrong family | Portable ACF export, but real Admin UI import/edit smoke blocked |
| Admin edit/save/reload gate | Required by Standard substrate after PR #190; frozen runtime remained environment-blocked and was not falsely marked PASS | Production implementation had mature CMS path | Not applicable | Not proven in real Admin UI |
| Horizontal overflow | 0 at 320/375/390/430/767/768/769/1024/1380 | 0 across 17 widths, 320–1440 | First browser pass had +5px at 320 and +3px at 390; one repair removed it | 0 in recorded runtime probes |
| PC page height | 7456 vs Figma 7714 = **−258 / −3.34%** | 7677 vs 7714 = **−37 / −0.48%** | 7553 vs 7714 = **−161 / −2.09%** after its repair | First-pass score records visual 18/structural 24/robustness 15; exact page-height alone is not a reliable fidelity score |
| SP page height | 11695 vs raw Figma frame 10817 = **+878 / +8.12%** | 10773 vs effective web reference 10777 = **−4 / −0.04%** | 10636 vs effective web reference 10777 = **−141 / −1.31%** after repair | 375 runtime body recorded 10815; visual score remained only 18 because media fidelity/section composition were incomplete |
| Repair rounds | **0 after freeze by definition; comparison starts from untouched First Pass** | Many historical visual repairs before Final | 1 implementation repair after First Pass | 2 repairs, +129/−1 lines across 3 files; score 57→67 |
| Source locality | 295 CSS lines, 322 template lines, 163 functions lines; 1 media query; 14 absolute declarations; no JS | Larger but mature section-owner/FLOCSS/BEM structure and production interaction/data checks | Small/simple, no `!important`, but wrong delivery family | Human-editability drills 10/10; shared CTA and section-local ownership worked |
| Asset state | Attachment-ID fields; missing IDs render explicit fallbacks | Exact/production assets substantially resolved | 19 exact raster slots unresolved | Persistent Figma media-byte transfer remained blocked |

Absolute positioning, fixed dimensions and `!important` are not scored as intrinsically bad. The question is whether each use belongs to decoration/art direction, has a clear owner, and remains responsive/editable. The new First Pass's 14 absolute declarations are therefore diagnostic, not an automatic failure.

## 1. New Clean Replay First Pass evaluation

The new replay is a **large implementation-correctness improvement but not yet a visual-fidelity win**.

It correctly selected WordPress + ACF from the start, stayed server-rendered PHP, kept field access behind a helper, used stable field/group keys, used attachment IDs for image fields, rejected transient Figma URLs, and honored the 767/768 owner boundary without inventing 1100px. All nine requested responsive probes avoided document horizontal overflow.

The main weakness is visual geometry. SP ends +8.12% taller and PC −3.34% shorter than the raw Figma roots. The freeze evidence also records internal clipping in the Value frame at smaller widths. A page-height error can hide compensating section errors, so this cannot be accepted as “close enough” from endpoint height alone.

## 2. Difference from Current Final

Current Final remains clearly stronger in fidelity and production completeness. PR #183 remeasured section bands and reduced whole-page error to −0.48% PC and −0.04% SP while retaining 34 render-contract checks, 17-width no-scroll coverage and content substitution checks.

The new First Pass is stronger as an experiment in **first-try architecture correctness**: it did not need to discover later that the target was WordPress/ACF or that 1100px was unauthorized. Current Final reached its quality through multiple repair cycles; the replay shows which of those mistakes are now preventable before coding.

## 3. Difference from old Clean Replay #182

The old negative replay demonstrated the previous Standard's largest execution gap: prose said “existing target first,” but the agent still implemented static HTML and introduced an unowned breakpoint. Its final experiment head was geometrically closer than the new First Pass after one repair, but that is not an architecture win.

The new replay proves PR #185-style executable target-family/breakpoint contracts worked: wrong-family and unowned-threshold errors disappeared. This is the clearest evidence that machine gates outperform adding more prose.

## 4. Difference from Blind Clean Replay

The Blind replay already selected WordPress + ACF and scored First Pass 57 (visual 18 / structural 24 / robustness 15), then required two repair rounds to reach 67. It passed human-editability drills but could not prove an actual ACF Admin UI import/edit workflow, and persistent media transfer remained blocked.

The new replay has stronger explicit preflight/freeze contracts and the post-#190 Admin E2E requirement, but its visual geometry is worse at freeze. Therefore Standard maturity improved **contract correctness**, not automatically spatial composition.

## 5. What improved

- target family is now executable authority, not an optional prose hint;
- WordPress + ACF is implemented directly rather than escaped into static HTML;
- breakpoint ownership is mechanically constrained to 767/768;
- ACF field keys and attachment-ID image contract are stable/portable;
- no speculative interaction was invented when current Figma authority showed no motion evidence;
- section/source ownership remains straightforward enough for human repair;
- responsive document overflow is clean at the required nine widths;
- freeze evidence is independently preserved before historical answers are opened.

## 6. What got worse or remains weak

- First Pass SP geometry is materially too tall (+8.12% raw-root comparison);
- PC is still short by 3.34%;
- exact photographic/composite asset fidelity is not present when attachment IDs are absent;
- internal Value-frame clipping remains at smaller widths even though document overflow is zero;
- page-height endpoint metrics can mask opposing section-local errors;
- correct CMS/runtime architecture consumes none of the visual repair burden by itself.

## 7. Why repair is still needed

The remaining repair class is mostly **layout/typography/asset composition**, not target-family or breakpoint discovery.

The Standard currently says “section-first root-cause repair,” but it does not guarantee that every section boundary is quantitatively reconciled before First Pass freeze. The next visual loop should compare cumulative section starts/heights, typography wrapping and asset presence rather than repair the footer merely because the final page endpoint is off.

Exact assets also remain a separate prerequisite. Placeholder/fallback geometry can be runtime-safe while still being visually wrong.

## 8. Problems the Standard now prevents

Mechanically prevented or strongly gated:

- STATIC_WEB when the frozen target is WORDPRESS;
- arbitrary 1100px-style breakpoint invention;
- transient Figma MCP URL persistence;
- unstable/absent ACF portable JSON contract;
- casual image URL return format for this benchmark instead of attachment IDs;
- claiming ACF complete from JSON validity alone after the Admin E2E contract introduced by PR #190;
- post-freeze historical answer contamination.

## 9. Problems the Standard still cannot fully prevent

- visually plausible but wrong section height/rhythm;
- typography wrapping that shifts cumulative geometry without overflow;
- exact asset-byte availability and art-directed cropping;
- whether a decorative absolute/fixed value is justified without section evidence;
- production/company CMS requirements that are genuinely unknown;
- interaction behavior that is not represented by Figma/prototype/owner evidence.

These should not be “solved” by inventing stricter universal property bans.

## 10. Standard improvements added from this comparison

This work adds a schema-v6 WordPress+ACF delivery contract rather than more narrative-only rules:

- `schemas/wordpress-acf-delivery.schema.json`;
- `scripts/validate_wordpress_acf_delivery.py`;
- `tests/test_wordpress_acf_delivery_gate.py`;
- schema-v6 defaults in `templates/implementation-profile.yaml`;
- `docs/frontend-wordpress-acf-delivery.md`.

Historical schema-v5-and-earlier experiments stay valid and untouched. New frozen WordPress+ACF profiles must declare the portable package, Admin E2E requirement, Fresh Install gate, DB-copy prohibition and required reconstruction steps.

For visual learning, the conclusion is deliberately smaller: reuse the existing section/runtime metrics and Playwright/Figma comparison path; do not introduce another large visual-diff engine solely because one exists externally. If a future replay still shows cumulative section drift, promote a section-boundary ledger from diagnostic evidence to a generic gate using the existing capture data.

## 11. ACF Delivery improvement

The reusable standalone fixture now gains a second environment reconstruction path:

1. start the development WordPress + ACF PRO runtime;
2. write a DB-only source marker;
3. export the field group with official `wp acf json export`;
4. stage theme/code/assets + `acf-export.json` + `INSTALL.md` + `ACF-FIELD-MAP.md`;
5. exclude ACF PRO/plugin/license/DB and deliberately omit Local JSON from the portable-import proof;
6. destroy the development Compose volumes;
7. start a different Compose project with a fresh database;
8. assert the source marker is absent and ACF field-group count is zero before import;
9. import the staged JSON with official `wp acf json import`;
10. assign the Page Template via fixture input;
11. render and run the existing Playwright mutation/responsive suite.

This distinguishes “development runtime works” from “recipient can reconstruct from delivery artifacts.”

## 12. Expected improvement in the next Clean Replay

Expected measurable changes:

- wrong implementation family: 0 occurrences;
- unowned breakpoint thresholds: 0;
- ACF JSON-only false positive: 0 because Admin E2E is separate;
- development-DB portability false positive: 0 because Fresh Delivery Gate is separate;
- recipient handoff includes installation and field-map contracts from the start;
- visual repair should be concentrated on section geometry/assets/typography rather than architecture reversals.

A visual score improvement is **not guaranteed** merely by these delivery changes. The next replay must measure section-local drift to prove that separately.

## 13. What to validate on a different Figma next

Use a different page that changes the evidence shape, not another near-clone of REF-001:

- one project with fixed-cardinality ACF fields and no Repeater;
- one project where editor add/remove/reorder genuinely requires Repeater or Flexible Content;
- PC/SP art direction where the same image source is cropped differently versus truly different source assets;
- a design with one real interaction/prototype so the “do not invent interaction” rule is tested positively and negatively;
- a page with stronger typography wrapping risk and intermediate widths around 767/768;
- a project that supplies an existing company theme convention, proving the delivery package adapts instead of forcing the standalone fixture's structure.

Success should be judged on two axes independently: **First Pass visual fidelity** and **delivery/maintenance correctness**. A high score on one must not hide failure on the other.
