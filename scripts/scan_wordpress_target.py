#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

SKIP_DIRS = {".git", "node_modules", "vendor", ".next", "dist", "build", "coverage"}
MAX_TEXT_BYTES = 2_000_000
THEME_NAME_RE = re.compile(r"(?mi)^\s*Theme Name\s*:\s*(.+?)\s*$")
TEMPLATE_NAME_RE = re.compile(r"(?mi)Template Name\s*:\s*(.+?)\s*(?:\*/|\r?$)")
ACF_PATTERNS = {
    "save_json_filter": re.compile(r"acf/settings/save_json"),
    "load_json_filter": re.compile(r"acf/settings/load_json"),
    "local_field_group_registration": re.compile(r"\bacf_add_local_field_group\s*\("),
    "get_field_usage": re.compile(r"\bget_field\s*\("),
    "the_field_usage": re.compile(r"\bthe_field\s*\("),
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def iter_files(root: Path, suffixes: set[str] | None = None) -> Iterable[Path]:
    for path in root.rglob("*"):
        if path.is_symlink() or not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(root).parts[:-1]):
            continue
        if suffixes is not None and path.suffix.lower() not in suffixes:
            continue
        yield path


def read_text(path: Path) -> str:
    try:
        if path.stat().st_size > MAX_TEXT_BYTES:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def has_theme_header(style_css: Path) -> tuple[bool, str]:
    if not style_css.is_file():
        return False, ""
    match = THEME_NAME_RE.search(read_text(style_css))
    return (bool(match), match.group(1).strip() if match else "")


def candidate_theme_roots(root: Path) -> list[Path]:
    candidates: list[Path] = []
    direct, _ = has_theme_header(root / "style.css")
    if direct:
        candidates.append(root)

    themes = root / "wp-content" / "themes"
    if themes.is_dir():
        for child in sorted(themes.iterdir()):
            if child.is_dir() and has_theme_header(child / "style.css")[0]:
                candidates.append(child)

    if not candidates:
        for style in iter_files(root, {".css"}):
            if style.name != "style.css":
                continue
            if has_theme_header(style)[0]:
                candidates.append(style.parent)
    unique: list[Path] = []
    seen: set[Path] = set()
    for path in candidates:
        resolved = path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            unique.append(path)
    return unique


def classify_theme(theme: Path, repo_root: Path) -> dict:
    theme_json = theme / "theme.json"
    php_markers = [theme / name for name in ("index.php", "header.php", "footer.php", "functions.php")]
    php_present = [rel(path, repo_root) for path in php_markers if path.is_file()]
    block_templates = sorted((theme / "templates").glob("*.html")) if (theme / "templates").is_dir() else []
    block_parts = sorted((theme / "parts").glob("*.html")) if (theme / "parts").is_dir() else []
    block_evidence = bool(theme_json.is_file() and (block_templates or block_parts))
    classic_evidence = bool(php_present)

    if block_evidence and classic_evidence:
        family = "HYBRID_THEME"
    elif block_evidence:
        family = "BLOCK_THEME"
    elif classic_evidence:
        family = "CLASSIC_THEME"
    else:
        family = "UNDETERMINED"

    _, theme_name = has_theme_header(theme / "style.css")
    evidence = []
    if theme_json.is_file():
        evidence.append(rel(theme_json, repo_root))
    evidence.extend(php_present)
    evidence.extend(rel(path, repo_root) for path in block_templates[:20])
    evidence.extend(rel(path, repo_root) for path in block_parts[:20])
    return {
        "path": rel(theme, repo_root) if theme != repo_root else ".",
        "theme_name": theme_name,
        "family": family,
        "family_is_inference": True,
        "evidence": sorted(set(evidence)),
        "theme_json": rel(theme_json, repo_root) if theme_json.is_file() else "",
    }


def scan_page_templates(theme: Path, repo_root: Path) -> dict:
    php_templates: list[dict] = []
    slug_templates: list[str] = []
    for path in iter_files(theme, {".php"}):
        source = read_text(path)
        match = TEMPLATE_NAME_RE.search(source)
        if match:
            php_templates.append({"path": rel(path, repo_root), "template_name": match.group(1).strip()})
        if path.name.startswith("page-") and path.name != "page.php":
            slug_templates.append(rel(path, repo_root))

    block_templates = []
    template_dir = theme / "templates"
    if template_dir.is_dir():
        block_templates = [rel(path, repo_root) for path in sorted(template_dir.glob("*.html"))]

    return {
        "php_template_headers": php_templates,
        "slug_specialized_php": sorted(slug_templates),
        "block_html_templates": block_templates,
    }


def scan_acf(theme: Path, repo_root: Path) -> dict:
    local_json_dirs = []
    local_json_files = []
    for directory in [path for path in theme.rglob("acf-json") if path.is_dir() and not path.is_symlink()]:
        if any(part in SKIP_DIRS for part in directory.relative_to(theme).parts):
            continue
        local_json_dirs.append(rel(directory, repo_root))
        local_json_files.extend(rel(path, repo_root) for path in sorted(directory.glob("*.json")) if path.is_file())

    pattern_hits: dict[str, list[str]] = {key: [] for key in ACF_PATTERNS}
    for path in iter_files(theme, {".php"}):
        source = read_text(path)
        for key, pattern in ACF_PATTERNS.items():
            if pattern.search(source):
                pattern_hits[key].append(rel(path, repo_root))

    return {
        "local_json_directories": sorted(local_json_dirs),
        "local_json_files": sorted(local_json_files),
        "php_evidence": {key: sorted(paths) for key, paths in pattern_hits.items()},
        "state": "OBSERVED" if local_json_dirs or any(pattern_hits.values()) else "NONE_OBSERVED",
    }


def scan_global_ownership(theme: Path, repo_root: Path) -> dict:
    candidates = {
        "classic_header": theme / "header.php",
        "classic_footer": theme / "footer.php",
        "block_header": theme / "parts" / "header.html",
        "block_footer": theme / "parts" / "footer.html",
    }
    observed = {key: rel(path, repo_root) for key, path in candidates.items() if path.is_file()}

    get_header_calls: list[str] = []
    get_footer_calls: list[str] = []
    for path in iter_files(theme, {".php"}):
        source = read_text(path)
        if re.search(r"\bget_header\s*\(", source):
            get_header_calls.append(rel(path, repo_root))
        if re.search(r"\bget_footer\s*\(", source):
            get_footer_calls.append(rel(path, repo_root))

    return {
        "observed_global_files": observed,
        "get_header_callers": sorted(get_header_calls),
        "get_footer_callers": sorted(get_footer_calls),
        "ownership_state": "EVIDENCE_AVAILABLE" if observed else "UNDETERMINED",
        "note": "File presence is implementation evidence, not authorization to replace company/global ownership without target review.",
    }


def scan_style_architecture(theme: Path, repo_root: Path) -> dict:
    package = theme / "package.json"
    package_data: dict = {}
    if package.is_file():
        try:
            value = json.loads(read_text(package))
            if isinstance(value, dict):
                package_data = value
        except json.JSONDecodeError:
            package_data = {}

    counts = {"css": 0, "scss": 0, "sass": 0, "module_css": 0, "module_scss": 0}
    sample_files: list[str] = []
    for path in iter_files(theme, {".css", ".scss", ".sass"}):
        name = path.name.lower()
        if name.endswith(".module.scss"):
            counts["module_scss"] += 1
        elif name.endswith(".module.css"):
            counts["module_css"] += 1
        elif path.suffix.lower() == ".scss":
            counts["scss"] += 1
        elif path.suffix.lower() == ".sass":
            counts["sass"] += 1
        elif path.suffix.lower() == ".css":
            counts["css"] += 1
        if len(sample_files) < 30:
            sample_files.append(rel(path, repo_root))

    dependencies = {}
    for lane in ("dependencies", "devDependencies"):
        value = package_data.get(lane, {})
        if isinstance(value, dict):
            dependencies.update({str(key): str(version) for key, version in value.items()})

    tool_hints = [
        tool
        for tool in ("sass", "postcss", "tailwindcss", "@wordpress/scripts", "vite", "webpack")
        if tool in dependencies
    ]
    return {
        "package_json": rel(package, repo_root) if package.is_file() else "",
        "package_scripts": sorted(package_data.get("scripts", {}).keys()) if isinstance(package_data.get("scripts"), dict) else [],
        "tool_hints": tool_hints,
        "style_file_counts": counts,
        "sample_style_files": sample_files,
        "decision_boundary": "Use these observations to follow the target architecture; do not replace it with a repository default by inference.",
    }


def scan(root: Path) -> dict:
    root = root.resolve()
    if not root.is_dir():
        raise ValueError(f"target path is not a directory: {root}")
    themes = candidate_theme_roots(root)
    theme_records = []
    for theme in themes:
        record = classify_theme(theme, root)
        record["page_templates"] = scan_page_templates(theme, root)
        record["acf"] = scan_acf(theme, root)
        record["global_ownership"] = scan_global_ownership(theme, root)
        record["style_architecture"] = scan_style_architecture(theme, root)
        theme_records.append(record)

    return {
        "schema_version": 1,
        "observed_at": utc_now(),
        "target_root": str(root),
        "theme_candidate_count": len(theme_records),
        "themes": theme_records,
        "selection_state": "UNAMBIGUOUS" if len(theme_records) == 1 else ("NONE_OBSERVED" if not theme_records else "MULTIPLE_CANDIDATES"),
        "claim_boundary": (
            "This is filesystem/code reconnaissance only. Theme family labels are evidence-based inferences; "
            "production ownership, route, starting commit, versions, and editor requirements remain target/company decisions."
        ),
    }


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description="Read-only reconnaissance for a connected WordPress target repository.")
    value.add_argument("target", type=Path)
    value.add_argument("--output", type=Path)
    value.add_argument("--require-single-theme", action="store_true")
    return value


def main() -> int:
    args = parser().parse_args()
    try:
        result = scan(args.target)
    except (OSError, ValueError) as exc:
        print(f"FAIL WordPress target reconnaissance: {exc}", file=sys.stderr)
        return 1
    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized, encoding="utf-8")
    print(serialized, end="")
    if args.require_single_theme and result["selection_state"] != "UNAMBIGUOUS":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
