# REF-002 Visual Truth Wrapper + Durable Asset Readiness

This record extends the canonical Fast Loop with concrete lessons observed on the independent REF-002 Budokan validation. It does **not** change REF-001 V2/V3 implementation, assets, or Visual QA.

## 1. Visual Truth wrapper artifact

Live Figma geometry was inspected on file `RfAQQ28V1HGaeIcpgRmQq1`.

### PC structured source

- root `839:4676`: width `1380`
- major sections are `x=0`, width `1380`
- root Layout/Render bounds are both `1380`
- no root stroke/effect explains extra visual width

### PC final Visual Truth

- root `2270:4565`: width `1381`
- major sections `2270:4566` through `2270:4573` are consistently `x=1`, width `1380`
- root Layout/Render bounds are both `1381`
- no root stroke/effect explains the extra pixel

### SP cross-check

- structured root `446:10020`: width `375`, major children `x=0`
- final root `2270:5570`: width `375`, major children `x=0`

### Decision

The PC final Visual Truth has a parent-only one-pixel left wrapper gutter. The actual repeated content remains 1380px wide. Web layout must **not** be widened to 1381px merely to copy this parent artifact.

Fast Loop comparison should normalize the reference to the repeated child content bounds before visual diff when all of these conditions hold:

1. multiple major visible children repeat the same x/width geometry;
2. their shared width covers almost all of the parent;
3. the parent alone contributes the residual horizontal gutter;
4. the structured/reference evidence supports the content width;
5. there is no stroke/effect/render-bound evidence that the extra width is meaningful rendered content.

A narrow centered content block is not a wrapper artifact. Mixed child geometry is not enough evidence to normalize.

Implementation: `visual_truth_guard.diagnose_reference_wrapper`.

## 2. Asset readiness is a durable-bytes fact

`fast_loop_next.py` already provides the content-addressed Asset Materializer. The missing guard was the state transition after materialization.

An asset is `ASSET_READY` only when all of the following are true:

- the registry record has a safe relative durable path;
- SHA-256 is present and valid;
- positive byte size is present;
- the durable file exists under the expected output root;
- actual byte size matches the record;
- actual SHA-256 matches the record;
- no ephemeral Figma MCP asset URL is serialized anywhere in the record.

State model:

- `ASSET_PENDING`: durable contract incomplete or bytes not present;
- `ASSET_READY`: durable bytes exist and hash/size verify;
- `ASSET_CORRUPT`: bytes exist but differ from recorded hash/size;
- `ASSET_INVALID_EPHEMERAL_METADATA`: a short-lived Figma asset URL leaked into persisted metadata.

Knowing a temporary Figma URL is **not** materialization and must never promote an asset from pending to ready.

Implementation: `visual_truth_guard.durable_asset_state`.

## REF-002 materialization update — 2026-08-23

The original section below was written before the later protected REF-002 asset-materialization work and is now historical evidence rather than the current asset-availability state.

Protected Draft PR #142 at immutable head `1320476ccaaf86eef6efde6b5cad99533faf085d` contains durable local assets used by its current benchmark runtime:

- PC `ASSET_PENDING = 0`
- SP `ASSET_PENDING = 0`
- 25 raster assets recorded in `assets/figma-raster/manifest.json` with per-file SHA-256, dimensions and byte sizes
- 12 durable Partner PNGs
- Footer brand vector authority preserved as SVG components
- short-lived Figma MCP URLs are not persisted

The raster manifest source is:

`experiments/ref002-budokan-fullcalendar-validation/assets/figma-raster/manifest.json`

The production WordPress replay does **not** inherit PR #142 HTML/CSS/JS architecture. Exact asset bytes may be selectively reused after the supplied Theme is observed and their hashes are reverified.

Canonical production-reuse evidence:

`experiments/ref002-budokan-wordpress/baseline-asset-source.yaml`

This separates two facts that must not be conflated:

1. **asset availability is solved for the protected benchmark source**;
2. **production Theme-bound visual fidelity is not solved until the new implementation imports the required bytes and passes fresh SP -> PC Figma comparison**.

## Historical boundary before materialization

At the time this lesson was first recorded, Budokan still had image materialization work remaining. The guard deliberately did not convert pending image evidence into a fake pass: status stayed pending until actual durable bytes were present and verified.

The Figma connector could expose/export the relevant image nodes, but the then-current ChatGPT connector/runtime boundary did not provide a safe reusable binary handoff for short-lived asset responses. The later #142 work solved that benchmark transport problem without weakening the durable-readiness contract.
