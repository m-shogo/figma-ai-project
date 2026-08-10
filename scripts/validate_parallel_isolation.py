#!/usr/bin/env python3
from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"READY", "RUNNING", "COMPLETE"}
PARALLEL_SAFE_MODES = {"BRANCH_WORKTREE", "AGENT_SANDBOX", "OTHER"}


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
    groups: dict[str, list[tuple[int, str, dict[str, Any]]]] = defaultdict(list)

    for index, section in enumerate(data.get("sections", [])):
        section_id = str(section.get("section_id", f"index-{index}"))
        worker = section.get("worker", {})
        status = str(worker.get("status", "PLANNED"))
        group = str(worker.get("parallel_group", "")).strip()
        isolation = worker.get("isolation", {})
        mode = str(isolation.get("mode", "UNASSIGNED"))
        ref = str(isolation.get("ref", "")).strip()

        if status not in ACTIVE:
            continue

        if not group:
            errors.append(f"sections[{index}] {section_id}: active worker requires parallel_group")
            continue

        if mode == "UNASSIGNED":
            errors.append(f"sections[{index}] {section_id}: active worker requires isolation.mode")
        if mode in PARALLEL_SAFE_MODES and not ref:
            errors.append(
                f"sections[{index}] {section_id}: isolation mode {mode} requires non-empty isolation.ref"
            )

        groups[group].append((index, section_id, worker))

    for group, members in sorted(groups.items()):
        if len(members) <= 1:
            continue

        refs: dict[str, str] = {}
        for index, section_id, worker in members:
            isolation = worker.get("isolation", {})
            mode = str(isolation.get("mode", "UNASSIGNED"))
            ref = str(isolation.get("ref", "")).strip()

            if mode == "SERIAL_SHARED_TREE":
                errors.append(
                    f"parallel group {group}: {section_id} uses SERIAL_SHARED_TREE; "
                    "shared working trees cannot be used concurrently"
                )
            elif mode not in PARALLEL_SAFE_MODES:
                errors.append(
                    f"parallel group {group}: {section_id} isolation mode {mode} is not parallel-safe"
                )

            if not ref:
                errors.append(f"parallel group {group}: {section_id} has empty isolation.ref")
                continue
            if ref in refs:
                errors.append(
                    f"parallel group {group}: {section_id} and {refs[ref]} share isolation.ref {ref}"
                )
            else:
                refs[ref] = section_id

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
