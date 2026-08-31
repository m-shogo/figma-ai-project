# Shared News page-title responsive master — 2026-08-31

## Scope

Current Budokan Figma authority (`w7SGVY63FuW6JpaQVKjxm2`) was re-read for both responsive surfaces in the same run before changing the Theme:

- News archive SP `1399:14225`
- News archive PC `413:2191`
- News single SP `1451:5197`
- News single PC `1235:6361`

All four use the same centered `お知らせ` page-title family. Theme ownership remains the existing `template-parts/_visual.php` + `css/module/global_mainVisual.css`; no News-only renderer or ACF contract was added.

## Finding

The existing PC baseline already matched the current Figma family: 220px visual, Zen Old Mincho/serif Bold 32px, line-height 1.4 and 5% tracking.

The shared SP baseline had drifted from current Figma: Theme still used a 160px visual and serif Bold 26px, while both current News archive and News single show a 180px visual with Zen Kaku Gothic New/sans Medium 22px, line-height 1.4 and 5% tracking.

## Fix

`global_mainVisual.css` now uses the current SP baseline first (180px, sans 22/500) and restores the existing/current PC baseline under `min-width:768px` (220px, serif 32/700). The ordinary fixed-page `_fixedPage` modifier keeps its own already-established responsive presentation.

A browser QA was added to assert the shared visual height, title type family/size/weight, line-height, tracking and 25% white overlay at 375px and 1380px. The News archive runtime workflow owns this shared-page-title QA because it already creates a disposable real WordPress News archive route.

## Cause / failed assumption

The old CSS comment grouped the shared archive/search/error visual as `160px SP / 220px PC`, and later News work concentrated on list/tab/pager geometry. That allowed a stale SP page-title baseline to survive while the current News full-page Figma had moved to the 180px/sans family.

## Reusable lesson

When a full-page responsive family is revalidated, do not treat the page-title/global shell as already correct merely because the section body passes. Re-read the current SP and PC full-page frames in the same run and verify shared shell geometry and typography as part of the visual gate.

Generalization is intentionally project-local for now. Search/error and other post types continue to use the shared renderer, but this change was justified by repeated current evidence from News archive + News single; do not infer unrelated page-specific content contracts from it.
