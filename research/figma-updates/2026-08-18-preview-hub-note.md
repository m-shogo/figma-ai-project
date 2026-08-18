# Preview Hub

Date: 2026-08-18

The GitHub Pages root is the human-facing entry point for active comparison and review:

- `/ref-001/latest/preview/` — current human-review working version
- `/ref-001/final/preview/` — explicitly approved final snapshot
- `/ref-001/v2/preview/` — fixed V2 comparison snapshot
- `/ref-001/v3/preview/` — fixed protected V3 comparison snapshot
- `/ref-002/latest/preview/` — current Budokan QA snapshot

The root `/figma-ai-project/` page exposes all five as large labeled cards. `/ref-001/` exposes the same launcher context so reviewers do not need to memorize URLs.

Operational rule: update `latest` during human review; update `final` only after explicit completion approval. V2/V3 stay immutable comparison authorities.
