#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
ASSET_DIR = FIXTURE / "assets" / "images" / "mv"
MV_TEMPLATE = FIXTURE / "template-parts" / "ref001" / "main-visual.php"
MV_CSS = FIXTURE / "assets" / "css" / "ref001-mv-vector.css"
FUNCTIONS = FIXTURE / "functions.php"

EXPECTED = {
    "mv-cyan-pc.svg": (1380, 636, "M0 0H1380L0 636V0Z", "#D2FAFF"),
    "mv-lavender-pc.svg": (1380, 636, "M1380 636H0L1380 0V636Z", "#E4DEFF"),
    "mv-cyan-sp.svg": (375, 704, "M0 0H375L0 704V0Z", "#D2FAFF"),
    "mv-lavender-sp.svg": (375, 704, "M375 704H0L375 0V704Z", "#E4DEFF"),
}

SVG_XMLNS = 'xmlns="http://www.w3.org/2000/svg"'


def validate() -> list[str]:
    errors: list[str] = []

    for filename, (width, height, path_data, fill) in EXPECTED.items():
        path = ASSET_DIR / filename
        if not path.is_file():
            errors.append(f"missing exact MV vector: {filename}")
            continue

        source = path.read_text(encoding="utf-8")
        if not source.startswith(f'<svg width="{width}" height="{height}"'):
            errors.append(f"unexpected MV vector dimensions for {filename}: expected {width}x{height}")
        if f'd="{path_data}"' not in source:
            errors.append(f"unexpected triangle geometry for {filename}")
        if f'fill="{fill}"' not in source:
            errors.append(f"unexpected fill for {filename}: expected {fill}")

        remote_check = source.replace(SVG_XMLNS, "")
        if "figma.com/api/mcp/asset" in remote_check or "http://" in remote_check or "https://" in remote_check:
            errors.append(f"{filename} must remain a self-contained SVG")

    if not MV_TEMPLATE.is_file():
        errors.append("missing Main Visual template")
        return errors

    template = MV_TEMPLATE.read_text(encoding="utf-8")
    required_template_tokens = (
        "assets/images/mv/mv-cyan-pc.svg",
        "assets/images/mv/mv-cyan-sp.svg",
        "assets/images/mv/mv-lavender-pc.svg",
        "assets/images/mv/mv-lavender-sp.svg",
        'data-figma-pc="21378:8035"',
        'data-figma-sp="21376:4889"',
        'data-figma-pc="21378:8034"',
        'data-figma-sp="21376:4888"',
        "ffaba0f1b80cd073b4f47d201eac19a7aa1dced0",
        "cdb53715ec7a8c016428e42d818ab2dd40d3abc0",
    )
    for token in required_template_tokens:
        if token not in template:
            errors.append(f"Main Visual template missing exact evidence: {token}")

    if not MV_CSS.is_file():
        errors.append("missing Main Visual vector fidelity stylesheet")
        return errors

    css = MV_CSS.read_text(encoding="utf-8")
    required_css_tokens = (
        ".ref001-mv__background-base",
        "height: 696px;",
        "background: rgb(255 250 234 / 10%);",
        "top: 40px;",
        "height: 636px;",
        "width: 375px;",
        "height: 704px;",
        "background: none;",
        "FIXTURE-ONLY",
    )
    for token in required_css_tokens:
        if token not in css:
            errors.append(f"Main Visual vector CSS missing measured evidence: {token}")

    if "linear-gradient" in css:
        errors.append("exact MV vector repair stylesheet must not reintroduce gradient approximation")

    if not FUNCTIONS.is_file():
        errors.append("missing fixture functions.php")
        return errors

    functions = FUNCTIONS.read_text(encoding="utf-8")
    if "'mv-vector'     => 'ref001-mv-vector.css'" not in functions:
        errors.append("exact MV vector stylesheet must be enqueued after the base fixture stylesheet")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("FAIL REF-001 MV vectors")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS REF-001 MV vectors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
