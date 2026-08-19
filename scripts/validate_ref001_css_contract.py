#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments/ref001-blind-clean-20260812/implementation/theme"
CANONICAL = THEME / "assets/css/ref001.css"
ALLOWED_MEDIA = {"(max-width:767px)", "(min-width:768px)"}
LEGACY_PREFIXES = (
    "v2-",
    "human-review-",
    "responsive-continuity",
    "visual-repair",
)


def normalize_condition(condition: str) -> str:
    return re.sub(r"\s+", "", condition.strip())


def main() -> None:
    errors: list[str] = []

    if not CANONICAL.is_file():
        errors.append(f"missing canonical CSS: {CANONICAL.relative_to(ROOT)}")
    else:
        css = CANONICAL.read_text(encoding="utf-8")
        conditions = [normalize_condition(value) for value in re.findall(r"@media\s*([^\{]+)\{", css, re.I)]
        invalid = sorted({condition for condition in conditions if condition not in ALLOWED_MEDIA})
        if invalid:
            errors.append(f"unsupported media queries: {invalid}")

        for forbidden in ("1299px", "1300px", "v2-intermediate", "FIRST PASS"):
            if forbidden in css:
                errors.append(f"legacy token remains in canonical CSS: {forbidden}")

    root_css = sorted(path.name for path in THEME.glob("*.css"))
    if root_css != ["style.css"]:
        errors.append(f"theme-root CSS must contain only style.css, found: {root_css}")

    legacy = sorted(
        path.name
        for path in THEME.rglob("*.css")
        if path != CANONICAL and path.name != "style.css" and path.name.startswith(LEGACY_PREFIXES)
    )
    if legacy:
        errors.append(f"legacy CSS files remain: {legacy}")

    functions = (THEME / "functions.php").read_text(encoding="utf-8")
    preview = (THEME / "preview.php").read_text(encoding="utf-8")

    for path, source in (("functions.php", functions), ("preview.php", preview)):
        if "assets/css/ref001.css" not in source:
            errors.append(f"{path} does not load canonical CSS")
        for token in ("v2-", "human-review-", "visual-repair.css", "responsive-continuity.css"):
            if token in source:
                errors.append(f"{path} still references legacy CSS token: {token}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    print("REF-001 CSS contract OK")
    print("- runtime CSS: assets/css/ref001.css")
    print("- responsive buckets: <=767 / >=768 only")
    print("- legacy V2/intermediate/review CSS: not loaded")


if __name__ == "__main__":
    main()
