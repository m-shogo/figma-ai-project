#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-content.yaml"
ACF_EXPORT_PATH = ROOT / "experiments" / "ref001-wordpress-acf" / "artifacts" / "acf-export.json"


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def load_export(path: Path) -> list[dict[str, Any]]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, list) or not value or not all(isinstance(item, dict) for item in value):
        raise ValueError("ACF export must be a non-empty top-level array of objects")
    return value


def field_index(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for item in items:
        fields = item.get("fields", [])
        if not isinstance(fields, list):
            continue
        for field in fields:
            if not isinstance(field, dict):
                continue
            name = str(field.get("name", "")).strip()
            key = str(field.get("key", "")).strip()
            if not name or not key:
                continue
            if name in index:
                raise ValueError(f"duplicate ACF field name in export: {name}")
            index[name] = field
    return index


def normalize_page(page: dict[str, Any]) -> dict[str, Any]:
    required = ("post_type", "title", "slug", "status", "template_placeholder")
    missing = [key for key in required if not str(page.get(key, "")).strip()]
    if missing:
        raise ValueError("fixture page is missing: " + ", ".join(missing))
    if page["post_type"] != "page":
        raise ValueError("REF-001 learning seed only supports post_type=page")
    return {
        "post_type": "page",
        "title": str(page["title"]),
        "slug": str(page["slug"]),
        "status": str(page["status"]),
        "template": str(page["template_placeholder"]),
    }


def field_row(name: str, value: Any, source: str, index: dict[str, dict[str, Any]]) -> dict[str, Any]:
    field = index.get(name)
    if field is None:
        raise ValueError(f"fixture content references unknown ACF field: {name}")
    key = str(field.get("key", "")).strip()
    field_type = str(field.get("type", "")).strip()
    if not key.startswith("field_"):
        raise ValueError(f"ACF field {name} does not have a stable field_ key")
    return {
        "field_key": key,
        "field_name": name,
        "field_type": field_type,
        "source": source,
        "status": "UNRESOLVED" if value is None else "READY",
        "value": value,
    }


def build_payload(content_path: Path = CONTENT_PATH, acf_export_path: Path = ACF_EXPORT_PATH) -> dict[str, Any]:
    content = load_yaml(content_path)
    export = load_export(acf_export_path)
    index = field_index(export)

    values = content.get("acf_values", {})
    media = content.get("media_placeholders", {})
    if not isinstance(values, dict) or not isinstance(media, dict):
        raise ValueError("fixture content acf_values/media_placeholders must be objects")

    fields: list[dict[str, Any]] = []
    for name, value in values.items():
        fields.append(field_row(str(name), value, "acf_values", index))

    for name, metadata in media.items():
        if not isinstance(metadata, dict):
            raise ValueError(f"media placeholder {name} must be an object")
        row = field_row(str(name), metadata.get("wp_attachment_id"), "media_placeholders", index)
        if row["field_type"] != "image":
            raise ValueError(f"media placeholder {name} must map to an ACF image field")
        row["figma_evidence"] = {
            key: value
            for key, value in metadata.items()
            if key.startswith("figma_") or key == "desired_role"
        }
        fields.append(row)

    fields.sort(key=lambda row: row["field_name"])
    reference_id = str(content.get("reference_id", "")).strip()
    if not reference_id:
        raise ValueError("fixture content reference_id is required")

    return {
        "schema_version": 1,
        "reference_id": reference_id,
        "purpose": "DISPOSABLE_WORDPRESS_FIRST_PASS_SEED",
        "source": {
            "fixture_content": content_path.relative_to(ROOT).as_posix() if content_path.is_relative_to(ROOT) else str(content_path),
            "fixture_content_sha256": file_sha256(content_path),
            "acf_export": acf_export_path.relative_to(ROOT).as_posix() if acf_export_path.is_relative_to(ROOT) else str(acf_export_path),
            "acf_export_sha256": file_sha256(acf_export_path),
        },
        "page": normalize_page(content.get("page", {})),
        "fields": fields,
        "summary": {
            "ready_field_count": sum(1 for row in fields if row["status"] == "READY"),
            "unresolved_field_count": sum(1 for row in fields if row["status"] == "UNRESOLVED"),
        },
    }


def render_payload(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a deterministic WordPress/ACF seed payload from REF-001 fixture content and stable ACF field keys"
    )
    parser.add_argument("--output", type=Path, help="write generated payload to this path; defaults to stdout")
    parser.add_argument("--check", type=Path, help="fail if this committed payload differs from a fresh build")
    args = parser.parse_args()

    rendered = render_payload(build_payload())

    if args.check:
        check_path = args.check if args.check.is_absolute() else ROOT / args.check
        if not check_path.is_file():
            print(f"FAIL missing seed payload: {check_path}")
            return 1
        if check_path.read_text(encoding="utf-8") != rendered:
            print(f"FAIL stale seed payload: {check_path}")
            return 1
        print(f"PASS {check_path.relative_to(ROOT)}")
        return 0

    if args.output:
        output = args.output if args.output.is_absolute() else ROOT / args.output
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding="utf-8")
        print(f"WROTE {output.relative_to(ROOT) if output.is_relative_to(ROOT) else output}")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
