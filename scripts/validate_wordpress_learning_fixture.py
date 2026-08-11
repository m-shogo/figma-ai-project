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
    education_part = fixture / "template-parts" / "ref001" / "education.php"
    education_css = fixture / "assets" / "css" / "ref001-education.css"
    visual_parts = [
        "main-visual",
        "reason",
        "education",
        "cta",
        "student-voice",
        "messages",
        "courses",
        "links",
        "cta-value",
    ]
    visual_styles = [
        "ref001.css",
        "ref001-shell.css",
        "ref001-education.css",
        "ref001-middle.css",
        "ref001-messages.css",
        "ref001-courses.css",
        "ref001-bottom.css",
        "ref001-visual-fixtures.css",
    ]

    required = [
        fixture / "style.css",
        fixture / "functions.php",
        fixture / "header.php",
        fixture / "footer.php",
        fixture / "index.php",
        fixture / TEMPLATE_RELATIVE_PATH,
        fixture / "README.md",
    ]
    required.extend(fixture / "template-parts" / "ref001" / f"{name}.php" for name in visual_parts)
    required.extend(fixture / "assets" / "css" / name for name in visual_styles)

    missing = [path for path in required if not path.is_file()]
    if missing:
        errors.extend(f"missing fixture file: {path}" for path in missing)
        return errors

    source_files = sorted(fixture.rglob("*.php")) + sorted(fixture.rglob("*.css"))
    sources = {path: read_text(path) for path in source_files}
    joined = "\n".join(sources.values())

    if "figma.com/api/mcp/asset" in joined:
        errors.append("fixture must not commit expiring Figma MCP asset URLs")
    if "truncated for brevity" in joined:
        errors.append("visual fixture must not contain truncated/incomplete embedded asset data")

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
    if 'data-fixture-completeness="partial"' not in template:
        errors.append("visual-first fixture must remain explicitly partial until screenshot QA freezes First Pass")

    expected_sequence = [
        "main-visual",
        "reason",
        "education",
        "cta",
        "student-voice",
        "messages",
        "cta",
        "courses",
        "links",
        "cta-value",
    ]
    cursor = 0
    for name in expected_sequence:
        token = f"get_template_part( 'template-parts/ref001/{name}' )"
        found = template.find(token, cursor)
        if found < 0:
            errors.append(f"visual-first Page sequence missing or out of order: {name}")
            break
        cursor = found + len(token)

    functions = read_text(fixture / "functions.php")
    if TEMPLATE_RELATIVE_PATH not in functions or "is_page_template" not in functions:
        errors.append("fixture asset enqueue must target the canonical REF-001 Page template")
    if "wp_get_attachment_image(" not in functions:
        errors.append("fixture images must use the WordPress attachment image helper")
    for stylesheet in visual_styles:
        if f"assets/css/{stylesheet}" not in functions:
            errors.append(f"visual-first fixture stylesheet is not enqueued: {stylesheet}")

    education_source = read_text(education_part)
    for number, label in (("01", "スタート"), ("02", "学ぶ"), ("03", "出会う"), ("04", "ゴール")):
        if f"'number' => '{number}'" not in education_source or f"'label' => '{label}'" not in education_source:
            errors.append(f"Education code-owned stage contract missing {number}/{label}")

    student_voice = read_text(fixture / "template-parts" / "ref001" / "student-voice.php")
    if "accordion" in student_voice.lower() or "addEventListener" in student_voice:
        errors.append("Student Voice visual First Pass must not invent accordion behavior")
    if student_voice.count("'open' => true") != 1 or student_voice.count("'open' => false") != 2:
        errors.append("Student Voice must preserve Figma state: one open item and two collapsed items")

    messages = read_text(fixture / "template-parts" / "ref001" / "messages.php")
    if "1 / 4" not in messages or "carousel" in messages.lower() or "swiper" in messages.lower():
        errors.append("Messages must preserve static 1 / 4 Figma evidence without inventing carousel implementation")

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

    expected_education_fields = {"education_intro"}
    bullet_counts = {1: 4, 2: 3, 3: 3, 4: 3}
    for stage, count in bullet_counts.items():
        expected_education_fields.update({f"education_{stage}_image", f"education_{stage}_title"})
        expected_education_fields.update(f"education_{stage}_bullet_{index}" for index in range(1, count + 1))
    missing_education = sorted(expected_education_fields - set(by_name))
    if missing_education:
        errors.append("fixed four-stage Education ACF contract missing fields: " + ", ".join(missing_education))

    forbidden_editor_stage_fields = {
        f"education_{stage}_{suffix}"
        for stage in (1, 2, 3, 4)
        for suffix in ("number", "label", "order")
    }
    leaked_stage_contract = sorted(forbidden_editor_stage_fields & set(by_name))
    if leaked_stage_contract:
        errors.append(
            "Education stage identity/order must remain code-owned, not ACF-editable: "
            + ", ".join(leaked_stage_contract)
        )

    for name, field in by_name.items():
        if field.get("type") == "image" and field.get("return_format") != "id":
            errors.append(f"ACF image field {name} must return attachment ID in the learning baseline")

    css = read_text(fixture / "assets" / "css" / "ref001.css")
    if "FIXTURE-ONLY" not in css or "@media (max-width: 600px)" not in css:
        errors.append("temporary responsive switch must remain explicitly labeled FIXTURE-ONLY")

    education_styles = read_text(education_css)
    if "FIXTURE-ONLY" not in education_styles or "@media (max-width: 600px)" not in education_styles:
        errors.append("Education responsive switch must remain explicitly labeled FIXTURE-ONLY")
    if "grid-template-columns: repeat(4, 281px)" not in education_styles or "gap: 40px" not in education_styles:
        errors.append("Education PC First Pass must retain measured four-card 281px/40px layout evidence")
    if "width: 335px" not in education_styles or "width: 140px" not in education_styles or "height: 79px" not in education_styles:
        errors.append("Education SP First Pass must retain measured card/media geometry evidence")

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
