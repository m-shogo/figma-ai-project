#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[3]
RUN_DIR = ROOT / "experiments/ref001-blind-clean-20260812"
RUN_PATH = RUN_DIR / "run.yaml"
RUNTIME_PATH = RUN_DIR / "evidence/final/latest/runtime-probes.json"
EDITABILITY_PATH = RUN_DIR / "evidence/human-editability-drills.json"
ACF_SOURCE = RUN_DIR / "implementation/acf-export.json"
ACF_EVIDENCE = RUN_DIR / "evidence/acf-export.json"
FINAL_MEASUREMENT = RUN_DIR / "evidence/final-measurement.yaml"

FINAL_CODE_COMMIT = "4974d36eb4775ce01d9ebde3d9dc8ca24aa9193f"
FINAL_CAPTURE_RUN_ID = 31525674545
FINAL_CAPTURE_STARTED_AT = "2026-08-12T04:00:38+09:00"
REQUIRED_WIDTHS = [320, 360, 375, 390, 430, 767, 768, 769, 1024, 1200, 1380]

EXPECTED_ENDPOINTS: dict[int, dict[str, Any]] = {
    375: {
        "body_height": 10777,
        "sections": [
            ("header", 0, 67),
            ("main-visual", 67, 724),
            ("reason", 847, 1295),
            ("education", 2198, 1534),
            ("shared-cta", 3732, 350),
            ("student-voice", 4138, 1758),
            ("messages", 5952, 538),
            ("shared-cta", 6546, 350),
            ("courses", 6896, 2515),
            ("links", 9467, 343),
            ("cta-value", 9866, 396),
            ("footer", 10262, 515),
        ],
    },
    1380: {
        "body_height": 7714,
        "sections": [
            ("header", 0, 94),
            ("main-visual", 94, 714),
            ("reason", 886, 559),
            ("education", 1541, 684),
            ("shared-cta", 2225, 328),
            ("student-voice", 2649, 1393),
            ("messages", 4225, 440),
            ("shared-cta", 4783, 328),
            ("courses", 5111, 1514),
            ("links", 6697, 260),
            ("cta-value", 7029, 328),
            ("footer", 7357, 357),
        ],
    },
}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"expected YAML object: {path}")
    return value


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def runtime_index() -> dict[int, dict[str, Any]]:
    raw = load_json(RUNTIME_PATH)
    if not isinstance(raw, list):
        raise ValueError("runtime-probes.json must be an array")
    result: dict[int, dict[str, Any]] = {}
    for entry in raw:
        if not isinstance(entry, dict) or not isinstance(entry.get("width"), int):
            raise ValueError("runtime probe entry missing integer width")
        result[int(entry["width"])] = entry
    if sorted(result) != REQUIRED_WIDTHS:
        raise ValueError(f"runtime widths mismatch: {sorted(result)}")
    return result


def assert_runtime(probes: dict[int, dict[str, Any]]) -> None:
    for width in REQUIRED_WIDTHS:
        probe = probes[width]
        if probe.get("pageOverflowPx") != 0:
            raise ValueError(f"{width}px horizontal overflow: {probe.get('pageOverflowPx')}")
        if probe.get("readableTextClipping"):
            raise ValueError(f"{width}px readable text clipping")
        fonts = probe.get("primaryFonts") or {}
        if fonts.get("zenKakuGothicNew") is not True or fonts.get("poppins") is not True:
            raise ValueError(f"{width}px primary font check failed")
        if probe.get("runtimeErrors"):
            raise ValueError(f"{width}px runtime errors: {probe.get('runtimeErrors')}")

    for width, expected in EXPECTED_ENDPOINTS.items():
        probe = probes[width]
        if probe.get("bodyHeight") != expected["body_height"]:
            raise ValueError(
                f"{width}px body height {probe.get('bodyHeight')} != {expected['body_height']}"
            )
        actual_sections = probe.get("sections") or []
        expected_sections = expected["sections"]
        if len(actual_sections) != len(expected_sections):
            raise ValueError(f"{width}px section count mismatch")
        for actual, (name, top, height) in zip(actual_sections, expected_sections):
            actual_triplet = (actual.get("name"), actual.get("top"), actual.get("height"))
            expected_triplet = (name, top, height)
            if actual_triplet != expected_triplet:
                raise ValueError(f"{width}px endpoint geometry mismatch: {actual_triplet} != {expected_triplet}")


def capture(capture_id: str, width: int, target_id: str, frame_id: str, path: str) -> dict[str, Any]:
    return {
        "capture_id": capture_id,
        "scope": "FULL_PAGE" if width in (375, 1380) else "BOUNDARY",
        "target_id": target_id,
        "frame_id": frame_id,
        "environment_profile_id": "github-actions-ubuntu-chromium-playwright-1x",
        "deterministic": True,
        "runtime": {
            "browser": "Chromium",
            "browser_version": "Playwright 1.54.2 bundled Chromium",
            "os": "Linux",
            "os_version": "GitHub-hosted-ubuntu",
            "engine": "Chromium",
            "webview": False,
            "viewport_width_css_px": width,
            "viewport_height_css_px": 900,
            "dpr": 1,
            "zoom": 1.0,
            "text_scale": 1.0,
            "orientation": "LANDSCAPE" if width == 1380 else "PORTRAIT",
        },
        "input_state": {
            "primary_hover": "HOVER",
            "primary_pointer": "FINE",
            "touch": False,
        },
        "preferences": {
            "reduced_motion": "NO_PREFERENCE",
            "forced_colors": "NONE",
            "contrast": "NO_PREFERENCE",
            "color_scheme": "LIGHT",
        },
        "path": path,
        "captured_at": FINAL_CAPTURE_STARTED_AT,
        "notes": [
            f"Final deterministic capture produced by GitHub Actions run {FINAL_CAPTURE_RUN_ID}.",
            "375px and 1380px are exact Figma acceptance endpoints; other widths are runtime-safety evidence.",
            "Photographic/composite media remains an explicit placeholder where persistent Figma source bytes could not be transferred safely.",
        ],
    }


def main() -> int:
    run = load_yaml(RUN_PATH)
    probes = runtime_index()
    assert_runtime(probes)

    editability = load_json(EDITABILITY_PATH)
    if not isinstance(editability, dict) or editability.get("all_pass") is not True:
        raise ValueError("Human Editability drill evidence must pass before finalization")
    drills = editability.get("drills")
    if not isinstance(drills, list) or len(drills) < 3:
        raise ValueError("expected at least three Human Editability drills")

    ACF_EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ACF_SOURCE, ACF_EVIDENCE)

    run["status"] = "BLOCKED"
    run["completed_at"] = ""
    run["code"]["final_commit"] = FINAL_CODE_COMMIT
    run["execution"]["actual_repair_rounds"] = 2

    run["human_editability"] = {
        "status": "PASS",
        "score": 10,
        "dimensions": {
            "discoverability": 2,
            "locality_of_change": 2,
            "intent_readability": 2,
            "change_safety_reuse": 2,
            "cms_content_ownership_clarity": 2,
        },
        "blockers": [],
        "change_drills": drills,
        "evidence": [
            "experiments/ref001-blind-clean-20260812/evidence/human-editability-drills.json",
            "experiments/ref001-blind-clean-20260812/implementation/README.md",
            "experiments/ref001-blind-clean-20260812/implementation/acf-export.json",
        ],
    }

    run["captures"]["final"] = [
        capture(
            "ref001-final-pc-1380",
            1380,
            "REF-001-PC",
            "21384:8173",
            "experiments/ref001-blind-clean-20260812/evidence/final/latest/first-pass-1380.png",
        ),
        capture(
            "ref001-final-sp-375",
            375,
            "REF-001-SP",
            "21376:4401",
            "experiments/ref001-blind-clean-20260812/evidence/final/latest/first-pass-375.png",
        ),
        capture(
            "ref001-final-runtime-probes",
            320,
            "REF-001-RUNTIME",
            "",
            "experiments/ref001-blind-clean-20260812/evidence/final/latest/runtime-probes.json",
        ),
    ]

    run["scores"]["final_fidelity"] = {
        "visual": 27,
        "structural": 25,
        "robustness": 15,
        "total": 67,
    }
    # Keep composite/derived scores unset while required external integration/media
    # evidence remains blocked; do not turn a partial benchmark into a false 100%.
    run["scores"]["rework_efficiency"] = None
    run["scores"]["reproducibility"] = None
    run["scores"]["final_composite"] = None

    run["rework"].update(
        {
            "repair_rounds": 2,
            "post_first_pass_files_changed": 3,
            "post_first_pass_lines_added": 129,
            "post_first_pass_lines_deleted": 1,
            "affected_section_count": 7,
        }
    )

    observations = run["lessons"]["observations"]
    observations.extend(
        [
            "After two post-freeze visual repair rounds, 375px and 1380px endpoint body/section geometry match live Figma exactly (0px top/height delta for every semantic section).",
            "All required runtime widths 320/360/375/390/430/767/768/769/1024/1200/1380 pass with zero horizontal overflow, zero readable text clipping, primary fonts present, and zero runtime errors.",
            "Human Editability scored 10/10 on the immutable FIRST PASS commit with three disposable change drills passing.",
            "The remaining dominant visual mismatch is photographic/composite media: the tool environment exposed only short-lived Figma asset URLs and could not persist their bytes safely into Git, so placeholders remain explicit rather than leaking temporary URLs or fabricating images.",
            "The run remains BLOCKED rather than COMPLETE because the owner-selected Implementation Profile requires a real ACF ADMIN_UI import smoke and target WordPress theme/runtime reconnaissance that are not present in the sanitized workspace.",
        ]
    )
    run["lessons"]["candidate_rules"].extend(
        [
            "Treat intentional whitespace between Figma sections as page rhythm first; do not automatically absorb it into section-local padding, because that creates cascading section-top drift.",
            "Keep shared text rails and section-specific presentation rails separate when the Figma heading width and card-grid width intentionally differ.",
            "Persistent media-byte transfer is a first-class prerequisite for image-heavy Figma-to-Web fidelity; never commit short-lived asset URLs as a workaround.",
        ]
    )
    run["lessons"]["agent_specific"].append(
        "This connector/runtime could inspect Figma media identity/crops and receive short-lived URLs, but could not resolve those URLs into durable bytes for Git."
    )
    run["lessons"]["project_specific"].append(
        "REF-001 production WordPress theme, route, ACF version/license, and admin import environment remain intentionally unresolved by the sanitized handoff."
    )
    run["notes"] = (
        "BLIND_CONTEXT_CLEAN. FIRST PASS remains immutable at 46eb326383ac7aff1cb023100a801b968df9f9bc. "
        "Final implementation code is 4974d36eb4775ce01d9ebde3d9dc8ca24aa9193f. "
        "Two repair rounds achieved exact 375/1380 semantic section geometry and all required runtime probes are clean. "
        "Status is BLOCKED only for persistent Figma media bytes and the Implementation Profile's required real WordPress/ACF ADMIN_UI smoke; neither is fabricated."
    )

    RUN_PATH.write_text(yaml.safe_dump(run, allow_unicode=True, sort_keys=False, width=120), encoding="utf-8")

    measurement = {
        "schema_version": 1,
        "run_id": run["run_id"],
        "blind_status": "CLEAN",
        "first_pass_code_commit": run["code"]["first_pass_commit"],
        "final_code_commit": FINAL_CODE_COMMIT,
        "final_capture_workflow_run_id": FINAL_CAPTURE_RUN_ID,
        "repair_rounds": 2,
        "endpoint_geometry": {
            "pc_1380": {
                "figma_body_height_px": 7714,
                "web_body_height_px": probes[1380]["bodyHeight"],
                "body_height_delta_px": probes[1380]["bodyHeight"] - 7714,
                "section_top_mae_px": 0,
                "section_height_mae_px": 0,
                "all_section_geometry_exact": True,
            },
            "sp_375": {
                "figma_root_height_px": 10817,
                "figma_device_chrome_px": 40,
                "figma_web_content_height_px": 10777,
                "web_body_height_px": probes[375]["bodyHeight"],
                "body_height_delta_px": probes[375]["bodyHeight"] - 10777,
                "section_top_mae_px": 0,
                "section_height_mae_px": 0,
                "all_section_geometry_exact": True,
            },
        },
        "runtime_safety": {
            "widths": REQUIRED_WIDTHS,
            "horizontal_overflow_failures": 0,
            "readable_text_clipping_failures": 0,
            "missing_primary_font_failures": 0,
            "runtime_error_failures": 0,
            "breakpoint_boundary_767_768_769": "PASS",
        },
        "fidelity": {
            "first_pass": run["scores"]["first_pass_fidelity"],
            "final": run["scores"]["final_fidelity"],
            "visual_media_blocker": "OPEN",
            "visual_media_blocker_note": "Geometry, typography hierarchy, colors, responsive structure, and CMS ownership are represented; source photographic/composite bytes remain placeholders because durable transfer from Figma was unavailable.",
        },
        "rework": {
            "post_freeze_visual_repair_rounds": 2,
            "implementation_files_changed": 3,
            "implementation_lines_added": 129,
            "implementation_lines_deleted": 1,
            "owner_blocking_questions": 0,
            "interaction_inventions": 0,
            "cms_inventions": 0,
        },
        "human_editability": {
            "status": "PASS",
            "score": 10,
            "drill_count": len(drills),
            "all_drills_pass": True,
        },
        "blocking_dependencies": [
            "Persistent source-image/composite bytes from Figma are not transferable in the current connector/runtime without storing short-lived URLs.",
            "Target production WordPress theme/route/runtime is not identified in the sanitized Implementation Profile.",
            "Required ACF ADMIN_UI import smoke cannot run without a real WordPress + ACF admin environment.",
        ],
    }
    FINAL_MEASUREMENT.write_text(
        yaml.safe_dump(measurement, allow_unicode=True, sort_keys=False, width=120),
        encoding="utf-8",
    )
    print("PASS finalized REF-001 run record with explicit external blockers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
