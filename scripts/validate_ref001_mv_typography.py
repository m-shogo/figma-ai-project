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

    required = (
        'font-family: "A P-OTF Futo Go B101 Pr6N"',
        'font-family: "A P-OTF RyuminKO+ ProN"',
        "text-shadow: none;",
        "-webkit-text-stroke: 1.5px #333;",
        "paint-order: stroke fill;",
        "text-align: center;",
        # PC exact geometry.
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
        # SP exact geometry.
        "left: 317px;",
        "left: 56px;",
        "top: 154px;",
        "font-size: 66px;",
        "left: 47px;",
        "top: 257px;",
        "font-size: 32px;",
        "left: 16px;",
        "top: 305px;",
        "font-size: 60px;",
        "top: 381px;",
        "width: 343px;",
        "font-size: 14px;",
        "FIXTURE-ONLY",
    )
    for token in required:
        if token not in css:
            errors.append(f"MV typography evidence missing: {token}")

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
