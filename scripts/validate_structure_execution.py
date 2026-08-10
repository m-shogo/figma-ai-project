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
ACTIVE = {"READY", "RUNNING"}
VALID_MODES = {"STRUCTURE_FIRST", "HYBRID", "VISUAL_FIRST", "CODEBASE_FIRST"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    if not path.is_file():
        raise ValueError(f"file does not exist: {value}")
    return path


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_pair(manifest: dict[str, Any], profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    manifest_reference = str(manifest.get("reference_id", ""))
    profile_reference = str(profile.get("reference_id", ""))
    if manifest_reference != profile_reference:
        errors.append(
            f"reference_id mismatch: section manifest={manifest_reference!r}, structure profile={profile_reference!r}"
        )

    profile_sections = {
        str(section.get("section_id", "")): section
        for section in profile.get("sections", [])
        if str(section.get("section_id", ""))
    }

    for index, section in enumerate(manifest.get("sections", [])):
        worker = section.get("worker", {})
        if worker.get("status") not in ACTIVE:
            continue

        section_id = str(section.get("section_id", ""))
        prefix = f"sections[{index}] {section_id or '<missing>'}"
        profiled = profile_sections.get(section_id)
        if profiled is None:
            errors.append(f"{prefix}: READY/RUNNING worker requires a structure profile entry")
            continue

        mode = str(profiled.get("recommended_translation_mode", "UNKNOWN"))
        if mode not in VALID_MODES:
            errors.append(
                f"{prefix}: translation mode must be resolved before execution; got {mode!r}"
            )

        profiled_nodes = {str(value) for value in profiled.get("figma_node_ids", []) if str(value)}
        figma = section.get("figma", {})
        manifest_nodes = {
            str(value)
            for value in [
                figma.get("pc_node_id", ""),
                figma.get("sp_node_id", ""),
                *figma.get("other_node_ids", []),
            ]
            if str(value)
        }
        if manifest_nodes and not (profiled_nodes & manifest_nodes):
            errors.append(
                f"{prefix}: structure profile does not reference any Figma node used by the section manifest"
            )

        signals = profiled.get("signals", {})
        if mode == "STRUCTURE_FIRST":
            strong = sum(
                str(signals.get(name, {}).get("confidence", "NONE")) in {"MEDIUM", "HIGH"}
                for name in ("components", "variables", "auto_layout", "semantic_naming")
            )
            if strong < 2:
                errors.append(
                    f"{prefix}: STRUCTURE_FIRST needs at least two MEDIUM/HIGH structure signals"
                )
        elif mode == "CODEBASE_FIRST":
            if not profiled.get("codebase_reuse_priority"):
                errors.append(
                    f"{prefix}: CODEBASE_FIRST requires explicit codebase_reuse_priority"
                )
        elif mode == "VISUAL_FIRST":
            if not profiled.get("untrusted_or_missing_structure"):
                errors.append(
                    f"{prefix}: VISUAL_FIRST requires explicit weak/missing structure evidence"
                )

    return list(dict.fromkeys(errors))


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate that every READY/RUNNING section has a matching Figma Structure Profile "
            "and a resolved translation strategy based on actual Figma evidence."
        )
    )
    parser.add_argument("section_manifest", help="Repository-relative section-manifest YAML")
    parser.add_argument("structure_profile", help="Repository-relative Figma structure-profile YAML")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args()

    try:
        manifest_path = repo_path(args.section_manifest)
        profile_path = repo_path(args.structure_profile)
        manifest = load_yaml(manifest_path)
        profile = load_yaml(profile_path)
        errors = validate_pair(manifest, profile)
        payload = {
            "ok": not errors,
            "section_manifest": args.section_manifest,
            "section_manifest_sha256": sha256(manifest_path),
            "structure_profile": args.structure_profile,
            "structure_profile_sha256": sha256(profile_path),
            "reference_id": manifest.get("reference_id", ""),
            "errors": errors,
        }
    except Exception as exc:
        payload = {
            "ok": False,
            "section_manifest": args.section_manifest,
            "structure_profile": args.structure_profile,
            "errors": [str(exc)],
        }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    elif payload["ok"]:
        print("PASS Figma structure execution gate")
        print(f"  section manifest: {payload['section_manifest']}")
        print(f"  structure profile: {payload['structure_profile']}")
    else:
        print("FAIL Figma structure execution gate")
        for error in payload["errors"]:
            print(f"  - {error}")

    return 0 if payload["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
