#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def atomic_write(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def node_ids(section: dict[str, Any]) -> list[str]:
    figma = section.get("figma", {})
    values = [
        figma.get("pc_node_id", ""),
        figma.get("sp_node_id", ""),
        *figma.get("other_node_ids", []),
    ]
    result: list[str] = []
    for value in values:
        text = str(value).strip()
        if text and text not in result:
            result.append(text)
    return result


def unknown_signal(**extra: Any) -> dict[str, Any]:
    return {
        "state": "UNKNOWN",
        "confidence": "NONE",
        "evidence": [],
        **extra,
    }


def new_profile_section(section: dict[str, Any]) -> dict[str, Any]:
    return {
        "section_id": str(section.get("section_id", "")).strip(),
        "figma_node_ids": node_ids(section),
        "signals": {
            "components": unknown_signal(instance_count=None, detached_or_repeated_patterns=[]),
            "variables": unknown_signal(bound_property_coverage=None, modes_observed=[]),
            "auto_layout": unknown_signal(
                container_coverage=None,
                absolute_child_ratio=None,
                generation="UNKNOWN",
            ),
            "semantic_naming": unknown_signal(generic_name_ratio=None),
            "code_connect": unknown_signal(mapped_component_coverage=None),
            "assets": unknown_signal(exact_sources_available=[]),
            "responsive_mapping": unknown_signal(),
        },
        "recommended_translation_mode": "UNKNOWN",
        "mode_reasoning_evidence": [],
        "trusted_structure": [],
        "untrusted_or_missing_structure": [],
        "codebase_reuse_priority": [],
        "unresolved_questions": [],
    }


def section_has_evidence(section: dict[str, Any]) -> bool:
    if section.get("mode_reasoning_evidence"):
        return True
    if section.get("trusted_structure") or section.get("untrusted_or_missing_structure"):
        return True
    for signal in section.get("signals", {}).values():
        if isinstance(signal, dict):
            if signal.get("state") not in {None, "", "UNKNOWN"}:
                return True
            if signal.get("evidence"):
                return True
    return False


def sync(manifest: dict[str, Any], profile: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    reference_id = str(manifest.get("reference_id", "")).strip()
    if not reference_id:
        raise ValueError("Section Manifest reference_id is required")
    profile_ref = str(profile.get("reference_id", "")).strip()
    if profile_ref and profile_ref != reference_id:
        raise ValueError("Figma Structure Profile reference_id does not match Section Manifest")
    profile["reference_id"] = reference_id

    manifest_sections = manifest.get("sections", [])
    ids = [str(section.get("section_id", "")).strip() for section in manifest_sections]
    if any(not value for value in ids):
        raise ValueError("every Section Manifest entry requires section_id")
    if len(ids) != len(set(ids)):
        raise ValueError("Section Manifest section_id values must be unique")

    existing_sections = profile.setdefault("sections", [])
    existing = {
        str(section.get("section_id", "")).strip(): section
        for section in existing_sections
        if str(section.get("section_id", "")).strip()
    }
    if len(existing) != len([s for s in existing_sections if str(s.get("section_id", "")).strip()]):
        raise ValueError("Figma Structure Profile section_id values must be unique")

    changes: list[str] = []
    for manifest_section in manifest_sections:
        section_id = str(manifest_section.get("section_id", "")).strip()
        expected_nodes = node_ids(manifest_section)
        current = existing.get(section_id)
        if current is None:
            created = new_profile_section(manifest_section)
            existing_sections.append(created)
            existing[section_id] = created
            changes.append(f"ADD {section_id}")
            continue

        current_nodes = [str(v) for v in current.get("figma_node_ids", []) if str(v).strip()]
        if current_nodes == expected_nodes:
            continue

        if section_has_evidence(current):
            raise ValueError(
                f"{section_id} Figma node IDs changed after structure evidence was recorded; "
                "create/review a new profile revision instead of silently rewriting evidence lineage"
            )

        current["figma_node_ids"] = expected_nodes
        changes.append(f"UPDATE_NODES {section_id}")

    # Do not delete profile-only sections automatically. They may belong to an older
    # reference/profile revision and require explicit human/coordinator review.
    manifest_id_set = set(ids)
    for section_id in existing:
        if section_id not in manifest_id_set:
            changes.append(f"ORPHAN_REVIEW {section_id}")

    return profile, changes


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sync Section Manifest identities/node IDs into a Figma Structure Profile without inventing structure evidence"
    )
    parser.add_argument("--section-manifest", required=True, type=Path)
    parser.add_argument("--structure-profile", required=True, type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    manifest_path = args.section_manifest if args.section_manifest.is_absolute() else ROOT / args.section_manifest
    profile_path = args.structure_profile if args.structure_profile.is_absolute() else ROOT / args.structure_profile
    if not manifest_path.is_file() or not profile_path.is_file():
        raise ValueError("section manifest and structure profile must both exist")

    manifest = load_yaml(manifest_path)
    profile = load_yaml(profile_path)
    updated, changes = sync(manifest, profile)

    for change in changes or ["NO_CHANGES"]:
        print(change)

    if args.apply:
        atomic_write(profile_path, updated)
        print(f"UPDATED {profile_path.relative_to(ROOT)}")
    else:
        print("DRY-RUN: pass --apply to update the Structure Profile")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
