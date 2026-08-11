#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any, Sequence

import yaml

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-content.yaml"
COURSES_CONTENT_PATH = ROOT / "experiments" / "ref001-wordpress-acf" / "courses-fixture-content.yaml"
ACF_EXPORT_PATH = ROOT / "experiments" / "ref001-wordpress-acf" / "artifacts" / "acf-export.json"
COURSES_ACF_EXPORT_PATH = ROOT / "experiments" / "ref001-wordpress-acf" / "artifacts" / "courses.acf-export.json"
DEFAULT_CONTENT_PATHS = (CONTENT_PATH, COURSES_CONTENT_PATH)
DEFAULT_ACF_EXPORT_PATHS = (ACF_EXPORT_PATH, COURSES_ACF_EXPORT_PATH)


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
        raise ValueError(f"ACF export must be a non-empty top-level array of objects: {path}")
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
                raise ValueError(f"duplicate ACF field name across exports: {name}")
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


def display_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix() if path.is_relative_to(ROOT) else str(path)


def merge_content_documents(paths: Sequence[Path]) -> tuple[str, dict[str, Any], dict[str, Any], dict[str, Any]]:
    reference_id = ""
    page: dict[str, Any] | None = None
    values: dict[str, Any] = {}
    media: dict[str, Any] = {}

    for path in paths:
        document = load_yaml(path)
        current_reference = str(document.get("reference_id", "")).strip()
        if not current_reference:
            raise ValueError(f"fixture content reference_id is required: {path}")
        if reference_id and current_reference != reference_id:
            raise ValueError(
                f"fixture content reference_id mismatch: {current_reference} != {reference_id} ({path})"
            )
        reference_id = current_reference

        raw_page = document.get("page")
        if raw_page is not None:
            if not isinstance(raw_page, dict):
                raise ValueError(f"fixture content page must be an object: {path}")
            if page is not None and raw_page != page:
                raise ValueError(f"multiple fixture content files define conflicting page metadata: {path}")
            page = raw_page

        for block_name, target in (("acf_values", values), ("media_placeholders", media)):
            block = document.get(block_name, {})
            if not isinstance(block, dict):
                raise ValueError(f"fixture content {block_name} must be an object: {path}")
            for name, value in block.items():
                if name in target:
                    raise ValueError(f"duplicate fixture content field across sources: {name}")
                target[str(name)] = value

    if not reference_id:
        raise ValueError("at least one fixture content source is required")
    if page is None:
        raise ValueError("one fixture content source must define page metadata")
    return reference_id, page, values, media


def build_payload(
    content_paths: Sequence[Path] | None = None,
    acf_export_paths: Sequence[Path] | None = None,
) -> dict[str, Any]:
    content_paths = tuple(content_paths or DEFAULT_CONTENT_PATHS)
    acf_export_paths = tuple(acf_export_paths or DEFAULT_ACF_EXPORT_PATHS)

    reference_id, page, values, media = merge_content_documents(content_paths)
    export_items: list[dict[str, Any]] = []
    for path in acf_export_paths:
        export_items.extend(load_export(path))
    index = field_index(export_items)

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

    return {
        "schema_version": 2,
        "reference_id": reference_id,
        "purpose": "DISPOSABLE_WORDPRESS_FIRST_PASS_SEED",
        "sources": {
            "fixture_contents": [
                {"path": display_path(path), "sha256": file_sha256(path)} for path in content_paths
            ],
            "acf_exports": [
                {"path": display_path(path), "sha256": file_sha256(path)} for path in acf_export_paths
            ],
        },
        "page": normalize_page(page),
        "fields": fields,
        "summary": {
            "ready_field_count": sum(1 for row in fields if row["status"] == "READY"),
            "unresolved_field_count": sum(1 for row in fields if row["status"] == "UNRESOLVED"),
            "content_source_count": len(content_paths),
            "acf_export_count": len(acf_export_paths),
        },
    }


def render_payload(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a deterministic WordPress/ACF seed payload from modular REF-001 content fixtures and stable ACF field keys"
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
