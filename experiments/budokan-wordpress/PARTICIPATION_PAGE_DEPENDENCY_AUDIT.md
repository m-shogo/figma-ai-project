# Budokan participation page dependency audit

Status: responsive page identity is resolved, but visual implementation is fail-closed because the current SP counterpart contains shell authority only and does not contain the PC content composition.

Updated: 2026-08-30

## Why this page was selected

After Header / Footer / Parts and the already-closed TOP families, the canonical SP page was inventoried again instead of following canvas order. A previously unmapped ordinary-page candidate was found:

- SP `1468:7508` (`SP_navigation`) — page title `大会・行事に参加したい`
- PC `1148:6390` (`navigation`) — same page title

The exact title match makes these a strong page-identity pair, but responsive implementation authority must be checked at section level before coding.

## SP authority — shell only

The current SP root `1468:7508` is 375 × 4672. Its direct children are only the established global shell:

- `1476:8101` page-title instance — `大会・行事に参加したい`
- `1468:7510` breadcrumb instance
- `1468:7509` Footer
- `1468:7597` purpose menu
- `1468:7598` Header
- status-bar image

There is no authored content surface between the page-title area and breadcrumb/footer in this current SP frame. In particular, there is no SP counterpart for the PC introduction, News rows, or navigation/content composition.

This is not evidence that production SP should intentionally be blank. It is evidence that the responsive content design is incomplete in the current Figma frame.

## PC authority — content exists

The current PC root `1148:6390` is 1380 × 3890 and does contain a substantive content frame:

- page title `大会・行事に参加したい`
- content container `1301:9490`, width 962px
- introductory copy about 武道大会 / 書初め大展覧会 / 研修会 / 武道学園
- `お知らせ` rows using the established News information structure
- global Header / breadcrumb / Footer

The PC content therefore cannot be safely projected onto SP by guessing stacking, spacing, visibility, or navigation behavior.

## Theme / WordPress dependency

Current repository search does not establish a dedicated page/content owner for the literal page title. Ordinary page routing remains the safest known shell authority (`page.php` + editor content), and existing News/shared navigation masters should be reused where the eventual SP design proves the same family.

Do not create:

- a dedicated `page-*` template from PC-only evidence,
- new ACF fields or a CPT,
- a new News renderer,
- SP geometry inferred from PC,
- hard-coded Figma specimen copy in Theme PHP.

## Smallest missing authority

The blocker is specifically the **SP content composition** for `大会・行事に参加したい`.

Smallest authority needed: a current SP frame or explicit design decision showing what appears after the page title — introduction, News, navigation/link groups, their order, and whether any PC content is intentionally omitted.

Once that exists, implementation can follow the required SP-first path and reuse existing masters instead of inventing a parallel system.

## Failed approach avoided

A title-only responsive match is not enough to authorize implementation. Here, SP and PC clearly identify the same page, but only PC contains the body. Treating page identity as layout authority would silently turn the PC body into an invented mobile design.

## Reusable lesson

When duplicated/generic Figma frame names exist, verify two independent layers:

1. **page identity** — title / breadcrumb / editorial subject;
2. **responsive content authority** — actual sections and information structure at both breakpoints.

Both must be present before SP-first implementation. A matching page title can resolve identity while the responsive body remains legitimately blocked.

No Theme PHP/CSS/JS, ACF contract, `parts.php`, Form, or Formidable work is changed by this audit.
