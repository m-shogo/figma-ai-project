#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

import start_section_run as starter
import validate_execution_output_contract as output_contract

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"RUNNING", "COMPLETE"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def candidate_runs() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "run.yaml" or path.name.endswith("run.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def has_profile_pin(data: dict[str, Any]) -> bool:
    coordination = data.get("coordination", {})
    return any(
        str(coordination.get(field, "")).strip()
        for field in (
            "implementation_profile_path",
            "implementation_profile_sha256",
            "implementation_profile_id",
        )
    )


def validate_run(data: dict[str, Any]) -> list[str]:
    if str(data.get("status", "PLANNED")) not in ACTIVE:
        return []

    scope = data.get("coordination", {}).get("scope")
    # Existing SECTION runs already require a profile pin. For older non-section
    # research records, stay backward-compatible until they opt into a profile.
    if scope != "SECTION" and not has_profile_pin(data):
        return []

    errors = starter.implementation_profile_errors(data)
    if not errors:
        errors.extend(output_contract.validate_run_output_contract(data))
    return errors


def main() -> int:
    failures = 0
    original_starter_root = starter.ROOT
    original_output_root = output_contract.ROOT
    try:
        starter.ROOT = ROOT
        output_contract.ROOT = ROOT
        for path in candidate_runs():
            try:
                errors = validate_run(load_yaml(path))
            except Exception as exc:
                errors = [str(exc)]
            rel = path.relative_to(ROOT)
            if errors:
                failures += 1
                print(f"FAIL {rel} implementation-profile-pin")
                for error in errors:
                    print(f"  - {error}")
            else:
                print(f"PASS {rel} implementation-profile-pin")
    finally:
        starter.ROOT = original_starter_root
        output_contract.ROOT = original_output_root
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
