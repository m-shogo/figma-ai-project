# Figma Responsive Variable Mode Audit

Purpose: detect a class of responsive design corruption where a logical PC/SP root frame and its effective Figma Variable Mode disagree.

This check exists because frame geometry alone is not enough. A 1380px frame can still inherit an SP variable mode, causing only variable-bound descendants to switch to SP values while fixed-position descendants retain PC coordinates.

## Real failure that motivated this check

REF-001 (`chiba-keizai-sample`) exposed this sequence:

```text
AI Page: template = SP
  ↓ inheritance
PC Top@2x: width = 1380, no explicit template mode
  ↓
CTA root: width = 1380
  ├ fixed-position button groups keep PC coordinates
  └ variable-bound img/mask resolve content-width/contents--100% in SP mode
       ↓
       width = 375
```

The CTA instance had zero instance overrides. The component was not manually resized. The failure was variable mode inheritance.

After the PC top frame explicitly pinned `template = PC`, the CTA `img` and `mask` returned from 375px to 1380px without manual width repair.

Canonical evidence: `references/chiba-keizai-sample.variable-mode-audit.yaml`.

## Production rule

For a Figma page containing multiple responsive roots:

```text
Page
├ Desktop root → explicitly pin responsive collection to PC/Desktop mode
└ Mobile root  → explicitly pin responsive collection to SP/Mobile mode
```

The page itself may have a mode. Root pins take precedence and make each responsive subtree deterministic.

Do not repair the symptom by detaching variable bindings or hardcoding the expected width.

## Never infer viewport from width alone

A 375px child can be a legitimate desktop card/image/container. Therefore this is invalid:

```text
if node.width == 375:
    assume SP pollution
```

Viewport evidence precedence:

1. explicit reference/owner mapping (`expected_viewport`)
2. known root role from Reference Manifest
3. semantic root name (`PC`, `Desktop`, `SP`, `Mobile`, etc.)
4. geometry only as low-confidence supporting evidence

If semantic evidence conflicts with geometry, emit `AMBIGUOUS_VIEWPORT` and do not auto-mutate Figma.

## What the audit checks

For each responsive root:

- expected logical viewport
- explicit responsive mode pin
- effective/resolved responsive mode
- variable-bound descendants' effective mode
- same-page PC/SP isolation

Important failure codes:

- `RESPONSIVE_ROOT_MODE_NOT_PINNED`
- `ROOT_EXPLICIT_MODE_MISMATCH`
- `ROOT_RESOLVED_MODE_MISMATCH`
- `DESCENDANT_MODE_MISMATCH`
- `AMBIGUOUS_VIEWPORT`
- `LOW_CONFIDENCE_VIEWPORT`

Only errors block readiness. Ambiguous/width-only inference is warning-only because automatic mutation would be unsafe.

## Record format

```yaml
schema_version: 1
reference_id: REF-001
same_page_responsive: true
responsive_collection:
  id: VariableCollectionId:...
  name: template
  modes:
    desktop: { id: "3:0", name: PC }
    mobile: { id: "4003:0", name: SP }
page:
  node_id: "1:1"
  explicit_mode_id: "4003:0"
roots:
  - node_id: "2:1"
    role: desktop-page
    expected_viewport: desktop
    width: 1380
    explicit_mode_id: "3:0"
    resolved_mode_id: "3:0"
    descendants:
      - node_id: "2:2"
        name: mask
        width: 1380
        bound_to_responsive_collection: true
        resolved_mode_id: "3:0"
```

Records are named `*.variable-mode-audit.yaml` under `references/`, `experiments/`, or `contracts/`.

## Commands

Audit all repository records:

```bash
python scripts/audit_figma_variable_modes.py
```

Audit one captured record:

```bash
python scripts/audit_figma_variable_modes.py path/to/reference.variable-mode-audit.yaml
```

The same check is part of repository readiness and CI.

## Figma/MCP capture guidance

During Global Figma Capability Profile / reference reconnaissance, capture for each logical responsive root:

- `id`, `name`, `width`, `height`
- reference-derived role/expected viewport
- `explicitVariableModes`
- `resolvedVariableModes`
- responsive collection ID + PC/SP mode IDs

For descendants, do not dump the whole page indiscriminately. Target nodes that are variable-sensitive or visually suspicious and record:

- variable binding exists for the responsive collection
- resolved mode
- affected property/value (width, padding, gap, font size, etc.)

This stays consistent with Progressive Disclosure: root audit first, then targeted descendants only when the root or visual evidence is suspicious.

## Auto-fix policy

Detection can be automatic. Mutation must remain evidence-gated.

Safe auto-fix candidate:

- root has authoritative PC/SP mapping from frozen reference evidence
- responsive collection and expected mode ID are known
- no conflicting semantic/geometry evidence
- write permission exists

Otherwise produce a remediation plan rather than changing Figma.

A future Figma adapter may execute the remediation plan with the Plugin API, but the audit logic itself remains tool-independent and testable in CI.
