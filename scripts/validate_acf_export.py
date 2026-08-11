#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def load_export(path: Path) -> list[dict[str, Any]]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, list):
        raise ValueError("ACF delivery export must be a top-level JSON array")
    if not value:
        raise ValueError("ACF delivery export must contain at least one item")
    if not all(isinstance(item, dict) for item in value):
        raise ValueError("every ACF export item must be an object")
    return value


def layout_entries(layouts: Any) -> list[tuple[str, Any]]:
    if layouts is None:
        return []
    if isinstance(layouts, list):
        return [(str(index), value) for index, value in enumerate(layouts)]
    if isinstance(layouts, dict):
        return [(str(key), value) for key, value in layouts.items()]
    return [("<invalid>", layouts)]


def validate_fields(fields: list[Any], *, seen_keys: set[str], path: str) -> list[str]:
    errors: list[str] = []
    for index, field in enumerate(fields):
        label = f"{path}[{index}]"
        if not isinstance(field, dict):
            errors.append(f"{label} must be an object")
            continue
        key = str(field.get("key", "")).strip()
        field_type = str(field.get("type", "")).strip()
        field_label = str(field.get("label", "")).strip()
        if not key.startswith("field_"):
            errors.append(f"{label}.key must be a stable ACF field_ key")
        elif key in seen_keys:
            errors.append(f"duplicate ACF field key: {key}")
        else:
            seen_keys.add(key)
        if not field_type:
            errors.append(f"{label}.type is required")
        if not field_label:
            errors.append(f"{label}.label is required")

        sub_fields = field.get("sub_fields")
        if sub_fields is not None:
            if not isinstance(sub_fields, list):
                errors.append(f"{label}.sub_fields must be an array")
            else:
                errors.extend(validate_fields(sub_fields, seen_keys=seen_keys, path=f"{label}.sub_fields"))

        layouts = field.get("layouts")
        for layout_key, layout in layout_entries(layouts):
            layout_label = f"{label}.layouts[{layout_key}]"
            if not isinstance(layout, dict):
                errors.append(f"{layout_label} must be an object")
                continue
            layout_fields = layout.get("sub_fields", [])
            if not isinstance(layout_fields, list):
                errors.append(f"{layout_label}.sub_fields must be an array")
            else:
                errors.extend(
                    validate_fields(
                        layout_fields,
                        seen_keys=seen_keys,
                        path=f"{layout_label}.sub_fields",
                    )
                )
    return errors


def validate_export(items: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    seen_item_keys: set[str] = set()
    seen_field_keys: set[str] = set()
    field_group_count = 0

    for index, item in enumerate(items):
        label = f"items[{index}]"
        key = str(item.get("key", "")).strip()
        if not key:
            errors.append(f"{label}.key is required")
            continue
        if key in seen_item_keys:
            errors.append(f"duplicate ACF item key: {key}")
        seen_item_keys.add(key)

        if key.startswith("group_"):
            field_group_count += 1
            if not str(item.get("title", "")).strip():
                errors.append(f"{label}.title is required for a field group")
            fields = item.get("fields")
            if not isinstance(fields, list):
                errors.append(f"{label}.fields must be an array for a field group")
            else:
                errors.extend(validate_fields(fields, seen_keys=seen_field_keys, path=f"{label}.fields"))
            location = item.get("location")
            if not isinstance(location, list) or not location:
                errors.append(f"{label}.location must contain at least one field-group location rule")

    if field_group_count == 0:
        errors.append("ACF delivery export must contain at least one field group (group_*)")
    return errors


def validate_path(path: Path) -> list[str]:
    if path.suffix.lower() != ".json":
        return ["ACF export file must use the .json extension"]
    if not path.is_file():
        return [f"ACF export file does not exist: {path}"]
    try:
        items = load_export(path)
    except Exception as exc:
        return [str(exc)]
    return validate_export(items)


def candidate_paths() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.json")):
            if (
                path.name == "acf-export.json"
                or path.name.endswith(".acf-export.json")
                or path.name == "acf-import-bundle.json"
            ):
                found.append(path)
    return list(dict.fromkeys(found))


def display_path(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return str(path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate portable ACF export JSON delivered with WordPress/ACF implementations"
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="ACF export JSON paths; when omitted, validate all repository ACF export/bundle artifacts",
    )
    args = parser.parse_args()

    paths = args.paths or candidate_paths()
    if not paths:
        print("PASS no ACF export artifacts found")
        return 0

    failures = 0
    for path in paths:
        candidate = path if path.is_absolute() else ROOT / path
        errors = validate_path(candidate)
        label = display_path(candidate)
        if errors:
            failures += 1
            print(f"FAIL {label}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {label}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
