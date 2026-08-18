#!/usr/bin/env python3
"""REF-001 Pages builder wrapper.

The implementation-heavy builder is pinned in build_human_review_site_base.py.
This wrapper adds one human-review policy: `/ref-001/final/preview/` is an
immutable approved snapshot and must never move merely because `/latest/`
changes during human polish.
"""
from __future__ import annotations

import shutil
from pathlib import Path

import build_human_review_site_base as base

REF001_FINAL_SNAPSHOT_REF = "58eecd2cdb105a1bbda7a0b14fc5e9ada19ecaeb"
_original_build_site = base.build_site


def build_site(*, manifest_path: Path = base.DEFAULT_MANIFEST, output: Path) -> Path:
    built = _original_build_site(manifest_path=manifest_path, output=output)

    final_preview = built / "ref-001" / "final" / "preview"
    if final_preview.exists():
        shutil.rmtree(final_preview)

    original_v2_ref = base.REF001_V2_SNAPSHOT_REF
    try:
        # The current Final uses the same proven V2-theme snapshot renderer, but
        # with the explicitly approved Final commit rather than the V2 compare ref.
        base.REF001_V2_SNAPSHOT_REF = REF001_FINAL_SNAPSHOT_REF
        base.build_v2_snapshot(final_preview)
    finally:
        base.REF001_V2_SNAPSHOT_REF = original_v2_ref

    base.write_snapshot_metadata(
        final_preview,
        label="REF-001 Final — human-approved frozen snapshot",
        ref=REF001_FINAL_SNAPSHOT_REF,
        source="Approved state before 2026-08-18 human polish",
        immutable=True,
    )
    return built


base.build_site = build_site

if __name__ == "__main__":
    raise SystemExit(base.main())
