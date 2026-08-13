# REF-001 Typography Runtime Metrics Learning

## Evidence

SP Education exposed a repeatable typography failure mode. Figma's nominal list style is 15px with 5% tracking, but copying 15px into the Web fallback-font environment caused visible extra wrapping at 375px while the authored Figma rows remain single-line.

The tested 15px change was intentionally not merged. The existing 14px Web value produced the more faithful visible result for the fixed authored geometry.

## Reusable rule

Do not treat a nominal Figma `font-size` value as sufficient proof of fidelity when the exact production font face/metrics are unavailable.

For fixed or tightly authored text geometry, validate in this order:
1. correct font family/weight when available;
2. visible glyph bounds;
3. authored line breaks and wrapping;
4. text block width/height and surrounding geometry;
5. nominal font-size/tracking values.

A compensating Web font size is acceptable when fresh runtime evidence shows it reproduces the authored visible result more faithfully.

## Generation consequence

During future Figma-to-Web generation, typography extraction must record both authored metrics and expected visible text geometry. Generated CSS should not blindly copy px values when runtime font metrics produce different wrapping.

Any compensation must be verified with fresh same-commit screenshots and must not be generalized as a fixed numeric offset across unrelated designs.
