#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
CSS = FIXTURE / "assets" / "css" / "ref001-mv-type.css"
FUNCTIONS = FIXTURE / "functions.php"


def validate() -> list[str]:
    errors: list[str] = []

    if not CSS.is_file():
        return ["missing MV typography fidelity stylesheet"]

    css = CSS.read_text(encoding="utf-8")
    marker = "@media (max-width: 767px)"
    if marker not in css:
        errors.append("MV typography must use the owner-resolved 768px breakpoint contract")
        desktop = css
        mobile = ""
    else:
        desktop, mobile = css.split(marker, 1)

    desktop_required = (
        'font-family: "A P-OTF Futo Go B101 Pr6N"',
        'font-family: "A P-OTF RyuminKO+ ProN"',
        "text-shadow: none;",
        "-webkit-text-stroke: 1.5px #333;",
        "paint-order: stroke fill;",
        "text-align: center;",
        # PC exact geometry at the supplied 1380px endpoint.
        "left: 471px;",
        "left: 830px;",
        "left: 519px;",
        "top: 150px;",
        "font-size: 77px;",
        "left: 503px;",
        "top: 263px;",
        "font-size: 44px;",
        "left: 496px;",
        "top: 323px;",
        "font-size: 71px;",
        "left: 481px;",
        "top: 452px;",
        "width: 419px;",
    )
    for token in desktop_required:
        if token not in desktop:
            errors.append(f"MV typography PC evidence missing: {token}")

    # Mobile keeps the supplied 375px visual values where they are safe, but
    # uses intrinsic/min/max expressions so narrower runtime widths do not
    # require viewport overflow or screenshot-only font shrinking hacks.
    mobile_required = (
        "left: 16px;",
        "right: 13px;",
        "top: 154px;",
        "left: max(16px, calc(50% - 131.5px));",
        "font-size: min(66px, 17.6vw);",
        "top: 257px;",
        "left: max(16px, calc(50% - 140.5px));",
        "font-size: min(32px, 8.5333vw);",
        "top: 305px;",
        "width: min(375px, calc(100% - 32px));",
        "font-size: min(60px, 16vw);",
        "top: 381px;",
        "width: min(343px, calc(100% - 32px));",
        "font-size: 14px;",
    )
    for token in mobile_required:
        if token not in mobile:
            errors.append(f"MV typography mobile/runtime evidence missing: {token}")

    if "@media (max-width: 600px)" in css or "FIXTURE-ONLY" in css:
        errors.append("MV typography must not retain the obsolete 600px fixture seam")

    # The repair layer must actively remove the initial text-shadow approximation.
    if css.count("text-shadow: none;") < 1:
        errors.append("MV typography repair must remove non-Figma text shadows")

    if not FUNCTIONS.is_file():
        errors.append("missing fixture functions.php")
        return errors
    functions = FUNCTIONS.read_text(encoding="utf-8")
    if "'mv-type'       => 'ref001-mv-type.css'" not in functions:
        errors.append("MV typography fidelity stylesheet must be enqueued")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("FAIL REF-001 MV typography")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS REF-001 MV typography")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
