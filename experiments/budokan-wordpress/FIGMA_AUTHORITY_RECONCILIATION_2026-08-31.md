# Budokan Figma authority reconciliation — 2026-08-31

> Later the same day, Human Authority moved current visual truth to `fKYDn9ikpJk1nW7IWFtaUx`. This note remains as lineage for the earlier `w7` vs `RfA` mix-up. Do not use it to override `CURRENT_AUTHORITY.md`.

Status: resolved, then superseded. Project-local authority correction only; no Theme/ACF/content contract changed.

## What happened

A previous documentation pass changed `FIGMA_MAP.md` to treat `RfAQQ28V1HGaeIcpgRmQq1` as the current Budokan file, while `CURRENT_AUTHORITY.md` continued to identify `w7SGVY63FuW6JpaQVKjxm2` as the Human-authorized current file and explicitly marked `RfA...` as lineage-only.

That conflict became material when re-checking Training Center. `1468:6595`, the richer SP Training Center redesign recorded in the project audit, does not resolve in `RfA...`, which made it look as though the node had been deleted. The same node resolves successfully in `w7...` and contains the expected current redesign structure: facility introduction, six-image gallery, inline pricing, News, Guide links, breadcrumb/footer/purpose-menu shell.

## Live evidence

Re-resolved on 2026-08-31:

- `w7SGVY63FuW6JpaQVKjxm2`
  - PC page `0:1` contains `1603:7062` `topdesign04`, Event archive/detail, publication/hardcover families, Parts, current page/navigation frames.
  - SP page `114:5409` contains `1399:14225` `SP_archive`, `1451:5197` `SP_post`, `1399:19144` `SP_parts`, `1455:5489` / `1468:6595` / `1468:7508` `SP_navigation`, plus older named frames.
  - `get_design_context(1468:6595)` succeeds and returns the pricing-inclusive Training Center redesign.
- `RfAQQ28V1HGaeIcpgRmQq1`
  - remains accessible as an older lineage file.
  - `1468:6595` is not present there.
  - its top-level page/frame set is smaller/different and must not override `CURRENT_AUTHORITY.md` merely because a saved node resolves there.

## Cause

The previous correction inferred file freshness from a partial live re-resolution and the presence of an extra page in `RfA...`, instead of checking the repository's explicit Human Authority contract first and then testing distinctive current-redesign nodes across both files.

This was an authority-selection error, not a Figma availability error.

## Fix

- Keep `CURRENT_AUTHORITY.md` unchanged: `w7SGVY63FuW6JpaQVKjxm2` remains the current Budokan authority.
- Reconcile `FIGMA_MAP.md` back to that file.
- Restore current redesign nodes that exist in `w7...`, including Training Center SP `1468:6595`, News SP archive/detail redesign nodes, current Parts, and TOP `1603:7062`.
- Keep older named frames (`560:*`) as corroborating/legacy evidence where applicable; do not silently promote them when a current redesign node exists.

## Reusable project-local lesson

When multiple Figma files with matching page IDs/names remain accessible:

1. Read `CURRENT_AUTHORITY.md` before treating connector accessibility as freshness evidence.
2. Use a distinctive current-redesign node/content token to test candidate files.
3. A missing node is not evidence of deletion until the file key itself is verified.
4. An extra page or a resolvable old frame is not enough to promote a lineage file to current authority.
5. If two project docs disagree about authority, reconcile the conflict before implementation rather than choosing whichever file makes the next task easier.

This is one project-local incident. Do not promote it to a company-wide standard until repeated evidence exists.

## Training Center consequence

The earlier Training Center dependency audit remains directionally correct on ownership and current redesign pairing:

- SP: `1468:6595`
- PC: `1137:5348`
- WordPress owner: ordinary page/editor composition, not a new page-specific PHP/ACF model
- remaining blocker: canonical WordPress Gutenberg content/media/link ownership for the redesign

No `parts.php`, Form/Formidable, ACF schema, Theme PHP/CSS/JS, or production editorial data was changed in this reconciliation.
