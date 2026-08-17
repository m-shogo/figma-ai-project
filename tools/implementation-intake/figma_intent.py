#!/usr/bin/env python3
"""Translate observed Figma layout/token metadata into implementation intent, not CSS copies."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def _value(node: dict[str, Any], *names: str):
    for name in names:
        if name in node:
            return node[name]
    return None


def infer_layout_intent(node: dict[str, Any]) -> dict[str, Any]:
    layout_mode = str(_value(node, "layoutMode", "layout_mode") or "NONE").upper()
    horizontal = str(_value(node, "layoutSizingHorizontal", "layout_sizing_horizontal") or "UNKNOWN").upper()
    vertical = str(_value(node, "layoutSizingVertical", "layout_sizing_vertical") or "UNKNOWN").upper()
    primary = str(_value(node, "primaryAxisSizingMode", "primary_axis_sizing_mode") or "UNKNOWN").upper()
    counter = str(_value(node, "counterAxisSizingMode", "counter_axis_sizing_mode") or "UNKNOWN").upper()
    min_width = _value(node, "minWidth", "min_width")
    max_width = _value(node, "maxWidth", "max_width")
    min_height = _value(node, "minHeight", "min_height")
    max_height = _value(node, "maxHeight", "max_height")
    gap = _value(node, "itemSpacing", "item_spacing")
    wrap = str(_value(node, "layoutWrap", "layout_wrap") or "NO_WRAP").upper()

    evidence = {
        "layoutMode": layout_mode,
        "layoutSizingHorizontal": horizontal,
        "layoutSizingVertical": vertical,
        "primaryAxisSizingMode": primary,
        "counterAxisSizingMode": counter,
        "layoutWrap": wrap,
        "itemSpacing": gap,
        "minWidth": min_width,
        "maxWidth": max_width,
        "minHeight": min_height,
        "maxHeight": max_height,
    }
    hypotheses = []
    if layout_mode in {"HORIZONTAL", "VERTICAL"}:
        hypotheses.append({
            "kind": "flow",
            "cssCandidate": "flex",
            "confidence": "observed",
            "reason": f"Figma layoutMode={layout_mode}",
        })
        if wrap == "WRAP":
            hypotheses.append({"kind": "wrapping", "cssCandidate": "flex-wrap", "confidence": "observed", "reason": "Figma Auto Layout wraps"})
    if horizontal == "FILL":
        hypotheses.append({"kind": "horizontal-sizing", "cssCandidate": "flex-grow-or-stretch", "confidence": "observed", "reason": "horizontal sizing is FILL"})
    elif horizontal == "HUG" or (layout_mode == "HORIZONTAL" and primary == "AUTO"):
        hypotheses.append({"kind": "horizontal-sizing", "cssCandidate": "content-intrinsic-width", "confidence": "observed", "reason": "horizontal sizing behaves as HUG/AUTO"})
    elif horizontal == "FIXED":
        hypotheses.append({"kind": "horizontal-sizing", "cssCandidate": "fixed-or-bounded-width", "confidence": "observed", "reason": "horizontal sizing is FIXED"})
    if vertical == "FILL":
        hypotheses.append({"kind": "vertical-sizing", "cssCandidate": "stretch-with-parent", "confidence": "observed", "reason": "vertical sizing is FILL"})
    elif vertical == "HUG" or (layout_mode == "VERTICAL" and primary == "AUTO"):
        hypotheses.append({"kind": "vertical-sizing", "cssCandidate": "content-driven-height", "confidence": "observed", "reason": "vertical sizing behaves as HUG/AUTO"})
    elif vertical == "FIXED":
        hypotheses.append({"kind": "vertical-sizing", "cssCandidate": "fixed-or-min-height-after-content-check", "confidence": "observed", "reason": "vertical sizing is FIXED"})
    if any(value is not None for value in (min_width, max_width, min_height, max_height)):
        hypotheses.append({"kind": "bounds", "cssCandidate": "min-max-constraints", "confidence": "observed", "reason": "Figma min/max constraints exist"})
    if gap is not None:
        hypotheses.append({"kind": "spacing", "cssCandidate": "gap-token-or-value", "confidence": "observed", "reason": "Figma itemSpacing exists"})

    unknown = layout_mode == "NONE" and all(value in {"UNKNOWN", ""} for value in (horizontal, vertical, primary, counter))
    return {
        "available": not unknown,
        "evidence": evidence,
        "implementationHypotheses": hypotheses,
        "guardrail": "implement observed layout intent; do not assume a fixed Figma frame dimension must become a fixed CSS dimension",
    }


def _flatten_bound_variables(value: Any, prefix: str = "") -> list[dict[str, str]]:
    rows = []
    if isinstance(value, dict):
        if "id" in value and isinstance(value["id"], str):
            rows.append({"property": prefix or "unknown", "variableId": value["id"]})
        else:
            for key, child in value.items():
                child_prefix = f"{prefix}.{key}" if prefix else str(key)
                rows.extend(_flatten_bound_variables(child, child_prefix))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            rows.extend(_flatten_bound_variables(child, f"{prefix}[{index}]"))
    return rows


def compare_variable_tokens(node: dict[str, Any], token_map: dict[str, Any]) -> dict[str, Any]:
    bound = _flatten_bound_variables(_value(node, "boundVariables", "bound_variables") or {})
    mapping = token_map.get("variables") if isinstance(token_map.get("variables"), dict) else token_map
    rows = []
    for item in bound:
        mapped = mapping.get(item["variableId"]) if isinstance(mapping, dict) else None
        rows.append({
            **item,
            "cssToken": mapped,
            "status": "mapped" if mapped else "unmapped",
        })
    return {
        "available": bool(bound),
        "boundVariableCount": len(bound),
        "mappedCount": sum(row["status"] == "mapped" for row in rows),
        "unmappedCount": sum(row["status"] == "unmapped" for row in rows),
        "bindings": rows,
        "nextAction": "reuse-observed-design-tokens" if bound and all(row["status"] == "mapped" for row in rows) else "observe-or-map-missing-tokens" if bound else "no-bound-variable-evidence",
        "guardrail": "absence of a mapped token is not permission to invent a global token",
    }


def analyze_figma_intent(node: dict[str, Any], token_map: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "layout": infer_layout_intent(node),
        "variables": compare_variable_tokens(node, token_map or {}),
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("node", type=Path)
    parser.add_argument("--token-map", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    node = json.loads(args.node.read_text(encoding="utf-8"))
    token_map = json.loads(args.token_map.read_text(encoding="utf-8")) if args.token_map else {}
    result = analyze_figma_intent(node, token_map)
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
