# REF-001 Mac local Figma export

The canonical REF-001 raster assets were refreshed through this path:

```text
Figma final-visible node render (PNG, 1x)
  -> macOS temporary staging directory
  -> PNG structure and registry-dimension validation
  -> encoded-byte and normalized RGBA comparison with the backup branch
  -> canonical Git paths
```

Google Drive, Google Drive Desktop, GAS, and the chat bridge are not part of
this path. Figma tokens and temporary render URLs are never stored in Git.

## Canonical inputs

- Registry: `rendered-asset-registry.json`
- Backup: `backup/ref001-drive-bridge-assets-20260813`
- Inventory: PC 16 + SP 16 = 32 PNGs
- Canonical root: `implementation/theme/assets/images/ref001/rendered/`

The Figma download step must read every node ID, expected dimension, and target
basename from the registry. It must render the final visible node at PNG 1x and
place all 32 files in one temporary staging directory. Do not replace canonical
files incrementally.

## Validate, compare, and install

After all 32 downloads finish:

```bash
python3 scripts/install_ref001_figma_mac_exports.py \
  /tmp/figma-ai-project-ref001-XXXXXXXX

python3 scripts/install_ref001_figma_mac_exports.py \
  /tmp/figma-ai-project-ref001-XXXXXXXX \
  --apply

python3 scripts/validate_ref001_asset_map.py --require-complete
```

The first command is a dry run. The `--apply` command touches canonical files
only after the full staging inventory passes PNG signature, IHDR, IEND, and
dimension checks and every backup comparison has been produced.

The report is written to:

```text
research/figma-assets/ref001/mac-local-export-report.json
```

Pixel hashes use the same macOS image decode and normalized RGBA pipeline for
new and backup PNGs. A byte difference alone is not a visual failure. Every
decoded-pixel difference requires visual QA against the live Figma node and the
PC/SP site runtime.

The Windows exporter remains available as an alternative local export path,
but a Windows run is not a completion requirement after the successful Mac
local materialization.
