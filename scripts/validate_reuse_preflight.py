#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
RUN_SCHEMA_VERSION = 14
ACTIVE_STATUSES = {"RUNNING", "BLOCKED", "COMPLETE"}
PREFLIGHT_STATUSES = {"PENDING", "PASS", "NOT_APPLICABLE", "LEGACY_UNRECORDED"}
CHECKED_SOURCES = {
    "EXISTING_CODEBASE",
    "NATIVE_PLATFORM",
    "OFFICIAL_CAPABILITY",
    "DESIGN_SYSTEM_OR_LIBRARY",
    "MATURE_OSS_OR_PATTERN",
    "PROJECT_GOOD_PATTERN",
}
CUSTOM_REQUIRED_FIELDS = (
    "why_existing_is_insufficient",
    "smallest_missing_glue",
    "ownership",
    "verification",
    "retirement_trigger",
)


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def material_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def material_list(value: Any) -> bool:
    return isinstance(value, list) and any(material_text(item) for item in value)


def run_records(root: Path) -> list[tuple[Path, dict[str, Any]]]:
    base = root / "experiments"
    if not base.exists():
        return []
    records: list[tuple[Path, dict[str, Any]]] = []
    for path in sorted(base.rglob("*.yaml")):
        try:
            data = load_yaml(path)
        except Exception:
            continue
        if material_text(data.get("run_id")):
            records.append((path, data))
    return records


def reuse_preflight_errors(data: dict[str, Any]) -> list[str]:
    schema_version = int(data.get("schema_version", 0) or 0)
    if schema_version < RUN_SCHEMA_VERSION:
        return []

    errors: list[str] = []
    preflight = data.get("reuse_preflight")
    if not isinstance(preflight, dict):
        return [f"schema-v{schema_version}+ run requires reuse_preflight"]

    status = preflight.get("status")
    if status not in PREFLIGHT_STATUSES:
        errors.append(f"reuse_preflight.status must be one of {sorted(PREFLIGHT_STATUSES)}")

    checked_sources = preflight.get("checked_sources", [])
    if not isinstance(checked_sources, list):
        errors.append("reuse_preflight.checked_sources must be a list")
        checked_sources = []
    else:
        invalid = [value for value in checked_sources if value not in CHECKED_SOURCES]
        if invalid:
            errors.append(f"reuse_preflight.checked_sources contains unknown values: {invalid}")
        if len(checked_sources) != len(set(checked_sources)):
            errors.append("reuse_preflight.checked_sources must not contain duplicates")

    run_status = data.get("status")
    if run_status in ACTIVE_STATUSES and status not in {"PASS", "NOT_APPLICABLE"}:
        errors.append(
            f"{run_status} schema-v{schema_version}+ run requires reuse_preflight.status PASS or NOT_APPLICABLE"
        )

    if status == "PASS":
        if not checked_sources:
            errors.append("reuse_preflight PASS requires at least one checked source")
        if not material_list(preflight.get("evidence")):
            errors.append("reuse_preflight PASS requires material evidence")

    if status == "NOT_APPLICABLE" and not material_list(preflight.get("decision_notes")):
        errors.append("reuse_preflight NOT_APPLICABLE requires decision_notes explaining why")

    custom = preflight.get("custom_infrastructure", {})
    if not isinstance(custom, dict):
        errors.append("reuse_preflight.custom_infrastructure must be an object")
        return errors

    planned = custom.get("planned")
    if not isinstance(planned, bool):
        errors.append("reuse_preflight.custom_infrastructure.planned must be boolean")
    elif planned:
        if status != "PASS":
            errors.append("planned custom infrastructure requires reuse_preflight.status PASS")
        if not material_list(custom.get("existing_solution_checked")):
            errors.append("planned custom infrastructure requires existing_solution_checked evidence")
        for field in CUSTOM_REQUIRED_FIELDS:
            if not material_text(custom.get(field)):
                errors.append(f"planned custom infrastructure requires custom_infrastructure.{field}")

    return errors


def repository_errors(root: Path) -> list[str]:
    errors: list[str] = []
    for path, data in run_records(root):
        relative = path.relative_to(root).as_posix()
        for error in reuse_preflight_errors(data):
            errors.append(f"{relative}: {error}")
    return errors


def main() -> int:
    errors = repository_errors(ROOT)
    if errors:
        print("FAIL reuse-before-build preflight evidence")
        for error in errors:
            print(f"  - {error}")
        return 1

    modern = sum(
        1
        for _, data in run_records(ROOT)
        if int(data.get("schema_version", 0) or 0) >= RUN_SCHEMA_VERSION
    )
    print("PASS reuse-before-build preflight evidence")
    print(f"  schema_v{RUN_SCHEMA_VERSION}_plus_runs={modern}")
    print("  legacy_runs_preserved=true")
    return 0


if __name__ == "__main__":
    sys.exit(main())
