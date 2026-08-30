# TOP Purpose Terminal Alignment — 2026-08-31

## Scope and dependency re-check

This run re-checked the current `so` Theme ownership before changing page order. Header / Footer / shared Parts are already established, and TOP Guide already owns the full `#top_guide-01` purpose section. The FV also owns the existing PC-only `.tm_guide` purpose rail. Therefore the remaining SP `menu-purpose` surface should be a thin derivative, not a third copy of the purpose content.

The Budokan Figma authority was re-grounded before implementation. An old unrelated file key was initially encountered and rejected after metadata showed a different school-request design. Repository PR history identifies the Budokan validation file as `RfAQQ28V1HGaeIcpgRmQq1`; fresh Figma reads then succeeded against that file.

Fresh evidence used in this run:

- SP terminal purpose control: `1360:9370` (`menu-purpose`), 375×56
- SP full frame: `446:10020`, where the control is at y=8344 and occupies the final 56px after the footer
- PC FV: `1399:12229`, where the existing `.tm_guide` remains the 240×600 desktop purpose rail
- existing TOP purpose master: `#top_guide-01`

No `parts.php`, Formidable/form work, ACF schema, or purpose-content duplication was introduced.

## Figma findings

`1360:9370` is a dark 375×56 terminal bar with:

- 1px top border `#4e5055`
- 24px horizontal padding
- centered list icon + `目的から探す`
- 15px list icon
- 16px label, 0.05em tracking
- 16px upward chevron aligned to the right

The node contains no expanded menu body. In the 375×8400 SP frame it sits immediately after the footer at the very bottom. PC evidence continues to show the existing purpose guide inside the FV instead of this terminal control.

## Reuse decision

The implementation does not duplicate the three purpose groups or links. On the front page only, `footer.php` renders a terminal `.top_purposeMenu` after `#global_footer`. Its only destination is the existing `#top_guide-01` master, so the existing `common.js` in-page smooth-scroll behavior is reused.

The upward-chevron + terminal placement strongly supports a return-to-purpose interpretation, but Figma does not encode a prototype interaction in the context available here. Therefore the **visual/DOM ownership is confirmed; the click meaning remains a provisional implementation choice** until a prototype or explicit product authority confirms it. The choice is intentionally low-risk: it adds a reversible same-page shortcut and creates no new data contract or duplicated navigation source.

## SP implementation

`top_guide.css` now owns the thin derivative because the destination/master is TOP Guide:

- 56px height
- full viewport width
- dark Theme text background
- 1px top separator
- 24px horizontal padding
- existing Font Awesome font for the list/up glyphs
- 16px centered label with 0.05em tracking

The markup is outside `#global_footer`, matching the authored SP order rather than forcing it into the Footer master.

## PC extension

At `min-width:768px`, `.top_purposeMenu` is hidden. The existing `.tm_guide` continues to be the PC purpose surface; no PC markup or content was replaced.

## Runtime/browser QA

The existing Budokan TOP Guide workflow is extended rather than adding another WordPress bootstrap workflow. A focused Chromium test now checks:

### SP

- 375px terminal width
- 56px terminal height
- direct adjacency after the rendered footer
- 1px top border
- 16px / 0.8px-tracking label geometry
- href reuses `#top_guide-01`
- clicking the terminal uses the existing smooth-scroll contract and lands the Guide below the header offset

### PC

- terminal derivative is `display:none`
- existing `.tm_guide` remains visible

This keeps the new QA on the same disposable real-WordPress front-page path already used by TOP Guide.

## Learning / feedback capture

### Mistake avoided: treating responsive difference as duplicated content

SP and PC expose different purpose surfaces, but that does not imply separate purpose data owners. The safe structure is one purpose content master plus responsive derivatives that either present it or navigate to it.

### Authority failure caught before implementation

A remembered Figma key resolved to a different project. The run stopped using it immediately, recovered the Budokan key from repository evidence, and re-read the exact target node before writing code. File identity is part of design authority; a valid Figma response is not enough if it is the wrong file.

These are concrete project findings. They are not promoted to a higher project-wide standard from this single additional example.

## Remaining uncertainty

- Figma context for `1360:9370` does not expose an explicit prototype action. The current same-page return behavior is provisional, not claimed as designer-confirmed interaction authority.
- Purpose destination URLs inside the existing PC `.tm_guide` remain `#` content placeholders and were not invented here.
- The TOP Guide cards still use placeholder imagery pending production media authority; this task does not alter that prior boundary.
