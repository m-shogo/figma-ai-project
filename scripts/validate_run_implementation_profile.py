#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

import start_section_run as starter

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


def validate_run(data: dict[str, Any]) -> list[str]:
    if str(data.get("status", "PLANNED")) not in ACTIVE:
        return []
    if data.get("coordination", {}).get("scope") != "SECTION":
        return []
    return starter.implementation_profile_errors(data)


def main() -> int:
    failures = 0
    original_starter_root = starter.ROOT
    try:
        starter.ROOT = ROOT
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
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
