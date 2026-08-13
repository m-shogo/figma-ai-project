# REF-001 Windows local Figma export

Status: prepared for local execution; not yet promoted over the existing backup bytes.

## Goal

Use the Figma-rendered final visible nodes as the website assets with no Google Drive / Drive Desktop hop:

```text
Figma REST render (32 registered nodes, PNG 1x)
  -> Windows local staging
  -> dimension + SHA-256 validation
  -> canonical Git working-tree paths
  -> REF-001 complete validator
  -> Git commit / push
```

The previous Drive/GAS materialization is preserved as a Git backup branch:

```text
backup/ref001-drive-bridge-assets-20260813
```

This is intentionally a branch snapshot rather than duplicated backup files, so Git keeps the exact old image blobs without adding a second copy of every binary path.

## Working branch

```text
agent/ref001-windows-local-export
```

## One-command local exporter

Script:

```text
scripts/export_ref001_figma_windows.ps1
```

It reads the canonical 32-node inventory from:

```text
research/figma-assets/ref001/rendered-asset-registry.json
```

The script performs one Figma `GET /v1/images/:key` request containing all 32 node IDs, downloads every returned PNG to a temporary Windows directory, validates all 32 dimensions before replacing canonical files, computes old/new SHA-256 values, then writes:

```text
research/figma-assets/ref001/windows-local-export-report.json
```

Temporary Figma URLs and the Figma token are never written to Git.

## Authentication

Use a Figma token with `file_content:read` in the current PowerShell process only:

```powershell
$env:FIGMA_TOKEN = "..."
```

Never save that token in the repository, a manifest, a report, or a committed `.env` file.

## Execute

From a clean checkout of `agent/ref001-windows-local-export`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export_ref001_figma_windows.ps1 -Commit -Push
```

The script refuses to run from the wrong branch or from a dirty working tree.

## Site wiring

The isolated REF-001 site fixture asset map is wired to all 32 canonical rendered paths on this branch. The local export overwrites those same canonical paths, so no template rewrite is required when the new bytes land.

## Promotion rule

Do not remove the backup branch or promote the local-export branch until:

1. all 32 local downloads pass registry dimensions,
2. `scripts/validate_ref001_asset_map.py --require-complete` passes (or CI proves the equivalent when local PHP/Python is unavailable),
3. visual QA uses the new canonical Git bytes,
4. the website fixture has no dummy REF-001 image assignments.

If the local export produces byte-identical files to the prior bridge export, keep the report as proof and avoid treating the absence of binary diffs as a failure.
