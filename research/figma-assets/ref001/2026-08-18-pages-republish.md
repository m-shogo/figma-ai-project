# REF-001 Pages republish

A small, non-runtime change used to force the GitHub Pages Human Review publish workflow after a REF-001 merge into `so` when a fresh public deployment must be confirmed.

Latest forced republish authority: PR #156 squash-merged as `28a475ce75982ab39fc4838f6621d7e79bedb513` on 2026-08-19.

Public deployment verification is enforced by `.github/workflows/ref001-public-pages-contract.yml`. The gate waits until `/ref-001/latest/review/manifest.json` reports the exact triggering `so` commit, then checks the CSS actually served from `/ref-001/latest/preview/`.

Runtime authority remains the current `so` implementation. This file does not change REF-001 visual or interaction behavior.
