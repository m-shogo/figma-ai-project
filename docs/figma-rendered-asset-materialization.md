# Figma Rendered Asset Materialization

## Purpose

Figma/MCP asset references can be short-lived. A production or research repository must not treat a temporary download locator as a durable asset.

This repository supports two separate concerns:

1. **Source acquisition** — obtain bytes while the current Figma/plugin/MCP capability can still access them.
2. **Durable materialization** — store the actual bytes plus hash/size/Figma lineage, while keeping temporary locators out of the tracked tree.

The durable artifact is the image file plus its adjacent `*.asset.json` record. The temporary transport is not the artifact.

## Rendered-byte lane

When the current client can obtain rendered bytes but cannot safely hand a temporary locator to a network-enabled process, use:

```text
Figma node
  -> plugin/MCP rendered bytes
  -> transient base64 chunks
  -> scripts/materialize_figma_rendered_asset.py
  -> durable image
  -> adjacent .asset.json
  -> remove transient chunks
  -> CI integrity + leak + final-tree hygiene
```

This lane is appropriate for **rendered visual evidence** such as a mask/group/composite whose final appearance is not represented by one source image fill.

It does not prove that the rendered composite should become a production CMS attachment. Visual evidence ownership and production content ownership remain separate decisions.

## Materializer

Example with a transient chunk directory:

```bash
python scripts/materialize_figma_rendered_asset.py \
  --chunk-dir /tmp/figma-render/chunks \
  --output research/figma-assets/ref001/example.png \
  --file-key <figma-file-key> \
  --node-id <node-id> \
  --logical-name <stable-logical-name> \
  --expected-format png \
  --min-bytes 1000
```

Optional hard checks:

```text
--expected-size <bytes>
--expected-sha256 <sha256>
```

Use them when an independent source has already supplied those values. Do not invent an expected hash.

The decoder is strict. Invalid base64, a format mismatch, size/hash mismatch, or overwrite conflict fails before a durable record is accepted.

## Durable manifest

The adjacent manifest records at least:

- durable artifact path
- SHA-256
- byte size
- detected media format/content type
- Figma file key
- Figma node id
- logical asset name
- rendered-byte materialization lineage
- explicit statement that the temporary source locator is not persisted

`python scripts/validate_figma_asset_manifests.py` recomputes the artifact hash/size and rejects drift or a missing target.

## Final-tree invariants

The final branch/PR must contain **none** of the following:

- transient base64 chunk staging
- one-shot materialization workflow
- short-lived Figma asset locator strings
- partial download/materialization files

`tests/test_final_tree_figma_asset_staging.py` makes the first two conditions part of ordinary repository CI. The existing temporary-locator leak validator and asset-manifest validator cover the remaining durable-tree boundaries.

A branch may use transient staging while constructing the artifact, but squash-merge only after the final-tree gates are green.

## REF-001 evidence boundary

REF-001 previously proved that some visible assets are layered/composited and that one arbitrary raw image fill can lose supplied visual information. The Blind Clean Replay also left media transport open because the execution environment could not durably move the required bytes.

A successfully materialized rendered node demonstrates a **transport capability**, not automatically full media completion for REF-001. To close the broader media blocker, every required production/QA visual still needs explicit ownership, durable bytes where required, and implementation wiring/verification.

## Do not over-promote this yet

One successful transfer is an E1/E2 transport observation depending on its replay context. It is not evidence that every Figma project should use rendered composites or base64 staging.

Prefer simpler existing-project asset paths when the target repository, DAM, CMS, or local filesystem already owns the correct durable bytes. Use this lane when it solves a real capability boundary and preserve evidence so it can be retested as Figma/MCP clients evolve.
