#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASELINE = ROOT / "review-dashboard" / "baselines" / "ref001" / "baseline.json"
BASELINE_JS = ROOT / "review-dashboard" / "app" / "baseline-review.js"


class BaselineAttachError(RuntimeError):
    pass


def load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise BaselineAttachError(f"cannot read JSON {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise BaselineAttachError(f"JSON root must be an object: {path}")
    return payload


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    try:
        path.relative_to(ROOT.resolve())
    except ValueError as exc:
        raise BaselineAttachError(f"baseline path escapes repository: {value}") from exc
    return path


def review_dirs(output: Path, reference_id: str) -> list[Path]:
    root = output / reference_id.lower()
    result: list[Path] = []
    latest = root / "latest" / "review"
    if latest.is_dir():
        result.append(latest)
    runs = root / "runs"
    if runs.is_dir():
        result.extend(sorted(path / "review" for path in runs.iterdir() if (path / "review").is_dir()))
    return result


def patch_review(review_dir: Path, baseline: dict[str, Any], captures: dict[str, Path]) -> None:
    manifest_path = review_dir / "manifest.json"
    index_path = review_dir / "index.html"
    if not manifest_path.is_file() or not index_path.is_file():
        raise BaselineAttachError(f"review output incomplete: {review_dir}")

    manifest = load_json(manifest_path)
    generated = manifest.setdefault("generated", {})
    generated_captures = generated.setdefault("captures", {})
    captures_dir = review_dir / "captures"
    captures_dir.mkdir(parents=True, exist_ok=True)

    for viewport, source in captures.items():
        target_name = f"baseline-{viewport}.png"
        shutil.copy2(source, captures_dir / target_name)
        viewport_capture = generated_captures.setdefault(viewport, {})
        viewport_capture["baseline"] = f"./captures/{target_name}"
        viewport_capture["baseline_available"] = True

    generated["baseline"] = {
        "schema_version": baseline.get("schema_version", 1),
        "approved_source_commit": baseline.get("approved_source_commit"),
        "approved_after_pr": baseline.get("approved_after_pr"),
        "hard_gate": bool(baseline.get("policy", {}).get("hard_gate", False)),
        "promotion_requires_human_approval": bool(
            baseline.get("policy", {}).get("promotion_requires_human_approval", True)
        ),
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    shutil.copy2(BASELINE_JS, review_dir / "baseline-review.js")
    html = index_path.read_text(encoding="utf-8")
    marker = '<script src="./baseline-review.js" defer></script>'
    if marker not in html:
        html = html.replace("</body>", f"  {marker}\n</body>", 1)
        index_path.write_text(html, encoding="utf-8")


def attach(*, output: Path, baseline_path: Path) -> int:
    baseline = load_json(baseline_path)
    reference_id = str(baseline.get("reference_id", "")).strip()
    if not reference_id:
        raise BaselineAttachError("baseline requires reference_id")
    if not BASELINE_JS.is_file():
        raise BaselineAttachError(f"missing baseline review app: {BASELINE_JS}")

    raw_captures = baseline.get("captures")
    if not isinstance(raw_captures, dict) or not raw_captures:
        raise BaselineAttachError("baseline requires captures")

    captures: dict[str, Path] = {}
    for viewport in ("pc", "sp"):
        value = str(raw_captures.get(viewport, "")).strip()
        if not value:
            raise BaselineAttachError(f"baseline missing {viewport} capture")
        source = repo_path(value)
        if not source.is_file():
            raise BaselineAttachError(f"baseline capture missing: {source}")
        captures[viewport] = source

    targets = review_dirs(output.resolve(), reference_id)
    if not targets:
        raise BaselineAttachError(f"no generated review directories found under {output}")
    for target in targets:
        patch_review(target, baseline, captures)

    print(
        f"PASS visual baseline attached: {reference_id} -> {len(targets)} review outputs "
        f"(approved {baseline.get('approved_source_commit', 'unknown')})"
    )
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Attach approved Web baseline captures to Human Review output")
    parser.add_argument("--output", type=Path, default=ROOT / "_site")
    parser.add_argument("--baseline", type=Path, default=DEFAULT_BASELINE)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        return attach(output=args.output, baseline_path=args.baseline.resolve())
    except BaselineAttachError as exc:
        print(f"FAIL visual baseline attach: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
