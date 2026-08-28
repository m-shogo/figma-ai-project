# Budokan backnumber dependency audit

Status: investigation only; no page implementation is authorized by this note.

## Why this audit exists

TOP lower banner PR #228 is structurally/runtime-green but is intentionally not merged until the exact Figma SP background raster is materialized as a durable Theme asset. Rather than bypass that gate or start another page blindly, this audit maps the next publication/backnumber family against live Figma and the current WordPress Theme so later implementation can reuse existing authority instead of inventing a parallel component or CMS model.

## Re-checked authority

- Git base: `so` at `6483b0b5ff65d465122fe81c811dc93bcc9606bb`.
- Figma file: `w7SGVY63FuW6JpaQVKjxm2`.
- PC publication/backnumber screen inspected: `1634:10806` (`publications`).
- SP backnumber screen inspected: `560:677` (`backnumber_sp`, 375 × 8082).
- Theme page routing: `page.php` owns ordinary pages and renders `_visual`, `_dropdown-navigation`, then `the_content()` inside `.block-editor_wrap`, with the existing sidebar.
- Theme does not currently contain a dedicated `page-backnumber.php`, `single-backnumber.php`, `archive-backnumber.php`, or publication-specific page template in the Theme root.
- Existing `templates/` contains only the form and one-column variants; no publication/backnumber-specialized template exists.
- `patterns.json` already establishes Gutenberg/pattern composition as a first-class content mechanism, including headings, text boxes, image/text layouts and other reusable primitives.
- `acf-export.json` is broad shared block/page authority; the inspected data does not justify inventing a new backnumber ACF field group or CPT contract.

## Figma structure that matters

The backnumber family is not a TOP-only section. Both PC and SP use the already established global Header/Footer/Page Title/Breadcrumb surfaces, then a content body with two repeated content families:

1. **General-index/help panel**
   - title: 月刊「武道」総索引
   - download action
   - H4-style “使い方” heading
   - numbered instructions
   - caution notes
2. **Backnumber item** repeated by month
   - issue title + order action header
   - cover image
   - article-summary text
   - PC additionally exposes “詳細はこちら” in the item body

Observed authored geometry:

- PC content body: 1040px wide.
- PC issue header: 60px high; cover 160 × 226; image/text gap 40px; item stack gap 24px; issue-to-issue gap 56px.
- SP body: 335px wide.
- SP issue header uses 16px horizontal padding and a compact order action; cover 100 × 142; image/text gap 12px; item stack gap 24px; issue-to-issue gap 40px.
- SP top-level content starts after the existing global header/page-title/breadcrumb stack, not from an isolated bespoke shell.

## Master / derivative conclusion

Do **not** build a second bespoke “backnumber card” for SP and PC and do **not** build a TOP derivative first.

The repeated issue row is the page-family master. PC and SP are responsive states of the same semantic item:

`issue title + order action + cover + summary (+ detail affordance where authored)`

The index/help panel is a second reusable content block. Page shell concerns remain owned by existing Theme globals (`header.php`, `_visual`, `_dropdown-navigation`, `page.php`, sidebar, footer).

This means the preferred future dependency order is:

`existing global shell` → `index/help content primitive` → `backnumber issue primitive` → `backnumber page composition` → only then any derivative/reuse elsewhere.

## WordPress ownership decision

Current evidence points toward **ordinary Page + Gutenberg/block composition** as the safest authority, not a new bespoke page template or CPT. `page.php` already delegates content to `the_content()`, and `patterns.json` confirms editor-composed content is an intended Theme workflow.

Before implementation, one missing authority must be resolved: where production issue data is supposed to live and be maintained. The Figma screen shows repeated monthly data, but neither Figma nor the current inspected Theme establishes whether production intends:

- editor-authored Gutenberg rows,
- a repeated/custom block,
- existing external/static data,
- or a dedicated structured WordPress model not yet present in this Theme snapshot.

Do not guess this CMS/data authority. Implementing the visual row before resolving it would risk hard-coding editorial content or creating an unnecessary ACF/CPT contract.

## Reuse-before-build checklist for the future implementation

- Reuse `_visual`, breadcrumb/dropdown navigation, global inner/column layout, sidebar and Footer as-is.
- Reuse existing button/arrow, heading, numbered-list, caution-note, image and text conventions from Theme blocks/styles before introducing page-specific CSS.
- Prefer one responsive issue primitive over separate PC/SP markup.
- Keep mobile-first base rules; add PC differences only under `min-width: 768px`.
- Do not touch `parts.php` to implement this page.
- Do not add an ACF group or CPT until production data ownership is proven.
- Do not persist short-lived Figma asset URLs; issue cover assets require a durable source/WordPress media authority.

## Blockers / smallest authority needed

No human decision is needed for the visual hierarchy or responsive master/derivative relationship; those are clear from Figma.

A human or production-source authority is required only for the **monthly issue data lifecycle**: identify the canonical WordPress/editor/data source for issue title, order URL, cover, summary, and detail destination. Once that is known, implementation can proceed without inventing schema.

## Reusable lesson

A visually repetitive page is not automatically evidence for a new CPT or ACF repeater. In this Theme, `page.php` + Gutenberg is already an explicit content-authoring boundary. First prove the production data lifecycle, then choose the smallest structure that preserves it. This avoids turning a Figma repetition pattern into an unsupported CMS architecture decision.
