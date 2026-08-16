#!/usr/bin/env python3
"""Small, runtime-agnostic Figma fidelity fast-loop helpers."""
from __future__ import annotations

import argparse
import copy
import fnmatch
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from visual_cause import (
    choose_counterfactual,
    classify_multiscale,
    compare_render_bounds,
    rank_css_root_causes,
    typography_fingerprint_diff,
)

ROOT = Path(__file__).resolve().parents[2]
MODES = {"FAST", "CHECKPOINT", "FINAL"}
DEPTHS = {"QUICK", "STANDARD", "DEEP"}
RISK = {
    "absolutePositioning": 1,
    "mask": 1.5,
    "imageComposition": 1,
    "overlap": 1,
    "specialTypography": .75,
    "pcSpStructureGap": 1.5,
    "slider": 1.5,
    "interaction": 1,
    "rasterVectorMix": .75,
    "unusualCrop": 1,
    "responsiveAmbiguity": 1.5,
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save(path: Path, value: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(value: Any):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def validate_contract(c: dict[str, Any]) -> list[str]:
    e = []
    f = c.get("figma") or {}
    i = c.get("implementation") or {}
    v = c.get("viewport") or {}
    r = c.get("reference") or {}
    for ok, msg in [
        (c.get("id"), "id is required"),
        (f.get("fileKey"), "figma.fileKey is required"),
        (f.get("nodeId"), "figma.nodeId is required"),
        (i.get("url"), "implementation.url is required"),
        (i.get("selector"), "implementation.selector is required"),
        (isinstance(v.get("width"), int) and v.get("width", 0) > 0, "viewport.width must be a positive integer"),
        (isinstance(v.get("height"), int) and v.get("height", 0) > 0, "viewport.height must be a positive integer"),
        (r.get("image"), "reference.image is required"),
        (r.get("measurement"), "reference.measurement is required"),
    ]:
        if not ok:
            e.append(msg)
    if str(c.get("mode", "FAST")).upper() not in MODES:
        e.append("mode must be FAST/CHECKPOINT/FINAL")
    if c.get("qaDepth") and str(c["qaDepth"]).upper() not in DEPTHS:
        e.append("qaDepth must be QUICK/STANDARD/DEEP")
    return e


def estimate_visual_risk(signals: dict[str, Any]) -> dict[str, Any]:
    score = 0.0
    reasons = []
    for key, weight in RISK.items():
        raw = signals.get(key, 0)
        amount = (1.0 if raw else 0.0) if isinstance(raw, bool) else max(0.0, min(float(raw), 3.0)) if isinstance(raw, (int, float)) else 0.0
        if amount:
            score += weight * amount
            reasons.append(key)
    score = round(min(score, 10), 2)
    fragile = sum(bool(signals.get(k)) for k in ("mask", "slider", "pcSpStructureGap", "responsiveAmbiguity"))
    depth = "QUICK" if score < 2.25 else "DEEP" if score >= 6 and fragile >= 2 else "STANDARD"
    return {"score": score, "recommendedDepth": depth, "reasons": reasons}


def choose_qa_depth(c: dict[str, Any]):
    risk = estimate_visual_risk(((c.get("risk") or {}).get("signals") or {}))
    explicit = c.get("qaDepth")
    return {**risk, "depth": str(explicit).upper() if explicit else risk["recommendedDepth"], "source": "explicit" if explicit else "risk-estimate"}


def style_diffs(reference: dict, actual: dict, keys: tuple[str, ...], category: str):
    return [
        {"category": category, "property": key, "reference": reference[key], "actual": actual[key]}
        for key in keys
        if key in reference and key in actual and reference[key] != actual[key]
    ]


def delta(reference, actual):
    return round(float(actual) - float(reference), 3) if isinstance(reference, (int, float)) and isinstance(actual, (int, float)) else None


def diagnose_section(reference: dict[str, Any], actual: dict[str, Any], pixel_ratio: float | None = None):
    diffs = []
    rb = reference.get("box") or {}
    ab = actual.get("box") or {}
    for key, category in (("x", "position"), ("y", "position"), ("width", "size"), ("height", "section-boundary")):
        d = delta(rb.get(key), ab.get(key))
        if d is not None and abs(d) >= .5:
            diffs.append({"category": category, "property": key, "deltaPx": d, "reference": rb.get(key), "actual": ab.get(key)})
    if all(k in rb and k in ab for k in ("y", "height")):
        d = round((ab["y"] + ab["height"]) - (rb["y"] + rb["height"]), 3)
        if abs(d) >= .5:
            diffs.append({"category": "section-boundary", "property": "bottom", "deltaPx": d})

    rs = reference.get("style") or {}
    aas = actual.get("style") or {}
    diffs += style_diffs(rs, aas, ("fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"), "typography")
    diffs += style_diffs(
        rs,
        aas,
        ("gap", "rowGap", "columnGap", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"),
        "spacing",
    )
    diffs += style_diffs(rs, aas, ("color",), "color")
    diffs += style_diffs(rs, aas, ("backgroundColor", "backgroundImage"), "background")
    if "text" in reference and "text" in actual and reference["text"] != actual["text"]:
        diffs.append({"category": "text", "property": "content", "reference": reference["text"], "actual": actual["text"]})

    ri = reference.get("images") or []
    ai = actual.get("images") or []
    for index, (rimg, aimg) in enumerate(zip(ri, ai)):
        for key in ("x", "y", "width", "height"):
            d = delta((rimg.get("box") or {}).get(key), (aimg.get("box") or {}).get(key))
            if d is not None and abs(d) >= .5:
                diffs.append({"category": "image-bounds", "property": f"image[{index}].{key}", "deltaPx": d})
        for key in ("objectFit", "objectPosition"):
            if key in rimg and key in aimg and rimg[key] != aimg[key]:
                diffs.append({"category": "image-crop", "property": f"image[{index}].{key}", "reference": rimg[key], "actual": aimg[key]})
    if len(ri) != len(ai):
        diffs.append({"category": "image-bounds", "property": "imageCount", "reference": len(ri), "actual": len(ai)})

    render_bounds = compare_render_bounds(rb, reference.get("renderBox"))
    typography = typography_fingerprint_diff(reference.get("typographyFingerprint") or rs, actual.get("typographyFingerprint") or aas)
    matched_rules = actual.get("matchedRules") or []
    css_candidates = [
        rank_css_root_causes(item, matched_rules)
        for item in diffs[:6]
        if item.get("category") in {"position", "size", "section-boundary", "spacing", "typography", "image-crop"}
    ]
    stability = actual.get("captureStability") or {}
    cause_hints = []
    if render_bounds.get("hasVisualOverflow"):
        cause_hints.append("render-effects-before-layout-offset")
    if typography.get("requiresTypographyInspection"):
        cause_hints.append("typography-fingerprint")
    if stability and not stability.get("stable", True):
        cause_hints.append("capture-before-layout-stable")
    if css_candidates:
        cause_hints.append("matched-css-owner-candidates")

    summary = []
    for item in diffs:
        if "deltaPx" in item:
            summary.append(f'{item["category"]}: {item["property"]} {"+" if item.get("deltaPx", 0) >= 0 else ""}{item["deltaPx"]}px')
        else:
            summary.append(f'{item["category"]}: {item["property"]} differs')
    if pixel_ratio is not None:
        summary.append(f"pixel-diff: {pixel_ratio * 100:.2f}%")
    return {
        "pixelDiffRatio": pixel_ratio,
        "categories": sorted({x["category"] for x in diffs}),
        "differences": diffs,
        "summary": summary[:12],
        "causeEvidence": {
            "figmaRenderBounds": render_bounds,
            "typography": typography,
            "captureStability": stability,
            "cssRootCandidates": css_candidates,
            "hints": cause_hints,
        },
    }


def detect_cumulative_drift(sections: list[dict[str, Any]]):
    pts = []
    for section in sections:
        reference = section.get("reference") or {}
        actual = section.get("actual") or {}
        if all(k in reference for k in ("top", "height")) and all(k in actual for k in ("top", "height")):
            pts.append({
                "id": section.get("id"),
                "bottomDriftPx": round((actual["top"] + actual["height"]) - (reference["top"] + reference["height"]), 3),
            })
    if len(pts) < 3:
        return {"detected": False, "reason": "need-at-least-3-section-boundaries", "points": pts}
    magnitudes = [abs(p["bottomDriftPx"]) for p in pts]
    increases = sum(b >= a + 1 for a, b in zip(magnitudes, magnitudes[1:]))
    growth = magnitudes[-1] - magnitudes[0]
    directions = {1 if p["bottomDriftPx"] > 0 else -1 for p in pts if p["bottomDriftPx"]}
    return {
        "detected": increases >= max(2, len(pts) - 2) and growth >= 4 and len(directions) <= 1,
        "netGrowthPx": round(growth, 3),
        "points": pts,
    }


def route_diagnosis(reports: list[dict[str, Any]], cumulative: dict | None = None):
    actions = []
    if cumulative and cumulative.get("detected"):
        actions.append({"scope": "shared", "target": "cumulative-spacing-height", "reason": "downstream section-boundary drift grows"})
    xs = []
    fonts = 0
    cats = {}
    local = []
    for row in reports:
        diagnosis = row.get("diagnosis") or row
        categories = set(diagnosis.get("categories") or [])
        viewport = str(row.get("viewport", "unknown")).upper()
        cats.setdefault(viewport, set()).update(categories)
        if categories:
            local.append(str(row.get("id", "unknown")))
        for item in diagnosis.get("differences") or []:
            if item.get("property") == "x" and isinstance(item.get("deltaPx"), (int, float)):
                xs.append(float(item["deltaPx"]))
            if item.get("category") == "typography":
                fonts += 1
    if len(xs) >= 2 and max(xs) - min(xs) <= 1 and abs(sum(xs) / len(xs)) >= 2:
        actions.append({"scope": "shared", "target": "container-or-common-horizontal-rule", "reason": "same horizontal shift appears across sections"})
    if fonts >= 2:
        actions.append({"scope": "shared", "target": "typography-root-token-font-loading", "reason": "typography differences repeat across sections"})
    if "PC" in cats and "SP" in cats:
        if cats["PC"] - cats["SP"]:
            actions.append({"scope": "desktop", "target": "desktop-rule", "reason": "PC-only difference categories"})
        if cats["SP"] - cats["PC"]:
            actions.append({"scope": "mobile", "target": "mobile-rule", "reason": "SP-only difference categories"})
    if not actions and local:
        actions.append({"scope": "section", "target": local[0], "reason": "difference is currently localized"})
    return {"actions": actions or [{"scope": "none", "target": "no-repair", "reason": "no actionable structured drift detected"}]}


def repair_stop(history: list[float], min_improvement=.002, window=2):
    if len(history) < window + 1:
        return {"stop": False, "reason": "insufficient-history"}
    improvements = [history[i - 1] - history[i] for i in range(len(history) - window, len(history))]
    stop = all(x < min_improvement for x in improvements)
    return {
        "stop": stop,
        "reason": "low-improvement-streak" if stop else "still-improving",
        "improvements": improvements,
        "next": ["shared-rule", "wrong-asset", "typography", "figma-interpretation"] if stop else [],
    }


class EvidenceCache:
    def __init__(self, path: Path):
        self.path = path
        self.data = load(path) if path.is_file() else {"version": 1, "entries": {}}

    def get(self, key, source_hash):
        entry = self.data.get("entries", {}).get(key)
        return entry.get("value") if entry and entry.get("sourceHash") == source_hash else None

    def put(self, key, source_hash, value):
        self.data.setdefault("entries", {})[key] = {"sourceHash": source_hash, "value": value}

    def save(self):
        save(self.path, self.data)


def reobservation_plan(items, cache, budget):
    reuse = []
    observe = []
    deferred = []
    for item in items:
        if cache.get(item["key"], item["sourceHash"]) is not None:
            reuse.append(item["key"])
        elif len(observe) < budget:
            observe.append(item["key"])
        else:
            deferred.append(item["key"])
    return {"reuse": reuse, "observe": observe, "deferred": deferred, "budget": budget}


def filter_context(paths, scope):
    include = scope.get("include") or ["**"]
    exclude = scope.get("exclude") or []
    protected = scope.get("protected") or []
    selected = []
    ignored = []
    blocked = []
    for path in paths:
        if any(fnmatch.fnmatch(path, pattern) for pattern in protected):
            blocked.append(path)
        elif not any(fnmatch.fnmatch(path, pattern) for pattern in include) or any(fnmatch.fnmatch(path, pattern) for pattern in exclude):
            ignored.append(path)
        else:
            selected.append(path)
    return {"selected": selected, "ignored": ignored, "protected": blocked}


def map_component(candidates, minimum_reuse=.82, minimum_adapt=.58):
    ranked = []
    for candidate in candidates:
        row = dict(candidate)
        row["score"] = round(float(candidate.get("visual", 0)) * .5 + float(candidate.get("semantic", 0)) * .25 + float(candidate.get("behavior", 0)) * .25, 4)
        ranked.append(row)
    ranked.sort(key=lambda row: row["score"], reverse=True)
    best = ranked[0] if ranked else None
    decision = (
        "new" if not best else
        "reuse" if best["score"] >= minimum_reuse and min(float(best.get("semantic", 0)), float(best.get("behavior", 0))) >= .7 else
        "adapt" if best["score"] >= minimum_adapt else
        "new"
    )
    return {"decision": decision, "best": best, "ranked": ranked[:5]}


def strategy_measurement(strategy, metrics):
    keys = {"implementationSeconds", "repairCount", "sectionCaptureCount", "fullCaptureCount", "finalVisualScore", "fullQaOnlyIssueCount", "regressionCount", "humanAdjustmentCount"}
    return {"strategy": strategy, "metrics": {key: metrics[key] for key in keys if key in metrics}}


def learning_feedback(value):
    return {
        "helpfulQa": value.get("helpfulQa", []),
        "wastedQa": value.get("wastedQa", []),
        "lateDiscoveries": value.get("lateDiscoveries", []),
        "reworkSections": value.get("reworkSections", []),
        "nextProject": {"increase": value.get("helpfulQa", []), "decrease": value.get("wastedQa", [])},
    }


def mode_plan(mode, depth):
    mode = mode.upper()
    depth = depth.upper()
    if mode == "FAST":
        return ["capture-section", "render-stability", "measure-geometry", "pixel-diff", "structured-diagnosis"] + (["typography-image-css-probes"] if depth in {"STANDARD", "DEEP"} else []) + (["declared-deep-probes"] if depth == "DEEP" else [])
    if mode == "CHECKPOINT":
        return ["capture-completed-block", "section-boundaries", "cumulative-drift", "multi-scale-diff", "shared-rule-router"]
    if mode == "FINAL":
        return ["pc-full-page", "sp-full-page", "structured-diagnosis", "multi-scale-diff", "responsive-runtime", "scoped-repair", "final-full-page"]
    raise ValueError(mode)


def _resolve_contract_path(contract_path: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else (contract_path.parent / path).resolve()


def _capture(contract_path: Path, out: Path):
    actual_img = out / "actual.png"
    actual_json = out / "actual.measurement.json"
    subprocess.run([
        "node",
        str(ROOT / "tools/implementation-intake/section_capture.mjs"),
        str(contract_path),
        str(actual_img),
        str(actual_json),
    ], check=True)
    return actual_img, actual_json


def _pixel_ratio(actual_img: Path, reference_img: Path, diff_img: Path, threshold: float) -> float:
    return float(subprocess.check_output([
        sys.executable,
        str(ROOT / "scripts/diff_png.py"),
        str(actual_img),
        str(reference_img),
        str(diff_img),
        str(threshold),
    ], text=True).strip())


def _multiscale(actual_img: Path, reference_img: Path, out: Path, threshold: float):
    raw_path = out / "multiscale.json"
    subprocess.run([
        sys.executable,
        str(ROOT / "tools/implementation-intake/multiscale_diff.py"),
        str(actual_img),
        str(reference_img),
        "--threshold",
        str(threshold),
        "--output",
        str(raw_path),
    ], check=True)
    raw = load(raw_path)
    return {**raw, "classification": classify_multiscale(raw["ratios"])}


def _counterfactuals(c: dict[str, Any], contract_path: Path, out: Path, reference_img: Path, threshold: float, baseline_ratio: float):
    measured = []
    for index, candidate in enumerate(c.get("repairCandidates") or []):
        if not candidate.get("css"):
            continue
        candidate_dir = out / "counterfactuals" / str(candidate.get("id") or index)
        candidate_dir.mkdir(parents=True, exist_ok=True)
        candidate_contract = copy.deepcopy(c)
        candidate_contract.setdefault("environment", {})["injectCss"] = str(candidate["css"])
        candidate_contract["repairCandidates"] = []
        candidate_contract_path = candidate_dir / "contract.json"
        save(candidate_contract_path, candidate_contract)
        image, measurement_path = _capture(candidate_contract_path, candidate_dir)
        ratio = _pixel_ratio(image, reference_img, candidate_dir / "diff.png", threshold)
        measurement = load(measurement_path)
        measured.append({
            "id": candidate.get("id") or f"candidate-{index}",
            "pixelDiffRatio": ratio,
            "runtimePass": bool((measurement.get("captureStability") or {}).get("stable", True)),
            "captureStability": measurement.get("captureStability"),
        })
    return choose_counterfactual(baseline_ratio, measured) if measured else None


def execute_contract(contract_path: Path, out: Path, skip_capture=False, skip_pixel=False):
    c = load(contract_path)
    errors = validate_contract(c)
    if errors:
        raise ValueError("; ".join(errors))
    out.mkdir(parents=True, exist_ok=True)
    actual_img = out / "actual.png"
    actual_json = out / "actual.measurement.json"
    if not skip_capture:
        actual_img, actual_json = _capture(contract_path, out)
    actual = load(actual_json)
    ref_json = _resolve_contract_path(contract_path, c["reference"]["measurement"])
    reference = load(ref_json)
    threshold = float(c.get("pixelThreshold", .14))
    ratio = None
    reference_img = _resolve_contract_path(contract_path, c["reference"]["image"])
    if not skip_pixel:
        ratio = _pixel_ratio(actual_img, reference_img, out / "diff.png", threshold)
    qa_depth = choose_qa_depth(c)
    mode = str(c.get("mode", "FAST")).upper()
    report = {
        "contractId": c["id"],
        "figma": c["figma"],
        "implementation": c["implementation"],
        "viewport": c["viewport"],
        "mode": mode,
        "qaDepth": qa_depth,
        "plan": mode_plan(mode, qa_depth["depth"]),
        "diagnosis": diagnose_section(reference, actual, ratio),
        "repairStop": repair_stop(c.get("repairHistory") or []),
        "environmentFingerprint": actual.get("environment") or {},
    }
    if ratio is not None and c.get("multiScaleDiff", mode in {"CHECKPOINT", "FINAL"}):
        report["multiScaleDiff"] = _multiscale(actual_img, reference_img, out, threshold)
    if ratio is not None and c.get("repairCandidates") and not skip_capture:
        report["counterfactualRepairs"] = _counterfactuals(c, contract_path, out, reference_img, threshold, ratio)
    save(out / "report.json", report)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description="Figma fidelity section QA fast loop")
    sub = parser.add_subparsers(dest="command", required=True)
    command = sub.add_parser("validate")
    command.add_argument("contract", type=Path)
    command = sub.add_parser("run")
    command.add_argument("contract", type=Path)
    command.add_argument("--output", type=Path, default=Path(".visual-qa/section"))
    command.add_argument("--skip-capture", action="store_true")
    command.add_argument("--skip-pixel", action="store_true")
    command = sub.add_parser("diagnose")
    command.add_argument("reference", type=Path)
    command.add_argument("actual", type=Path)
    command = sub.add_parser("drift")
    command.add_argument("sections", type=Path)
    command = sub.add_parser("aggregate")
    command.add_argument("checkpoint", type=Path)
    args = parser.parse_args(argv)
    if args.command == "validate":
        errors = validate_contract(load(args.contract))
        print(json.dumps({"valid": not errors, "errors": errors}, ensure_ascii=False, indent=2))
        return 1 if errors else 0
    if args.command == "run":
        print(json.dumps(execute_contract(args.contract.resolve(), args.output.resolve(), args.skip_capture, args.skip_pixel), ensure_ascii=False, indent=2))
        return 0
    if args.command == "diagnose":
        print(json.dumps(diagnose_section(load(args.reference), load(args.actual)), ensure_ascii=False, indent=2))
        return 0
    if args.command == "drift":
        print(json.dumps(detect_cumulative_drift(load(args.sections)), ensure_ascii=False, indent=2))
        return 0
    checkpoint = load(args.checkpoint)
    drift = detect_cumulative_drift(checkpoint.get("boundaries") or [])
    print(json.dumps({"cumulativeDrift": drift, "route": route_diagnosis(checkpoint.get("reports") or [], drift)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
