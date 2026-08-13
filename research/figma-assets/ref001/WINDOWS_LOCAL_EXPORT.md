# REF-001 Windows local Figma export

> This remains an alternative local export path. The completed Mac-local
> materialization documented in `MAC_LOCAL_EXPORT.md` is the canonical refresh,
> so a separate Windows run is no longer a promotion requirement.

## Goal

Replace the 32 canonical website raster files from Figma through the Windows working tree, without Google Drive or Google Drive Desktop:

```text
Figma REST render (32 registered nodes, PNG 1x)
  -> Windows %TEMP% staging
  -> PNG structure + dimension validation
  -> exact-byte comparison with preserved Git backup
  -> decoded-pixel comparison with preserved Git backup
  -> canonical Git working-tree paths
  -> REF-001 complete validator
  -> Git commit / push
  -> Human Review / runtime visual QA
```

The previous Drive/GAS materialization is preserved at:

```text
backup/ref001-drive-bridge-assets-20260813
```

That backup is a Git branch snapshot, so it preserves the exact old image blobs without duplicating a second backup directory inside the site.

## Working branch

```text
agent/ref001-figma-raster-assets
```

## Exporter

```text
scripts/export_ref001_figma_windows.ps1
```

The script reads all 32 node IDs, expected dimensions, and canonical paths from:

```text
research/figma-assets/ref001/rendered-asset-registry.json
```

It performs one Figma image-render request for all 32 IDs and downloads every PNG to `%TEMP%`. No canonical site file is replaced until all 32 downloads pass PNG signature/IEND and dimension validation.

For every asset the script then compares the Windows-local PNG with the explicit backup branch in two different ways:

- Git blob / SHA-256 equality: proves the encoded PNG bytes are exactly identical.
- decoded 32-bit pixel SHA-256 equality: distinguishes harmless PNG compression/metadata differences from actual decoded-pixel differences.

The result is written to:

```text
research/figma-assets/ref001/windows-local-export-report.json
```

Temporary Figma URLs and the Figma token are never written to Git.

## Pre-export live audit

Before the Windows run, a read-only live Figma Plugin API audit was performed and persisted at:

```text
research/figma-assets/ref001/live-vs-backup-byte-audit.json
```

Result:

```text
fresh Figma Plugin API 1x PNG vs preserved Drive/GAS backup
exact bytes: 4 / 32
byte-different: 28 / 32
PC exact: 0 / 16
SP exact: 4 / 16
```

This is **not** evidence that 28 images are visually wrong. Different Figma export paths or PNG encoders can produce different compressed bytes for the same decoded pixels. That is why the actual Windows run performs decoded-pixel comparison as a separate gate and why final Human Review remains required.

## Authentication

The PowerShell exporter uses the Figma REST image endpoint, so it needs a Figma token with `file_content:read` in the current PowerShell process only:

```powershell
$env:FIGMA_TOKEN = "..."
```

Do not save the token in the repository, manifest, report, committed `.env`, shell history, or CI logs.

Figma's desktop MCP server is a separate local-agent option. Figma documents the desktop MCP at `http://127.0.0.1:3845/mcp` and its image settings can allow an MCP client to download/write assets into the user's project. That route is useful for a local IDE agent, but this repository's deterministic Windows proof script intentionally uses the REST export endpoint so the 32-node run, hashes, and Git comparison are explicit and reproducible.

## Execute

From a clean Windows checkout on `agent/ref001-figma-raster-assets`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export_ref001_figma_windows.ps1 -Commit -Push
```

The script refuses to run from a different branch or from a dirty working tree. It fetches the backup branch itself before comparing the 32 assets.

## Site usage

The REF-001 fixture asset map uses all 32 canonical rendered paths. The local export overwrites those same paths, so templates do not need to change when the locally downloaded bytes replace the previous bridge-delivered bytes.

## Promotion gate

Keep the backup branch until all of the following are true:

1. all 32 Windows-local downloads pass PNG structure and registry-dimension validation,
2. `windows-local-export-report.json` contains comparisons for exactly 32 assets,
3. every encoded-byte difference is classified separately from decoded-pixel difference,
4. `scripts/validate_ref001_asset_map.py --require-complete` passes locally or in CI,
5. the Human Review / runtime preview loads the new canonical bytes,
6. PC and SP visual QA against live Figma passes.

A byte mismatch alone is not a failure. A decoded-pixel mismatch must be inspected against live Figma before merge. The preserved backup branch remains the rollback source until that QA is complete.
