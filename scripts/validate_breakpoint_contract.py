#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
SPECIFIED_MODES = {"GLOBAL_SPECIFIED", "SECTION_SPECIFIED"}


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
    mode = str(breakpoints.get("mode", "UNKNOWN"))
    source = str(breakpoints.get("source", "UNKNOWN"))
    values = breakpoints.get("values", [])
    validation_viewports = breakpoints.get("validation_viewports", [])

    if mode == "UNKNOWN":
        errors.append("frozen contract cannot keep breakpoints.mode=UNKNOWN")
        return errors

    if mode not in SPECIFIED_MODES:
        return errors

    if source == "UNKNOWN":
        errors.append("specified breakpoint contract requires a non-UNKNOWN source")
    if not isinstance(values, list) or not values:
        errors.append("specified breakpoint contract requires at least one breakpoint value")
        return errors

    names: set[str] = set()
    for index, raw in enumerate(values):
        if not isinstance(raw, dict):
            errors.append(f"breakpoints.values[{index}] must be an object")
            continue

        name = str(raw.get("name", "")).strip()
        media_query = str(raw.get("media_query", "")).strip()
        minimum = raw.get("min_width_px")
        maximum = raw.get("max_width_px")

        if not name:
            errors.append(f"breakpoints.values[{index}] requires a name")
        elif name in names:
            errors.append(f"duplicate breakpoint name: {name}")
        else:
            names.add(name)

        if not media_query and minimum is None and maximum is None:
            errors.append(
                f"breakpoints.values[{index}] {name or '<unnamed>'}: "
                "requires media_query and/or a min/max width"
            )

        for field, value in (("min_width_px", minimum), ("max_width_px", maximum)):
            if value is not None:
                if isinstance(value, bool) or not isinstance(value, int):
                    errors.append(
                        f"breakpoints.values[{index}] {name or '<unnamed>'}: {field} must be an integer or null"
                    )
                elif value < 0:
                    errors.append(
                        f"breakpoints.values[{index}] {name or '<unnamed>'}: {field} cannot be negative"
                    )

        if (
            isinstance(minimum, int)
            and not isinstance(minimum, bool)
            and isinstance(maximum, int)
            and not isinstance(maximum, bool)
            and minimum > maximum
        ):
            errors.append(
                f"breakpoints.values[{index}] {name or '<unnamed>'}: min_width_px cannot exceed max_width_px"
            )

    if not isinstance(validation_viewports, list) or not validation_viewports:
        errors.append(
            "frozen specified breakpoint contract requires validation_viewports for boundary verification"
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
