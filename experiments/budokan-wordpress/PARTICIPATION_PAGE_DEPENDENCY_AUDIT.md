# Budokan participation page dependency audit

Status: responsive page identity is resolved, but visual implementation remains fail-closed because the current SP counterpart contains shell authority only and does not contain the PC content composition.

Updated: 2026-09-02

## Current authority

- current Human-selected Figma file: `fKYDn9ikpJk1nW7IWFtaUx`
- current SP page: `114:5409`
- current PC page: `0:1`
- current SP frame: `1468:7508` (`SP_navigation`)
- current PC frame: `1148:6390` (`navigation`)

Historical `560:*` nodes must not be recovered as current authority. `560:188` was directly re-queried against the current file on 2026-09-02 and returned **node not found**.

No Theme PHP/CSS/JS, ACF/CPT model, Form/Formidable, or `parts.php` change is authorized by this audit.

## Why this page remains blocked

The exact page title resolves the responsive identity pair:

- SP `1468:7508` — `大会・行事に参加したい`
- PC `1148:6390` — `大会・行事に参加したい`

However, page identity and responsive body authority are separate questions. The current SP frame is still shell-only, while the PC frame contains substantive body content.

## SP authority — current shell only

Current SP `1468:7508` was live-retrieved again from `fKYDn9ikpJk1nW7IWFtaUx` on 2026-09-02.

The frame contains the established global shell:

- page title `大会・行事に参加したい`
- Header
- breadcrumb
- Footer
- purpose menu
- status-bar image

The area between the page-title composition and breadcrumb/footer is visually empty in the current frame. No authored SP counterpart is present for the PC introduction, News rows, or later content/navigation composition.

This is **not** evidence that production SP should intentionally be blank. It means current mobile body composition is **UNDETERMINED**.

Do not infer:

- stacking order from PC
- SP spacing from another navigation page
- omission rules from the empty canvas
- News/card/navigation behavior from a historical `560:*` frame

## PC authority — body exists

Current PC `1148:6390` remains the mapped body authority for this page. Existing audit/repository evidence records:

- page title `大会・行事に参加したい`
- substantive content container
- introductory copy about 武道大会 / 書初め大展覧会 / 研修会 / 武道学園
- `お知らせ` rows using the established News information structure
- global Header / breadcrumb / Footer

The PC body can inform component-family discovery and reuse mapping, but it cannot be mechanically projected into SP while SP composition is unauthored.

## Historical `560:188 join_sp` is no longer a current alternative

The previous version of this audit described `560:188` (`join_sp`) as a second SP root in the current file and then rejected it as a responsive counterpart because its title was `大会に参加したい` rather than `大会・行事に参加したい`.

That historical comparison remains useful as lineage explaining why title similarity alone is unsafe, but the **current-file claim was stale**.

2026-09-02 current-file verification:

- `FIGMA_MAP.md` current top-level re-resolution does not list `560:188`
- direct `get_design_context` for `560:188` in `fKYDn9ikpJk1nW7IWFtaUx` returns `node not found`

Therefore:

- do not search historical Figma files to resurrect `560:188` as implementation authority
- do not use its old body as a mobile fallback
- do not preserve a false “current second SP page” dependency in future implementation decisions
- historical screenshots/docs may remain historical evidence only

## Theme / WordPress dependency

Current repository evidence does not establish a dedicated page/content owner for this literal page title. Ordinary page routing remains the safest known shell authority (`page.php` + editor content), and existing News/shared navigation masters should be reused if and when current SP design proves those same families.

Do not create:

- a dedicated `page-*` template from PC-only body evidence
- new ACF fields or a CPT
- a new News renderer
- SP geometry inferred from PC
- hard-coded Figma specimen copy in Theme PHP
- a historical-node fallback path

## Smallest missing authority

The blocker remains specifically the **current SP content composition** for `大会・行事に参加したい`.

Smallest authority needed: either

1. a current SP frame showing what appears after the page title — introduction, News, navigation/link groups, order, and intentional omissions; or
2. an explicit Human decision that a named existing shared SP composition is the authority for this page.

Until then the correct implementation state is fail-closed, not “copy PC and make it responsive.”

## Reuse-first continuation once SP authority exists

When current SP content authority becomes available:

1. map each authored section back to existing Theme/WordPress owners
2. reuse existing News and Navigation/shared blocks where semantic and visual contracts match
3. keep ordinary `page.php` + editor-owned composition unless a stronger template authority exists
4. verify SP runtime first
5. extend/verify PC at `min-width: 768px`
6. add only the smallest shared derivative justified by a proven gap
7. run visual/runtime QA and relevant CI before merge

## Reusable lesson boundary

The underlying cross-project lesson — re-resolve current Figma provenance instead of trusting stale node lineage — is now tracked through the repository learning evidence flow as a reviewed Candidate. This audit is project evidence for that Candidate; do not create another duplicate learning record for the same failure.

No Theme PHP/CSS/JS, ACF/CPT, `parts.php`, Form/Formidable, Slider, Calendar, or Search work is changed by this authority refresh.