#!/usr/bin/env python3
"""Guardrails for Figma visual-truth wrappers and durable asset readiness.

This module complements the Fast Loop Asset Materializer. It does not fetch
Figma assets and never treats an ephemeral URL as durable evidence.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

SHA256_RE = re.compile(r"^[a-f0-9]{64}$")
FIGMA_EPHEMERAL_MARKER = "/api/mcp/asset/"


def _close(a: float, b: float, tolerance: float) -> bool:
    return abs(float(a) - float(b)) <= tolerance


def diagnose_reference_wrapper(
    root_width: float,
    children: list[dict[str, Any]],
    *,
    tolerance: float = 0.01,
    minimum_full_width_ratio: float = 0.95,
    minimum_repeated_children: int = 2,
) -> dict[str, Any]:
    """Detect a parent-only horizontal gutter around repeated full-width children.

    Pass major section children rather than arbitrary descendants. A wrapper is
    classified only when repeated visible children share the same x/width and
    collectively cover almost all of the root width. This prevents a normal
    centered/narrow component from being misclassified as a Figma wrapper
    artifact.
    """
    root_width = float(root_width)
    if root_width <= 0:
        raise ValueError("root_width must be positive")

    rows: list[dict[str, float | str]] = []
    for index, child in enumerate(children):
        if child.get("visible", True) is False:
            continue
        width = float(child.get("width", 0))
        if width <= 0:
            continue
        rows.append(
            {
                "id": str(child.get("id") or f"child-{index + 1}"),
                "x": float(child.get("x", 0)),
                "width": width,
            }
        )

    if len(rows) < minimum_repeated_children:
        return {
            "kind": "insufficient-evidence",
            "normalizeReference": False,
            "mutateRuntime": False,
            "childCount": len(rows),
            "reason": "need-repeated-major-section-geometry",
        }

    first_x = float(rows[0]["x"])
    first_width = float(rows[0]["width"])
    repeated = all(
        _close(float(row["x"]), first_x, tolerance)
        and _close(float(row["width"]), first_width, tolerance)
        for row in rows[1:]
    )
    coverage = first_width / root_width
    left = first_x
    right = root_width - (first_x + first_width)
    extra = root_width - first_width

    inside_root = left >= -tolerance and right >= -tolerance
    nearly_full_width = coverage >= minimum_full_width_ratio
    has_wrapper_extra = extra > tolerance and (left > tolerance or right > tolerance)

    if repeated and inside_root and nearly_full_width and has_wrapper_extra:
        return {
            "kind": "wrapper-only-gutter",
            "normalizeReference": True,
            "mutateRuntime": False,
            "childCount": len(rows),
            "contentX": first_x,
            "contentWidth": first_width,
            "rootWidth": root_width,
            "leftGutter": max(0.0, left),
            "rightGutter": max(0.0, right),
            "wrapperExtra": extra,
            "coverageRatio": coverage,
            "comparisonCrop": {"x": first_x, "width": first_width},
            "runtimeTargetWidth": first_width,
            "confidence": "high" if len(rows) >= 3 else "medium",
            "nextAction": "normalize-reference-wrapper-before-diff-do-not-widen-runtime",
        }

    if repeated and _close(first_width, root_width, tolerance) and _close(first_x, 0.0, tolerance):
        return {
            "kind": "aligned",
            "normalizeReference": False,
            "mutateRuntime": False,
            "childCount": len(rows),
            "contentX": first_x,
            "contentWidth": first_width,
            "rootWidth": root_width,
            "leftGutter": 0.0,
            "rightGutter": 0.0,
            "wrapperExtra": 0.0,
            "coverageRatio": coverage,
            "runtimeTargetWidth": root_width,
            "nextAction": "compare-without-wrapper-normalization",
        }

    return {
        "kind": "mixed-or-content-inset",
        "normalizeReference": False,
        "mutateRuntime": False,
        "childCount": len(rows),
        "rootWidth": root_width,
        "coverageRatio": coverage,
        "reason": "do-not-infer-wrapper-from-nonrepeated-or-material-content-inset",
        "nextAction": "inspect-structure-before-layout-repair",
    }


def _safe_relative_path(value: str) -> Path | None:
    path = Path(value)
    if not value or path.is_absolute() or ".." in path.parts:
        return None
    return path


def durable_asset_state(record: dict[str, Any], output_root: Path) -> dict[str, Any]:
    """Require durable bytes + matching size/SHA before an asset becomes READY.

    A known ephemeral Figma URL is never readiness evidence. Missing durable
    bytes remain ASSET_PENDING; mismatched bytes are ASSET_CORRUPT.
    """
    serialized = json.dumps(record, ensure_ascii=False, sort_keys=True)
    if FIGMA_EPHEMERAL_MARKER in serialized:
        return {
            "state": "ASSET_INVALID_EPHEMERAL_METADATA",
            "ready": False,
            "reason": "ephemeral-figma-url-must-remain-runtime-only",
        }

    path_value = str(record.get("path") or "")
    digest = str(record.get("sha256") or "").lower()
    size = record.get("sizeBytes")
    rel = _safe_relative_path(path_value)

    missing_contract: list[str] = []
    if rel is None:
        missing_contract.append("path")
    if not SHA256_RE.fullmatch(digest):
        missing_contract.append("sha256")
    if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
        missing_contract.append("sizeBytes")
    if missing_contract:
        return {
            "state": "ASSET_PENDING",
            "ready": False,
            "reason": "durable-materialization-contract-incomplete",
            "missing": missing_contract,
        }

    root = output_root.resolve()
    candidate = (root / rel).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return {
            "state": "ASSET_PENDING",
            "ready": False,
            "reason": "durable-path-escapes-output-root",
        }

    if not candidate.is_file():
        return {
            "state": "ASSET_PENDING",
            "ready": False,
            "reason": "durable-bytes-not-present",
            "path": rel.as_posix(),
        }

    data = candidate.read_bytes()
    actual_digest = hashlib.sha256(data).hexdigest()
    actual_size = len(data)
    if actual_size != size or actual_digest != digest:
        return {
            "state": "ASSET_CORRUPT",
            "ready": False,
            "reason": "durable-bytes-do-not-match-record",
            "path": rel.as_posix(),
            "expected": {"sha256": digest, "sizeBytes": size},
            "actual": {"sha256": actual_digest, "sizeBytes": actual_size},
        }

    return {
        "state": "ASSET_READY",
        "ready": True,
        "reason": "durable-bytes-hash-and-size-verified",
        "path": rel.as_posix(),
        "sha256": digest,
        "sizeBytes": size,
    }
