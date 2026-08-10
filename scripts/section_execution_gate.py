#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts import section_planner  # noqa: E402
from scripts import validate_breakpoint_contract  # noqa: E402
from scripts import validate_parallel_isolation  # noqa: E402
from scripts import validate_parallel_paths  # noqa: E402
from scripts import validate_records  # noqa: E402
from scripts import validate_section_discovery  # noqa: E402

EXECUTABLE = {"READY", "RUNNING"}


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


def linked_shared_contract(manifest: dict[str, Any]) -> tuple[Path | None, dict[str, Any] | None, list[str]]:
    errors: list[str] = []
    value = str(manifest.get("shared_contract", "")).strip()
    if not value:
        return None, None, ["shared_contract is required before execution"]
    try:
        path = repo_path(value)
    except ValueError as exc:
        return None, None, [str(exc)]
    if not path.is_file():
        return path, None, [f"shared_contract does not exist: {value}"]
    try:
        return path, load_yaml(path), errors
    except Exception as exc:
        return path, None, [f"cannot load shared_contract {value}: {exc}"]


def executable_groups(manifest: dict[str, Any]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {}
    for section in manifest.get("sections", []):
        worker = section.get("worker", {})
        if worker.get("status") not in EXECUTABLE:
            continue
        group = str(worker.get("parallel_group", "")).strip()
        if not group:
            continue
        groups.setdefault(group, []).append(str(section.get("section_id", "")))
    return {group: sorted(ids) for group, ids in sorted(groups.items())}


def validate_execution(path: Path, manifest: dict[str, Any]) -> tuple[list[str], dict[str, Any] | None]:
    errors: list[str] = []

    # Schema + cross-file semantic lineage.
    try:
        section_schema = validate_records.load_json(ROOT / "schemas" / "section.schema.json")
        errors.extend(validate_records.validate_schema(manifest, section_schema))
        errors.extend(validate_records.semantic_section_errors(manifest))
    except Exception as exc:
        errors.append(f"section record validation failed: {exc}")

    # Discovery confidence, write ownership/dependencies, and Git/filesystem isolation.
    errors.extend(validate_section_discovery.validate_manifest(path))
    errors.extend(validate_parallel_paths.validate_manifest(path))
    errors.extend(validate_parallel_isolation.validate_manifest(path))

    # Shared breakpoint contract must be execution-ready.
    _, contract, contract_errors = linked_shared_contract(manifest)
    errors.extend(contract_errors)
    if contract is not None:
        errors.extend(validate_records.semantic_shared_errors(contract))
        errors.extend(validate_breakpoint_contract.validate_contract(contract))

    groups = executable_groups(manifest)
    if not groups:
        errors.append("no READY/RUNNING section workers are available for execution")

    plan: dict[str, Any] | None = None
    try:
        plan = section_planner.build_plan(manifest)
    except Exception as exc:
        errors.append(f"section planner failed: {exc}")

    # De-duplicate while retaining deterministic order.
    errors = list(dict.fromkeys(errors))
    return errors, plan


def render_human(path: Path, errors: list[str], groups: dict[str, list[str]], plan: dict[str, Any] | None) -> None:
    relative = path.relative_to(ROOT) if ROOT in path.parents else path
    if errors:
        print(f"FAIL execution gate: {relative}")
        for error in errors:
            print(f"  - {error}")
        return

    print(f"PASS execution gate: {relative}")
    print("Executable groups:")
    for group, section_ids in groups.items():
        print(f"  - {group}: {', '.join(section_ids)}")

    if plan is not None:
        print("Planner waves (advisory):")
        for wave in plan.get("waves", []):
            sections = ", ".join(wave.get("sections", []))
            print(
                f"  - wave {wave.get('wave')}: {sections} "
                f"[{wave.get('recommended_parallel_group', '')}]"
            )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Fail-closed preflight for section execution: schema, shared-contract/foundation lineage, "
            "Figma discovery confidence, breakpoint semantics, dependencies/write ownership, and worker isolation."
        )
    )
    parser.add_argument("manifest", help="Repository-relative section-manifest YAML path")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args()

    try:
        path = repo_path(args.manifest)
        if not path.is_file():
            raise ValueError(f"section manifest does not exist: {args.manifest}")
        manifest = load_yaml(path)
        errors, plan = validate_execution(path, manifest)
        groups = executable_groups(manifest)
    except Exception as exc:
        errors = [str(exc)]
        groups = {}
        plan = None
        path = (ROOT / args.manifest).resolve()

    if args.json:
        payload = {
            "ok": not errors,
            "manifest": args.manifest,
            "errors": errors,
            "executable_groups": groups,
            "planner": plan,
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        render_human(path, errors, groups, plan)

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
