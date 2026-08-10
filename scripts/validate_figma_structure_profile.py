#!/usr/bin/env python3
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"READY", "RUNNING", "COMPLETE"}
SIGNAL_NAMES = (
    "components",
    "variables",
    "auto_layout",
    "semantic_naming",
    "code_connect",
    "assets",
    "responsive_mapping",
)


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def candidate_manifests() -> list[Path]:
    found: list[Path] = [ROOT / "templates" / "section-manifest.yaml"]
    for base in (ROOT / "references", ROOT / "experiments", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "section-manifest.yaml" or path.name.endswith("section-manifest.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def profile_sections(profile: dict[str, Any]) -> tuple[dict[str, dict[str, Any]], list[str]]:
    errors: list[str] = []
    mapped: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(profile.get("sections", [])):
        if not isinstance(item, dict):
            errors.append(f"profile.sections[{index}] must be an object")
            continue
        section_id = str(item.get("section_id", "")).strip()
        if not section_id:
            errors.append(f"profile.sections[{index}] requires section_id")
            continue
        if section_id in mapped:
            errors.append(f"profile section_id must be unique: {section_id}")
            continue
        mapped[section_id] = item
    return mapped, errors


def validate_signal(section_id: str, name: str, signal: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(signal, dict):
        return [f"{section_id} signal {name} must be an object"]

    state = str(signal.get("state", "UNKNOWN"))
    confidence = str(signal.get("confidence", "NONE"))
    evidence = signal.get("evidence", [])

    if state == "UNKNOWN":
        errors.append(f"{section_id} signal {name} cannot remain UNKNOWN for an active worker")
        return errors

    if state in {"NONE", "OBSERVED", "UNDETERMINED"}:
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"{section_id} signal {name} state={state} requires evidence")

    if state == "OBSERVED" and confidence == "NONE":
        errors.append(f"{section_id} signal {name} OBSERVED requires LOW/MEDIUM/HIGH confidence")

    if state == "UNDETERMINED" and confidence == "NONE":
        errors.append(
            f"{section_id} signal {name} UNDETERMINED requires confidence about the limitation/evidence"
        )

    return errors


def validate_manifest(path: Path) -> list[str]:
    manifest = load_yaml(path)
    errors: list[str] = []
    active_sections = [
        section
        for section in manifest.get("sections", [])
        if isinstance(section, dict) and section.get("worker", {}).get("status") in ACTIVE
    ]

    # Draft/empty template is intentionally valid before production work starts.
    if not active_sections:
        return errors

    profile_value = str(manifest.get("figma_structure_profile", "")).strip()
    expected_hash = str(manifest.get("figma_structure_profile_sha256", "")).strip()
    if not profile_value:
        return ["active section workers require figma_structure_profile"]
    if not expected_hash:
        errors.append("active section workers require figma_structure_profile_sha256")

    try:
        profile_path = repo_path(profile_value)
    except ValueError as exc:
        return errors + [str(exc)]

    if not profile_path.is_file():
        return errors + [f"figma_structure_profile does not exist: {profile_value}"]

    if expected_hash and sha256(profile_path) != expected_hash:
        errors.append("figma_structure_profile_sha256 does not match linked profile")

    profile = load_yaml(profile_path)
    if profile.get("reference_id") != manifest.get("reference_id"):
        errors.append("Figma Structure Profile reference_id must match Section Manifest reference_id")

    if not profile.get("captured_at"):
        errors.append("active Figma Structure Profile requires captured_at")
    if not profile.get("figma_tooling_snapshot"):
        errors.append("active Figma Structure Profile requires figma_tooling_snapshot")

    page = profile.get("page", {})
    generation = str(page.get("auto_layout_generation", "UNKNOWN")) if isinstance(page, dict) else "UNKNOWN"
    if generation == "UNKNOWN":
        errors.append(
            "active Figma Structure Profile page.auto_layout_generation cannot remain UNKNOWN; "
            "use UNDETERMINED with notes when current tooling cannot establish it"
        )
    if generation == "UNDETERMINED":
        notes = page.get("notes", []) if isinstance(page, dict) else []
        if not isinstance(notes, list) or not notes:
            errors.append("page auto_layout_generation=UNDETERMINED requires notes/evidence")

    indexed, index_errors = profile_sections(profile)
    errors.extend(index_errors)

    for manifest_section in active_sections:
        section_id = str(manifest_section.get("section_id", "")).strip()
        profile_section = indexed.get(section_id)
        if profile_section is None:
            errors.append(f"active section {section_id} is missing from Figma Structure Profile")
            continue

        profile_nodes = {str(node) for node in profile_section.get("figma_node_ids", [])}
        figma = manifest_section.get("figma", {})
        for field in ("pc_node_id", "sp_node_id"):
            node_id = str(figma.get(field, "")).strip()
            if node_id and node_id not in profile_nodes:
                errors.append(
                    f"active section {section_id} {field}={node_id} is not present in profile figma_node_ids"
                )

        signals = profile_section.get("signals", {})
        if not isinstance(signals, dict):
            errors.append(f"active section {section_id} requires signals")
        else:
            for name in SIGNAL_NAMES:
                errors.extend(validate_signal(section_id, name, signals.get(name)))

        mode = str(profile_section.get("recommended_translation_mode", "UNKNOWN"))
        if mode == "UNKNOWN":
            errors.append(f"active section {section_id} requires a resolved recommended_translation_mode")
        evidence = profile_section.get("mode_reasoning_evidence", [])
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"active section {section_id} requires mode_reasoning_evidence")

    return errors


def main() -> int:
    failures = 0
    for path in candidate_manifests():
        try:
            errors = validate_manifest(path)
        except Exception as exc:
            errors = [str(exc)]

        relative = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {relative}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {relative}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
