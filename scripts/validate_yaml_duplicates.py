#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]


class UniqueKeyLoader(yaml.SafeLoader):
    pass


def construct_mapping(loader: UniqueKeyLoader, node: yaml.MappingNode, deep: bool = False) -> dict[Any, Any]:
    loader.flatten_mapping(node)
    mapping: dict[Any, Any] = {}
    seen: set[Any] = set()
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        try:
            duplicate = key in seen
        except TypeError as exc:
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"found unhashable mapping key: {key!r}",
                key_node.start_mark,
            ) from exc
        if duplicate:
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"found duplicate key: {key!r}",
                key_node.start_mark,
            )
        seen.add(key)
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


UniqueKeyLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    construct_mapping,
)


def candidate_files() -> list[Path]:
    paths: list[Path] = []
    for base_name in ("templates", "policies", "references", "contracts", "experiments", "research"):
        base = ROOT / base_name
        if not base.exists():
            continue
        paths.extend(base.rglob("*.yaml"))
        paths.extend(base.rglob("*.yml"))

    workflows = ROOT / ".github" / "workflows"
    if workflows.exists():
        paths.extend(workflows.rglob("*.yaml"))
        paths.extend(workflows.rglob("*.yml"))

    return sorted(set(paths))


def validate_file(path: Path) -> list[str]:
    try:
        yaml.load(path.read_text(encoding="utf-8"), Loader=UniqueKeyLoader)
    except yaml.YAMLError as exc:
        return [str(exc)]
    return []


def main() -> int:
    failures = 0
    for path in candidate_files():
        errors = validate_file(path)
        relative = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {relative} yaml-unique-keys")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {relative} yaml-unique-keys")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
