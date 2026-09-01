# Budokan Core Details native-markup audit

Status: shared Core Details visual owner corrected against current Figma and immutable editor markup.

Updated: 2026-09-02

## Authority checked

- Current Figma file: `fKYDn9ikpJk1nW7IWFtaUx`
- PC collapsed Details: `1157:8302`
- PC open Details: `1157:8314`
- PC FAQ Details: `1157:8324`
- SP collapsed Details family: `1399:18837`
- SP FAQ Details: `1399:18857`
- Immutable editor reference: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/parts.php`
- Shared CSS owner: `css/blocks/wp-block-details-style.css`

`parts.php` was read only. It was not modified.

## Problem found

The shared CSS expected synthetic descendant hooks such as:

- `.wp-block-details__title`
- `.wp-block-details__button`
- `.wp-block-details__content`
- `.wp-block-details__inner`

but the actual authorized Gutenberg source is native Core Details markup:

```html
<details class="wp-block-details">
  <summary>...</summary>
  <!-- editor-owned child blocks -->
</details>
```

The FAQ variant only adds `_qa` on the root. No repository transform was found that materializes the synthetic `__title/__button/__content/__inner` elements for the frontend.

This meant substantial parts of the previous shared visual contract were targeting DOM that Core does not emit.

## Correction

The shared CSS now owns the real native structure directly:

- `summary` owns Figma title typography and responsive padding
- `summary::after` owns the plus/minus affordance, so no JS-only or extra HTML button is invented
- `[open] summary` owns the divider and minus state
- direct editor-owned blocks receive the shared content inset without wrapping or rewriting them
- `_qa summary::before` provides `Q`
- `_qa summary + *::before` provides the first-content `A` marker

No new PHP template, JavaScript behavior, Gutenberg markup, ACF field, CPT, or page-specific CSS was introduced.

## Figma geometry retained

- SP collapsed rail: 59px (`1399:18837`)
- PC collapsed one-line rail: 75px (`1157:8302`)
- PC open title/content boundary remains a native `<summary>` boundary rather than a synthetic wrapper
- PC/SP FAQ Q/A markers remain decorative and do not become editor data

The CSS intentionally preserves arbitrary child blocks inside `<details>` instead of assuming the content is only a paragraph.

## Reuse-before-build decision

This is a shared-block repair, not a Publications-specific component. Publications uses the same Details family, so fixing the canonical block owner is preferable to adding Backnumber CSS.

## Remaining QA boundary

The repository has no dedicated permanent Budokan Parts browser workflow today. Figma structure plus actual immutable Gutenberg markup prove the ownership mismatch, while PR CI must still validate repository-level regressions. Do not describe this audit alone as a full browser pixel-parity pass.

If a future runtime fixture exercises Core Details, assert the real `details > summary` and `[open]` state rather than synthetic descendant classes.

## Reusable lesson

Before styling a CMS/core block against helper class names, compare the selector contract with the actual serialized/rendered markup. A visually correct CSS rule that targets nodes the CMS never emits is dead implementation, even when the stylesheet itself is syntactically valid.

Generalization remains project-scoped until another implementation family/reference reproduces the failure and the correction is measured there.
