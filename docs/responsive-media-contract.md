# Responsive Media Contract

Owner decision for the current Figma → Web implementation workflow.

## Rule

Responsive content images are managed as separate PC and SP sources.

- PC image and SP image are separate CMS/media inputs.
- Use the project breakpoint contract: SP is `<= 767px`, PC is `>= 768px`.
- Render responsive media with `<picture>` when HTML is available.
- The SP source uses `media="(max-width: 767px)"`.
- The `<img>` fallback is the PC source.
- Media boxes use `width: 100%`, `height: 100%`, and `object-fit: cover` unless the design explicitly requires contain or uncropped intrinsic sizing.
- Preserve the Figma crop/focal intent with `object-position` when evidence exists.
- Do not collapse PC/SP fields into one attachment merely because Figma currently reports the same image hash. The separate-field contract is an owner decision and outranks source deduplication heuristics.

## CMS naming

For an editor-owned logical image, prefer paired fields such as:

- `hero_image_pc`
- `hero_image_sp`

Apply the same pairing to repeated fixed sections, for example `reason_1_image_pc` / `reason_1_image_sp`.

If one side is temporarily missing, the runtime may fall back to the available source so the page does not break, but QA should report the missing counterpart before production completion.

## Markup baseline

```html
<picture class="media">
  <source media="(max-width: 767px)" srcset="...sp...">
  <img src="...pc..." alt="">
</picture>
```

```css
.media,
.media img {
  width: 100%;
  height: 100%;
}

.media img {
  display: block;
  object-fit: cover;
}
```

## Figma evidence

Figma PC/SP image hashes remain useful for visual lineage and asset verification, but they no longer decide whether CMS fields are merged. Separate PC/SP media ownership is the implementation contract.