# REF-001 WebP / SP 3x / CTA alpha materialization

The canonical raster path is:

```text
Figma final-visible nodes
  -> temporary Mac-local PNG staging (PC 1x / SP 3x)
  -> lossless WebP with exact transparent RGB preservation
  -> decode, dimensions, RGBA roundtrip, alpha, SHA-256 validation
  -> canonical Git paths
```

Google Drive, Drive Desktop, GAS, chat-side binary reconstruction, base64
transport, and persistent temporary Figma URLs are not part of this path.

## CTA person exception

The Figma CTA groups contain an opaque final composite: the person, a colored
silhouette, and a flattened background. For the editable website implementation,
the two original high-resolution RGBA person fills are the authoritative source.

- Left person image hash: `5bbe541c05b43e0f29b2c001c185ed0e1fef7a2b`
- Right person image hash: `492378b1703a6941cd23ebdf8427c785fce351f3`

The registry records the exact Figma layer node and placement geometry for PC
and SP. The materializer resizes and positions those existing RGBA pixels on a
transparent canvas. It does not use chroma keying, background-removal models,
or generated imagery. CTA background and decoration remain in CSS/HTML.

## Reproduce

First export all registered PC nodes at 1x and SP nodes at 3x into one temporary
staging directory. Download the two original CTA RGBA sources and verify their
registry SHA-256 values. Then run:

```bash
python3 scripts/materialize_ref001_webp_assets.py /tmp/ref001-staging \
  --cta-left-source /tmp/cta-left-original.png \
  --cta-right-source /tmp/cta-right-original.png

python3 scripts/materialize_ref001_webp_assets.py /tmp/ref001-staging \
  --cta-left-source /tmp/cta-left-original.png \
  --cta-right-source /tmp/cta-right-original.png \
  --apply

python3 scripts/validate_ref001_asset_map.py --require-complete
```

The first command is a dry run. Canonical files are written only after all 32
assets pass. The machine-readable result is `webp-export-report.json`.

## Required QA

- WebP decode succeeds for all 32 assets.
- SP source dimensions match exact Figma visible dimensions multiplied by 3.
- PNG staging and lossless WebP decoded RGBA match exactly.
- CTA alpha is not all opaque and remains clean on transparent, white, black,
  and checkerboard backgrounds.
- Runtime selects all 16 PC sources at desktop and all 16 SP sources at mobile.
- Natural/rendered ratios are approximately 3 on SP without changing layout.
