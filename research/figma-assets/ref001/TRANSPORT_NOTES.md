# REF-001 exact Figma raster transport notes

Updated: 2026-08-12

## Authority

Figma remains the editable visual authority. Git stores durable rendered artifacts only after the bytes have been validated and delivered through the existing image bridge.

- file: `ZYTdtw4wCgkcBy2cVnhxVI`
- page: `21376:1600` (`AI`)
- PC frame: `21384:8173` (`Top@2x`)
- SP frame: `21376:4401` (`Top_sp@2x`)
- exact target inventory: `rendered-asset-registry.json`

## Verified export behavior

For the same unchanged Figma node, repeated Plugin API `node.exportAsync({ format: 'PNG' })` calls were byte-for-byte stable in the REF-001 run. This was explicitly checked by exporting the same node twice and comparing every byte before using byte-range materialization.

Do **not** assume this globally without a stability probe. Re-probe if Figma, the node, export options, or the runtime changes.

## Correct chunk protocol

The existing `scripts/assemble_figma_plugin_asset.py` contract is based on **binary byte ranges**, not on slicing one giant base64 string.

Correct:

```text
PNG bytes
  -> bytes[0:N]
  -> base64(chunk 1)
  -> bytes[N:2N]
  -> base64(chunk 2)
  -> ...
  -> decode every independent .b64 chunk
  -> concatenate decoded bytes in order
  -> verify size / PNG signature / dimensions / IEND / SHA-256
```

Incorrect:

```text
PNG bytes
  -> base64(entire PNG)
  -> split the base64 text arbitrarily
  -> independently decode split strings
```

The incorrect form caused the earlier REF-001 materialization failure.

## Current safe response budget

Observed in the connected Figma tool runtime:

- a 9,000-byte binary range (~12 KB base64) is safe
- a 12,000-byte binary range (~16 KB base64) is also safe for one asset
- returning multiple asset chunks in one tool response can exceed the response budget and be truncated
- a truncated base64 response must be rejected; never pad or guess missing data

Current operational default: **one asset per call, up to 12,000 source bytes per chunk**, with a smaller range if the surrounding response becomes large.

## Validation before Drive

A reconstructed PNG is allowed into Drive only after all of these pass:

1. decoded byte count equals the Figma export byte count
2. PNG signature is `89 50 4E 47 0D 0A 1A 0A`
3. IHDR dimensions match the registry / Figma node
4. file ends with a valid `IEND` chunk
5. SHA-256 is computed from the reconstructed final bytes
6. manifest uses that exact SHA-256

A failed or truncated reconstruction is discarded and must not be uploaded.

## Drive / Git handoff

Use the existing `m-shogo/chatgpt-git-bridge` lane:

```text
Figma final visible node render
  -> exact local PNG bytes
  -> Drive incoming/<repo>/<branch>/<task>/image + manifest.json
  -> GAS 5-minute processQueue trigger
  -> GitHub target branch/path
  -> GitHub raw read-back SHA-256 verification
  -> Drive task cleanup
```

Short-lived Figma MCP asset URLs are transport-only and must never be persisted in Git, manifests, docs, or long-lived artifacts.

## REF-001 lessons

- Final visible mask/group renders are the visual fixture authority, not arbitrary raw source photos.
- PC and SP are independent assets; do not infer one from the other.
- A semantic slot must remain on the explicit dummy fallback until its exact target render has completed bridge delivery.
- Do not mark asset completion from a successful Figma export alone. Completion means durable Git bytes exist and the registry / asset-map validation passes.
- Prefer machine-readable node/path mapping so a human can later replace or adjust one asset without touching templates.
