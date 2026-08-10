#!/usr/bin/env python3
from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
SPECIFIED_MODES = {"GLOBAL_SPECIFIED", "SECTION_SPECIFIED"}
RELATIONS = {"BEFORE", "AT", "AFTER", "CUSTOM"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def candidate_contracts() -> list[Path]:
    found: list[Path] = [ROOT / "templates" / "shared-contract.yaml"]
    for base in (ROOT / "contracts", ROOT / "experiments", ROOT / "references"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "shared-contract.yaml" or path.name.endswith("shared-contract.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def validate_contract(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if data.get("freeze", {}).get("ready") is not True:
        return errors

    breakpoints = data.get("breakpoints", {})
    if breakpoints.get("mode") not in SPECIFIED_MODES:
        return errors

    values = breakpoints.get("values", [])
    known_names = {
        str(item.get("name", "")).strip()
        for item in values
        if isinstance(item, dict) and str(item.get("name", "")).strip()
    }

    viewports = breakpoints.get("validation_viewports", [])
    if not isinstance(viewports, list):
        return ["breakpoints.validation_viewports must be an array"]

    viewport_names: list[str] = []
    referenced: Counter[str] = Counter()

    for index, viewport in enumerate(viewports):
        prefix = f"breakpoints.validation_viewports[{index}]"
        if not isinstance(viewport, dict):
            errors.append(f"{prefix} must be an object")
            continue

        name = str(viewport.get("name", "")).strip()
        breakpoint_name = str(viewport.get("breakpoint", "")).strip()
        width = viewport.get("width_px")
        relation = str(viewport.get("relation", "")).strip()

        if not name:
            errors.append(f"{prefix}.name is required")
        else:
            viewport_names.append(name)

        if not breakpoint_name:
            errors.append(f"{prefix}.breakpoint is required")
        elif breakpoint_name not in known_names:
            errors.append(
                f"{prefix}.breakpoint references unknown breakpoint {breakpoint_name!r}"
            )
        else:
            referenced[breakpoint_name] += 1

        if isinstance(width, bool) or not isinstance(width, int):
            errors.append(f"{prefix}.width_px must be an integer")
        elif width < 0:
            errors.append(f"{prefix}.width_px cannot be negative")

        if relation not in RELATIONS:
            errors.append(
                f"{prefix}.relation must be one of {sorted(RELATIONS)}"
            )

    duplicates = [name for name, count in Counter(viewport_names).items() if count > 1]
    for name in sorted(duplicates):
        errors.append(f"duplicate validation viewport name: {name}")

    for breakpoint_name in sorted(known_names):
        if referenced[breakpoint_name] == 0:
            errors.append(
                f"breakpoint {breakpoint_name!r} has no mapped validation viewport"
            )

    return errors


def main() -> int:
    failures = 0
    for path in candidate_contracts():
        try:
            errors = validate_contract(load_yaml(path))
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
