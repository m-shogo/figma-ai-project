#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MAP = ROOT / "experiments/ref001-blind-clean-20260812/implementation/theme/inc/asset-map.php"
CANONICAL_THEME = ROOT / "implementation/theme"
DUMMY_BY_VIEWPORT = {
    "pc": "assets/images/dummy/image-pc.svg",
    "sp": "assets/images/dummy/image-sp.svg",
}
EXPECTED_SLOTS = {
    "main-visual-left",
    "main-visual-right",
    "reason-1",
    "reason-2",
    "reason-3",
    "education-1",
    "education-2",
    "education-3",
    "education-4",
    "voice-1-avatar",
    "voice-1-detail",
    "voice-2-avatar",
    "voice-3-avatar",
    "messages-photo",
    "cta-person-left",
    "cta-person-right",
}
RENDERED_PREFIX = "assets/images/ref001/rendered/"


class ValidationError(RuntimeError):
    pass


def load_images(asset_map: Path) -> dict[str, dict[str, str]]:
    php = (
        "$m=require $argv[1];"
        "if(!isset($m['images'])||!is_array($m['images'])){fwrite(STDERR,'missing images map');exit(2);}"
        "echo json_encode($m['images'], JSON_UNESCAPED_SLASHES);"
    )
    try:
        result = subprocess.run(
            ["php", "-r", php, str(asset_map)],
            cwd=ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10,
        )
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise ValidationError(f"cannot load asset map: {exc}") from exc
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise ValidationError(f"asset map did not emit JSON: {exc}") from exc
    if not isinstance(payload, dict):
        raise ValidationError("images map must be an object")
    return payload


def validate(asset_map: Path, *, require_complete: bool = False) -> tuple[list[str], dict[str, int]]:
    images = load_images(asset_map)
    errors: list[str] = []
    actual = set(images)
    missing_slots = sorted(EXPECTED_SLOTS - actual)
    extra_slots = sorted(actual - EXPECTED_SLOTS)
    if missing_slots:
        errors.append(f"missing slots: {', '.join(missing_slots)}")
    if extra_slots:
        errors.append(f"unexpected slots: {', '.join(extra_slots)}")

    rendered_paths: list[str] = []
    counts = {"rendered": 0, "dummy": 0, "total": 0}
    for slot in sorted(EXPECTED_SLOTS & actual):
        entry = images.get(slot)
        if not isinstance(entry, dict):
            errors.append(f"{slot}: entry must be an object")
            continue
        if set(entry) != {"pc", "sp"}:
            errors.append(f"{slot}: must contain exactly pc and sp")
        for viewport in ("pc", "sp"):
            counts["total"] += 1
            value = entry.get(viewport)
            if not isinstance(value, str) or not value:
                errors.append(f"{slot}.{viewport}: path must be a non-empty string")
                continue
            if value == DUMMY_BY_VIEWPORT[viewport]:
                counts["dummy"] += 1
                if require_complete:
                    errors.append(f"{slot}.{viewport}: dummy remains in complete mode")
                continue
            if value.startswith("assets/images/dummy/"):
                errors.append(f"{slot}.{viewport}: wrong dummy for viewport: {value}")
                continue
            if not value.startswith(RENDERED_PREFIX):
                errors.append(f"{slot}.{viewport}: non-dummy path must use {RENDERED_PREFIX}: {value}")
                continue
            expected_viewport_prefix = f"{RENDERED_PREFIX}{viewport}/"
            if not value.startswith(expected_viewport_prefix):
                errors.append(f"{slot}.{viewport}: rendered asset is classified under wrong viewport: {value}")
                continue
            canonical = CANONICAL_THEME / value
            if not canonical.is_file():
                errors.append(f"{slot}.{viewport}: canonical rendered file missing: {canonical.relative_to(ROOT)}")
                continue
            rendered_paths.append(value)
            counts["rendered"] += 1

    duplicates = sorted({p for p in rendered_paths if rendered_paths.count(p) > 1})
    if duplicates:
        errors.append(f"rendered asset reused by multiple slots: {', '.join(duplicates)}")
    if counts["total"] != 32:
        errors.append(f"expected 32 viewport assignments, got {counts['total']}")
    return errors, counts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate REF-001 PC/SP rendered asset wiring")
    parser.add_argument("--asset-map", type=Path, default=DEFAULT_MAP)
    parser.add_argument("--require-complete", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    errors, counts = validate(args.asset_map.resolve(), require_complete=args.require_complete)
    if errors:
        for error in errors:
            print(f"FAIL {error}")
        print(f"STATUS rendered={counts['rendered']}/32 dummy={counts['dummy']}/32")
        return 1
    print(f"PASS REF-001 asset map rendered={counts['rendered']}/32 dummy={counts['dummy']}/32")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
