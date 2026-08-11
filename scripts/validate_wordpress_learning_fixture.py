#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
DEFAULT_ACF_EXPORT = ROOT / "experiments" / "ref001-wordpress-acf" / "artifacts" / "acf-export.json"
TEMPLATE_RELATIVE_PATH = "page-templates/template-ref001.php"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate_fixture(fixture: Path = DEFAULT_FIXTURE, acf_export: Path = DEFAULT_ACF_EXPORT) -> list[str]:
    errors: list[str] = []
    required = [
        fixture / "style.css",
        fixture / "functions.php",
        fixture / "header.php",
        fixture / "footer.php",
        fixture / "index.php",
        fixture / TEMPLATE_RELATIVE_PATH,
        fixture / "template-parts" / "ref001" / "main-visual.php",
        fixture / "template-parts" / "ref001" / "reason.php",
        fixture / "assets" / "css" / "ref001.css",
        fixture / "README.md",
    ]
    missing = [path for path in required if not path.is_file()]
    if missing:
        errors.extend(f"missing fixture file: {path}" for path in missing)
        return errors

    source_files = sorted(fixture.rglob("*.php")) + sorted(fixture.rglob("*.css"))
    sources = {path: read_text(path) for path in source_files}
    joined = "\n".join(sources.values())

    if "figma.com/api/mcp/asset" in joined:
        errors.append("fixture must not commit expiring Figma MCP asset URLs")

    repeater_patterns = {
        "have_rows(": "have_rows()",
        "the_row(": "the_row()",
        "get_sub_field(": "get_sub_field()",
    }
    for token, label in repeater_patterns.items():
        if token in joined:
            errors.append(f"fixed-cardinality learning baseline must not use ACF Repeater API: {label}")

    template_path = fixture / TEMPLATE_RELATIVE_PATH
    template = read_text(template_path)
    if "Template Name:" not in template:
        errors.append("learning Page template must declare Template Name")
    if not re.search(r"Template\s+Post\s+Type:\s*page\b", template, flags=re.IGNORECASE):
        errors.append("learning Page template must declare Template Post Type: page")

    functions = read_text(fixture / "functions.php")
    if TEMPLATE_RELATIVE_PATH not in functions or "is_page_template" not in functions:
        errors.append("fixture asset enqueue must target the canonical REF-001 Page template")
    if "wp_get_attachment_image(" not in functions:
        errors.append("fixture images must use the WordPress attachment image helper")

    if not acf_export.is_file():
        errors.append(f"missing ACF export: {acf_export}")
        return errors

    try:
        export = json.loads(read_text(acf_export))
    except Exception as exc:
        errors.append(f"cannot load ACF export: {exc}")
        return errors

    if not isinstance(export, list) or not export or not isinstance(export[0], dict):
        errors.append("ACF export must contain a field group array")
        return errors

    group = export[0]
    location_values: list[str] = []
    for and_group in group.get("location", []):
        if not isinstance(and_group, list):
            continue
        for rule in and_group:
            if isinstance(rule, dict) and rule.get("param") == "page_template":
                location_values.append(str(rule.get("value", "")))
    if TEMPLATE_RELATIVE_PATH not in location_values:
        errors.append("ACF page_template location must match the learning fixture template path")

    fields = group.get("fields", [])
    if not isinstance(fields, list):
        errors.append("ACF field group fields must be an array")
        return errors

    by_name = {
        str(field.get("name", "")): field
        for field in fields
        if isinstance(field, dict) and field.get("name")
    }
    expected_reason_fields = {
        f"reason_{index}_{suffix}"
        for index in (1, 2, 3)
        for suffix in ("image", "title", "body")
    }
    missing_reason = sorted(expected_reason_fields - set(by_name))
    if missing_reason:
        errors.append("fixed three-card ACF contract missing fields: " + ", ".join(missing_reason))

    for name, field in by_name.items():
        if field.get("type") == "image" and field.get("return_format") != "id":
            errors.append(f"ACF image field {name} must return attachment ID in the learning baseline")

    css = read_text(fixture / "assets" / "css" / "ref001.css")
    if "FIXTURE-ONLY" not in css or "@media (max-width: 600px)" not in css:
        errors.append("temporary responsive switch must remain explicitly labeled FIXTURE-ONLY")

    return errors


def main() -> int:
    errors = validate_fixture()
    if errors:
        print("FAIL experiments/ref001-wordpress-acf/fixture-theme")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS experiments/ref001-wordpress-acf/fixture-theme")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
