#!/usr/bin/env python3
"""Aggregate cause-oriented evidence from two section measurements."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from visual_cause import asset_provenance_diff, semantic_region_diff


def build_cause_bundle(reference: dict[str, Any], actual: dict[str, Any]) -> dict[str, Any]:
    reference_regions = reference.get("semanticRegions")
    actual_regions = actual.get("semanticRegions")
    semantic = (
        semantic_region_diff(reference_regions, actual_regions)
        if isinstance(reference_regions, list) and isinstance(actual_regions, list)
        else {"available": False, "semanticStructureMismatch": False, "nextAction": "semantic-reference-unavailable"}
    )
    reference_images = reference.get("images")
    actual_images = actual.get("images")
    assets = (
        asset_provenance_diff(reference_images, actual_images)
        if isinstance(reference_images, list) and isinstance(actual_images, list)
        else {"available": False, "likelyCause": "asset-reference-unavailable"}
    )
    hints = []
    if semantic.get("semanticStructureMismatch"):
        hints.append("semantic-region-structure")
    if assets.get("likelyCause") and assets.get("likelyCause") not in {"asset-provenance-aligned", "asset-reference-unavailable"}:
        hints.append(assets["likelyCause"])
    return {
        "semanticRegions": semantic,
        "assetProvenance": assets,
        "hints": hints,
        "principle": "separate missing/extra semantic regions and wrong assets from pure geometry/crop repair",
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("reference", type=Path)
    parser.add_argument("actual", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    reference = json.loads(args.reference.read_text(encoding="utf-8"))
    actual = json.loads(args.actual.read_text(encoding="utf-8"))
    result = build_cause_bundle(reference, actual)
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
