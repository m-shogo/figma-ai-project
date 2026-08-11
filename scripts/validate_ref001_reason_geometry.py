#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
CSS = FIXTURE / "assets" / "css" / "ref001-reason-geometry.css"
FUNCTIONS = FIXTURE / "functions.php"


def validate() -> list[str]:
    errors: list[str] = []

    if not CSS.is_file():
        return ["missing Reason geometry fidelity stylesheet"]

    css = CSS.read_text(encoding="utf-8")

    required_pc = (
        "width: 1160px;",
        "height: 559px;",
        "margin: 78px auto 96px;",
        "top: 121px;",
        "grid-template-columns: repeat(3, 360px);",
        "gap: 40px;",
        "width: 360px;",
        "height: 318px;",
        "height: 240px;",
        "top: 277px;",
        "height: 41px;",
    )
    for token in required_pc:
        if token not in css:
            errors.append(f"Reason PC measured geometry missing: {token}")

    required_sp = (
        "width: 345px;",
        "height: 1295px;",
        "margin: 56px auto;",
        "top: 168px;",
        "flex-direction: column;",
        "gap: 16px;",
        "width: 343px;",
        "height: 365px;",
        "height: 229px;",
        "top: 268px;",
        "height: 88px;",
        "FIXTURE-ONLY",
    )
    for token in required_sp:
        if token not in css:
            errors.append(f"Reason SP measured geometry missing: {token}")

    # The original learning baseline used generic app-card styling. Figma's
    # Reason cards are image + overlaid label + body copy, without rounded card
    # shells or drop-shadow cards. The repair layer must actively neutralize it.
    for token in (
        "border: 0;",
        "border-radius: 0;",
        "box-shadow: none;",
        "background: transparent;",
        "overflow: visible;",
    ):
        if token not in css:
            errors.append(f"Reason generic-card neutralization missing: {token}")

    if not FUNCTIONS.is_file():
        errors.append("missing fixture functions.php")
        return errors

    functions = FUNCTIONS.read_text(encoding="utf-8")
    if "'reason-geometry' => 'ref001-reason-geometry.css'" not in functions:
        errors.append("Reason geometry fidelity stylesheet must be enqueued")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("FAIL REF-001 Reason geometry")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS REF-001 Reason geometry")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
