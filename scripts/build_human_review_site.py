#!/usr/bin/env python3
"""REF-001 Pages builder with frozen Final policy.

`/ref-001/latest/` is the active human-review target. `/ref-001/final/` is
rebuilt from an explicitly approved immutable commit and therefore does not move
just because latest receives another polish round.
"""
from __future__ import annotations

import shutil
from pathlib import Path

import build_human_review_site_base as base

# Preserve the original module API for tests/scripts that import helper functions
# from build_human_review_site rather than executing the CLI.
for _name in dir(base):
    if not _name.startswith('_') and _name not in globals():
        globals()[_name] = getattr(base, _name)

REF001_FINAL_SNAPSHOT_REF = "58eecd2cdb105a1bbda7a0b14fc5e9ada19ecaeb"
_original_build_site = base.build_site


def build_site(*, manifest_path: Path = base.DEFAULT_MANIFEST, output: Path) -> Path:
    built = _original_build_site(manifest_path=manifest_path, output=output)

    final_preview = built / "ref-001" / "final" / "preview"
    if final_preview.exists():
        shutil.rmtree(final_preview)

    original_v2_ref = base.REF001_V2_SNAPSHOT_REF
    try:
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


# base.main() resolves base.build_site dynamically, so CLI and imported calls use
# the exact same frozen-Final policy.
base.build_site = build_site

if __name__ == "__main__":
    raise SystemExit(base.main())
