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

    parts = {
        name: fixture / "template-parts" / "ref001" / f"{name}.php"
        for name in (
            "main-visual", "reason", "education", "cta", "student-voice",
            "messages", "courses", "links", "cta-value",
        )
    }
    css_files = {
        name: fixture / "assets" / "css" / f"ref001-{name}.css"
        for name in (
            "header", "education", "cta", "student-voice", "messages",
            "courses", "links", "cta-value", "footer",
        )
    }
    footer_logo_mark = fixture / "assets" / "images" / "ref001-footer-logo-mark.svg"

    required = [
        fixture / "style.css", fixture / "functions.php", fixture / "header.php",
        fixture / "footer.php", fixture / "index.php", fixture / TEMPLATE_RELATIVE_PATH,
        fixture / "assets" / "css" / "ref001.css", footer_logo_mark,
        fixture / "README.md", *parts.values(), *css_files.values(),
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

    js_files = sorted(fixture.rglob("*.js")) + sorted(fixture.rglob("*.mjs"))
    if js_files:
        errors.append("visual-first static-state wave must not add JavaScript before interaction integration")

    repeater_patterns = {
        "have_rows(": "have_rows()", "the_row(": "the_row()", "get_sub_field(": "get_sub_field()",
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

    actual_sequence = re.findall(r"get_template_part\(\s*'template-parts/ref001/([^']+)'\s*\)", template)
    expected_sequence = [
        "main-visual", "reason", "education", "cta", "student-voice",
        "messages", "cta", "courses", "links", "cta-value",
    ]
    if actual_sequence != expected_sequence:
        errors.append("learning Page template must preserve Figma section order: " + " -> ".join(expected_sequence))
    for part in dict.fromkeys(expected_sequence):
        if part not in actual_sequence:
            errors.append(f"learning Page template must include the {part} template part")

    if 'data-fixture-completeness="partial"' not in template:
        errors.append("incomplete learning Page must remain explicitly marked data-fixture-completeness=partial")
    if 'data-visual-section-sequence="figma-order"' not in template:
        errors.append("learning Page must explicitly record that its visual section sequence follows Figma")

    functions = read_text(fixture / "functions.php")
    if TEMPLATE_RELATIVE_PATH not in functions or "is_page_template" not in functions:
        errors.append("fixture asset enqueue must target the canonical REF-001 Page template")
    if "wp_get_attachment_image(" not in functions:
        errors.append("fixture images must use the WordPress attachment image helper")
    for name in css_files:
        filename = f"ref001-{name}.css"
        if filename not in functions:
            errors.append(f"fixture must enqueue stylesheet through WordPress: assets/css/{filename}")

    header_source = read_text(fixture / "header.php")
    if 'data-global-ownership-status="deferred"' not in header_source:
        errors.append("shared Header ownership must remain deferred during visual pass")
    if "<a " in header_source or "href=" in header_source:
        errors.append("Header visual pass must not invent global destinations")
    if "assets/images/ref001-footer-logo-mark.svg" not in header_source:
        errors.append("Header must reuse the persisted exact Figma logo-mark asset")

    education_source = read_text(parts["education"])
    for number, label in (("01", "スタート"), ("02", "学ぶ"), ("03", "出会う"), ("04", "ゴール")):
        if f"'number' => '{number}'" not in education_source or f"'label' => '{label}'" not in education_source:
            errors.append(f"Education code-owned stage contract missing {number}/{label}")

    shared_cta_source = read_text(parts["cta"])
    if 'data-interaction-status="deferred"' not in shared_cta_source:
        errors.append("shared CTA visual pass must explicitly defer destination integration")
    if "<a " in shared_cta_source or "href=" in shared_cta_source:
        errors.append("shared CTA visual pass must not invent href values")
    if template.count("get_template_part( 'template-parts/ref001/cta' )") != 2:
        errors.append("shared CTA must be reused exactly twice in the supplied Figma section sequence")

    voice_source = read_text(parts["student-voice"])
    if 'data-interaction-status="deferred"' not in voice_source:
        errors.append("Student Voice must keep interaction behavior deferred")
    for text in (
        "まだやりたいことが決まっていなくても大丈夫だった。",
        "将来の仕事が、大学生活の中で見えてきました。",
        "学芸員になる夢を、安心して目指せると思った。",
    ):
        if text not in voice_source:
            errors.append(f"Student Voice supplied state missing text: {text}")
    for image_hash in (
        "7a0569464ece1a5ffe4e6c5a1e50fb4b5efaac0c", "33aab97f8b6328f273150c0578bc5b6230d0c5e2",
        "8c372ab3f8d02f36020b3b7c1bd719545105ff26", "12c4c3b3e824e6f191ac8a273fdfadb64912383b",
    ):
        if image_hash not in voice_source:
            errors.append(f"Student Voice must retain unresolved Figma image evidence: {image_hash}")
    for forbidden in ("<button", "aria-expanded=", "onclick="):
        if forbidden in voice_source:
            errors.append("Student Voice static First Pass must not invent accordion interaction semantics")

    messages_source = read_text(parts["messages"])
    for marker in (
        'data-current-item="1"', 'data-visible-total="4"', 'data-supplied-item-count="1"',
        'data-interaction-status="deferred"', 'data-slider-status="deferred"',
    ):
        if marker not in messages_source:
            errors.append(f"Messages static evidence missing marker: {marker}")
    if "0cd34d406c04a31f4a32bc2628d184f80db47fad" not in messages_source:
        errors.append("Messages must retain current-item Figma image hash")
    if "<button" in messages_source or "onclick=" in messages_source:
        errors.append("Messages static First Pass must not invent slider controls")

    courses_source = read_text(parts["courses"])
    for title in (
        "公務員コース", "会計コース", "ビジネス経営コース", "金融コース",
        "教職コース", "学芸員コース", "ITコース",
    ):
        if title not in courses_source:
            errors.append(f"Courses fixed-domain contract missing: {title}")
    if "<a " in courses_source or "href=" in courses_source:
        errors.append("Courses First Pass must not invent course links before URL ownership is resolved")

    links_source = read_text(parts["links"])
    if 'data-interaction-status="deferred"' not in links_source:
        errors.append("Links visual pass must explicitly defer destination integration")
    if "<a " in links_source or "href=" in links_source:
        errors.append("Links visual pass must not invent href values")

    cta_value_source = read_text(parts["cta-value"])
    if 'data-interaction-status="deferred"' not in cta_value_source:
        errors.append("CTA Value visual pass must explicitly defer destination integration")
    if "<a " in cta_value_source or "href=" in cta_value_source:
        errors.append("CTA Value visual pass must not invent href values")
    for image_hash in ("6b082e6c3630c06394f659125e8ab1a5dfedb588", "9f70f5f08727bc3367f4fe1f3ed848d7c82c41ba"):
        if image_hash not in cta_value_source:
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
    by_name = {str(field.get("name", "")): field for field in fields if isinstance(field, dict) and field.get("name")}

    expected_reason_fields = {f"reason_{index}_{suffix}" for index in (1, 2, 3) for suffix in ("image", "title", "body")}
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
        f"education_{stage}_{suffix}" for stage in (1, 2, 3, 4) for suffix in ("number", "label", "order")
    }
    leaked_stage_contract = sorted(forbidden_editor_stage_fields & set(by_name))
    if leaked_stage_contract:
        errors.append("Education stage identity/order must remain code-owned, not ACF-editable: " + ", ".join(leaked_stage_contract))

    for name, field in by_name.items():
        if field.get("type") == "image" and field.get("return_format") != "id":
            errors.append(f"ACF image field {name} must return attachment ID in the learning baseline")

    # Owner-resolved responsive contract. 375/1380 are visual acceptance endpoints;
    # the actual mobile/desktop switch is 768px (mobile <= 767px).
    base_css = read_text(fixture / "assets" / "css" / "ref001.css")
    if "@media (max-width: 767px)" not in base_css:
        errors.append("base REF-001 CSS must use the owner-resolved 768px responsive contract")

    education_styles = read_text(css_files["education"])
    if "@media (max-width: 767px)" not in education_styles:
        errors.append("Education must use the owner-resolved 768px responsive contract")
    if "281px" not in education_styles or "gap: 40px" not in education_styles:
        errors.append("Education must retain measured PC 281px-card / 40px-gap evidence")
    if "width: 140px" not in education_styles or "height: 79px" not in education_styles or "335px" not in education_styles:
        errors.append("Education must retain measured SP 335px-card / 140x79 media evidence")

    cta_styles = read_text(css_files["cta"])
    if "height: 328px" not in cta_styles or "height: 350px" not in cta_styles:
        errors.append("shared CTA must retain measured PC/SP heights")
    if "grid-template-columns: repeat(2, 261px)" not in cta_styles or "grid-template-columns: 261px" not in cta_styles:
        errors.append("shared CTA must retain measured PC/SP button geometry")

    voice_styles = read_text(css_files["student-voice"])
    for measurement in ("height: 591px", "height: 290px", "height: 1032px", "height: 262px", "width: 311px"):
        if measurement not in voice_styles:
            errors.append(f"Student Voice must retain measured visual-state geometry: {measurement}")

    messages_styles = read_text(css_files["messages"])
    if "height: 440px" not in messages_styles or "height: 538px" not in messages_styles:
        errors.append("Messages must retain measured PC/SP section heights")
    if "width: 660px" not in messages_styles or "width: 343px" not in messages_styles:
        errors.append("Messages must retain measured PC/SP current-item image slots")

    courses_styles = read_text(css_files["courses"])
    if "@media (max-width: 767px)" not in courses_styles:
        errors.append("Courses must use the owner-resolved 768px responsive contract")
    if "560px" not in courses_styles or "gap: 40px" not in courses_styles:
        errors.append("Courses must retain measured PC 560px-card / 40px-gap evidence")
    if "343px" not in courses_styles:
        errors.append("Courses must retain measured SP 343px card evidence")

    links_styles = read_text(css_files["links"])
    if "@media (max-width: 767px)" not in links_styles:
        errors.append("Links must use the owner-resolved 768px responsive contract")
    if "260px" not in links_styles or "gap: 24px" not in links_styles:
        errors.append("Links PC First Pass must retain measured four-circle geometry evidence")
    if "162px" not in links_styles or "gap: 19px" not in links_styles:
        errors.append("Links SP First Pass must retain measured two-by-two geometry evidence")

    cta_value_styles = read_text(css_files["cta-value"])
    if "height: 328px" not in cta_value_styles or "width: min(1340px, calc(100% - 40px))" not in cta_value_styles:
        errors.append("CTA Value PC First Pass must retain measured section/frame geometry")
    if "width: 343px" not in cta_value_styles or "height: 364px" not in cta_value_styles:
        errors.append("CTA Value SP First Pass must retain measured inner-frame geometry")

    header_styles = read_text(css_files["header"])
    if "height: 94px" not in header_styles or "height: 67px" not in header_styles:
        errors.append("Header First Pass must retain measured PC/SP heights")
    if "grid-template-columns: repeat(2, 201px)" not in header_styles or "display: none" not in header_styles:
        errors.append("Header must retain PC CTA geometry and supplied SP logo-only state")

    footer_styles = read_text(css_files["footer"])
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
