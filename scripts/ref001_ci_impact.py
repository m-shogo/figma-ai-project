#!/usr/bin/env python3
"""Classify REF-001 V2 changes so CI spends browser time where risk requires it.

Unknown runtime-affecting files and mixed changes conservatively fall back to the
full responsive matrix. The Human Review workflow still starts on implementation
PRs so required-check semantics stay stable, but expensive review capture can be
deferred to the full `so` post-merge run when only implementation changed.
"""

from __future__ import annotations

import argparse
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

FULL_WIDTHS = (320, 360, 375, 390, 430, 767, 768, 769, 1024, 1200, 1380)
FULL_SCREENSHOTS = (320, 375, 430, 767, 768, 1024, 1200, 1380)
SECTION_WIDTHS = (375, 767, 768, 1380)
LIGHT_WIDTHS = (375, 768, 1380)

RANK = {"static": 0, "light": 1, "section": 2, "full": 3}

RUNTIME_ROOT = "experiments/ref001-blind-clean-20260812/implementation/"
THEME_ROOT = f"{RUNTIME_ROOT}theme/"
SECTION_ROOT = f"{THEME_ROOT}template-parts/sections/"
ICON_ROOT = f"{THEME_ROOT}assets/icons/"
LOCAL_IMAGE_ROOT = f"{THEME_ROOT}assets/images/"
CANONICAL_RENDERED_ROOT = "implementation/theme/assets/images/ref001/rendered/"

FULL_EXACT = {
    ".github/workflows/ref001-blind-clean-runtime.yml",
    ".github/workflows/publish-human-review.yml",
    "scripts/ref001_ci_impact.py",
    "tests/test_ref001_ci_impact.py",
    f"{THEME_ROOT}preview.php",
    f"{THEME_ROOT}functions.php",
    f"{THEME_ROOT}style.css",
    f"{THEME_ROOT}index.php",
}

SECTION_EXACT = {
    f"{THEME_ROOT}template-parts/header-site.php",
    f"{THEME_ROOT}template-parts/footer-site.php",
    f"{THEME_ROOT}header-site.php",
    f"{THEME_ROOT}footer-site.php",
}

STATIC_EXACT = {
    "scripts/validate_ref001_asset_map.py",
    "scripts/validate_acf_export.py",
    "tests/test_ref001_asset_map.py",
    "tests/test_ref001_v2_logo_contract.py",
}

GLOBAL_CSS_MARKERS = (
    "responsive",
    "continuity",
    "global",
    "shared",
    "foundation",
    "base",
)

HUMAN_REVIEW_PR_PREFIXES = (
    "review-dashboard/",
    "research/figma-assets/ref001/",
)
HUMAN_REVIEW_PR_EXACT = {
    ".github/workflows/publish-human-review.yml",
    "scripts/build_human_review_site.py",
    "scripts/attach_visual_baseline.py",
    "scripts/build_ref001_section_diff_report.py",
    "scripts/crop_png.py",
    "scripts/diff_png.py",
    "scripts/validate_human_review_site.py",
    "tests/test_human_review_dashboard.py",
}


@dataclass(frozen=True)
class Impact:
    mode: str
    widths: tuple[int, ...]
    screenshots: tuple[int, ...]
    run_browser: bool
    run_stress: bool
    run_human_review_pr: bool
    reason: str

    def outputs(self) -> dict[str, str]:
        return {
            "mode": self.mode,
            "widths": ",".join(map(str, self.widths)),
            "screenshots": ",".join(map(str, self.screenshots)),
            "run_browser": str(self.run_browser).lower(),
            "run_stress": str(self.run_stress).lower(),
            "run_human_review_pr": str(self.run_human_review_pr).lower(),
            "reason": self.reason.replace("\n", " "),
        }


def _normalize(path: str) -> str:
    return path.strip().replace("\\", "/").lstrip("./")


def needs_pr_human_review(paths: Iterable[str]) -> bool:
    normalized = {_normalize(path) for path in paths if _normalize(path)}
    return any(
        path in HUMAN_REVIEW_PR_EXACT
        or any(path.startswith(prefix) for prefix in HUMAN_REVIEW_PR_PREFIXES)
        for path in normalized
    )


def _mode_for_path(path: str) -> tuple[str, str]:
    path = _normalize(path)

    if path in FULL_EXACT:
        return "full", f"global/CI contract: {path}"
    if path.startswith(".github/workflows/"):
        return "full", f"workflow change: {path}"
    if path.startswith("experiments/ref001-blind-clean-20260812/tools/"):
        return "full", f"runtime tooling: {path}"
    if path == "experiments/ref001-blind-clean-20260812/run.yaml":
        return "full", f"run contract: {path}"
    if path in STATIC_EXACT:
        return "static", f"validator/test only: {path}"
    if path.startswith("tests/"):
        return "static", f"test only: {path}"
    if path.startswith(ICON_ROOT):
        return "light", f"local vector asset: {path}"
    if path.startswith(CANONICAL_RENDERED_ROOT) or path.startswith(LOCAL_IMAGE_ROOT):
        return "light", f"rendered/local image asset: {path}"
    if path in SECTION_EXACT or path.startswith(SECTION_ROOT):
        return "section", f"local template composition: {path}"
    if path.startswith(THEME_ROOT) and path.endswith(".css"):
        name = Path(path).name.lower()
        if any(marker in name for marker in GLOBAL_CSS_MARKERS):
            return "full", f"shared responsive CSS: {path}"
        return "section", f"local visual CSS: {path}"
    if path.startswith(THEME_ROOT) and path.endswith((".php", ".js")):
        return "full", f"unscoped runtime code: {path}"
    if path.startswith(RUNTIME_ROOT):
        return "full", f"unknown implementation impact: {path}"

    return "full", f"conservative fallback: {path}"


def classify(paths: Iterable[str]) -> Impact:
    normalized = sorted({_normalize(path) for path in paths if _normalize(path)})
    review_pr = needs_pr_human_review(normalized)
    if not normalized:
        return Impact(
            "full",
            FULL_WIDTHS,
            FULL_SCREENSHOTS,
            True,
            True,
            True,
            "no changed paths resolved; conservative full fallback",
        )

    classified = [(_mode_for_path(path), path) for path in normalized]
    top_mode = max((entry[0][0] for entry in classified), key=RANK.__getitem__)
    top_reasons = [entry[0][1] for entry in classified if entry[0][0] == top_mode]
    reason = "; ".join(top_reasons[:4])
    if len(top_reasons) > 4:
        reason += f"; +{len(top_reasons) - 4} more"

    if top_mode == "static":
        return Impact("static", (), (), False, False, review_pr, reason)
    if top_mode == "light":
        return Impact("light", LIGHT_WIDTHS, LIGHT_WIDTHS, True, False, review_pr, reason)
    if top_mode == "section":
        return Impact("section", SECTION_WIDTHS, SECTION_WIDTHS, True, True, review_pr, reason)
    return Impact("full", FULL_WIDTHS, FULL_SCREENSHOTS, True, True, review_pr, reason)


def changed_paths(base: str, head: str) -> list[str]:
    if not base or not head or set(base) == {"0"}:
        return []
    try:
        completed = subprocess.run(
            ["git", "diff", "--name-only", f"{base}...{head}"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    return [line for line in completed.stdout.splitlines() if line.strip()]


def write_github_output(path: str, impact: Impact) -> None:
    with open(path, "a", encoding="utf-8") as handle:
        for key, value in impact.outputs().items():
            handle.write(f"{key}={value}\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--github-output")
    parser.add_argument("paths", nargs="*")
    args = parser.parse_args()

    paths = args.paths or changed_paths(args.base, args.head)
    impact = classify(paths)
    for key, value in impact.outputs().items():
        print(f"{key}={value}")
    if paths:
        print("changed_paths:")
        for path in paths:
            print(f"- {path}")
    if args.github_output:
        write_github_output(args.github_output, impact)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
