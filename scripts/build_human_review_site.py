#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "review-dashboard" / "manifests" / "ref001-run-2.json"
APP_DIR = ROOT / "review-dashboard" / "app"
THEME_DIR = ROOT / "experiments" / "ref001-blind-clean-20260812" / "implementation" / "theme"
PREVIEW_PHP = THEME_DIR / "preview.php"
PREVIEW_ASSETS = THEME_DIR / "assets"
REF001_RENDERED_ASSETS = ROOT / "implementation" / "theme" / "assets" / "images" / "ref001" / "rendered"

# Immutable comparison authorities. V2 is the typography-complete version immediately
# before V3 learnings were replayed into V2. V3 is the protected Draft PR #92 head.
REF001_V2_SNAPSHOT_REF = os.environ.get(
    "REF001_V2_SNAPSHOT_REF",
    "a8f5846080805dd1d16c0a94a5bde8d581f6a68f",
)
REF001_V3_SNAPSHOT_REF = os.environ.get(
    "REF001_V3_SNAPSHOT_REF",
    "fb1820917fb6ca82a1509eac4a8d2b9a4c51e8c2",
)
# REF-002 is intentionally published as a QA snapshot without merging Draft PR #142.
# Update this authority only after its full-page QA is green.
REF002_SNAPSHOT_REF = os.environ.get(
    "REF002_SNAPSHOT_REF",
    "1320476ccaaf86eef6efde6b5cad99533faf085d",
)
V2_THEME_REPO_PATH = Path("experiments/ref001-blind-clean-20260812/implementation/theme")
V3_IMPL_REPO_PATH = Path("experiments/ref001-v3/implementation")
RENDERED_REPO_PATH = Path("implementation/theme/assets/images/ref001/rendered")
REF002_REPO_PATH = Path("experiments/ref002-budokan-fullcalendar-validation")


class ReviewBuildError(RuntimeError):
    pass


class PreviewStylesheetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "link":
            return
        values = {key.lower(): value for key, value in attrs if key}
        rel = (values.get("rel") or "").lower().split()
        href = values.get("href")
        if "stylesheet" in rel and href:
            self.hrefs.append(href)


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


def local_preview_stylesheets(html: str) -> list[str]:
    parser = PreviewStylesheetParser()
    parser.feed(html)
    stylesheets: list[str] = []
    seen: set[str] = set()
    for href in parser.hrefs:
        parsed = urlsplit(href)
        if parsed.scheme or parsed.netloc or href.startswith("//"):
            continue
        relative = Path(parsed.path)
        if not parsed.path or relative.is_absolute() or ".." in relative.parts:
            raise ReviewBuildError(f"unsafe local preview stylesheet reference: {href}")
        normalized = relative.as_posix()
        if normalized not in seen:
            seen.add(normalized)
            stylesheets.append(normalized)
    if not stylesheets:
        raise ReviewBuildError("rendered preview does not reference any local stylesheets")
    return stylesheets


def run_php_preview(preview_php: Path, cwd: Path, *, label: str) -> str:
    require_file(preview_php, f"{label} preview.php")
    try:
        result = subprocess.run(
            ["php", str(preview_php)],
            cwd=cwd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise ReviewBuildError("php CLI is required to build static previews") from exc
    except subprocess.CalledProcessError as exc:
        raise ReviewBuildError(f"{label} preview.php failed: {exc.stderr.strip()}") from exc
    except subprocess.TimeoutExpired as exc:
        raise ReviewBuildError(f"{label} preview.php timed out") from exc
    return result.stdout


def add_noindex(html: str) -> str:
    if '<meta name="robots"' in html:
        return html
    return html.replace(
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">',
        1,
    )


def render_preview_html() -> str:
    html = run_php_preview(PREVIEW_PHP, THEME_DIR, label="REF-001 final")
    if "data-ref001-page" not in html:
        raise ReviewBuildError("rendered preview is missing data-ref001-page marker")
    html = html.replace("<title>REF-001 FIRST PASS</title>", "<title>REF-001 Automated Final Preview</title>", 1)
    return add_noindex(html)


def write_preview(destination: Path, html: str) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "index.html").write_text(html, encoding="utf-8")

    for relative_name in local_preview_stylesheets(html):
        source = (THEME_DIR / relative_name).resolve()
        try:
            source.relative_to(THEME_DIR.resolve())
        except ValueError as exc:
            raise ReviewBuildError(f"preview stylesheet escapes theme directory: {relative_name}") from exc
        target = destination / relative_name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(require_file(source, f"preview stylesheet {relative_name}"), target)

    if not PREVIEW_ASSETS.is_dir():
        raise ReviewBuildError(f"missing preview assets directory: {PREVIEW_ASSETS}")
    shutil.copytree(PREVIEW_ASSETS, destination / "assets", dirs_exist_ok=True)

    if REF001_RENDERED_ASSETS.is_dir():
        shutil.copytree(
            REF001_RENDERED_ASSETS,
            destination / "assets" / "images" / "ref001" / "rendered",
            dirs_exist_ok=True,
        )


def copy_app(destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for name in (
        "index.html",
        "app.css",
        "app.js",
        "review-assist.css",
        "review-assist.js",
        "visual-diff.css",
        "visual-diff.js",
    ):
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


def ensure_git_ref(ref: str, *, fallback_branch: str | None = None) -> None:
    probe = subprocess.run(
        ["git", "rev-parse", "--verify", f"{ref}^{{commit}}"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if probe.returncode == 0:
        return

    fetch_target = fallback_branch or ref
    try:
        subprocess.run(
            ["git", "fetch", "--no-tags", "--depth=1", "origin", fetch_target],
            cwd=ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=120,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise ReviewBuildError(f"cannot fetch snapshot authority {ref}: {exc}") from exc

    probe = subprocess.run(
        ["git", "rev-parse", "--verify", f"{ref}^{{commit}}"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if probe.returncode != 0:
        raise ReviewBuildError(f"snapshot authority is unavailable after fetch: {ref}")


def extract_git_paths(ref: str, paths: list[Path], destination: Path, *, fallback_branch: str | None = None) -> None:
    ensure_git_ref(ref, fallback_branch=fallback_branch)
    destination.mkdir(parents=True, exist_ok=True)
    archive_path = destination / "snapshot.tar"
    command = ["git", "archive", "--format=tar", ref, *[path.as_posix() for path in paths]]
    try:
        with archive_path.open("wb") as stream:
            subprocess.run(
                command,
                cwd=ROOT,
                check=True,
                stdout=stream,
                stderr=subprocess.PIPE,
                timeout=120,
            )
    except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise ReviewBuildError(f"cannot archive snapshot {ref}: {exc}") from exc

    try:
        with tarfile.open(archive_path, mode="r:") as archive:
            for member in archive.getmembers():
                member_path = Path(member.name)
                if member_path.is_absolute() or ".." in member_path.parts:
                    raise ReviewBuildError(f"unsafe snapshot archive member: {member.name}")
            archive.extractall(destination)
    except (OSError, tarfile.TarError) as exc:
        raise ReviewBuildError(f"cannot extract snapshot {ref}: {exc}") from exc
    finally:
        archive_path.unlink(missing_ok=True)


def copy_tree_without_php(source: Path, destination: Path) -> None:
    if not source.is_dir():
        raise ReviewBuildError(f"missing snapshot implementation directory: {source}")
    for child in source.rglob("*"):
        if child.is_dir() or child.suffix.lower() == ".php":
            continue
        relative = child.relative_to(source)
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(child, target)


def write_snapshot_metadata(
    destination: Path,
    *,
    label: str,
    ref: str,
    source: str,
    immutable: bool = True,
) -> None:
    payload = {
        "label": label,
        "ref": ref,
        "source": source,
        "immutable_comparison_snapshot": immutable,
    }
    (destination / "snapshot.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def build_v2_snapshot(destination: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="ref001-v2-") as temp_name:
        temp_root = Path(temp_name)
        extract_git_paths(
            REF001_V2_SNAPSHOT_REF,
            [V2_THEME_REPO_PATH, RENDERED_REPO_PATH],
            temp_root,
        )
        theme = temp_root / V2_THEME_REPO_PATH
        rendered = temp_root / RENDERED_REPO_PATH
        html = run_php_preview(theme / "preview.php", theme, label="REF-001 V2 snapshot")
        html = add_noindex(html.replace("<title>REF-001 FIRST PASS</title>", "<title>REF-001 V2 Snapshot</title>", 1))

        destination.mkdir(parents=True, exist_ok=True)
        (destination / "index.html").write_text(html, encoding="utf-8")
        for relative_name in local_preview_stylesheets(html):
            source = theme / relative_name
            target = destination / relative_name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(require_file(source, f"V2 stylesheet {relative_name}"), target)
        if (theme / "assets").is_dir():
            shutil.copytree(theme / "assets", destination / "assets", dirs_exist_ok=True)
        if rendered.is_dir():
            shutil.copytree(rendered, destination / "assets" / "images" / "ref001" / "rendered", dirs_exist_ok=True)
        write_snapshot_metadata(
            destination,
            label="REF-001 V2 — typography complete, before V3 learnings",
            ref=REF001_V2_SNAPSHOT_REF,
            source="PR #143 merge commit",
        )


def build_v3_snapshot(destination: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="ref001-v3-") as temp_name:
        temp_root = Path(temp_name)
        extract_git_paths(
            REF001_V3_SNAPSHOT_REF,
            [V3_IMPL_REPO_PATH, RENDERED_REPO_PATH],
            temp_root,
            fallback_branch="agent/ref001-v3",
        )
        implementation = temp_root / V3_IMPL_REPO_PATH
        rendered = temp_root / RENDERED_REPO_PATH
        html = run_php_preview(implementation / "preview.php", implementation, label="REF-001 V3 snapshot")
        html = add_noindex(html.replace("<title>REF-001 V3</title>", "<title>REF-001 V3 Snapshot</title>", 1))
        html = html.replace(
            "/implementation/theme/assets/images/ref001/rendered/",
            "assets/images/ref001/rendered/",
        )

        destination.mkdir(parents=True, exist_ok=True)
        (destination / "index.html").write_text(html, encoding="utf-8")
        copy_tree_without_php(implementation, destination)
        if rendered.is_dir():
            shutil.copytree(rendered, destination / "assets" / "images" / "ref001" / "rendered", dirs_exist_ok=True)
        write_snapshot_metadata(
            destination,
            label="REF-001 V3 — protected independent fixture",
            ref=REF001_V3_SNAPSHOT_REF,
            source="Draft PR #92 head",
        )


def build_ref002_snapshot(destination: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="ref002-preview-") as temp_name:
        temp_root = Path(temp_name)
        extract_git_paths(
            REF002_SNAPSHOT_REF,
            [REF002_REPO_PATH],
            temp_root,
            fallback_branch="agent/ref002-budokan-final-assets",
        )
        source = temp_root / REF002_REPO_PATH
        if not (source / "index.html").is_file():
            raise ReviewBuildError("REF-002 snapshot is missing index.html")
        shutil.copytree(source, destination, dirs_exist_ok=True)
        write_snapshot_metadata(
            destination,
            label="REF-002 Budokan — current QA snapshot",
            ref=REF002_SNAPSHOT_REF,
            source="Draft PR #142 green full-page QA; ASSET_PENDING=0",
            immutable=False,
        )


def write_ref001_version_landing(reference_root: Path) -> None:
    html = """<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>REF-001 Versions</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:60px auto;padding:0 20px;color:#222}h1{font-size:28px}a{display:block;margin:14px 0;padding:16px 18px;border:1px solid #ddd;border-radius:10px;color:inherit;text-decoration:none}strong{display:block;font-size:18px}small{display:block;margin-top:6px;color:#666}</style></head><body>
<h1>REF-001 Preview Versions</h1>
<a href="./final/preview/"><strong>完成版 / Final</strong><small>最新V2 + V3から学習したno-visual-diff設計改善 + JS</small></a>
<a href="./v2/preview/"><strong>V2 保存版</strong><small>TypographyをFigma数値一致させた直後、V3改善を入れる前</small></a>
<a href="./v3/preview/"><strong>V3 保存版</strong><small>保護中Draft PR #92の独立fixture</small></a>
<a href="./latest/review/"><strong>Human Review</strong><small>完成版とFigmaの比較・Section Diff</small></a>
</body></html>
"""
    (reference_root / "index.html").write_text(html, encoding="utf-8")


def write_ref002_landing(reference_root: Path) -> None:
    reference_root.mkdir(parents=True, exist_ok=True)
    html = """<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=./latest/preview/"><title>REF-002 Budokan Preview</title></head><body><p><a href="./latest/preview/">REF-002 Budokan Previewを開く</a></p></body></html>"""
    (reference_root / "index.html").write_text(html, encoding="utf-8")


def write_landing(output: Path, reference_id: str) -> None:
    target = f"./{reference_id.lower()}/"
    html = f"""<!doctype html>
<html lang=\"ja\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\"><meta http-equiv=\"refresh\" content=\"0;url={target}\"><title>{reference_id} Preview Versions</title></head><body><p><a href=\"{target}\">REF-001 Preview Versionsを開く</a></p></body></html>
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

    shutil.copytree(latest_root / "preview", reference_root / "final" / "preview", dirs_exist_ok=True)
    build_v2_snapshot(reference_root / "v2" / "preview")
    build_v3_snapshot(reference_root / "v3" / "preview")

    reference_root.mkdir(parents=True, exist_ok=True)
    write_ref001_version_landing(reference_root)

    ref002_root = output / "ref-002"
    build_ref002_snapshot(ref002_root / "latest" / "preview")
    write_ref002_landing(ref002_root)

    write_landing(output, reference_id)
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build static Human Review Dashboard + Artifact Preview")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, default=ROOT / "_site")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        output = build_site(manifest_path=args.manifest.resolve(), output=args.output)
    except ReviewBuildError as exc:
        print(f"FAIL human review site build: {exc}")
        return 1
    print(f"PASS human review site build: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
