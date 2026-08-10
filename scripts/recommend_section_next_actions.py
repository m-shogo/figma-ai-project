#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
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


def linked_contract(manifest: dict[str, Any]) -> dict[str, Any] | None:
    raw = str(manifest.get("shared_contract", "")).strip()
    if not raw:
        return None
    try:
        return load_yaml(repo_path(raw))
    except Exception:
        return None


def recommend_section(
    section: dict[str, Any],
    *,
    profile_sections: dict[str, dict[str, Any]],
    contract: dict[str, Any] | None,
    manifest: dict[str, Any],
) -> dict[str, Any]:
    section_id = str(section.get("section_id", ""))
    figma = section.get("figma", {})
    worker = section.get("worker", {})
    implementation = section.get("implementation", {})
    dependencies = section.get("dependencies", {})

    reasons: list[str] = []
    blockers: list[str] = []

    boundary_confidence = str(figma.get("boundary_confidence", "LOW"))
    mapping_confidence = str(figma.get("pc_sp_mapping_confidence", "LOW"))
    status = str(worker.get("status", "PLANNED"))

    if status == "COMPLETE":
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": "INTEGRATION_CANDIDATE",
            "reasons": ["section worker output is complete"],
            "blockers": [],
        }

    if status == "BLOCKED":
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": "RESOLVE_BLOCKER",
            "reasons": [],
            "blockers": ["worker status is BLOCKED"],
        }

    if boundary_confidence == "LOW":
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": "DEEPEN_DISCOVERY",
            "reasons": ["section boundary confidence is LOW"],
            "blockers": [],
        }

    if mapping_confidence == "LOW":
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": "DEEPEN_PC_SP_MAPPING",
            "reasons": ["PC/SP mapping confidence is LOW"],
            "blockers": [],
        }

    profiled = profile_sections.get(section_id)
    if profiled is None:
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": "PROFILE_STRUCTURE",
            "reasons": ["no Figma Structure Profile entry exists for the section"],
            "blockers": [],
        }

    mode = str(profiled.get("recommended_translation_mode", "UNKNOWN"))
    if mode not in VALID_MODES:
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": "RESOLVE_TRANSLATION_MODE",
            "reasons": [f"translation mode is {mode!r}"],
            "blockers": [],
        }

    if contract is None:
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": "BUILD_SHARED_CONTRACT",
            "reasons": ["linked Shared Contract is unavailable"],
            "blockers": [],
        }

    if contract.get("freeze", {}).get("ready") is not True:
        foundation_status = str(contract.get("foundation", {}).get("status", "NOT_BUILT"))
        action = "VERIFY_SHARED_FOUNDATION" if foundation_status == "BUILT" else "BUILD_SHARED_FOUNDATION"
        return {
            "section_id": section_id,
            "worker_status": status,
            "next_action": action,
            "reasons": [f"Shared Contract is not frozen; foundation status={foundation_status}"],
            "blockers": [],
        }

    contract_hash = str(manifest.get("shared_contract_sha256", "")).strip()
    worker_hash = str(worker.get("contract_sha256", "")).strip()
    foundation_commit = str(manifest.get("foundation_commit", "")).strip()
    base_commit = str(worker.get("base_commit", "")).strip()
    allowed_paths = implementation.get("allowed_paths", [])
    isolation = worker.get("isolation", {})

    if not allowed_paths:
        blockers.append("section write ownership is unresolved")
    if not contract_hash:
        blockers.append("section manifest Shared Contract hash is missing")
    if status in {"READY", "RUNNING"} and worker_hash != contract_hash:
        blockers.append("worker Shared Contract hash is missing or stale")
    if status in {"READY", "RUNNING"} and base_commit != foundation_commit:
        blockers.append("worker base commit does not match verified foundation commit")
    if status in {"READY", "RUNNING"} and not str(worker.get("parallel_group", "")).strip():
        blockers.append("parallel group is not assigned")
    if status in {"READY", "RUNNING"} and str(isolation.get("mode", "UNASSIGNED")) == "UNASSIGNED":
        blockers.append("worker isolation is not assigned")

    dependency_ids = dependencies.get("section_ids", [])
    if dependency_ids:
        reasons.append(f"depends on: {', '.join(map(str, dependency_ids))}")

    if blockers:
        action = "PREPARE_WORKER_EXECUTION"
    elif status in {"READY", "RUNNING"}:
        action = "RUN_PRODUCTION_GATE"
    else:
        action = "PREPARE_WORKER_EXECUTION"
        reasons.append(f"structure mode resolved as {mode}")

    return {
        "section_id": section_id,
        "worker_status": status,
        "translation_mode": mode,
        "next_action": action,
        "reasons": reasons,
        "blockers": blockers,
    }


def build_report(manifest: dict[str, Any], profile: dict[str, Any]) -> dict[str, Any]:
    profile_sections = {
        str(section.get("section_id", "")): section
        for section in profile.get("sections", [])
        if str(section.get("section_id", ""))
    }
    contract = linked_contract(manifest)
    items = [
        recommend_section(
            section,
            profile_sections=profile_sections,
            contract=contract,
            manifest=manifest,
        )
        for section in manifest.get("sections", [])
    ]

    counts: dict[str, int] = {}
    for item in items:
        action = item["next_action"]
        counts[action] = counts.get(action, 0) + 1

    return {
        "reference_id": manifest.get("reference_id", ""),
        "sections": items,
        "action_counts": dict(sorted(counts.items())),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Recommend the next workflow action for every discovered Figma implementation section."
    )
    parser.add_argument("section_manifest", help="Repository-relative section-manifest YAML")
    parser.add_argument("structure_profile", help="Repository-relative Figma structure-profile YAML")
    args = parser.parse_args()

    try:
        manifest = load_yaml(repo_path(args.section_manifest))
        profile = load_yaml(repo_path(args.structure_profile))
        report = build_report(manifest, profile)
    except Exception as exc:
        print(json.dumps({"ok": False, "errors": [str(exc)]}, ensure_ascii=False, indent=2))
        return 1

    print(json.dumps({"ok": True, **report}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
