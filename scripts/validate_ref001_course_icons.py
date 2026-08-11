#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
ASSET_DIR = FIXTURE / "assets" / "images" / "courses"
COURSES_PHP = FIXTURE / "template-parts" / "ref001" / "courses.php"
COURSES_CSS = FIXTURE / "assets" / "css" / "ref001-courses.css"

EXPECTED = {
    "public-service.svg": (44, 56, "21378_7722"),
    "accounting.svg": (40, 56, "21378_7683"),
    "business-management.svg": (56, 56, "21378_7655"),
    "finance.svg": (52, 56, "21378_7623"),
    "teaching.svg": (56, 38, "21378_7594"),
    "curator.svg": (48, 56, "21378_7565"),
    "it.svg": (56, 40, "21378_7533"),
}


def validate() -> list[str]:
    errors: list[str] = []

    for filename, (width, height, node_token) in EXPECTED.items():
        path = ASSET_DIR / filename
        if not path.is_file():
            errors.append(f"missing exact Course SVG: {filename}")
            continue

        source = path.read_text(encoding="utf-8")
        if not source.startswith(f'<svg width="{width}" height="{height}"'):
            errors.append(f"unexpected outer dimensions for {filename}: expected {width}x{height}")
        if node_token not in source:
            errors.append(f"{filename} does not retain its exported Figma node clip identifier")
        if "figma.com/api/mcp/asset" in source or "http://" in source or "https://" in source.replace(
            'xmlns="http://www.w3.org/2000/svg"', ""
        ):
            errors.append(f"{filename} must be self-contained and must not use remote asset URLs")
        if 'fill="white"' not in source and 'stroke="white"' not in source:
            errors.append(f"{filename} lost the supplied white pictogram rendering")

    if not COURSES_PHP.is_file():
        errors.append("missing Courses template")
        return errors

    php = COURSES_PHP.read_text(encoding="utf-8")
    required_php_evidence = (
        "assets/images/courses/",
        "str_replace( '_', '-', $course['key'] )",
        "<picture>",
        '<source media="(max-width: 600px)"',
        "FIGMA_SOURCE_ANOMALY",
        "21376:4587",
        "assets/images/courses/teaching.svg",
    )
    for token in required_php_evidence:
        if token not in php:
            errors.append(f"Courses template missing responsive icon evidence: {token}")

    if not COURSES_CSS.is_file():
        errors.append("missing Courses stylesheet")
        return errors

    css = COURSES_CSS.read_text(encoding="utf-8")
    expected_sp_sizes = {
        "public_service": (31, 40),
        "accounting": (30, 40),
        "business_management": (40, 40),
        "finance": (39, 40),
    }
    for key, (width, height) in expected_sp_sizes.items():
        pattern = re.compile(
            rf'data-course-key="{re.escape(key)}"[^{{]*\.ref001-course-card__icon img\s*{{[^}}]*width:\s*{width}px;[^}}]*height:\s*{height}px;',
            re.S,
        )
        if not pattern.search(css):
            errors.append(f"Courses SP icon size evidence missing for {key}: {width}x{height}")

    if 'data-course-key="teaching"' not in css or 'data-course-key="curator"' not in css or 'data-course-key="it"' not in css:
        errors.append("Courses SP 48x34 icon group must include teaching/curator/it")
    if "width: 48px;" not in css or "height: 34px;" not in css:
        errors.append("Courses SP 48x34 icon geometry evidence is missing")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("FAIL REF-001 Course icons")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS REF-001 Course icons")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
