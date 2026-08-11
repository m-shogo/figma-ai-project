#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
MAX_TEXT_FILE_BYTES = 4 * 1024 * 1024

# Build the signature from non-contiguous pieces so the validator does not flag itself.
EPHEMERAL_URL_SIGNATURE = "https://" + "www.figma.com" + "/api/mcp/asset/"


def git_tracked_files(root: Path = ROOT) -> list[Path]:
    completed = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=root,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    paths: list[Path] = []
    for raw in completed.stdout.split(b"\0"):
        if not raw:
            continue
        paths.append(root / raw.decode("utf-8", errors="strict"))
    return paths


def readable_text(path: Path, *, max_bytes: int = MAX_TEXT_FILE_BYTES) -> str | None:
    try:
        if not path.is_file() or path.stat().st_size > max_bytes:
            return None
        payload = path.read_bytes()
    except OSError:
        return None
    if b"\x00" in payload:
        return None
    try:
        return payload.decode("utf-8")
    except UnicodeDecodeError:
        return None


def find_ephemeral_url_leaks(paths: Iterable[Path]) -> list[tuple[Path, int]]:
    leaks: list[tuple[Path, int]] = []
    for path in paths:
        text = readable_text(path)
        if text is None:
            continue
        for line_number, line in enumerate(text.splitlines(), start=1):
            if EPHEMERAL_URL_SIGNATURE in line:
                leaks.append((path, line_number))
    return leaks


def display_path(path: Path, root: Path = ROOT) -> str:
    try:
        return str(path.resolve().relative_to(root.resolve()))
    except ValueError:
        return str(path)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fail if a tracked UTF-8 text file contains a short-lived Figma MCP asset URL."
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Optional paths to scan. With no paths, scan all git-tracked files.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if args.paths:
        paths = [path if path.is_absolute() else ROOT / path for path in args.paths]
    else:
        try:
            paths = git_tracked_files()
        except (OSError, subprocess.CalledProcessError, UnicodeDecodeError) as exc:
            print(f"FAIL Figma MCP URL leak gate: cannot enumerate tracked files: {type(exc).__name__}", file=sys.stderr)
            return 1

    leaks = find_ephemeral_url_leaks(paths)
    if leaks:
        print("FAIL Figma MCP URL leak gate: short-lived asset URL must not be persisted", file=sys.stderr)
        for path, line_number in leaks:
            print(f"  - {display_path(path)}:{line_number}", file=sys.stderr)
        return 1

    print(f"PASS Figma MCP URL leak gate files_scanned={len(paths)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
