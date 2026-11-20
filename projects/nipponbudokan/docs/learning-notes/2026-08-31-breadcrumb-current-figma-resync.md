# Breadcrumb resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- SP `bread` `1451:5316` / instance `1468:7510`
- PC `bread` `1235:6479`

Owner remains `_breadCrumb.php` + `module_breadCrumb.css`. No data-contract change (News single still omits the category crumb).

## Finding

Rhythm (SP 8px / PC 10px chevron margins, 13px, line-height 1, red chevron) already matched. Stale values were Noto/inherit family, `--color-link` red on anchors, hover removing the underline, and current crumb Regular instead of Medium.

## Cause

`normalize.css` `a { color: var(--color-link); text-decoration: underline }` plus breadcrumb hover `text-decoration: none` overrode the Figma `#333` underlined Regular links.

## Fix

Shared master uses Zen Kaku Gothic New, `#333` links that keep their underline, last crumb Medium, and bread inner padding 24/20 SP and 64/24 PC with `max-width: none` so PC inset is the Figma 64px rather than `.global_inner` 110px.

PC News single still uses 12px on some intermediate crumbs. That stays page-specific until SP repeats it.

## Lesson

A shared breadcrumb can already have the right size/gap and still be the wrong family/color because global `a` styles win. Re-read the live `bread` component after a Figma file-key change; do not keep the last News QA as visual authority.
