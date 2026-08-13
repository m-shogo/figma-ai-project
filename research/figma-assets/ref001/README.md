# REF-001 raster asset notes

Current canonical policy:

- `../../../docs/figma-raster-export-policy.md`
- `MAC_LOCAL_EXPORT.md`
- `mac-local-export-report.json`

## Current source of truth

The current REF-001 canonical raster refresh is the completed Mac-local export
on `agent/ref001-figma-raster-assets`.

Inventory:

- PC: 16
- SP: 16
- total: 32 PNGs

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
