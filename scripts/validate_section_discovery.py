#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
RECORDED = {"READY", "RUNNING", "COMPLETE"}
EXECUTING = {"READY", "RUNNING"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def candidate_manifests() -> list[Path]:
    found: list[Path] = [ROOT / "templates" / "section-manifest.yaml"]
    for base in (ROOT / "references", ROOT / "experiments", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "section-manifest.yaml" or path.name.endswith("section-manifest.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def validate_manifest(path: Path) -> list[str]:
    data = load_yaml(path)
    errors: list[str] = []

    for index, section in enumerate(data.get("sections", [])):
        section_id = str(section.get("section_id", f"index-{index}"))
        figma = section.get("figma", {})
        worker = section.get("worker", {})
        status = str(worker.get("status", "PLANNED"))

        boundary_confidence = str(figma.get("boundary_confidence", "LOW"))
        boundary_evidence = figma.get("boundary_evidence", [])
        mapping_confidence = str(figma.get("pc_sp_mapping_confidence", "LOW"))
        mapping_evidence = figma.get("mapping_evidence", [])
        sp_node_id = str(figma.get("sp_node_id", "")).strip()

        if status in RECORDED:
            if boundary_confidence in {"HIGH", "MEDIUM"}:
                if not isinstance(boundary_evidence, list) or not boundary_evidence:
                    errors.append(
                        f"sections[{index}] {section_id}: {boundary_confidence} boundary confidence "
                        "requires non-empty boundary_evidence"
                    )

            if mapping_confidence in {"HIGH", "MEDIUM"}:
                if not isinstance(mapping_evidence, list) or not mapping_evidence:
                    errors.append(
                        f"sections[{index}] {section_id}: {mapping_confidence} PC/SP mapping confidence "
                        "requires non-empty mapping_evidence"
                    )
                if not sp_node_id:
                    errors.append(
                        f"sections[{index}] {section_id}: {mapping_confidence} PC/SP mapping requires sp_node_id"
                    )

            if mapping_confidence == "NOT_APPLICABLE" and sp_node_id:
                errors.append(
                    f"sections[{index}] {section_id}: mapping is NOT_APPLICABLE but sp_node_id is present"
                )

        if status in EXECUTING:
            if boundary_confidence == "LOW":
                errors.append(
                    f"sections[{index}] {section_id}: LOW boundary confidence cannot enter {status}; "
                    "deepen Figma evidence or obtain owner confirmation first"
                )
            if mapping_confidence == "LOW":
                errors.append(
                    f"sections[{index}] {section_id}: LOW PC/SP mapping confidence cannot enter {status}; "
                    "deepen mapping evidence or obtain owner confirmation first"
                )

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
