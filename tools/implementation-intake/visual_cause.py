#!/usr/bin/env python3
"""Cause-oriented helpers for Figma fidelity diagnosis."""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

SEVERITY_ORDER = {
    "subpixel": 0,
    "micro": 1,
    "small-material": 2,
    "material": 3,
    "major": 4,
}

CSS_PROPERTY_WEIGHTS = {
    "x": {"transform": 8, "left": 6, "right": 6, "margin-left": 4, "margin-right": 4, "padding-left": 3, "padding-right": 3, "width": 2, "max-width": 2},
    "y": {"transform": 8, "top": 6, "bottom": 6, "margin-top": 4, "margin-bottom": 4, "padding-top": 3, "padding-bottom": 3, "line-height": 2},
    "width": {"width": 8, "min-width": 7, "max-width": 7, "transform": 6, "padding-left": 3, "padding-right": 3, "gap": 2, "column-gap": 2},
    "height": {"height": 8, "min-height": 7, "max-height": 7, "transform": 6, "padding-top": 3, "padding-bottom": 3, "line-height": 3, "gap": 2, "row-gap": 2},
    "bottom": {"height": 8, "min-height": 7, "max-height": 7, "transform": 6, "padding-top": 3, "padding-bottom": 3, "margin-top": 3, "margin-bottom": 3, "line-height": 3, "gap": 2, "row-gap": 2},
    "fontSize": {"font-size": 8, "line-height": 3},
    "lineHeight": {"line-height": 8, "font-size": 5, "font-family": 4, "font-weight": 3, "letter-spacing": 3},
    "letterSpacing": {"letter-spacing": 8, "font-family": 3},
    "objectFit": {"object-fit": 8, "width": 3, "height": 3},
    "objectPosition": {"object-position": 8},
}


def _float(value: Any) -> float | None:
    return float(value) if isinstance(value, (int, float)) else None


def _selector_specificity(selector: str) -> int:
    """Cheap ranking hint only; not a full CSS parser."""
    ids = len(re.findall(r"#[A-Za-z0-9_-]+", selector))
    classes = len(re.findall(r"\.[A-Za-z0-9_-]+|\[[^\]]+\]|:(?!:)[A-Za-z0-9_-]+", selector))
    elements = len(re.findall(r"(?:^|[\s>+~,(])([A-Za-z][A-Za-z0-9_-]*)", selector))
    return ids * 100 + classes * 10 + elements


def compare_render_bounds(layout_box: dict[str, Any], render_box: dict[str, Any] | None) -> dict[str, Any]:
    if not render_box:
        return {"available": False, "hasVisualOverflow": False, "overhangPx": None, "likelyCause": None}
    required = ("x", "y", "width", "height")
    if not all(isinstance(layout_box.get(k), (int, float)) and isinstance(render_box.get(k), (int, float)) for k in required):
        return {"available": False, "hasVisualOverflow": False, "overhangPx": None, "likelyCause": None}
    left = float(layout_box["x"]) - float(render_box["x"])
    top = float(layout_box["y"]) - float(render_box["y"])
    right = (float(render_box["x"]) + float(render_box["width"])) - (float(layout_box["x"]) + float(layout_box["width"]))
    bottom = (float(render_box["y"]) + float(render_box["height"])) - (float(layout_box["y"]) + float(layout_box["height"]))
    overhang = {k: round(max(0.0, v), 3) for k, v in {"left": left, "top": top, "right": right, "bottom": bottom}.items()}
    max_overhang = max(overhang.values())
    return {
        "available": True,
        "hasVisualOverflow": max_overhang >= 0.5,
        "overhangPx": overhang,
        "maxOverhangPx": round(max_overhang, 3),
        "likelyCause": "figma-render-effect-overflow" if max_overhang >= 0.5 else "layout-and-render-bounds-aligned",
        "inspect": ["shadow", "stroke", "blur", "effect-bounds"] if max_overhang >= 0.5 else [],
    }


def typography_fingerprint_diff(reference: dict[str, Any], actual: dict[str, Any]) -> dict[str, Any]:
    fields = ("fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing")
    changed = [field for field in fields if field in reference and field in actual and reference[field] != actual[field]]
    ref_lines = reference.get("lineRects") or []
    act_lines = actual.get("lineRects") or []
    line_count_delta = len(act_lines) - len(ref_lines) if ref_lines or act_lines else 0
    ref_glyph = reference.get("glyphMetrics") or {}
    act_glyph = actual.get("glyphMetrics") or {}
    metric_deltas: dict[str, float] = {}
    for key in ("width", "actualBoundingBoxLeft", "actualBoundingBoxRight", "actualBoundingBoxAscent", "actualBoundingBoxDescent"):
        rv = _float(ref_glyph.get(key))
        av = _float(act_glyph.get(key))
        if rv is not None and av is not None:
            delta = round(av - rv, 3)
            if abs(delta) >= 0.25:
                metric_deltas[key] = delta
    likely = []
    if "fontFamily" in changed or "fontWeight" in changed:
        likely.append("font-loading-or-font-selection")
    if "lineHeight" in changed or line_count_delta:
        likely.append("line-height-or-wrap")
    if "letterSpacing" in changed or "width" in metric_deltas:
        likely.append("glyph-advance-or-letter-spacing")
    if any(k.startswith("actualBoundingBox") for k in metric_deltas):
        likely.append("glyph-shape-metrics")
    return {
        "changedStyleFields": changed,
        "lineCountDelta": line_count_delta,
        "glyphMetricDeltas": metric_deltas,
        "likelyCauses": list(dict.fromkeys(likely)),
        "requiresTypographyInspection": bool(changed or line_count_delta or metric_deltas),
    }


def render_stability(samples: list[dict[str, Any]], tolerance_px: float = 0.25, required_consecutive: int = 3) -> dict[str, Any]:
    if len(samples) < required_consecutive:
        return {"stable": False, "reason": "insufficient-samples", "sampleCount": len(samples), "requiredConsecutive": required_consecutive}
    consecutive = 1
    max_delta = 0.0
    for previous, current in zip(samples, samples[1:]):
        deltas = []
        for key in ("x", "y", "width", "height"):
            pv, cv = _float(previous.get(key)), _float(current.get(key))
            if pv is not None and cv is not None:
                deltas.append(abs(cv - pv))
        step = max(deltas) if deltas else 0.0
        max_delta = max(max_delta, step)
        consecutive = consecutive + 1 if step <= tolerance_px else 1
    return {
        "stable": consecutive >= required_consecutive,
        "reason": "consecutive-stable-frames" if consecutive >= required_consecutive else "layout-still-moving",
        "sampleCount": len(samples),
        "requiredConsecutive": required_consecutive,
        "stableConsecutive": consecutive,
        "tolerancePx": tolerance_px,
        "maxObservedStepPx": round(max_delta, 3),
    }


def rank_css_root_causes(difference: dict[str, Any], matched_rules: list[dict[str, Any]]) -> dict[str, Any]:
    prop = str(difference.get("property") or "")
    category = str(difference.get("category") or "")
    weights = dict(CSS_PROPERTY_WEIGHTS.get(prop, {}))
    if category == "typography":
        weights.update({"font-family": max(weights.get("font-family", 0), 5), "font-size": max(weights.get("font-size", 0), 5), "font-weight": max(weights.get("font-weight", 0), 4), "line-height": max(weights.get("line-height", 0), 6), "letter-spacing": max(weights.get("letter-spacing", 0), 5)})
    if category == "spacing":
        weights.update({"gap": 6, "row-gap": 6, "column-gap": 6, "padding": 5, "margin": 5})
    ranked = []
    for rule in matched_rules:
        declarations = rule.get("declarations") or {}
        priorities = rule.get("priorities") or {}
        declaration_keys = {str(k).lower() for k in declarations}
        overlap = sorted(key for key in declaration_keys if key in weights)
        score = float(sum(weights[key] for key in overlap))
        selector = str(rule.get("selector") or "")
        if selector and difference.get("selector") and selector == difference.get("selector"):
            score += 4
        important = [key for key in overlap if str(priorities.get(key, "")).lower() == "important"]
        score += len(important) * 6
        if rule.get("inline"):
            score += 3
        if rule.get("inherited") and category == "typography":
            score += 2
        specificity = int(rule.get("specificity") or _selector_specificity(selector))
        score += min(2.0, specificity / 100.0)
        source_order = int(rule.get("sourceOrder") or 0)
        score += min(1.0, source_order / 1000.0)
        if score:
            ranked.append({
                "selector": selector,
                "href": rule.get("href"),
                "overlap": overlap,
                "important": important,
                "specificity": specificity,
                "sourceOrder": source_order,
                "score": round(score, 4),
                "declarations": {k: declarations[k] for k in declarations if str(k).lower() in overlap},
            })
    ranked.sort(key=lambda row: (-row["score"], -row["sourceOrder"], row.get("selector") or ""))
    return {
        "difference": {"category": category, "property": prop, "deltaPx": difference.get("deltaPx")},
        "candidateCount": len(ranked),
        "candidates": ranked[:8],
        "nextAction": "inspect-top-matched-css-rule" if ranked else "inspect-parent-or-layout-owner",
    }


def choose_counterfactual(baseline_ratio: float, candidates: list[dict[str, Any]], min_improvement: float = 0.001) -> dict[str, Any]:
    ranked = []
    for candidate in candidates:
        ratio = float(candidate.get("pixelDiffRatio", baseline_ratio))
        improvement = baseline_ratio - ratio
        runtime_pass = bool(candidate.get("runtimePass", True))
        localized = candidate.get("localizedDiffRatio")
        regression = bool(candidate.get("regression", False))
        accepted = runtime_pass and not regression and improvement >= min_improvement
        if accepted:
            reason = "improves-without-runtime-regression"
        elif not runtime_pass or regression:
            reason = "runtime-regression"
        elif improvement < -1e-6:
            reason = "visual-regression"
        elif abs(improvement) <= 1e-6:
            reason = "no-visual-gain"
        else:
            reason = "insufficient-visual-gain"
        ranked.append({
            **candidate,
            "improvement": round(improvement, 6),
            "accepted": accepted,
            "decisionReason": reason,
            "localizedDiffRatio": localized,
        })
    ranked.sort(key=lambda row: (not row["accepted"], -row["improvement"], float(row.get("pixelDiffRatio", baseline_ratio))))
    best = ranked[0] if ranked and ranked[0]["accepted"] else None
    return {
        "baselinePixelDiffRatio": baseline_ratio,
        "bestAccepted": best,
        "candidates": ranked,
        "principle": "measure temporary repairs before source edit; keep rejected candidates as learning evidence",
    }


def classify_multiscale(ratios: dict[str, float]) -> dict[str, Any]:
    one = float(ratios.get("1.0", ratios.get("1", 0.0)))
    half = float(ratios.get("0.5", one))
    quarter = float(ratios.get("0.25", half))
    retention_half = half / one if one > 0 else 0.0
    retention_quarter = quarter / one if one > 0 else 0.0
    if one == 0:
        kind = "aligned"
    elif retention_half <= 0.45 and retention_quarter <= 0.25:
        kind = "edge-rasterization-dominant"
    elif retention_half >= 0.70 and retention_quarter >= 0.50:
        kind = "structural-difference-persists"
    else:
        kind = "mixed-scale-difference"
    return {
        "kind": kind,
        "ratios": {k: round(float(v), 8) for k, v in ratios.items()},
        "retentionAtHalf": round(retention_half, 4),
        "retentionAtQuarter": round(retention_quarter, 4),
        "nextAction": {
            "aligned": "no-repair",
            "edge-rasterization-dominant": "inspect-aa-stroke-dpr-before-layout-edit",
            "structural-difference-persists": "inspect-layout-content-asset-structure",
            "mixed-scale-difference": "inspect-both-edge-and-structure",
        }[kind],
    }


def _asset_token(image: dict[str, Any]) -> str:
    if image.get("assetKey"):
        return str(image["assetKey"])
    src = str(image.get("src") or "")
    if not src:
        return ""
    return Path(urlparse(src).path).name


def _aspect(width: Any, height: Any) -> float | None:
    w, h = _float(width), _float(height)
    return (w / h) if w is not None and h not in (None, 0) else None


def asset_provenance_diff(reference_images: list[dict[str, Any]], actual_images: list[dict[str, Any]]) -> dict[str, Any]:
    items = []
    wrong_asset = 0
    crop_mismatch = 0
    intrinsic_mismatch = 0
    for index, (reference, actual) in enumerate(zip(reference_images, actual_images)):
        ref_token, act_token = _asset_token(reference), _asset_token(actual)
        asset_changed = bool(ref_token and act_token and ref_token != act_token)
        if asset_changed:
            wrong_asset += 1
        crop_changed = any(reference.get(key) != actual.get(key) for key in ("objectFit", "objectPosition") if key in reference and key in actual)
        if crop_changed:
            crop_mismatch += 1
        ref_aspect = _aspect(reference.get("naturalWidth"), reference.get("naturalHeight"))
        act_aspect = _aspect(actual.get("naturalWidth"), actual.get("naturalHeight"))
        intrinsic_changed = ref_aspect is not None and act_aspect is not None and abs(ref_aspect - act_aspect) > 0.01
        if intrinsic_changed:
            intrinsic_mismatch += 1
        if asset_changed or crop_changed or intrinsic_changed:
            items.append({
                "index": index,
                "referenceAsset": ref_token or None,
                "actualAsset": act_token or None,
                "wrongAsset": asset_changed,
                "cropMismatch": crop_changed,
                "intrinsicAspectMismatch": intrinsic_changed,
                "referenceAspect": round(ref_aspect, 4) if ref_aspect is not None else None,
                "actualAspect": round(act_aspect, 4) if act_aspect is not None else None,
            })
    count_delta = len(actual_images) - len(reference_images)
    if wrong_asset or count_delta:
        likely = "wrong-asset-or-slot-mapping"
    elif intrinsic_mismatch:
        likely = "asset-intrinsic-dimension-mismatch"
    elif crop_mismatch:
        likely = "wrong-crop-or-object-position"
    else:
        likely = "asset-provenance-aligned"
    return {
        "referenceCount": len(reference_images),
        "actualCount": len(actual_images),
        "countDelta": count_delta,
        "wrongAssetCount": wrong_asset,
        "cropMismatchCount": crop_mismatch,
        "intrinsicAspectMismatchCount": intrinsic_mismatch,
        "items": items,
        "likelyCause": likely,
    }


def classify_dpr_variance(ratios: dict[str, float], stable_delta: float = 0.01) -> dict[str, Any]:
    points = sorted((float(key), float(value)) for key, value in ratios.items())
    if len(points) < 2:
        return {"kind": "insufficient-dpr-evidence", "ratios": ratios}
    values = [value for _, value in points]
    spread = max(values) - min(values)
    first, last = values[0], values[-1]
    if spread <= stable_delta:
        kind = "dpr-stable"
    elif last >= first + max(stable_delta, 0.02):
        kind = "dpr-rasterization-sensitive"
    elif first >= 0.08 and last >= 0.08:
        kind = "persistent-non-dpr-difference"
    else:
        kind = "mixed-dpr-behavior"
    return {
        "kind": kind,
        "ratios": {str(key): round(value, 8) for key, value in points},
        "spread": round(spread, 8),
        "nextAction": {
            "dpr-stable": "do-not-blame-dpr-first",
            "dpr-rasterization-sensitive": "inspect-stroke-aa-svg-raster-scaling",
            "persistent-non-dpr-difference": "inspect-layout-content-asset-first",
            "mixed-dpr-behavior": "inspect-dpr-and-structure",
        }[kind],
    }


def semantic_region_diff(reference: list[dict[str, Any]], actual: list[dict[str, Any]]) -> dict[str, Any]:
    def counts(rows):
        result: dict[str, int] = {}
        for row in rows:
            kind = str(row.get("kind") or "unknown")
            result[kind] = result.get(kind, 0) + 1
        return result
    ref_counts, act_counts = counts(reference), counts(actual)
    kinds = sorted(set(ref_counts) | set(act_counts))
    deltas = {kind: act_counts.get(kind, 0) - ref_counts.get(kind, 0) for kind in kinds if act_counts.get(kind, 0) != ref_counts.get(kind, 0)}
    missing_important = {kind: delta for kind, delta in deltas.items() if kind in {"text", "image", "control", "vector"}}
    return {
        "referenceCounts": ref_counts,
        "actualCounts": act_counts,
        "countDeltas": deltas,
        "semanticStructureMismatch": bool(missing_important),
        "nextAction": "inspect-missing-extra-semantic-region" if missing_important else "semantic-counts-aligned",
    }


def calibrate_cause_predictions(records: list[dict[str, Any]]) -> dict[str, Any]:
    rows = []
    for record in records:
        confidence = max(0.0, min(float(record.get("confidence", 0.5)), 1.0))
        correct = str(record.get("predictedCause")) == str(record.get("actualCause"))
        rows.append({**record, "confidence": confidence, "correct": correct, "brier": (confidence - (1.0 if correct else 0.0)) ** 2})
    if not rows:
        return {"count": 0, "hitRate": None, "meanConfidence": None, "brierScore": None, "calibrationGap": None}
    hit_rate = sum(row["correct"] for row in rows) / len(rows)
    mean_confidence = sum(row["confidence"] for row in rows) / len(rows)
    return {
        "count": len(rows),
        "hitRate": round(hit_rate, 4),
        "meanConfidence": round(mean_confidence, 4),
        "brierScore": round(sum(row["brier"] for row in rows) / len(rows), 4),
        "calibrationGap": round(abs(mean_confidence - hit_rate), 4),
        "records": rows,
        "principle": "measure whether cause confidence is earned; do not turn confidence into authority without outcome evidence",
    }


def rank_observation_candidates(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ranked = []
    for item in items:
        severity = item.get("severity", 0)
        if isinstance(severity, str):
            severity_norm = SEVERITY_ORDER.get(severity, 0) / max(SEVERITY_ORDER.values())
        else:
            severity_norm = max(0.0, min(float(severity), 1.0))
        factors = {
            "uncertainty": max(0.0, min(float(item.get("uncertainty", 0)), 1.0)),
            "severity": severity_norm,
            "sharedPatternPotential": max(0.0, min(float(item.get("sharedPatternPotential", 0)), 1.0)),
            "priorFailureRate": max(0.0, min(float(item.get("priorFailureRate", 0)), 1.0)),
            "lateDiscoveryRisk": max(0.0, min(float(item.get("lateDiscoveryRisk", 0)), 1.0)),
            "changed": 1.0 if item.get("changed") else 0.0,
        }
        raw_value = (
            factors["uncertainty"] * 1.2
            + factors["severity"]
            + factors["sharedPatternPotential"]
            + factors["priorFailureRate"] * 0.8
            + factors["lateDiscoveryRisk"] * 0.8
            + factors["changed"] * 0.6
        )
        cost = max(0.25, float(item.get("captureCost", 1.0)))
        score = raw_value / math.sqrt(cost)
        ranked.append({**item, "informationValueFactors": factors, "observationPriority": round(score, 4)})
    ranked.sort(key=lambda row: (-row["observationPriority"], str(row.get("id") or "")))
    return ranked


def _signature(row: dict[str, Any]) -> tuple:
    explicit = row.get("signature")
    if isinstance(explicit, (str, int, float, bool)):
        return (explicit,)
    if isinstance(explicit, dict):
        return tuple(sorted((str(k), json.dumps(v, sort_keys=True, ensure_ascii=False)) for k, v in explicit.items()))
    return tuple(
        (key, json.dumps(row.get(key), sort_keys=True, ensure_ascii=False))
        for key in ("composition", "columns", "visibleKeys", "assetKeys", "sectionHeights")
        if key in row
    )


def detect_breakpoint_topology(observations: list[dict[str, Any]]) -> dict[str, Any]:
    rows = sorted((row for row in observations if isinstance(row.get("width"), (int, float))), key=lambda row: float(row["width"]))
    if not rows:
        return {"states": [], "transitions": [], "candidateBreakpoints": []}
    states = []
    transitions = []
    start = rows[0]
    previous = rows[0]
    current_sig = _signature(rows[0])
    for row in rows[1:]:
        sig = _signature(row)
        if sig != current_sig:
            states.append({"minWidth": start["width"], "maxWidth": previous["width"], "signature": list(current_sig)})
            transitions.append({
                "between": [previous["width"], row["width"]],
                "fromSignature": list(current_sig),
                "toSignature": list(sig),
                "candidatePx": round((float(previous["width"]) + float(row["width"])) / 2, 3),
            })
            start = row
            current_sig = sig
        previous = row
    states.append({"minWidth": start["width"], "maxWidth": previous["width"], "signature": list(current_sig)})
    return {
        "states": states,
        "transitions": transitions,
        "candidateBreakpoints": [transition["candidatePx"] for transition in transitions],
        "principle": "infer responsive topology from observed composition changes, not a universal breakpoint constant",
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Cause-oriented Fast Visual QA helpers")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("breakpoints")
    p.add_argument("observations", type=Path)
    p = sub.add_parser("multiscale")
    p.add_argument("ratios", type=Path)
    args = parser.parse_args(argv)
    payload = json.loads(args.observations.read_text()) if args.command == "breakpoints" else json.loads(args.ratios.read_text())
    result = detect_breakpoint_topology(payload) if args.command == "breakpoints" else classify_multiscale(payload)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
