#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from visual_cause import (
    asset_provenance_diff,
    calibrate_cause_predictions,
    choose_counterfactual,
    classify_dpr_variance,
    classify_multiscale,
    compare_render_bounds,
    detect_breakpoint_topology,
    rank_css_root_causes,
    rank_observation_candidates,
    render_stability,
    semantic_region_diff,
    typography_fingerprint_diff,
)


def run_case(case):
    kind = case["kind"]
    if kind == "render-bounds":
        return compare_render_bounds(case["layoutBox"], case["renderBox"])["likelyCause"]
    if kind == "typography":
        result = typography_fingerprint_diff(case["reference"], case["actual"])
        return result["likelyCauses"][0] if result["likelyCauses"] else None
    if kind == "stability":
        return render_stability(case["samples"])["stable"]
    if kind == "css-root":
        result = rank_css_root_causes(case["difference"], case["rules"])
        return result["candidates"][0]["selector"] if result["candidates"] else None
    if kind == "css-root-property":
        result = rank_css_root_causes(case["difference"], case["rules"])
        top = result["candidates"][0] if result["candidates"] else None
        return top["overlap"][0] if top and top["overlap"] else None
    if kind == "counterfactual":
        result = choose_counterfactual(case["baseline"], case["candidates"])
        return result["bestAccepted"]["id"] if result["bestAccepted"] else None
    if kind == "multiscale":
        return classify_multiscale(case["ratios"])["kind"]
    if kind == "asset-provenance":
        return asset_provenance_diff(case["reference"], case["actual"])["likelyCause"]
    if kind == "dpr":
        return classify_dpr_variance(case["ratios"])["kind"]
    if kind == "semantic":
        return semantic_region_diff(case["reference"], case["actual"])["semanticStructureMismatch"]
    if kind == "calibration":
        return calibrate_cause_predictions(case["records"])["hitRate"]
    if kind == "observation-priority":
        ranked = rank_observation_candidates(case["items"])
        return ranked[0]["id"] if ranked else None
    if kind == "breakpoint":
        result = detect_breakpoint_topology(case["observations"])
        return result["transitions"][0]["between"] if result["transitions"] else None
    raise ValueError(f"unknown benchmark kind: {kind}")


def run_benchmark(payload):
    results = []
    passed = 0
    for case in payload.get("cases", []):
        actual = run_case(case)
        ok = actual == case.get("expect")
        passed += int(ok)
        results.append({
            "id": case["id"],
            "kind": case["kind"],
            "expected": case.get("expect"),
            "actual": actual,
            "pass": ok,
        })
    total = len(results)
    return {
        "schemaVersion": 1,
        "summary": {
            "passed": passed,
            "failed": total - passed,
            "total": total,
            "passRate": round(passed / total, 4) if total else 1.0,
        },
        "results": results,
    }


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("fixture", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    result = run_benchmark(json.loads(args.fixture.read_text(encoding="utf-8")))
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 1 if result["summary"]["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
