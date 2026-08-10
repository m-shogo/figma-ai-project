#!/usr/bin/env python3
from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"READY", "RUNNING", "COMPLETE"}
KNOWN_PARALLEL_SAFE_MODES = {"BRANCH_WORKTREE", "AGENT_SANDBOX"}


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
    manifest_contract_hash = str(data.get("shared_contract_sha256", "")).strip()

    for index, section in enumerate(data.get("sections", [])):
        section_id = str(section.get("section_id", f"index-{index}"))
        worker = section.get("worker", {})
        status = str(worker.get("status", "PLANNED"))
        group = str(worker.get("parallel_group", "")).strip()
        worker_contract_hash = str(worker.get("contract_sha256", "")).strip()
        isolation = worker.get("isolation", {})
        mode = str(isolation.get("mode", "UNASSIGNED"))
        ref = str(isolation.get("ref", "")).strip()
        parallel_safe = bool(isolation.get("parallel_safe", False))
        notes = isolation.get("notes", [])

        if status not in ACTIVE:
            continue

        if not group:
            errors.append(f"sections[{index}] {section_id}: active worker requires parallel_group")
            continue

        if not manifest_contract_hash:
            errors.append(
                f"sections[{index}] {section_id}: active worker requires manifest shared_contract_sha256"
            )
        if not worker_contract_hash:
            errors.append(
                f"sections[{index}] {section_id}: active worker requires worker.contract_sha256"
            )
        elif manifest_contract_hash and worker_contract_hash != manifest_contract_hash:
            errors.append(
                f"sections[{index}] {section_id}: worker contract hash is stale; "
                "it must equal manifest shared_contract_sha256"
            )

        if mode == "UNASSIGNED":
            errors.append(f"sections[{index}] {section_id}: active worker requires isolation.mode")

        if mode in KNOWN_PARALLEL_SAFE_MODES and not ref:
            errors.append(
                f"sections[{index}] {section_id}: isolation mode {mode} requires non-empty isolation.ref"
            )

        if mode == "OTHER" and parallel_safe:
            if not ref:
                errors.append(
                    f"sections[{index}] {section_id}: parallel-safe OTHER isolation requires isolation.ref"
                )
            if not isinstance(notes, list) or not notes:
                errors.append(
                    f"sections[{index}] {section_id}: parallel-safe OTHER isolation requires notes "
                    "describing why the new isolation mechanism is safe"
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
            parallel_safe = bool(isolation.get("parallel_safe", False))
            notes = isolation.get("notes", [])

            if mode == "SERIAL_SHARED_TREE":
                errors.append(
                    f"parallel group {group}: {section_id} uses SERIAL_SHARED_TREE; "
                    "shared working trees cannot be used concurrently"
                )
            elif mode in KNOWN_PARALLEL_SAFE_MODES:
                if not parallel_safe:
                    errors.append(
                        f"parallel group {group}: {section_id} must explicitly set isolation.parallel_safe=true"
                    )
            elif mode == "OTHER":
                if not parallel_safe:
                    errors.append(
                        f"parallel group {group}: {section_id} uses OTHER isolation without "
                        "explicit parallel_safe=true"
                    )
                if not isinstance(notes, list) or not notes:
                    errors.append(
                        f"parallel group {group}: {section_id} OTHER isolation requires safety notes"
                    )
            else:
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
