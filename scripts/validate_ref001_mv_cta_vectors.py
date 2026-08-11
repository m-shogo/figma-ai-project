#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
ASSET_DIR = FIXTURE / "assets" / "images" / "mv"
TEMPLATE = FIXTURE / "template-parts" / "ref001" / "main-visual.php"
CSS = FIXTURE / "assets" / "css" / "ref001-mv-cta-detail.css"
FUNCTIONS = FIXTURE / "functions.php"

EXPECTED = {
    "mv-oc-note-back.svg": (187, 47),
    "mv-oc-note-front.svg": (187, 47),
    "mv-oc-arrow-pc.svg": (14, 13),
    "mv-oc-arrow-sp.svg": (11, 10),
}

SVG_XMLNS = 'xmlns="http://www.w3.org/2000/svg"'


def validate() -> list[str]:
    errors: list[str] = []

    for filename, (width, height) in EXPECTED.items():
        path = ASSET_DIR / filename
        if not path.is_file():
            errors.append(f"missing exact MV CTA asset: {filename}")
            continue
        source = path.read_text(encoding="utf-8")
        if not source.startswith(f'<svg width="{width}" height="{height}"'):
            errors.append(f"unexpected MV CTA asset dimensions for {filename}: expected {width}x{height}")
        remote_check = source.replace(SVG_XMLNS, "")
        if "figma.com/api/mcp/asset" in remote_check or "http://" in remote_check or "https://" in remote_check:
            errors.append(f"{filename} must remain self-contained")

    if not TEMPLATE.is_file():
        errors.append("missing Main Visual template")
        return errors
    template = TEMPLATE.read_text(encoding="utf-8")
    for token in (
        "assets/images/mv/mv-oc-note-back.svg",
        "assets/images/mv/mv-oc-note-front.svg",
        "assets/images/mv/mv-oc-arrow-pc.svg",
        "assets/images/mv/mv-oc-arrow-sp.svg",
        'data-figma-pc="21378:8046"',
        'data-figma-sp="21376:4898"',
    ):
        if token not in template:
            errors.append(f"Main Visual CTA template missing exact evidence: {token}")

    if not CSS.is_file():
        errors.append("missing MV CTA detail stylesheet")
        return errors
    css = CSS.read_text(encoding="utf-8")

    # PC: group and important child coordinates.
    for token in (
        "width: 240px;",
        "height: 240px;",
        "left: 27px;",
        "top: 7px;",
        "left: 48px;",
        "top: 67px;",
        "left: 78px;",
        "top: 163px;",
        "left: 184px;",
        "top: 184px;",
        "left: 16.32px;",
        "top: 18.02px;",
    ):
        if token not in css:
            errors.append(f"MV CTA PC measured coordinate missing: {token}")

    # SP: group includes out-of-circle bubble/arrow bounds.
    for token in (
        "width: 189px;",
        "height: 192px;",
        "left: 19px;",
        "top: 22px;",
        "width: 170px;",
        "height: 170px;",
        "left: 145px;",
        "top: 148px;",
        "width: 36px;",
        "height: 36px;",
        "left: 13px;",
        "top: 13px;",
        "width: 11px;",
        "height: 10px;",
    ):
        if token not in css:
            errors.append(f"MV CTA SP measured coordinate missing: {token}")

    if not FUNCTIONS.is_file():
        errors.append("missing fixture functions.php")
        return errors
    functions = FUNCTIONS.read_text(encoding="utf-8")
    if "'mv-cta-detail' => 'ref001-mv-cta-detail.css'" not in functions:
        errors.append("MV CTA detail stylesheet must be enqueued after the base fixture stylesheet")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("FAIL REF-001 MV CTA vectors")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS REF-001 MV CTA vectors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
