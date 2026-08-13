#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
MANIFEST = ROOT / "review-dashboard/manifests/ref001-run-2.json"
RUNTIME = ROOT / "experiments/ref001-blind-clean-20260812/evidence/final/latest/runtime-probes.json"
BASELINE_DIR = ROOT / "review-dashboard/baselines/ref001"
SECTION_DIR = SITE / "ref-001/latest/review/section-diffs"
REVIEW_DIR = SITE / "ref-001/latest/review"
WORKFLOW = ROOT / ".github/workflows/publish-human-review.yml"

EXPECTED_WIDTHS = [320, 360, 375, 390, 430, 767, 768, 769, 1024, 1200, 1380]
REQUIRED_LAYERS = [
    "full_page_reference",
    "section_local_diff",
    "approved_baseline",
    "runtime_health",
    "asset_integrity",
    "font_readiness",
    "human_review",
    "ci_evidence",
]

failures: list[str] = []
checks: dict[str, dict[str, object]] = {}


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def mark(name: str, passed: bool, detail: object) -> None:
    checks[name] = {"passed": bool(passed), "detail": detail}
    if not passed:
        failures.append(f"audit layer failed: {name}")


def read_json(path: Path):
    require(path.is_file(), f"missing JSON: {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        failures.append(f"invalid JSON {path}: {exc}")
        return None


manifest = read_json(MANIFEST) or {}
runtime = read_json(RUNTIME) or []
baseline = read_json(BASELINE_DIR / "baseline.json") or {}
section_report = read_json(SECTION_DIR / "report.json") or []

# 1. Full-page source-of-truth evidence.
viewports = manifest.get("viewports", {})
full_page_ok = True
for key in ("pc", "sp"):
    vp = viewports.get(key, {})
    web = ROOT / str(vp.get("web_capture_source", ""))
    figma = ROOT / str(vp.get("figma_capture_source", ""))
    full_page_ok &= web.is_file() and figma.is_file()
    require(web.is_file(), f"missing {key} Web full-page capture")
    require(figma.is_file(), f"missing {key} Figma full-page capture")
mark("full_page_reference", full_page_ok, {"viewports": ["pc", "sp"]})

# 2. Section-local evidence. Full Page is intentionally excluded.
sections = manifest.get("sections", [])
review_sections = [s for s in sections if s.get("id") != "full-page" and s.get("web_selector")]
expected_section_rows = len(review_sections) * 2
section_ok = len(section_report) == expected_section_rows and expected_section_rows > 0
seen = {(row.get("viewport", "").lower(), row.get("id")) for row in section_report}
for section in review_sections:
    for vp in ("pc", "sp"):
        sid = section.get("id")
        require((vp, sid) in seen, f"missing section report row: {vp}/{sid}")
        stem = f"{vp}-{sid}"
        for suffix in ("web.png", "figma.png", "diff.png"):
            file = SECTION_DIR / f"{stem}-{suffix}"
            section_ok &= file.is_file()
            require(file.is_file(), f"missing section evidence: {file.name}")
        geometry = section.get("geometry", {}).get(vp, {})
        require(int(geometry.get("height", 0)) > 0, f"missing section geometry: {vp}/{sid}")
        require(bool(section.get(f"figma_{vp}_node")), f"missing Figma node: {vp}/{sid}")
mark("section_local_diff", section_ok, {"sections": len(review_sections), "comparisons": expected_section_rows})

# 3. Human-approved regression baseline is explicit and immutable unless promoted.
baseline_ok = all((BASELINE_DIR / name).is_file() for name in ("baseline.json", "web-pc.png", "web-sp.png"))
require(bool(baseline), "baseline metadata missing")
mark("approved_baseline", baseline_ok, {"metadata": baseline})

# 4 + 5. Runtime health and font readiness across every required width.
by_width = {int(item.get("width", -1)): item for item in runtime if isinstance(item, dict)}
runtime_ok = sorted(by_width) == EXPECTED_WIDTHS
fonts_ok = True
for width in EXPECTED_WIDTHS:
    item = by_width.get(width)
    require(item is not None, f"missing runtime probe width {width}")
    if not item:
        runtime_ok = False
        fonts_ok = False
        continue
    overflow = int(item.get("pageOverflowPx", -1))
    image_failures = item.get("imageFailures", [])
    errors = item.get("runtimeErrors", [])
    runtime_ok &= overflow == 0 and len(image_failures) == 0 and len(errors) == 0
    require(overflow == 0, f"runtime overflow at {width}px: {overflow}px")
    require(len(image_failures) == 0, f"image failures at {width}px: {len(image_failures)}")
    require(len(errors) == 0, f"runtime errors at {width}px: {len(errors)}")
    fonts = item.get("primaryFonts", {})
    width_fonts_ok = bool(fonts.get("zenKakuGothicNew")) and bool(fonts.get("poppins"))
    fonts_ok &= width_fonts_ok
    require(width_fonts_ok, f"primary font readiness failed at {width}px")
mark("runtime_health", runtime_ok, {"widths": EXPECTED_WIDTHS, "overflow": 0, "imageFailures": 0, "runtimeErrors": 0})
mark("font_readiness", fonts_ok, {"required": ["Zen Kaku Gothic New", "Poppins"]})

# 6. Asset evidence and validators must stay part of the audit contract.
asset_registry = ROOT / "research/figma-assets/ref001/rendered-asset-registry.json"
pc_assets = list((ROOT / "experiments/ref001-blind-clean-20260812/implementation/theme/assets/images/ref001/rendered/pc").glob("*.webp"))
sp_assets = list((ROOT / "experiments/ref001-blind-clean-20260812/implementation/theme/assets/images/ref001/rendered/sp").glob("*.webp"))
asset_ok = asset_registry.is_file() and len(pc_assets) >= 16 and len(sp_assets) >= 16
require(asset_registry.is_file(), "rendered asset registry missing")
require(len(pc_assets) >= 16, f"PC rendered asset set incomplete: {len(pc_assets)}")
require(len(sp_assets) >= 16, f"SP rendered asset set incomplete: {len(sp_assets)}")
mark("asset_integrity", asset_ok, {"pcRendered": len(pc_assets), "spRendered": len(sp_assets)})

# 7. Human judgement is mandatory as a stage, but it may legitimately be pending.
human_status = str(manifest.get("human_review_status", "MISSING")).upper()
human_feedback_status = str(manifest.get("human_feedback_status", "MISSING")).upper()
human_layer_ok = human_status != "MISSING" and human_feedback_status != "MISSING" and (REVIEW_DIR / "index.html").is_file()
require(human_status != "MISSING", "human_review_status missing from manifest")
require(human_feedback_status != "MISSING", "human_feedback_status missing from manifest")
require((REVIEW_DIR / "index.html").is_file(), "Human Review UI missing")
mark("human_review", human_layer_ok, {"reviewStatus": human_status, "feedbackStatus": human_feedback_status, "machineMayApprove": False})

# 8. CI evidence must include the critical validators, browser review, artifacts, and Pages publication.
workflow_text = WORKFLOW.read_text(encoding="utf-8") if WORKFLOW.is_file() else ""
workflow_tokens = [
    "Validate incremental REF-001 asset wiring",
    "Build section-local visual diff report",
    "Validate generated review site",
    "Reject short-lived Figma asset locators",
    "Validate durable Figma asset manifests when present",
    "Reject transient Figma asset staging",
    "Browser smoke — PC, SP, sections, persistence, copy, mobile, visual diff, baseline regression",
    "Upload review backup artifact",
    "Deploy Human Review Dashboard",
]
ci_ok = all(token in workflow_text for token in workflow_tokens)
for token in workflow_tokens:
    require(token in workflow_text, f"CI audit step missing: {token}")
mark("ci_evidence", ci_ok, {"requiredSteps": workflow_tokens})

# Guarantee that every declared audit layer produced a check record.
for layer in REQUIRED_LAYERS:
    require(layer in checks, f"audit layer not evaluated: {layer}")

report = {
    "schemaVersion": 1,
    "referenceId": manifest.get("reference_id", "REF-001"),
    "status": "FAIL" if failures else "PASS",
    "humanReviewStatus": human_status,
    "policy": {
        "machineVisualDiffIsAdvisory": True,
        "humanFinalJudgementRequired": True,
        "doNotChaseRasterNoise": True,
    },
    "checks": checks,
    "failures": failures,
}

if SITE.exists():
    for target in (
        SITE / "ref-001/latest/review/audit-completeness.json",
        SITE / "ref-001/runs/run-2/review/audit-completeness.json",
    ):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print(json.dumps(report, ensure_ascii=False, indent=2))
if failures:
    raise SystemExit(1)
