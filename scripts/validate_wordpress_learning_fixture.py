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
    courses_part = fixture / "template-parts" / "ref001" / "courses.php"
    courses_css = fixture / "assets" / "css" / "ref001-courses.css"
    links_part = fixture / "template-parts" / "ref001" / "links.php"
    links_css = fixture / "assets" / "css" / "ref001-links.css"
    cta_value_part = fixture / "template-parts" / "ref001" / "cta-value.php"
    cta_value_css = fixture / "assets" / "css" / "ref001-cta-value.css"
    footer_css = fixture / "assets" / "css" / "ref001-footer.css"
    footer_logo_mark = fixture / "assets" / "images" / "ref001-footer-logo-mark.svg"
    required = [
        fixture / "style.css",
        fixture / "functions.php",
        fixture / "header.php",
        fixture / "footer.php",
        fixture / "index.php",
        fixture / TEMPLATE_RELATIVE_PATH,
        fixture / "template-parts" / "ref001" / "main-visual.php",
        fixture / "template-parts" / "ref001" / "reason.php",
        education_part,
        courses_part,
        links_part,
        cta_value_part,
        fixture / "assets" / "css" / "ref001.css",
        education_css,
        courses_css,
        links_css,
        cta_value_css,
        footer_css,
        footer_logo_mark,
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

    expected_template_parts = ("main-visual", "reason", "education", "courses", "links", "cta-value")
    for part in expected_template_parts:
        needle = f"get_template_part( 'template-parts/ref001/{part}' )"
        if needle not in template:
            errors.append(f"learning Page template must include the {part} template part")

    if 'data-fixture-completeness="partial"' not in template:
        errors.append("incomplete learning Page must remain explicitly marked data-fixture-completeness=partial")

    functions = read_text(fixture / "functions.php")
    if TEMPLATE_RELATIVE_PATH not in functions or "is_page_template" not in functions:
        errors.append("fixture asset enqueue must target the canonical REF-001 Page template")
    if "wp_get_attachment_image(" not in functions:
        errors.append("fixture images must use the WordPress attachment image helper")
    for stylesheet in (
        "assets/css/ref001-education.css",
        "assets/css/ref001-courses.css",
        "assets/css/ref001-links.css",
        "assets/css/ref001-cta-value.css",
        "assets/css/ref001-footer.css",
    ):
        if stylesheet not in functions:
            errors.append(f"fixture must enqueue stylesheet through WordPress: {stylesheet}")

    education_source = read_text(education_part)
    for number, label in (("01", "スタート"), ("02", "学ぶ"), ("03", "出会う"), ("04", "ゴール")):
        if f"'number' => '{number}'" not in education_source or f"'label' => '{label}'" not in education_source:
            errors.append(f"Education code-owned stage contract missing {number}/{label}")

    courses_source = read_text(courses_part)
    expected_courses = (
        "公務員コース",
        "会計コース",
        "ビジネス経営コース",
        "金融コース",
        "教職コース",
        "学芸員コース",
        "ITコース",
    )
    for title in expected_courses:
        if title not in courses_source:
            errors.append(f"Courses fixed-domain contract missing: {title}")
    if "<a " in courses_source or "href=" in courses_source:
        errors.append("Courses First Pass must not invent course links before URL ownership is resolved")

    links_source = read_text(links_part)
    if 'data-interaction-status="deferred"' not in links_source:
        errors.append("Links visual pass must explicitly defer destination integration")
    if "<a " in links_source or "href=" in links_source:
        errors.append("Links visual pass must not invent href values")

    cta_source = read_text(cta_value_part)
    if 'data-interaction-status="deferred"' not in cta_source:
        errors.append("CTA Value visual pass must explicitly defer destination integration")
    if "<a " in cta_source or "href=" in cta_source:
        errors.append("CTA Value visual pass must not invent href values")
    for image_hash in (
        "6b082e6c3630c06394f659125e8ab1a5dfedb588",
        "9f70f5f08727bc3367f4fe1f3ed848d7c82c41ba",
    ):
        if image_hash not in cta_source:
            errors.append(f"CTA Value must retain unresolved Figma image evidence: {image_hash}")

    footer_source = read_text(fixture / "footer.php")
    if 'data-global-ownership-status="deferred"' not in footer_source:
        errors.append("shared Footer ownership must remain deferred during visual pass")
    if "<a " in footer_source or "href=" in footer_source:
        errors.append("Footer visual pass must not invent global destinations")
    if "assets/images/ref001-footer-logo-mark.svg" not in footer_source:
        errors.append("Footer must use the persisted exact Figma logo-mark asset")

    logo_svg = read_text(footer_logo_mark)
    if not logo_svg.startswith('<svg width="56" height="61"') or '#38A1DB' not in logo_svg or '#51318F' not in logo_svg:
        errors.append("persisted Footer logo mark does not match expected Figma SVG evidence")

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

    courses_styles = read_text(courses_css)
    if "FIXTURE-ONLY" not in courses_styles or "@media (max-width: 600px)" not in courses_styles:
        errors.append("Courses responsive switch must remain explicitly labeled FIXTURE-ONLY")
    if "grid-template-columns: repeat(2, 560px)" not in courses_styles or "gap: 40px" not in courses_styles:
        errors.append("Courses PC First Pass must retain measured 560px two-column / 40px-gap evidence")
    if "width: 343px" not in courses_styles:
        errors.append("Courses SP First Pass must retain measured 343px card width evidence")

    links_styles = read_text(links_css)
    if "grid-template-columns: repeat(4, 260px)" not in links_styles or "gap: 24px" not in links_styles:
        errors.append("Links PC First Pass must retain measured four-circle geometry")
    if "grid-template-columns: repeat(2, 162px)" not in links_styles or "gap: 19px" not in links_styles:
        errors.append("Links SP First Pass must retain measured two-by-two geometry")

    cta_styles = read_text(cta_value_css)
    if "height: 328px" not in cta_styles or "width: min(1340px, calc(100% - 40px))" not in cta_styles:
        errors.append("CTA Value PC First Pass must retain measured section/frame geometry")
    if "width: 343px" not in cta_styles or "height: 364px" not in cta_styles:
        errors.append("CTA Value SP First Pass must retain measured inner-frame geometry")

    footer_styles = read_text(footer_css)
    if "height: 357px" not in footer_styles or "height: 515px" not in footer_styles:
        errors.append("Footer First Pass must retain measured PC/SP heights")

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
