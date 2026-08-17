#!/usr/bin/env python3
"""Read-only adapter from existing section manifests/runtime probes into Fast Visual QA."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import fast_visual_qa as fvq


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def section_probe_name(section_id: str) -> str:
    return "shared-cta" if section_id.startswith("shared-cta-") else section_id


def exact_probe(probes: list[dict[str, Any]], width: int) -> dict[str, Any]:
    matches = [probe for probe in probes if int(probe.get("width", -1)) == width]
    if len(matches) != 1:
        raise ValueError(f"expected exactly one runtime probe for reference width {width}, found {len(matches)}")
    return matches[0]


def runtime_health(probe: dict[str, Any]) -> dict[str, Any]:
    fonts = probe.get("primaryFonts") or {}
    clipping_count = len(probe.get("readableTextClipping") or [])
    overflow_count = len(probe.get("overflowElements") or [])
    image_failure_count = len(probe.get("imageFailures") or [])
    runtime_error_count = len(probe.get("runtimeErrors") or [])
    missing_fonts = sorted(name for name, loaded in fonts.items() if not loaded)
    issues: list[str] = []
    if float(probe.get("pageOverflowPx", 0) or 0) > 0:
        issues.append("page-overflow")
    if clipping_count:
        issues.append("readable-text-clipping")
    if overflow_count:
        issues.append("overflow-elements")
    if image_failure_count:
        issues.append("image-failures")
    if runtime_error_count:
        issues.append("runtime-errors")
    if missing_fonts:
        issues.append("missing-primary-fonts")
    return {
        "width": int(probe.get("width", 0)),
        "bodyHeight": probe.get("bodyHeight"),
        "pageOverflowPx": probe.get("pageOverflowPx", 0),
        "readableTextClippingCount": clipping_count,
        "overflowElementCount": overflow_count,
        "imageFailureCount": image_failure_count,
        "runtimeErrorCount": runtime_error_count,
        "missingPrimaryFonts": missing_fonts,
        "issues": issues,
        "pass": not issues,
    }


def probe_section(probe: dict[str, Any], section: dict[str, Any]) -> dict[str, Any]:
    name = section_probe_name(str(section["id"]))
    matches = [item for item in probe.get("sections", []) if item.get("name") == name]
    index = int(section.get("web_index", 0))
    if index >= len(matches):
        raise ValueError(f"missing runtime section {name}[{index}] for {section['id']}")
    return matches[index]


def classify_boundary_pattern(
    boundaries: list[dict[str, Any]],
    cumulative: dict[str, Any],
    *,
    tolerance_px: float = 1.0,
    plateau_tolerance_px: float = 1.5,
    min_shift_px: float = 4.0,
) -> dict[str, Any]:
    points = cumulative.get("points") or []
    if not points:
        return {"pattern": "insufficient-data", "rootCauseCandidate": None}
    drifts = [float(point["bottomDriftPx"]) for point in points]
    ids = [point.get("id") for point in points]
    active = [index for index, drift in enumerate(drifts) if abs(drift) > tolerance_px]
    if not active:
        return {"pattern": "aligned", "rootCauseCandidate": None}
    if cumulative.get("detected"):
        return {
            "pattern": "cumulative-growth",
            "rootCauseCandidate": ids[active[0]],
            "recommendedInspection": ["repeated-spacing", "section-height", "shared-vertical-rule"],
        }
    if len(active) == 1:
        index = active[0]
        return {
            "pattern": "isolated",
            "rootCauseCandidate": ids[index],
            "recommendedInspection": ["section-height", "local-spacing", "section-boundary"],
        }
    signs = {1 if drifts[index] > 0 else -1 for index in active}
    if len(active) == len(drifts):
        values = [drifts[index] for index in active]
        if len(signs) == 1 and max(values) - min(values) <= plateau_tolerance_px and abs(sum(values) / len(values)) >= min_shift_px:
            return {
                "pattern": "constant-offset",
                "rootCauseCandidate": "page-or-shared-root",
                "shiftPx": round(sum(values) / len(values), 3),
                "recommendedInspection": ["page-offset", "shared-wrapper", "coordinate-normalization"],
            }
    first = active[0]
    if first > 0 and len(drifts) - first >= 2 and all(abs(drifts[index]) <= tolerance_px for index in range(first)):
        tail = drifts[first:]
        tail_signs = {1 if drift > 0 else -1 for drift in tail if abs(drift) > tolerance_px}
        if (
            len(tail_signs) == 1
            and all(abs(drift) > tolerance_px for drift in tail)
            and max(tail) - min(tail) <= plateau_tolerance_px
            and abs(sum(tail) / len(tail)) >= min_shift_px
        ):
            return {
                "pattern": "step-shift",
                "rootCauseCandidate": ids[first],
                "shiftPx": round(sum(tail) / len(tail), 3),
                "recommendedInspection": ["first-divergent-section", "preceding-gap", "section-height"],
            }
    return {
        "pattern": "mixed",
        "rootCauseCandidate": ids[active[0]],
        "recommendedInspection": ["structured-section-diffs", "shared-rule-if-repeated"],
    }


def boundary_route_detail(boundary_pattern: dict[str, Any]) -> dict[str, Any]:
    """Translate boundary-pattern evidence into a stable, machine-readable repair target."""
    pattern = str(boundary_pattern.get("pattern") or "insufficient-data")
    candidate = boundary_pattern.get("rootCauseCandidate")
    inspection = list(boundary_pattern.get("recommendedInspection") or [])
    mapping = {
        "aligned": ("none", "aligned", "high"),
        "cumulative-growth": ("shared-layout", "cumulative-spacing-or-height", "high"),
        "step-shift": ("section-boundary", "local-boundary-jump", "high"),
        "constant-offset": ("shared-layout", "page-or-coordinate-offset", "high"),
        "isolated": ("section-boundary", "local-section-boundary", "medium"),
        "mixed": ("section-or-shared", "mixed-boundary-drift", "low"),
        "insufficient-data": ("none", "insufficient-boundary-data", "low"),
    }
    scope, cause, confidence = mapping.get(pattern, ("section-or-shared", "unknown-boundary-pattern", "low"))
    return {
        "scope": scope,
        "cause": cause,
        "candidate": candidate,
        "confidence": confidence,
        "sourcePattern": pattern,
        "recommendedInspection": inspection,
    }


def reference_checkpoint(manifest: dict[str, Any], probes: list[dict[str, Any]], viewport_key: str) -> dict[str, Any]:
    viewport_key = viewport_key.lower()
    if viewport_key not in manifest.get("viewports", {}):
        raise ValueError(f"unknown viewport {viewport_key}")
    viewport = manifest["viewports"][viewport_key]
    width = int(viewport["width"])
    probe = exact_probe(probes, width)
    boundaries = []
    reports = []

    for section in manifest.get("sections", []):
        if section.get("id") == "full-page" or not section.get("web_selector"):
            continue
        geometry = (section.get("geometry") or {}).get(viewport_key)
        if not geometry:
            continue
        actual = probe_section(probe, section)
        reference_box = {
            "x": 0,
            "y": float(geometry["top"]),
            "width": width,
            "height": float(geometry["height"]),
        }
        actual_box = {
            "x": 0,
            "y": float(actual["top"]),
            "width": width,
            "height": float(actual["height"]),
        }
        diagnosis = fvq.diagnose_section({"box": reference_box}, {"box": actual_box})
        boundaries.append({
            "id": section["id"],
            "reference": {"top": geometry["top"], "height": geometry["height"]},
            "actual": {"top": actual["top"], "height": actual["height"]},
        })
        reports.append({
            "id": section["id"],
            "viewport": viewport_key.upper(),
            "diagnosis": diagnosis,
        })

    drift = fvq.detect_cumulative_drift(boundaries)
    boundary_pattern = classify_boundary_pattern(boundaries, drift)
    route = fvq.route_diagnosis(reports, drift)
    if boundary_pattern["pattern"] == "step-shift":
        route = {
            "actions": [{
                "scope": "section-boundary",
                "target": boundary_pattern["rootCauseCandidate"],
                "reason": "first divergent boundary creates a stable downstream shift",
            }]
        }
    elif boundary_pattern["pattern"] == "constant-offset":
        route = {
            "actions": [{
                "scope": "shared",
                "target": "page-or-shared-root-offset",
                "reason": "same vertical offset is present from the first measured boundary",
            }]
        }
    return {
        "viewport": viewport_key.upper(),
        "referenceWidth": width,
        "figmaDeviceChromePx": int(viewport.get("figma_device_chrome_px", 0) or 0),
        "geometryCoordinateSpace": "runtime-page",
        "referenceProbeHealth": runtime_health(probe),
        "boundaries": boundaries,
        "reports": reports,
        "cumulativeDrift": drift,
        "boundaryPattern": boundary_pattern,
        "route": route,
        "repairRouteDetail": boundary_route_detail(boundary_pattern),
    }


def adapt_manifest_probes(manifest: dict[str, Any], probes: list[dict[str, Any]]) -> dict[str, Any]:
    reference_widths = {int(v["width"]) for v in manifest.get("viewports", {}).values()}
    reference = {
        key.upper(): reference_checkpoint(manifest, probes, key)
        for key in manifest.get("viewports", {})
    }
    intermediate = [
        runtime_health(probe)
        for probe in probes
        if int(probe.get("width", -1)) not in reference_widths
    ]
    return {
        "schemaVersion": 1,
        "referenceId": manifest.get("reference_id"),
        "runId": manifest.get("run_id"),
        "referenceViewports": reference,
        "intermediateRuntime": intermediate,
        "allIntermediateRuntimeHealthy": all(item["pass"] for item in intermediate),
        "policy": {
            "referenceGeometryComparedOnlyAtAuthoredWidths": True,
            "intermediateWidthsAreRuntimeHealthOnly": True,
            "figmaDeviceChromeIsNormalizedByManifestGeometry": True,
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Adapt existing section manifest/runtime probes to Fast Visual QA")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("probes", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    payload = adapt_manifest_probes(load(args.manifest), load(args.probes))
    if args.output:
        fvq.save(args.output, payload)
    else:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
