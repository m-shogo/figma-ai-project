# REF-001 raster asset notes

Current canonical policy and implementation:

- `../../../docs/figma-raster-export-policy.md`
- `WEBP_SP3X_ALPHA.md`
- `webp-export-report.json`
- `webp-runtime-qa.json`
- `MAC_LOCAL_EXPORT.md`
- `mac-local-export-report.json`

## Current source of truth

The current REF-001 canonical raster set uses lossless WebP. PC assets retain
their Figma 1x source geometry, while every SP asset is exported at 3x its exact
Figma visible dimensions. CTA people use the original Figma RGBA source layers
on transparent canvases; CTA background and color-silhouette decoration are not
baked into the assets.

Inventory:

- PC: 16
- SP: 16
- total: 32 WebP files
- SP source scale: 3x
- CTA transparent people: 4/4

The previous Drive/GAS-delivered state is preserved only as rollback/comparison
evidence at:

```text
backup/ref001-drive-bridge-assets-20260813
```

A backup ref proves historical bytes existed; it does **not** prove those bytes
were valid or visually faithful.

## Historical note

`TRANSPORT_NOTES.md` contains the earlier chat / binary-chunk / Drive / GAS bridge
work and the lessons learned from that route. Treat it as historical transport
documentation, not the default future raster workflow.

The repository-wide default is now:

```text
Figma official connector / API / Desktop MCP
  -> local filesystem-capable agent (Codex / Claude Code / equivalent)
  -> temporary local staging
  -> full validation and comparison
  -> canonical Git paths
  -> runtime QA
  -> Git push
  -> CI
```

Chat-only binary materialization remains a fallback and must pass the same
validation gates before promotion.
