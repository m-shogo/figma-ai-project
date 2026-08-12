#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN_PATHS = (
    ROOT / "tmp" / "ref001-plugin-asset",
    ROOT / ".github" / "workflows" / "ref001-rendered-asset-materialize.yml",
)


def validate(root: Path = ROOT) -> list[str]:
    candidates = (
        root / "tmp" / "ref001-plugin-asset",
        root / ".github" / "workflows" / "ref001-rendered-asset-materialize.yml",
    )
    errors: list[str] = []
    for path in candidates:
        if path.exists():
            errors.append(f"temporary Figma asset staging must not exist in the final tree: {path.relative_to(root)}")
    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("FAIL Figma asset staging hygiene")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS Figma asset staging hygiene")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
