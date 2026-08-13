# Figma raster export and Git promotion policy

Updated: 2026-08-13

## Purpose

This document is the repository-wide default policy for exporting raster assets
from Figma and promoting them into Git.

Figma is the editable visual authority. A PNG existing in Git is **not**
automatically considered trustworthy. Raster assets become canonical only after
the export, file integrity, mapping, pixel/visual, runtime, and CI gates below
have passed.

The REF-001 incident is the reason this policy exists.

## Default workflow

Prefer a local filesystem-capable coding agent such as Codex or Claude Code:

```text
Figma official connector / API / Desktop MCP
  -> local temporary staging directory
  -> complete inventory validation
  -> format decode + dimension / alpha checks
  -> WebP conversion when fidelity is preserved
  -> byte / normalized pixel comparison when a prior asset exists
  -> live-Figma visual QA for pixel differences
  -> canonical repository paths
  -> site/runtime QA
  -> Git commit / push
  -> CI
```

For the current macOS REF-001 implementation, see:

- `research/figma-assets/ref001/MAC_LOCAL_EXPORT.md`
- `scripts/install_ref001_figma_mac_exports.py`
- `research/figma-assets/ref001/mac-local-export-report.json`

A Windows local path may also be used when it provides the same guarantees.
The important property is not the operating system; it is that the agent can
materialize real files locally and validate them before Git promotion.

## Tool choice

### Preferred: Codex / Claude Code / another local coding agent

Use a local agent when the task includes any of these:

- write Figma exports to disk
- compare binary or decoded image data
- run multiple decoders
- replace repository assets atomically
- run local site/runtime QA
- commit and push the resulting assets

This keeps the full chain on one machine and makes validation reproducible.

### Chat-only export: fallback, not the default

A chat session may be able to obtain Figma renders, but that does **not** imply
that the resulting bytes are safe to promote directly into Git.

Treat any chat-materialized image as **unverified staging** until it passes the
same gates as a local export.

Chat is acceptable only when there is no practical local-agent path, or as a
bounded experiment. If chat is used:

1. verify the exact Figma file and node ID
2. export the final visible group/mask, not an arbitrary raw source image
3. verify format and scale
4. reject truncated or partially reconstructed payloads
5. validate PNG structure and decode
6. verify dimensions against the registry
7. compare normalized pixels with the trusted source/previous asset when possible
8. visually compare any pixel difference with live Figma
9. run site/runtime QA
10. do not call the asset canonical until CI is green

Do not assume a successful tool response, successful download, matching filename,
or matching dimensions proves visual identity.

## Drive / bridge policy

Google Drive, Drive Desktop, GAS, and `chatgpt-git-bridge` are **not** the
default raster promotion path.

They may remain useful as transport fallbacks when a local filesystem-capable
agent is unavailable, but every transported image must still pass the full
validation gates in this document.

The REF-001 incident does **not** prove that Google Drive itself corrupts PNGs.
The risk came from the end-to-end chat export / reconstruction / multi-hop
transport path without sufficiently strong validation at every boundary.

Never blame a transport component without evidence. Record the actual failing
boundary if it can be isolated.

## Canonical source selection

For each asset, keep a machine-readable registry containing at least:

- semantic slot
- viewport / breakpoint
- Figma file key
- exact node ID
- expected width and height
- output format and scale
- canonical Git path

Rules:

- final visible mask/group/node render is authoritative by default
- a documented raw-source exception is allowed when a final group bakes in a
  background or decoration that must remain editable in HTML/CSS; preserve the
  original alpha and reproduce the Figma crop from recorded geometry
- raw source photos are otherwise not interchangeable with the final visible node
- PC and SP are independent assets
- never infer SP from PC, or PC from SP, when both exist in Figma
- never hand-maintain a second node/path list when a registry already exists

## Staging and atomic promotion

Do not write each downloaded raster directly into the canonical site directory.

Use this order:

```text
download all expected assets
  -> validate all assets
  -> compare all assets
  -> stop on any hard failure
  -> only then replace canonical files
```

A partial 11/32 or 31/32 replacement is a failure state, not progress to publish.

The canonical tree should stay untouched if inventory validation, PNG validation,
dimensions, mapping, or required comparison fails.

## Format, WebP, scale, and alpha gates

A file is not considered valid merely because macOS Preview or one browser
happens to display it. Canonical photographic raster assets should use WebP
when decoded visual fidelity is preserved. Figma PNG exports may remain as
temporary staging inputs.

At minimum verify:

- non-zero byte length
- actual encoded format matches the extension and registry
- expected width / height
- successful normal decode
- SHA-256

For lossless WebP conversion, compare decoded RGBA before and after encoding.
For transparent assets, require an encoded alpha channel and real transparent
pixels. Do not accept an all-opaque RGBA file merely because its decoder reports
an alpha-capable pixel format.

SP source rasters must be exported at 3x their exact Figma visible dimensions;
CSS must continue to display them at 1x geometry. Preserve fractional Figma
dimensions and use one recorded rounding rule instead of rounding the display
dimension first. Runtime QA should verify natural/rendered ratios as well as
the selected PC/SP source.

When practical, decode with more than one normal decoder/library. Decoder
disagreement is a compatibility warning and must be investigated before
promotion.

For critical reusable assets, prefer a decode -> normalized RGBA pipeline in
addition to structural PNG checks.

## Meaning of "same"

Use explicit comparison classes. Do not collapse all of them into "same" or
"different".

### A. Encoded-byte identical

The complete PNG bytes are identical.

Useful for provenance and exact reproduction, but not required for visual
equivalence.

### B. Pixel identical

Encoded PNG bytes differ, but decoded normalized pixel data is identical.

This is normally acceptable. Compression, chunk ordering, encoder behavior, or
metadata can change bytes without changing the displayed result.

### C. Pixel different, visually accepted

Normalized pixels differ. The asset must be checked against the live Figma node
and in the actual PC/SP runtime.

Small differences at mask edges, alpha handling, antialiasing, or export
implementation can be acceptable only after explicit visual QA.

### D. Visual mismatch

Crop, mask, content, color, alpha, scale, or other visible output differs from
the intended Figma result.

Do not promote.

### E. Corrupt / decoder-unstable

A normal decoder fails, the decoded output is visibly noisy/broken, or decoders
disagree in a way that makes the asset unreliable.

Do not promote even if the file has a `.png` extension, matching dimensions, or
can be displayed by one tolerant application.

## REF-001 evidence and incident lessons

The completed Mac-local REF-001 refresh provides concrete evidence for this
policy:

- inventory: 32 PNGs = PC 16 + SP 16
- new Mac-local PNG integrity / dimensions / registry mapping: PASS
- exact encoded-byte matches with the previous backup: 2/32
- normalized RGBA pixel matches with the previous backup: 18/32
- normalized pixel differences: 14/32, all reviewed against live Figma
- runtime QA: PC 1380px and SP 375px passed without missing images, PC/SP mix-up,
  or horizontal overflow

The old backup was produced through the earlier:

```text
Figma
  -> chat-side extraction / reconstruction
  -> Google Drive
  -> Git
```

path.

During follow-up inspection, two old SP PNGs showed decoder instability; one was
also visibly noisy/broken. This is an incident observation about the old
end-to-end path, not evidence that Drive itself caused the damage.

The central lesson is:

> "present in Git" and "came from Figma" are not sufficient acceptance criteria.

## Reports and provenance

Every non-trivial raster refresh should leave machine-readable evidence when
practical.

Recommended report fields:

- export timestamp
- source method
- Figma file key
- format / scale
- asset count
- slot / viewport / node ID / path
- dimensions
- new byte size
- previous byte size, when available
- new SHA-256
- previous SHA-256, when available
- encoded-byte match
- normalized pixel hash / match, when available
- visual QA classification for pixel differences
- transport flags
- canonical branch / backup ref

Never persist:

- Figma access tokens
- short-lived Figma render URLs
- auth headers
- cookies
- secrets
- giant base64 payloads used only for transport

## Runtime QA gate

After canonical replacement, verify the actual consuming implementation.

At minimum check:

- expected image count
- no unresolved dummy fallback
- no missing assets
- correct PC source at desktop viewport
- correct SP source at mobile viewport
- no accidental PC/SP crossover
- correct aspect ratio
- no unintended crop or stretch
- no horizontal overflow
- critical sections visually match Figma

If pixel comparison class is C, runtime QA plus live-Figma visual QA is required.

## Git promotion gate

Before committing:

- working tree state understood
- only intended raster/report/script/doc changes staged
- no secret or temporary URL included
- asset validator passes
- runtime/site checks pass
- backup or rollback ref exists when replacing a substantial asset set

After pushing:

- confirm the branch head actually contains the intended blobs
- re-read the PR / branch state
- wait for required CI
- investigate red checks; do not report completion merely because push succeeded

## Failure handling

Hard failures include:

- missing expected asset
- duplicate or wrong node mapping
- PC/SP mismatch
- format signature / container failure
- dimension mismatch
- decoder failure
- visual mismatch with live Figma
- unresolved dummy asset
- secret or temporary URL leakage

On a hard failure:

1. do not partially promote the new set
2. preserve the prior canonical assets
3. record the failing slot/node/path
4. fix or re-export only after the cause is understood
5. rerun the complete inventory gate

## Decision discipline

1. Prefer the shortest path that preserves fidelity and gives local validation.
2. Do not introduce Drive/bridge/base64 hops when a local agent can write the
   files directly.
3. Do not replace a proven local path with a more complex transport without a
   measurable benefit.
4. A new transport idea should be tested on one representative asset first.
5. Keep the current working path available until the new path passes equivalent
   validation.
6. Separate transport success from asset correctness.
7. Separate byte identity from pixel identity.
8. Separate pixel identity from visual acceptance.
9. A backup is rollback evidence, not proof that its images are correct.
10. Do not delete a backup until the replacement has passed validation, runtime
    QA, Git push, and CI.

## Completion definition

A Figma raster refresh is complete only when all applicable items are true:

- exact inventory exported
- final visible Figma nodes used
- structural format validation passed
- decoding passed
- dimensions and registry mapping passed
- prior assets compared when relevant
- all pixel differences classified
- live-Figma visual QA completed for pixel differences
- canonical files replaced atomically
- runtime PC/SP QA passed
- report/provenance written
- Git commit and push completed
- required CI is green

Anything earlier is an intermediate state.
