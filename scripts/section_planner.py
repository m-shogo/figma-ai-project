#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
GLOB_CHARS = set("*?[]{}")


@dataclass(frozen=True)
class Section:
    section_id: str
    order: int
    dependencies: frozenset[str]
    write_scopes: tuple[PurePosixPath, ...]
    coupling: str
    status: str


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def normalize_scope(value: str) -> PurePosixPath:
    raw = value.strip().replace("\\", "/")
    if not raw:
        raise ValueError("empty allowed path")
    if any(char in raw for char in GLOB_CHARS):
        raise ValueError(f"allowed path must be an ownership root, not a glob: {value}")
    path = PurePosixPath(raw)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"allowed path must stay repository-relative: {value}")
    return path


def scopes_overlap(left: PurePosixPath, right: PurePosixPath) -> bool:
    n = min(len(left.parts), len(right.parts))
    return left.parts[:n] == right.parts[:n]


def sections_conflict(left: Section, right: Section) -> bool:
    # Unknown ownership is not safe to parallelize.
    if not left.write_scopes or not right.write_scopes:
        return True
    if left.coupling == "HIGH" or right.coupling == "HIGH":
        return True
    return any(scopes_overlap(a, b) for a in left.write_scopes for b in right.write_scopes)


def parse_sections(data: dict[str, Any]) -> dict[str, Section]:
    parsed: dict[str, Section] = {}
    for index, raw in enumerate(data.get("sections", [])):
        section_id = str(raw.get("section_id", "")).strip()
        if not section_id:
            raise ValueError(f"sections[{index}] has no section_id")
        if section_id in parsed:
            raise ValueError(f"duplicate section_id: {section_id}")
        dependencies = raw.get("dependencies", {})
        implementation = raw.get("implementation", {})
        worker = raw.get("worker", {})
        scopes = tuple(normalize_scope(str(value)) for value in implementation.get("allowed_paths", []))
        parsed[section_id] = Section(
            section_id=section_id,
            order=int(raw.get("order", index)),
            dependencies=frozenset(str(value) for value in dependencies.get("section_ids", [])),
            write_scopes=scopes,
            coupling=str(dependencies.get("integration_coupling", "LOW")),
            status=str(worker.get("status", "PLANNED")),
        )

    known = set(parsed)
    for section in parsed.values():
        unknown = section.dependencies - known
        if unknown:
            raise ValueError(
                f"{section.section_id} depends on unknown section(s): {', '.join(sorted(unknown))}"
            )
        if section.section_id in section.dependencies:
            raise ValueError(f"{section.section_id} cannot depend on itself")
    return parsed


def topological_layers(sections: dict[str, Section]) -> list[list[Section]]:
    complete = {sid for sid, section in sections.items() if section.status == "COMPLETE"}
    blocked = {sid for sid, section in sections.items() if section.status == "BLOCKED"}
    remaining = {
        sid
        for sid, section in sections.items()
        if section.status not in {"COMPLETE", "BLOCKED"}
    }
    resolved = set(complete)
    layers: list[list[Section]] = []

    while remaining:
        ready_ids = [
            sid
            for sid in remaining
            if sections[sid].dependencies <= resolved
        ]
        if not ready_ids:
            blocked_by = {
                sid: sorted(sections[sid].dependencies - resolved)
                for sid in sorted(remaining)
            }
            details = "; ".join(f"{sid}<-{deps}" for sid, deps in blocked_by.items())
            if any(set(deps) & blocked for deps in blocked_by.values()):
                raise ValueError(f"unschedulable because dependency is BLOCKED: {details}")
            raise ValueError(f"dependency cycle or unsatisfied graph: {details}")

        ready = sorted((sections[sid] for sid in ready_ids), key=lambda item: (item.order, item.section_id))
        layers.append(ready)
        for section in ready:
            remaining.remove(section.section_id)
            resolved.add(section.section_id)

    return layers


def partition_parallel(layer: list[Section]) -> list[list[Section]]:
    groups: list[list[Section]] = []
    for section in layer:
        placed = False
        for group in groups:
            if all(not sections_conflict(section, member) for member in group):
                group.append(section)
                placed = True
                break
        if not placed:
            groups.append([section])
    return groups


def build_plan(data: dict[str, Any]) -> dict[str, Any]:
    sections = parse_sections(data)
    layers = topological_layers(sections)
    waves: list[dict[str, Any]] = []

    for wave_index, layer in enumerate(layers, start=1):
        groups = partition_parallel(layer)
        waves.append(
            {
                "wave": wave_index,
                "groups": [
                    {
                        "recommended_parallel_group": f"wave-{wave_index:02d}-{chr(97 + group_index)}",
                        "sections": [section.section_id for section in group],
                    }
                    for group_index, group in enumerate(groups)
                ],
            }
        )

    return {
        "reference_id": data.get("reference_id", ""),
        "page_id": data.get("page_id", ""),
        "foundation_commit": data.get("foundation_commit", ""),
        "waves": waves,
        "completed_sections": sorted(
            sid for sid, section in sections.items() if section.status == "COMPLETE"
        ),
        "blocked_sections": sorted(
            sid for sid, section in sections.items() if section.status == "BLOCKED"
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Plan safe section implementation waves")
    parser.add_argument("manifest", type=Path, help="section-manifest.yaml path")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = parser.parse_args()

    path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    plan = build_plan(load_yaml(path))

    if args.json:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0

    print(f"Reference: {plan['reference_id']}  Page: {plan['page_id']}")
    for wave in plan["waves"]:
        print(f"Wave {wave['wave']}")
        for group in wave["groups"]:
            joined = ", ".join(group["sections"])
            print(f"  {group['recommended_parallel_group']}: {joined}")
    if plan["blocked_sections"]:
        print("Blocked: " + ", ".join(plan["blocked_sections"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
