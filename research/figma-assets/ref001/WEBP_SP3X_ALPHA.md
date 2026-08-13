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

The Figma CTA groups contain a person and an offset colored silhouette behind
it. Direct child/group exports are flattened opaque by the export path, while
the four original high-resolution fills contain real alpha. The original person
and colored-silhouette RGBA fills are therefore the authoritative sources.

- Left person image hash: `5bbe541c05b43e0f29b2c001c185ed0e1fef7a2b`
- Left yellow silhouette hash: `6b082e6c3630c06394f659125e8ab1a5dfedb588`
- Right person image hash: `492378b1703a6941cd23ebdf8427c785fce351f3`
- Right green silhouette hash: `9f70f5f08727bc3367f4fe1f3ed848d7c82c41ba`

The registry records each layer node and exact placement geometry for PC and
SP. The materializer draws silhouette first and person second on a transparent
group-sized canvas. It does not use chroma keying, background-removal models,
or generated imagery. Only the CTA background remains in CSS/HTML.

## Reproduce

First export all registered PC nodes at 1x and SP nodes at 3x into one temporary
staging directory. Download the two original CTA RGBA sources and verify their
registry SHA-256 values. Then run:

```bash
python3 scripts/materialize_ref001_webp_assets.py /tmp/ref001-staging \
  --cta-left-source /tmp/cta-left-original.png \
  --cta-right-source /tmp/cta-right-original.png \
  --cta-left-color-source /tmp/cta-left-yellow.png \
  --cta-right-color-source /tmp/cta-right-green.png

python3 scripts/materialize_ref001_webp_assets.py /tmp/ref001-staging \
  --cta-left-source /tmp/cta-left-original.png \
  --cta-right-source /tmp/cta-right-original.png \
  --cta-left-color-source /tmp/cta-left-yellow.png \
  --cta-right-color-source /tmp/cta-right-green.png \
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
