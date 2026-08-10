#!/usr/bin/env python3
from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path, PurePosixPath
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"READY", "RUNNING", "COMPLETE"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def normalize(value: str) -> PurePosixPath:
    raw = value.strip().replace("\\", "/")
    if not raw:
        raise ValueError("empty allowed path")
    path = PurePosixPath(raw)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"allowed path must stay repository-relative: {value}")
    return path


def path_overlaps(a: PurePosixPath, b: PurePosixPath) -> bool:
    a_parts = a.parts
    b_parts = b.parts
    n = min(len(a_parts), len(b_parts))
    return a_parts[:n] == b_parts[:n]


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
    groups: dict[str, list[tuple[str, PurePosixPath]]] = defaultdict(list)

    for i, section in enumerate(data.get("sections", [])):
        section_id = str(section.get("section_id", f"index-{i}"))
        worker = section.get("worker", {})
        status = worker.get("status")
        group = str(worker.get("parallel_group", "")).strip()
        implementation = section.get("implementation", {})
        raw_paths = implementation.get("allowed_paths", [])

        if status in ACTIVE and not group:
            errors.append(
                f"sections[{i}] {section_id}: active worker requires non-empty worker.parallel_group"
            )

        normalized: list[PurePosixPath] = []
        for raw in raw_paths:
            try:
                normalized.append(normalize(str(raw)))
            except ValueError as exc:
                errors.append(f"sections[{i}] {section_id}: {exc}")

        for left_index, left in enumerate(normalized):
            for right in normalized[left_index + 1 :]:
                if path_overlaps(left, right):
                    errors.append(
                        f"sections[{i}] {section_id}: redundant/overlapping allowed paths "
                        f"{left.as_posix()} and {right.as_posix()}"
                    )

        if status in ACTIVE and group:
            for allowed in normalized:
                groups[group].append((section_id, allowed))

    for group, ownership in sorted(groups.items()):
        for i, (left_id, left_path) in enumerate(ownership):
            for right_id, right_path in ownership[i + 1 :]:
                if left_id == right_id:
                    continue
                if path_overlaps(left_path, right_path):
                    errors.append(
                        f"parallel group {group}: write scope overlap between {left_id} "
                        f"({left_path.as_posix()}) and {right_id} ({right_path.as_posix()})"
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
    sys.exit(main())
