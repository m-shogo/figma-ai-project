#!/usr/bin/env python3
"""Bounded, scope-aware existing-component candidate discovery.

Discovery only finds plausible files. Reuse/adapt/new still requires visual,
semantic, and behavioral compatibility evidence via fast_visual_qa.map_component().
"""
from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
from pathlib import Path, PurePosixPath
from typing import Any

import fast_visual_qa as fvq

SOURCE_EXTENSIONS = {".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte", ".php", ".html", ".css", ".scss"}
GENERIC_TOKENS = {"component", "components", "section", "sections", "block", "blocks", "item", "items", "frame", "group"}
GLOB_META = re.compile(r"[*?[]")


def words(value: str) -> list[str]:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", value)
    return [token for token in re.findall(r"[a-z0-9]+", value.lower()) if len(token) >= 2 and token not in GENERIC_TOKENS]


def discovery_terms(figma_name: str, aliases: list[str] | None = None) -> list[str]:
    terms: list[str] = []
    for value in [figma_name, *(aliases or [])]:
        for token in words(value):
            if token not in terms:
                terms.append(token)
    return terms


def candidate_score(relative_path: str, content: str, terms: list[str]) -> tuple[float, dict[str, Any]]:
    if not terms:
        return 0.0, {"pathMatches": [], "contentMatches": []}
    path_tokens = set(words(relative_path))
    content_lower = content.lower()
    path_matches = [term for term in terms if term in path_tokens]
    content_matches = [term for term in terms if term in content_lower]
    path_ratio = len(path_matches) / len(terms)
    content_ratio = len(content_matches) / len(terms)
    score = round(path_ratio * 0.7 + content_ratio * 0.3, 4)
    return score, {"pathMatches": path_matches, "contentMatches": content_matches}


def literal_scan_root(root: Path, pattern: str) -> Path:
    match = GLOB_META.search(pattern)
    if not match:
        return (root / pattern).resolve()
    literal = pattern[:match.start()]
    if not literal:
        return root
    if literal.endswith("/"):
        prefix = literal.rstrip("/")
    else:
        prefix = PurePosixPath(literal).parent.as_posix()
    return (root / prefix).resolve() if prefix not in {"", "."} else root


def scan_roots(root: Path, include: list[str]) -> list[Path]:
    candidates = [literal_scan_root(root, pattern) for pattern in (include or ["**/*"])]
    existing = sorted({path for path in candidates if path.exists()}, key=lambda path: (len(path.parts), path.as_posix()))
    result: list[Path] = []
    for path in existing:
        if any(path == parent or parent in path.parents for parent in result):
            continue
        result.append(path)
    return result


def path_matches_any(path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(path, pattern) for pattern in patterns)


def blocked_directory(relative_dir: str, scope: dict[str, Any]) -> str | None:
    probe = f"{relative_dir.rstrip('/')}/__scope_probe__"
    if path_matches_any(probe, scope.get("protected", [])):
        return "protected"
    if path_matches_any(probe, scope.get("exclude", [])):
        return "excluded"
    return None


def scoped_source_paths(
    root: Path,
    scope: dict[str, Any],
    *,
    max_files: int,
    max_scan_files: int,
) -> dict[str, Any]:
    selected: list[str] = []
    protected_files: list[str] = []
    ignored_files: list[str] = []
    protected_roots: list[str] = []
    excluded_roots: list[str] = []
    seen: set[str] = set()
    visited_files = 0
    truncated = False

    def inspect_file(path: Path) -> bool:
        nonlocal visited_files, truncated
        if visited_files >= max_scan_files:
            truncated = True
            return False
        visited_files += 1
        if path.suffix.lower() not in SOURCE_EXTENSIONS:
            return True
        try:
            relative = path.relative_to(root).as_posix()
        except ValueError:
            return True
        if relative in seen:
            return True
        seen.add(relative)
        filtered = fvq.filter_context([relative], scope)
        if filtered["protected"]:
            protected_files.append(relative)
        elif filtered["selected"]:
            selected.append(relative)
            if len(selected) >= max_files:
                truncated = True
                return False
        else:
            ignored_files.append(relative)
        return True

    for scan_root in scan_roots(root, scope.get("include", [])):
        if len(selected) >= max_files or visited_files >= max_scan_files:
            truncated = True
            break
        if scan_root.is_file():
            if not inspect_file(scan_root):
                break
            continue
        for current, dirs, files in os.walk(scan_root):
            dirs.sort(); files.sort()
            current_path = Path(current)
            kept_dirs: list[str] = []
            for dirname in dirs:
                child = current_path / dirname
                try:
                    relative_dir = child.relative_to(root).as_posix()
                except ValueError:
                    continue
                blocked = blocked_directory(relative_dir, scope)
                if blocked == "protected":
                    protected_roots.append(relative_dir)
                elif blocked == "excluded":
                    excluded_roots.append(relative_dir)
                else:
                    kept_dirs.append(dirname)
            dirs[:] = kept_dirs
            stop = False
            for filename in files:
                if not inspect_file(current_path / filename):
                    stop = True
                    break
            if stop:
                break
        if len(selected) >= max_files or visited_files >= max_scan_files:
            truncated = True
            break

    return {
        "selected": selected,
        "protectedFiles": protected_files,
        "ignoredFiles": ignored_files,
        "protectedRoots": sorted(set(protected_roots)),
        "excludedRoots": sorted(set(excluded_roots)),
        "visitedFiles": visited_files,
        "truncated": truncated,
    }


def discover_candidates(
    root: Path,
    figma_name: str,
    scope: dict[str, Any],
    *,
    aliases: list[str] | None = None,
    max_files: int = 200,
    max_results: int = 12,
    read_limit_bytes: int = 65536,
    max_scan_files: int = 1200,
) -> dict[str, Any]:
    root = root.resolve()
    scan = scoped_source_paths(
        root,
        scope,
        max_files=max(0, max_files),
        max_scan_files=max(0, max_scan_files),
    )
    terms = discovery_terms(figma_name, aliases)
    ranked: list[dict[str, Any]] = []
    files_read: list[str] = []

    for relative in scan["selected"]:
        path = root / relative
        try:
            with path.open("r", encoding="utf-8", errors="ignore") as handle:
                content = handle.read(max(0, read_limit_bytes))
        except OSError:
            continue
        files_read.append(relative)
        score, evidence = candidate_score(relative, content, terms)
        if score <= 0:
            continue
        ranked.append({
            "path": relative,
            "discoveryScore": score,
            "lexicalEvidence": evidence,
            "requiresCompatibilityObservation": True,
        })

    ranked.sort(key=lambda item: (-item["discoveryScore"], item["path"]))
    return {
        "figmaName": figma_name,
        "terms": terms,
        "candidates": ranked[:max(0, max_results)],
        "scan": {
            "roots": [path.relative_to(root).as_posix() if path != root else "." for path in scan_roots(root, scope.get("include", []))],
            "filesystemFilesVisited": scan["visitedFiles"],
            "scopeSelected": len(scan["selected"]),
            "filesRead": files_read,
            "protectedSkipped": scan["protectedFiles"],
            "protectedRootsSkipped": scan["protectedRoots"],
            "excludedRootsSkipped": scan["excludedRoots"],
            "ignored": scan["ignoredFiles"],
            "truncatedByBudget": scan["truncated"],
            "maxFiles": max_files,
            "maxScanFiles": max_scan_files,
            "readLimitBytes": read_limit_bytes,
        },
        "decision": "compatibility-observation-required",
        "next": "score visual + semantic + behavioral compatibility before reuse/adapt/new",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Find scoped existing-component candidates without deciding reuse from names alone")
    parser.add_argument("root", type=Path)
    parser.add_argument("figma_name")
    parser.add_argument("--scope", type=Path, required=True)
    parser.add_argument("--alias", action="append", default=[])
    parser.add_argument("--max-files", type=int, default=200)
    parser.add_argument("--max-scan-files", type=int, default=1200)
    parser.add_argument("--max-results", type=int, default=12)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    scope = json.loads(args.scope.read_text(encoding="utf-8"))
    result = discover_candidates(
        args.root,
        args.figma_name,
        scope,
        aliases=args.alias,
        max_files=args.max_files,
        max_scan_files=args.max_scan_files,
        max_results=args.max_results,
    )
    if args.output:
        fvq.save(args.output, result)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
