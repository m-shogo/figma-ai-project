#!/usr/bin/env python3
from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path, PurePosixPath
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"READY", "RUNNING", "COMPLETE"}
GLOB_CHARS = set("*?[]{}")


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def normalize(value: str) -> PurePosixPath:
    raw = value.strip().replace("\\", "/")
    if not raw:
        raise ValueError("empty allowed path")
    if any(char in raw for char in GLOB_CHARS):
        raise ValueError(
            f"allowed path must be an exact file/directory ownership root, not a glob: {value}"
        )
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


def find_dependency_cycle(graph: dict[str, set[str]]) -> list[str] | None:
    visiting: set[str] = set()
    visited: set[str] = set()
    stack: list[str] = []

    def visit(node: str) -> list[str] | None:
        if node in visited:
            return None
        if node in visiting:
            start = stack.index(node)
            return stack[start:] + [node]

        visiting.add(node)
        stack.append(node)
        for dependency in graph.get(node, set()):
            cycle = visit(dependency)
            if cycle:
                return cycle
        stack.pop()
        visiting.remove(node)
        visited.add(node)
        return None

    for node in graph:
        cycle = visit(node)
        if cycle:
            return cycle
    return None


def load_linked_contract(data: dict[str, Any]) -> dict[str, Any] | None:
    value = str(data.get("shared_contract", "")).strip()
    if not value:
        return None
    candidate = (ROOT / value).resolve()
    if ROOT != candidate and ROOT not in candidate.parents:
        return None
    if not candidate.is_file():
        return None
    try:
        return load_yaml(candidate)
    except Exception:
        # validate_records.py owns malformed/missing linked-contract errors.
        return None


def _collect_paths(values: list[Any], *, label: str, errors: list[str]) -> list[tuple[str, PurePosixPath]]:
    collected: list[tuple[str, PurePosixPath]] = []
    for raw in values:
        text = str(raw).strip()
        if not text:
            continue
        try:
            collected.append((label, normalize(text)))
        except ValueError as exc:
            errors.append(f"protected path {label}: {exc}")
    return collected


def protected_paths(data: dict[str, Any], contract: dict[str, Any] | None, errors: list[str]) -> list[tuple[str, PurePosixPath]]:
    """Return coordinator/shared roots that section workers must not own."""
    protected: list[tuple[str, PurePosixPath]] = []

    integration_path = str(data.get("integration", {}).get("root_composition_path", "")).strip()
    if integration_path:
        protected.extend(_collect_paths([integration_path], label="section-manifest root composition", errors=errors))

    if contract is None:
        return protected

    codebase = contract.get("codebase", {})
    parallel = contract.get("parallel_execution", {})
    foundation = contract.get("foundation", {})
    integration = contract.get("integration", {})

    protected.extend(
        _collect_paths(
            parallel.get("coordinator_only_paths", []),
            label="explicit coordinator-only",
            errors=errors,
        )
    )
    protected.extend(
        _collect_paths(
            codebase.get("global_style_paths", []),
            label="global style",
            errors=errors,
        )
    )
    protected.extend(
        _collect_paths(codebase.get("token_paths", []), label="token source", errors=errors)
    )
    protected.extend(
        _collect_paths(
            codebase.get("shared_component_paths", []),
            label="shared component",
            errors=errors,
        )
    )
    protected.extend(
        _collect_paths(
            codebase.get("design_system_paths", []),
            label="design system",
            errors=errors,
        )
    )
    protected.extend(
        _collect_paths(
            foundation.get("changed_paths", []),
            label="verified foundation",
            errors=errors,
        )
    )

    contract_root = str(integration.get("root_composition_path", "")).strip()
    if contract_root:
        protected.extend(
            _collect_paths([contract_root], label="shared-contract root composition", errors=errors)
        )

    # Deduplicate identical roots while retaining the first, most specific label.
    deduped: dict[str, tuple[str, PurePosixPath]] = {}
    for label, path in protected:
        deduped.setdefault(path.as_posix(), (label, path))
    return list(deduped.values())


def validate_manifest(path: Path) -> list[str]:
    data = load_yaml(path)
    errors: list[str] = []
    sections = data.get("sections", [])
    ids = [str(section.get("section_id", "")) for section in sections]
    known_ids = {section_id for section_id in ids if section_id}

    contract = load_linked_contract(data)
    protected = protected_paths(data, contract, errors)

    graph: dict[str, set[str]] = {}
    group_members: dict[str, list[str]] = defaultdict(list)
    group_paths: dict[str, list[tuple[str, PurePosixPath]]] = defaultdict(list)
    coupling: dict[str, str] = {}

    for i, section in enumerate(sections):
        section_id = str(section.get("section_id", f"index-{i}"))
        worker = section.get("worker", {})
        status = worker.get("status")
        group = str(worker.get("parallel_group", "")).strip()
        implementation = section.get("implementation", {})
        raw_paths = implementation.get("allowed_paths", [])
        dependencies = section.get("dependencies", {})
        section_dependencies = {str(value) for value in dependencies.get("section_ids", [])}
        coupling_level = str(dependencies.get("integration_coupling", "LOW"))
        coupling[section_id] = coupling_level
        graph[section_id] = section_dependencies

        if section_id in section_dependencies:
            errors.append(f"sections[{i}] {section_id}: section cannot depend on itself")

        for dependency in sorted(section_dependencies):
            if dependency not in known_ids:
                errors.append(
                    f"sections[{i}] {section_id}: dependency references unknown section {dependency}"
                )

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

        if status in ACTIVE:
            for allowed in normalized:
                for protected_label, protected_path in protected:
                    if path_overlaps(allowed, protected_path):
                        errors.append(
                            f"sections[{i}] {section_id}: allowed path {allowed.as_posix()} overlaps "
                            f"protected {protected_label} path {protected_path.as_posix()}"
                        )

        if status in ACTIVE and group:
            group_members[group].append(section_id)
            for allowed in normalized:
                group_paths[group].append((section_id, allowed))

    cycle = find_dependency_cycle(graph)
    if cycle:
        errors.append("section dependency cycle: " + " -> ".join(cycle))

    for group, members in sorted(group_members.items()):
        member_set = set(members)
        if len(member_set) > 1:
            for section_id in sorted(member_set):
                if coupling.get(section_id) == "HIGH":
                    errors.append(
                        f"parallel group {group}: HIGH-coupling section {section_id} "
                        "must be isolated or explicitly reclassified after review"
                    )
                conflicting_dependencies = graph.get(section_id, set()) & member_set
                for dependency in sorted(conflicting_dependencies):
                    errors.append(
                        f"parallel group {group}: {section_id} depends on {dependency}; "
                        "dependent sections cannot execute concurrently"
                    )

    for group, ownership in sorted(group_paths.items()):
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
