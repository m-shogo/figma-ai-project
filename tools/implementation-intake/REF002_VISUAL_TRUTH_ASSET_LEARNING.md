# REF-002 Visual Truth Wrapper + Durable Asset Readiness

This record extends the canonical Fast Loop with two concrete lessons observed on the independent REF-002 Budokan validation. It does **not** change REF-001 V2/V3 implementation, assets, or Visual QA.

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

## REF-002 current boundary

Budokan still has real image materialization work remaining. This guard deliberately does not convert its pending image evidence into a fake pass: the status remains pending until actual durable bytes are present and verified.

The Figma connector can expose/export the relevant image nodes, but the current ChatGPT connector/runtime boundary does not yet provide a safe reusable binary handoff for these short-lived asset responses. That transport limitation is kept separate from the durable readiness contract.
