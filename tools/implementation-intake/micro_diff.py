#!/usr/bin/env python3
"""Learn from visual pixel differences without creating blind repair thrash.

The module keeps the original 1-4px micro-difference contract, but it also
classifies larger deltas and relative impact so a 5px difference on a 20px
control is not treated like a 5px difference on a 1000px section.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

MICRO_MIN_PX = 1.0
MICRO_MAX_PX = 4.0
SMALL_MATERIAL_MAX_PX = 8.0
MATERIAL_MAX_PX = 16.0

SEVERITY_ORDER = {
    "subpixel": 0,
    "micro": 1,
    "small-material": 2,
    "material": 3,
    "major": 4,
}

RELATIVE_BANDS = {
    "micro": 2.0,
    "small-material": 5.0,
    "material": 10.0,
    "major": 25.0,
}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def save(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        match = re.fullmatch(r"\s*(-?\d+(?:\.\d+)?)px\s*", value)
        if match:
            return float(match.group(1))
    return None


def _absolute_kind(magnitude: float) -> str:
    if magnitude < MICRO_MIN_PX:
        return "subpixel"
    if magnitude <= MICRO_MAX_PX:
        return "micro"
    if magnitude <= SMALL_MATERIAL_MAX_PX:
        return "small-material"
    if magnitude <= MATERIAL_MAX_PX:
        return "material"
    return "major"


def _relative_kind(relative_percent: float | None) -> str | None:
    if relative_percent is None or relative_percent < RELATIVE_BANDS["micro"]:
        return None
    if relative_percent < RELATIVE_BANDS["small-material"]:
        return "micro"
    if relative_percent < RELATIVE_BANDS["material"]:
        return "small-material"
    if relative_percent < RELATIVE_BANDS["major"]:
        return "material"
    return "major"


def _max_kind(*kinds: str | None) -> str:
    present = [kind for kind in kinds if kind in SEVERITY_ORDER]
    return max(present, key=lambda kind: SEVERITY_ORDER[kind]) if present else "subpixel"


def classify_delta(delta_px: float, reference_px: float | None = None) -> dict[str, Any]:
    magnitude = abs(float(delta_px))
    absolute_kind = _absolute_kind(magnitude)
    reference = abs(float(reference_px)) if isinstance(reference_px, (int, float)) and reference_px else None
    relative_percent = round(magnitude / reference * 100.0, 3) if reference else None
    relative_kind = _relative_kind(relative_percent)
    impact_kind = _max_kind(absolute_kind, relative_kind)
    direction = "positive" if delta_px > 0 else "negative" if delta_px < 0 else "zero"
    relative_escalated = SEVERITY_ORDER[impact_kind] > SEVERITY_ORDER[absolute_kind]
    return {
        # `kind` remains the absolute classification for backwards compatibility.
        "kind": absolute_kind,
        "absoluteKind": absolute_kind,
        "impactKind": impact_kind,
        "magnitudePx": round(magnitude, 3),
        "direction": direction,
        "referenceSizePx": round(reference, 3) if reference is not None else None,
        "relativePercent": relative_percent,
        "relativeKind": relative_kind,
        "relativeEscalated": relative_escalated,
        "microRangePx": [MICRO_MIN_PX, MICRO_MAX_PX],
    }


def _rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("reports", "sections"):
        rows = payload.get(key)
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]
    return [payload]


def _reference_size(diff: dict[str, Any]) -> float | None:
    explicit = _number(diff.get("referenceSizePx"))
    if explicit is not None and explicit != 0:
        return abs(explicit)

    prop = str(diff.get("property") or "")
    reference = _number(diff.get("reference"))
    if reference is None or reference == 0:
        return None

    relative_safe_properties = {
        "width", "height", "fontSize", "lineHeight", "letterSpacing",
        "gap", "rowGap", "columnGap",
        "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
        "marginTop", "marginRight", "marginBottom", "marginLeft",
    }
    if prop in relative_safe_properties or prop.endswith(".width") or prop.endswith(".height"):
        return abs(reference)
    return None


def _action_for(impact_kind: str, structural: bool, relative_escalation: bool) -> str:
    if structural:
        return "inspect-shared-root-cause-before-local-repair"
    if relative_escalation and impact_kind in {"material", "major"}:
        return "inspect-small-element-scale-or-rasterization-before-repair"
    if impact_kind == "major":
        return "diagnose-structure-before-value-edit"
    if impact_kind == "material":
        return "inspect-cause-before-priority-repair"
    if impact_kind == "small-material":
        return "inspect-cause-then-repair"
    if impact_kind == "micro":
        return "record-before-local-repair"
    return "record-subpixel-and-check-rendering"


def learn_micro_diffs(payload: Any) -> dict[str, Any]:
    """Analyze all numeric pixel deltas while preserving micro-diff compatibility."""
    observations: list[dict[str, Any]] = []
    groups: dict[tuple[str, str, str, str], list[dict[str, Any]]] = defaultdict(list)

    for index, row in enumerate(_rows(payload)):
        diagnosis = row.get("diagnosis") if isinstance(row.get("diagnosis"), dict) else row
        section_id = str(row.get("id") or row.get("contractId") or f"row-{index}")
        viewport = row.get("viewport")
        if isinstance(viewport, dict):
            viewport_key = f'{viewport.get("width", "?")}x{viewport.get("height", "?")}'
        else:
            viewport_key = str(viewport or "unknown")
        outcome = str(row.get("repairOutcome") or diagnosis.get("repairOutcome") or "unknown")

        for diff in diagnosis.get("differences") or []:
            delta_px = diff.get("deltaPx")
            if not isinstance(delta_px, (int, float)):
                continue
            classification = classify_delta(float(delta_px), _reference_size(diff))
            observation = {
                "sectionId": section_id,
                "viewport": viewport_key,
                "category": str(diff.get("category") or "unknown"),
                "property": str(diff.get("property") or "unknown"),
                "deltaPx": round(float(delta_px), 3),
                "direction": classification["direction"],
                "magnitudePx": classification["magnitudePx"],
                "absoluteKind": classification["absoluteKind"],
                "impactKind": classification["impactKind"],
                "referenceSizePx": classification["referenceSizePx"],
                "relativePercent": classification["relativePercent"],
                "relativeKind": classification["relativeKind"],
                "relativeEscalated": classification["relativeEscalated"],
                "repairOutcome": outcome,
            }
            observations.append(observation)
            key = (
                observation["viewport"],
                observation["category"],
                observation["property"],
                observation["direction"],
            )
            groups[key].append(observation)

    grouped = []
    structural_count = 0
    for (viewport, category, prop, direction), items in sorted(groups.items()):
        section_ids = sorted({item["sectionId"] for item in items})
        structural = len(section_ids) >= 2
        if structural:
            structural_count += 1
        max_impact = _max_kind(*(item["impactKind"] for item in items))
        relative_escalation_count = sum(bool(item["relativeEscalated"]) for item in items)
        relative_values = [item["relativePercent"] for item in items if item["relativePercent"] is not None]
        grouped.append({
            "viewport": viewport,
            "category": category,
            "property": prop,
            "direction": direction,
            "occurrences": len(items),
            "uniqueSections": section_ids,
            "structuralCandidate": structural,
            "absoluteKinds": sorted({item["absoluteKind"] for item in items}, key=lambda k: SEVERITY_ORDER[k]),
            "impactKinds": sorted({item["impactKind"] for item in items}, key=lambda k: SEVERITY_ORDER[k]),
            "maxImpactKind": max_impact,
            "meanMagnitudePx": round(sum(item["magnitudePx"] for item in items) / len(items), 3),
            "maxRelativePercent": round(max(relative_values), 3) if relative_values else None,
            "relativeEscalationCount": relative_escalation_count,
            "repairOutcomes": {
                name: sum(item["repairOutcome"] == name for item in items)
                for name in ("accepted", "rejected", "no-change", "unknown")
            },
            "nextAction": _action_for(max_impact, structural, relative_escalation_count > 0),
        })

    isolated = sum(1 for group in grouped if not group["structuralCandidate"])
    absolute_counts = {kind: sum(item["absoluteKind"] == kind for item in observations) for kind in SEVERITY_ORDER}
    impact_counts = {kind: sum(item["impactKind"] == kind for item in observations) for kind in SEVERITY_ORDER}
    source = payload.get("source") if isinstance(payload, dict) and isinstance(payload.get("source"), dict) else None
    result = {
        "policy": {
            "absoluteBandsPx": {
                "subpixel": "<1",
                "micro": "1-4 inclusive",
                "small-material": ">4-8 inclusive",
                "material": ">8-16 inclusive",
                "major": ">16",
            },
            "relativeBandsPercent": {
                "micro": ">=2",
                "small-material": ">=5",
                "material": ">=10",
                "major": ">=25",
            },
            "microMinPx": MICRO_MIN_PX,
            "microMaxPx": MICRO_MAX_PX,
            "fourPxIncluded": True,
            "repeatedUniqueSectionsForStructuralCandidate": 2,
            "principle": "measure every pixel delta; use absolute size plus relative impact; repair the smallest correct root cause",
        },
        "summary": {
            "differenceCount": len(observations),
            "microDifferenceCount": absolute_counts["micro"],
            "materialOrLargerCount": absolute_counts["small-material"] + absolute_counts["material"] + absolute_counts["major"],
            "relativeEscalationCount": sum(bool(item["relativeEscalated"]) for item in observations),
            "absoluteSeverityCounts": absolute_counts,
            "impactSeverityCounts": impact_counts,
            "patternCount": len(grouped),
            "structuralCandidateCount": structural_count,
            "isolatedPatternCount": isolated,
        },
        "observations": observations,
        "patterns": grouped,
    }
    if source is not None:
        result["source"] = source
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze Fast Visual QA pixel differences for reusable learning.")
    parser.add_argument("report", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = learn_micro_diffs(load(args.report))
    if args.output:
        save(args.output, result)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
