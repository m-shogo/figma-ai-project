#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "review-dashboard" / "manifests" / "ref001-run-2.json"
APP_DIR = ROOT / "review-dashboard" / "app"
THEME_DIR = ROOT / "experiments" / "ref001-blind-clean-20260812" / "implementation" / "theme"
PREVIEW_PHP = THEME_DIR / "preview.php"
PREVIEW_CSS = ["style.css", "responsive-continuity.css", "visual-repair.css", "human-review-repair.css"]
PREVIEW_ASSETS = THEME_DIR / "assets"
REF001_RENDERED_ASSETS = ROOT / "implementation" / "theme" / "assets" / "images" / "ref001" / "rendered"


class ReviewBuildError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ReviewBuildError(f"cannot read review manifest: {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise ReviewBuildError("review manifest top level must be an object")
    return payload


def require_file(path: Path, label: str) -> Path:
    if not path.is_file():
        raise ReviewBuildError(f"missing {label}: {path}")
    return path


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    try:
        path.relative_to(ROOT.resolve())
    except ValueError as exc:
        raise ReviewBuildError(f"manifest path escapes repository: {value}") from exc
    return path


def render_preview_html() -> str:
    require_file(PREVIEW_PHP, "REF-001 preview.php")
    try:
        result = subprocess.run(
            ["php", str(PREVIEW_PHP)],
            cwd=THEME_DIR,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise ReviewBuildError("php CLI is required to build the static Artifact Preview") from exc
    except subprocess.CalledProcessError as exc:
        raise ReviewBuildError(f"preview.php failed: {exc.stderr.strip()}") from exc
    except subprocess.TimeoutExpired as exc:
        raise ReviewBuildError("preview.php timed out") from exc

    html = result.stdout
    if "data-ref001-page" not in html:
        raise ReviewBuildError("rendered preview is missing data-ref001-page marker")
    html = html.replace("<title>REF-001 FIRST PASS</title>", "<title>REF-001 Automated Final Preview</title>", 1)
    if '<meta name="robots"' not in html:
        html = html.replace(
            '<meta name="viewport" content="width=device-width,initial-scale=1">',
            '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">',
            1,
        )
    return html


def write_preview(destination: Path, html: str) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "index.html").write_text(html, encoding="utf-8")
    for name in PREVIEW_CSS:
        shutil.copy2(require_file(THEME_DIR / name, name), destination / name)
    if not PREVIEW_ASSETS.is_dir():
        raise ReviewBuildError(f"missing preview assets directory: {PREVIEW_ASSETS}")
    shutil.copytree(PREVIEW_ASSETS, destination / "assets", dirs_exist_ok=True)

    # Rendered Figma composites are normalized outside the isolated replay fixture
    # so they have one durable repository location. Merge them into the static
    # preview's normal theme-relative asset path without duplicating source bytes.
    if REF001_RENDERED_ASSETS.is_dir():
        shutil.copytree(
            REF001_RENDERED_ASSETS,
            destination / "assets" / "images" / "ref001" / "rendered",
            dirs_exist_ok=True,
        )


def copy_app(destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "app.css", "app.js", "review-assist.css", "review-assist.js"):
        shutil.copy2(require_file(APP_DIR / name, f"dashboard {name}"), destination / name)


def prepare_generated_manifest(source: dict[str, Any], review_dir: Path) -> dict[str, Any]:
    manifest = copy.deepcopy(source)
    generated: dict[str, Any] = {
        "generated_at": utc_now(),
        "source_commit": os.environ.get("GITHUB_SHA", "LOCAL"),
        "preview_url": "../preview/",
        "captures": {},
    }
    captures_dir = review_dir / "captures"
    captures_dir.mkdir(parents=True, exist_ok=True)

    viewports = manifest.get("viewports", {})
    if not isinstance(viewports, dict):
        raise ReviewBuildError("manifest viewports must be an object")

    for viewport_key, viewport in viewports.items():
        if not isinstance(viewport, dict):
            raise ReviewBuildError(f"viewport {viewport_key} must be an object")
        web_source = repo_path(str(viewport.get("web_capture_source", "")))
        require_file(web_source, f"{viewport_key} deterministic Web capture")
        web_name = f"web-{viewport_key}.png"
        shutil.copy2(web_source, captures_dir / web_name)

        figma_value = str(viewport.get("figma_capture_source", "")).strip()
        figma_source = repo_path(figma_value) if figma_value else None
        figma_name = f"figma-{viewport_key}.png"
        figma_relative: str | None = None
        if figma_source is not None and figma_source.is_file():
            shutil.copy2(figma_source, captures_dir / figma_name)
            figma_relative = f"./captures/{figma_name}"

        generated["captures"][viewport_key] = {
            "web": f"./captures/{web_name}",
            "figma": figma_relative,
            "overlay_available": bool(figma_relative),
        }

    manifest["generated"] = generated
    return manifest


def write_review(destination: Path, source_manifest: dict[str, Any]) -> None:
    copy_app(destination)
    generated = prepare_generated_manifest(source_manifest, destination)
    (destination / "manifest.json").write_text(
        json.dumps(generated, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_landing(output: Path, reference_id: str) -> None:
    target = f"./{reference_id.lower()}/latest/review/"
    html = f"""<!doctype html>
<html lang=\"ja\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\"><meta http-equiv=\"refresh\" content=\"0;url={target}\"><title>{reference_id} Human Review</title></head><body><p><a href=\"{target}\">Human Review Dashboardを開く</a></p></body></html>
"""
    (output / "index.html").write_text(html, encoding="utf-8")


def build_site(*, manifest_path: Path = DEFAULT_MANIFEST, output: Path) -> Path:
    manifest = load_manifest(manifest_path)
    reference_id = str(manifest.get("reference_id", "")).strip()
    run_slug = str(manifest.get("run_slug", "")).strip()
    if not reference_id or not run_slug:
        raise ReviewBuildError("manifest requires reference_id and run_slug")

    output = output.resolve()
    if output == ROOT.resolve() or ROOT.resolve() in output.parents and output.name in {"review-dashboard", "experiments"}:
        raise ReviewBuildError(f"refusing unsafe output path: {output}")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    (output / ".nojekyll").write_text("", encoding="utf-8")

    preview_html = render_preview_html()
    reference_root = output / reference_id.lower()
    run_root = reference_root / "runs" / run_slug
    latest_root = reference_root / "latest"

    write_preview(run_root / "preview", preview_html)
    write_review(run_root / "review", manifest)

    shutil.copytree(run_root / "preview", latest_root / "preview", dirs_exist_ok=True)
    shutil.copytree(run_root / "review", latest_root / "review", dirs_exist_ok=True)

    reference_root.mkdir(parents=True, exist_ok=True)
    (reference_root / "index.html").write_text(
        '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./latest/review/"><a href="./latest/review/">REF-001 Human Review</a>\n',
        encoding="utf-8",
    )
    write_landing(output, reference_id)
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build static Human Review Dashboard + Artifact Preview")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, default=ROOT / "_site")
    return parser.parse_args()


def main() -> int:
    args = parser().parse_args()
    try:
        output = build_site(manifest_path=args.manifest.resolve(), output=args.output)
    except ReviewBuildError as exc:
        print(f"FAIL human review site build: {exc}")
        return 1
    print(f"PASS human review site build: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
