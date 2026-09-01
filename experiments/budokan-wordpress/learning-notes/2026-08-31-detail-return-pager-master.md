# Budokan detail return-to-list pager master — 2026-08-31

## Authority re-check

Before changing the shared pager, the current canonical Figma file `fKYDn9ikpJk1nW7IWFtaUx` was re-checked rather than relying on the prior News-only screenshot.

2026-09-01 revalidation: the current Human-selected file remains `fKYDn9ikpJk1nW7IWFtaUx`; News detail SP `1451:5197` and PC `1235:6361` still show the same central `一覧へ戻る` visual. The older file key `w7SGVY63FuW6JpaQVKjxm2` is lineage only and must not be treated as current authority.

Repeated evidence exists across the detail specimens:

- News detail SP `1451:5197`
- News detail PC `1235:6361`
- Event detail PC `1632:10382`

All three show the same `button_L` return action after detail content: a neutral outlined 270×60 button, 3px radius, white background, `#d7d4d4` separator border, main-red list icon, dark text, and the label `一覧へ戻る`.

This resolves the previous uncertainty about whether News needed a page-specific pager derivative. The visual is repeated across detail families, so the existing shared Theme owner `module_pager-02` is the correct place to align the return action.

## Existing Theme ownership

`single.php` already owns the semantic pager contract:

- conditional previous article navigation
- central archive/list return link
- conditional next article navigation

The existing data/route behavior is retained. This change does not infer that previous/next controls should be globally removed just because the inspected Figma fixtures show only the central return action.

## Concrete mismatch

Before this correction, `module_pager-02` styled all actions from a red pill baseline. The `.back` item only inverted foreground/background colors. That left the return action at roughly 240×48 on SP and constrained the PC item to the generic 150px slot.

The current Figma detail family instead repeats a 270×60 neutral outlined return action at both breakpoints.

## Fix

Only the shared `.module_pager-02 .back` presentation is specialized:

- 270px width at SP and PC
- 60px height
- 1px `--color-line` border (`#d7d4d4`)
- 3px radius
- white background
- `--color-text`
- 10px icon/text gap
- Font Awesome list icon (`f03a`) in `--color-primary`

The existing `.prev` / `.next` styling and conditional PHP behavior remain intact. On PC their hidden placeholders still reserve the left/right slots so the central return action remains centered.

## Runtime / browser QA contract

A permanent focused QA path was added because this is a shared detail control rather than a one-off screenshot correction.

The disposable WordPress fixture proves:

- real `single.php` routing returns HTTP 200
- dot-separated visible date and ISO `datetime` remain intact
- `一覧へ戻る` is rendered
- previous/next are still conditionally emitted as `_hidden` when no adjacent posts exist

Chromium geometry QA verifies SP first and then PC:

- 270×60 return action
- 3px radius
- `#d7d4d4` border
- white background / dark text / red list icon
- centered return action
- SP absent adjacent controls remain `display:none`
- PC absent adjacent controls remain layout-reserving `visibility:hidden`

## Failed / rejected approaches

### Rejected: News-only CSS override

The previous News recheck found the button mismatch but did not yet prove whether it was a shared detail master or a News-specific variant. A News-scoped override would have duplicated an existing semantic owner and risked Event drifting separately.

**Resolution:** inspect another detail family first. Event detail PC independently repeats the same `button_L` return action, so the fix belongs in `module_pager-02`.

### Rejected: removing previous/next navigation

The inspected Figma states do not show adjacent article controls, but the Theme renders them conditionally based on actual content adjacency. Absence in these fixtures is not enough evidence for a global interaction deletion.

**Resolution:** change only the repeated visual contract that is proven; preserve conditional navigation semantics.

## Reusable lesson

When a shared component appears visually wrong on one page, do not immediately create a page-specific modifier. First inspect another page family that uses the same semantic control. Repeated cross-family Figma evidence is strong enough to promote the correction to the shared Theme master; a single fixture is not. Conversely, repeated visual evidence does not automatically authorize changing unrelated data or interaction semantics.

This is repeated evidence inside Budokan, so it can inform the project Theme standard. It is not yet promoted as a cross-project frontend standard.
