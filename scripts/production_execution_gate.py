#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts import section_execution_gate  # noqa: E402
from scripts import suggest_translation_mode  # noqa: E402
from scripts import validate_figma_structure_profiles  # noqa: E402
from scripts import validate_structure_execution  # noqa: E402


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    if not path.is_file():
        raise ValueError(f"file does not exist: {value}")
    return path


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build_report(section_manifest_path: Path, profile_path: Path) -> dict[str, Any]:
    manifest = load_yaml(section_manifest_path)
    profile = load_yaml(profile_path)

    section_errors, planner = section_execution_gate.validate_execution(
        section_manifest_path, manifest
    )

    profile_schema = validate_figma_structure_profiles.load_schema()
    profile_errors = validate_figma_structure_profiles.validate_profile(
        profile_path, profile_schema
    )
    structure_execution_errors = validate_structure_execution.validate_pair(
        manifest, profile
    )

    errors = list(
        dict.fromkeys([*section_errors, *profile_errors, *structure_execution_errors])
    )

    active_ids = {
        str(section.get("section_id", ""))
        for section in manifest.get("sections", [])
        if section.get("worker", {}).get("status") in {"READY", "RUNNING"}
    }
    profile_sections = {
        str(section.get("section_id", "")): section
        for section in profile.get("sections", [])
        if str(section.get("section_id", ""))
    }

    strategies = []
    for section_id in sorted(active_ids):
        profiled = profile_sections.get(section_id)
        if profiled is None:
            continue
        suggestion = suggest_translation_mode.suggest(profiled)
        strategies.append(
            {
                "section_id": section_id,
                "confirmed_mode": profiled.get("recommended_translation_mode", "UNKNOWN"),
                "advisory_suggestion": suggestion,
            }
        )

    return {
        "ok": not errors,
        "reference_id": manifest.get("reference_id", ""),
        "section_manifest": section_manifest_path.relative_to(ROOT).as_posix(),
        "section_manifest_sha256": sha256(section_manifest_path),
        "structure_profile": profile_path.relative_to(ROOT).as_posix(),
        "structure_profile_sha256": sha256(profile_path),
        "executable_groups": section_execution_gate.executable_groups(manifest),
        "translation_strategies": strategies,
        "planner": planner,
        "errors": errors,
    }


def render_human(report: dict[str, Any]) -> None:
    if report["ok"]:
        print("PASS production execution gate")
    else:
        print("FAIL production execution gate")

    print(f"Reference: {report.get('reference_id', '')}")
    print(
        f"Section manifest: {report.get('section_manifest', '')} "
        f"[{report.get('section_manifest_sha256', '')[:12]}]"
    )
    print(
        f"Structure profile: {report.get('structure_profile', '')} "
        f"[{report.get('structure_profile_sha256', '')[:12]}]"
    )

    if report.get("translation_strategies"):
        print("Translation strategies:")
        for item in report["translation_strategies"]:
            suggestion = item["advisory_suggestion"]
            marker = "=" if item["confirmed_mode"] == suggestion["suggested_mode"] else "≠"
            print(
                f"  - {item['section_id']}: confirmed {item['confirmed_mode']} "
                f"{marker} advisory {suggestion['suggested_mode']}"
            )

    if report.get("executable_groups"):
        print("Executable groups:")
        for group, ids in report["executable_groups"].items():
            print(f"  - {group}: {', '.join(ids)}")

    if report["errors"]:
        print("Errors:")
        for error in report["errors"]:
            print(f"  - {error}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "One-command production preflight combining Figma structure evidence, "
            "translation strategy, Shared Contract/foundation lineage, breakpoint semantics, "
            "section discovery, dependency/write ownership, and worker isolation."
        )
    )
    parser.add_argument("section_manifest", help="Repository-relative section-manifest YAML")
    parser.add_argument("structure_profile", help="Repository-relative Figma structure-profile YAML")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args()

    try:
        report = build_report(
            repo_path(args.section_manifest),
            repo_path(args.structure_profile),
        )
    except Exception as exc:
        report = {
            "ok": False,
            "section_manifest": args.section_manifest,
            "structure_profile": args.structure_profile,
            "errors": [str(exc)],
        }

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        render_human(report)

    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
