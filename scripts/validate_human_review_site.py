#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

EPHEMERAL_FIGMA_ASSET = re.compile(r"https://(?:www\.)?figma\.com/api/mcp/asset/", re.IGNORECASE)
REQUIRED_SECTIONS = [
    "full-page",
    "header",
    "main-visual",
    "reason",
    "education",
    "shared-cta-1",
    "student-voice",
    "messages",
    "shared-cta-2",
    "courses",
    "links",
    "cta-value",
    "footer",
]


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate_site(root: Path) -> list[str]:
    errors: list[str] = []
    root = root.resolve()
    latest_review = root / "ref-001" / "latest" / "review"
    latest_preview = root / "ref-001" / "latest" / "preview"
    run_review = root / "ref-001" / "runs" / "run-2" / "review"
    run_preview = root / "ref-001" / "runs" / "run-2" / "preview"

    required_files = [
        root / ".nojekyll",
        root / "index.html",
        latest_review / "index.html",
        latest_review / "app.css",
        latest_review / "app.js",
        latest_review / "review-assist.css",
        latest_review / "review-assist.js",
        latest_review / "manifest.json",
        latest_preview / "index.html",
        latest_preview / "style.css",
        latest_preview / "responsive-continuity.css",
        latest_preview / "visual-repair.css",
        run_review / "index.html",
        run_review / "review-assist.css",
        run_review / "review-assist.js",
        run_review / "manifest.json",
        run_preview / "index.html",
    ]
    for path in required_files:
        if not path.is_file():
            errors.append(f"missing generated file: {path.relative_to(root) if root in path.parents else path}")

    if errors:
        return errors

    manifest = json.loads(text(latest_review / "manifest.json"))
    if manifest.get("human_feedback_status") != "PENDING":
        errors.append("published Run 2 human_feedback_status must remain PENDING until real user feedback is received")
    if manifest.get("human_review_status") != "PENDING":
        errors.append("published Run 2 human_review_status must remain PENDING until real user review is received")
    if manifest.get("figma", {}).get("file_key") != "ZYTdtw4wCgkcBy2cVnhxVI":
        errors.append("REF-001 Figma file key drifted")

    viewports = manifest.get("viewports", {})
    pc = viewports.get("pc", {})
    sp = viewports.get("sp", {})
    if pc.get("width") != 1380 or sp.get("width") != 375:
        errors.append("exact review viewport contract must remain PC 1380 / SP 375")
    if sp.get("figma_device_chrome_px") != 40:
        errors.append("SP Figma-only device chrome must remain recorded as 40px")
    if sp.get("web_height") != 10777:
        errors.append("SP Web-content height must remain normalized to 10777px")

    section_ids = [section.get("id") for section in manifest.get("sections", [])]
    if section_ids != REQUIRED_SECTIONS:
        errors.append(f"review section order mismatch: {section_ids}")

    generated = manifest.get("generated", {})
    captures = generated.get("captures", {})
    for viewport in ("pc", "sp"):
        capture = captures.get(viewport, {})
        web = capture.get("web")
        if not web:
            errors.append(f"{viewport} deterministic Web capture is required")
        else:
            capture_path = (latest_review / web).resolve()
            if not capture_path.is_file():
                errors.append(f"{viewport} deterministic Web capture missing from generated site")
        figma = capture.get("figma")
        if bool(figma) != bool(capture.get("overlay_available")):
            errors.append(f"{viewport} overlay_available must exactly reflect deterministic Figma capture presence")
        if figma and not (latest_review / figma).resolve().is_file():
            errors.append(f"{viewport} deterministic Figma capture path does not exist")

    preview_html = text(latest_preview / "index.html")
    if "data-ref001-page" not in preview_html:
        errors.append("Artifact Preview does not contain the actual REF-001 page marker")
    if "Human Visual Review" in preview_html:
        errors.append("Artifact Preview must not include Human Review UI")

    app_js = text(latest_review / "app.js")
    assist_js = text(latest_review / "review-assist.js")
    app_html = text(latest_review / "index.html")
    for needle, message, source in [
        ("embed.figma.com/design/", "live Figma embed missing", app_js),
        ("localStorage", "feedback persistence missing", app_js),
        ("navigator.clipboard", "Clipboard feedback copy missing", app_js),
        ('data-mode="overlay"', "Overlay control missing", app_html),
        ('data-mobile-panel="web"', "mobile Web/Figma panel switch missing", app_html),
        ('id="review-progress"', "review progress control missing", app_html),
        ('id="next-unreviewed"', "next-unreviewed control missing", app_html),
        ('id="create-issue"', "GitHub issue prefill control missing", app_html),
        ("navigateNextUnreviewed", "zero-friction next-unreviewed behavior missing", assist_js),
        ("bulkMarkCurrentViewportGreen", "safe viewport bulk-green behavior missing", assist_js),
        ("issues/new", "GitHub issue prefill URL missing", assist_js),
        ("ArrowRight", "keyboard navigation shortcut missing", assist_js),
    ]:
        if needle not in source:
            errors.append(message)

    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"}:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if EPHEMERAL_FIGMA_ASSET.search(content):
            errors.append(f"short-lived Figma MCP asset URL leaked into generated site: {path.relative_to(root)}")

    latest_manifest = json.loads(text(latest_review / "manifest.json"))
    run_manifest = json.loads(text(run_review / "manifest.json"))
    for payload in (latest_manifest, run_manifest):
        payload.get("generated", {}).pop("generated_at", None)
    if latest_manifest != run_manifest:
        errors.append("latest and run-2 review manifests drifted apart unexpectedly")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate generated Human Review Dashboard site")
    parser.add_argument("site", type=Path)
    args = parser.parse_args()
    errors = validate_site(args.site)
    if errors:
        print("FAIL human review site validation")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS human review site validation")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
