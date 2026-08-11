#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Iterable

from validate_acf_export import validate_export

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = ROOT / "experiments" / "ref001-wordpress-acf" / "artifacts"
SOURCE_EXPORTS = (
    ARTIFACT_DIR / "acf-export.json",
    ARTIFACT_DIR / "courses.acf-export.json",
)
DEFAULT_OUTPUT = ARTIFACT_DIR / "acf-import-bundle.json"


def load_export(path: Path) -> list[dict[str, Any]]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, list) or not all(isinstance(item, dict) for item in value):
        raise ValueError(f"ACF source export must be an array of objects: {path}")
    return value


def iter_fields(fields: Iterable[Any]) -> Iterable[dict[str, Any]]:
    for field in fields:
        if not isinstance(field, dict):
            continue
        yield field
        sub_fields = field.get("sub_fields")
        if isinstance(sub_fields, list):
            yield from iter_fields(sub_fields)
        layouts = field.get("layouts")
        if isinstance(layouts, dict):
            layout_values = layouts.values()
        elif isinstance(layouts, list):
            layout_values = layouts
        else:
            layout_values = ()
        for layout in layout_values:
            if isinstance(layout, dict) and isinstance(layout.get("sub_fields"), list):
                yield from iter_fields(layout["sub_fields"])


def validate_bundle_identity(items: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    seen_group_keys: set[str] = set()
    seen_field_keys: set[str] = set()
    seen_field_names: set[str] = set()

    for item in items:
        group_key = str(item.get("key", "")).strip()
        if group_key in seen_group_keys:
            errors.append(f"duplicate field-group key across bundle sources: {group_key}")
        elif group_key:
            seen_group_keys.add(group_key)

        for field in iter_fields(item.get("fields", [])):
            field_key = str(field.get("key", "")).strip()
            field_name = str(field.get("name", "")).strip()
            if field_key:
                if field_key in seen_field_keys:
                    errors.append(f"duplicate field key across bundle sources: {field_key}")
                seen_field_keys.add(field_key)
            if field_name:
                if field_name in seen_field_names:
                    errors.append(f"duplicate field name across bundle sources: {field_name}")
                seen_field_names.add(field_name)
    return errors


def build_bundle(source_exports: Iterable[Path] = SOURCE_EXPORTS) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for path in source_exports:
        if not path.is_file():
            raise ValueError(f"missing ACF source export: {path}")
        items.extend(load_export(path))

    errors = [*validate_export(items), *validate_bundle_identity(items)]
    if errors:
        raise ValueError("invalid REF-001 ACF import bundle: " + "; ".join(errors))
    return items


def render_bundle(items: list[dict[str, Any]]) -> str:
    return json.dumps(items, ensure_ascii=False, indent=2) + "\n"


def display_path(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return str(path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build one importable ACF JSON containing the scoped REF-001 field groups"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="output JSON path (default: committed REF-001 import bundle)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify the output already matches the deterministic source exports",
    )
    args = parser.parse_args()

    output = args.output if args.output.is_absolute() else ROOT / args.output
    rendered = render_bundle(build_bundle())

    if args.check:
        if not output.is_file():
            print(f"FAIL missing REF-001 ACF import bundle: {display_path(output)}")
            return 1
        if output.read_text(encoding="utf-8") != rendered:
            print(f"FAIL stale REF-001 ACF import bundle: {display_path(output)}")
            return 1
        print(f"PASS {display_path(output)} matches scoped source exports")
        return 0

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8")
    print(f"WROTE {display_path(output)} with {len(json.loads(rendered))} field groups")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
