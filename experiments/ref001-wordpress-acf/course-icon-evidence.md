# REF-001 Course pictogram evidence

Purpose: preserve what was learned while replacing the Course First Pass placeholder icon slots with exact Figma vectors.

## Exact persisted PC pictograms

| Course | PC Figma node | Asset | Source size |
|---|---|---|---|
| 公務員 | `21378:7722` | `public-service.svg` | 44×56 |
| 会計 | `21378:7683` | `accounting.svg` | 40×56 |
| ビジネス経営 | `21378:7655` | `business-management.svg` | 56×56 |
| 金融 | `21378:7623` | `finance.svg` | 52×56 |
| 教職 | `21378:7594` | `teaching.svg` | 56×38 |
| 学芸員 | `21378:7565` | `curator.svg` | 48×56 |
| IT | `21378:7533` | `it.svg` | 56×40 |

All seven were exported through Figma Plugin API `exportAsync({ format: 'SVG_STRING' })` and committed as self-contained SVGs. No expiring MCP asset URL is used.

## Responsive comparison

PC/SP `VectorNetwork` geometry was normalized by each vector node's width/height before comparison.

Six courses matched as the same normalized artwork with responsive resizing:

- 公務員
- 会計
- ビジネス経営
- 金融
- 教職
- IT

The supplied SP sizes are retained in CSS:

- 公務員 31×40
- 会計 30×40
- ビジネス経営 40×40
- 金融 39×40
- 教職 48×34
- IT 48×34

## Figma source anomaly — SP 学芸員

PC 学芸員 uses the curator pictogram (`21378:7565`).

SP 学芸員 (`21376:4561`) visibly uses the school/Teaching pictogram. Its icon frame is `21376:4587`, 48×34, and its normalized VectorNetwork does not match the PC Curator artwork. A screenshot inspection confirmed that the SP card really shows the school icon next to `学芸員コース`.

First Pass decision: **reproduce the supplied Figma state exactly**. The SP Curator card therefore uses `teaching.svg` and is marked `FIGMA_SOURCE_ANOMALY` in the template.

Do not silently “correct” this during immutable First Pass. During visual repair/final integration, decide whether source fidelity or semantic correction should win, and record that as an explicit repair rather than hiding the difference.

## Learning

Responsive asset handling should use evidence, not a blanket rule:

```text
same bitmap hash → share one source and change crop/layout
same normalized vector network → share one SVG and resize
changed vector network / visible source mismatch → preserve separate evidence and classify before repair
```
