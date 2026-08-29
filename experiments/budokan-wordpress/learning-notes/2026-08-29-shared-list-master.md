# Budokan shared Gutenberg list master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- SP Parts list group: `1399:18760`; list body: `1399:18762`.
- PC Parts list group: `1157:8218`; list body: `1157:8220`.
- Shared Theme owner: `css/blocks/wp-block-list-style.css`.
- Runtime owner: native Gutenberg `core/list` rendered inside the existing `.block-editor_wrap` content surface.

## Dependency decision

The list family is a shared Parts master. The Theme already has the correct semantic owner and Gutenberg contract, so no page-specific PHP component, ACF field, render filter, or TOP-only duplicate should be introduced. The work is presentation-level alignment inside the existing owner.

## Concrete Figma findings

### Unordered list

- Body copy is 17px / 1.6 / 5% tracking, Regular.
- Primary bullet is a 6×6 gold circle using `#ca9957`.
- SP authors primary bullet x=0 and text x=21.
- PC authors primary bullet x=0 and text x=18.
- PC nested list authority is explicit: nested marker x=24, nested text x=42, 12px separation from the parent row, and 8px between nested rows. The nested marker is white with a 1px gold stroke.
- SP Parts does not show a corresponding nested example, so the PC-only nested horizontal offset must not be projected backward into SP without authority.

### Ordered list

- Row gap is 16px.
- Number rail is 26px wide with content text beginning at x=36.
- Number is 16px / 500 / 100% line-height / 10% tracking.
- Body copy remains the shared 17px / 1.6 / 5% tracking Regular style.

### Annotation list

- Row gap is 10px.
- Marker is `※`, 16px Medium, primary red.
- Annotation copy is 14px Regular / 1.6 / 5% tracking.
- SP copy begins at x=31; PC copy begins at x=28.
- The previous Theme used 500 weight for the annotation copy itself, which did not match the Figma text node. Only the marker is Medium.

## Implementation

- Preserve native Gutenberg list markup and the existing shared selector family.
- Align SP primary unordered-list text inset to 21px, then restore the PC authority to 18px under `min-width:768px`.
- Keep the 6px gold primary marker and place its first-line center from the authored 27px line box rather than using an em approximation.
- Preserve the existing 12px nested top gap and 8px nested row gap; add the explicit PC-only 6px nested horizontal offset required to reach marker x=24 / text x=42 from the 18px parent content inset.
- Align annotation copy to 31px SP / 28px PC and correct its copy weight to 400 while keeping the `※` marker at 500.
- Leave ordered-list geometry unchanged because its current 36px text inset and 26px number rail already match the Parts authority.

## Mistake / cause / fix

The existing CSS encoded several list families with one mostly shared inset. That was structurally reasonable but obscured real breakpoint-specific authored geometry: SP primary bullets use a 21px text inset while PC uses 18px, and annotations use 31px SP / 28px PC. Treating these as one universal number would either leave SP visibly cramped or shift PC away from the source.

A second issue was typography ownership inside annotation rows. The previous `font-weight:500` was applied to the whole annotation item, while Figma shows the marker as Medium and the copy as Regular. The fix separates marker emphasis from body typography instead of increasing the whole row weight.

The nested PC list is also a useful boundary case: Figma provides direct authority for the extra horizontal offset on PC but not in the SP Parts sample. The implementation therefore scopes that offset to the PC breakpoint rather than guessing an SP counterpart.

## Runtime QA

A disposable real WordPress + ACF PRO runtime was run against the supplied `nipponbudokan` Theme after sourcing the shared `runtime-env.sh`, then a native Gutenberg page containing unordered, nested, ordered, and annotation lists was seeded through WP-CLI. ACF PRO 6.8.9 was active. The browser contract used the established 390 → authored 375 SP and 1395 → authored 1380 PC viewports.

Both SP and PC passed HTTP 200, page-error, and page-level overflow gates. Computed runtime evidence matched the authored responsibilities:

- SP primary list: 21px text inset; 17px / 27.2px / 400 copy; 6×6 gold bullet; 3px radius; 10.5px vertical marker offset.
- PC primary list: 18px text inset with the same typography and marker primitive.
- Nested list: 8px row gap, 18px item inset, transparent 6px marker with 1px gold border; PC adds the verified 6px horizontal list offset while SP remains at 0 because no SP nested authority exists.
- Ordered list: 36px item inset; 16px / 500 marker; 26px number rail.
- Annotation list: 31px SP / 28px PC inset; 14px / 22.4px / 400 copy; 16px / 500 red `※` marker with 3px vertical offset.

The temporary runtime workflow was used only as a verification gate and is removed before merge. REF001 Audit Completeness was also GREEN on the runtime-tested head.

## Reusable lesson

For list systems, validate each responsibility separately: marker primitive, marker-to-copy inset, row gap, nested offset, and marker-vs-copy typography. A single generic `padding-left` often hides meaningful differences between primary, nested, numbered, and annotation families. When only one breakpoint contains a nested authority example, scope the evidence to that breakpoint instead of extrapolating it.

Keep this lesson project-local until it repeats independently in another list/navigation family.
