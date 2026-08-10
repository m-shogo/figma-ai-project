#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def resolve_repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"contract path escapes repository root: {value}")
    if not path.is_file():
        raise ValueError(f"contract file does not exist: {value}")
    return path


def summarize(path: Path, data: dict[str, Any]) -> dict[str, Any]:
    breakpoints = data.get("breakpoints", {})
    foundation = data.get("foundation", {})
    freeze = data.get("freeze", {})
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": sha256(path),
        "contract_id": data.get("contract_id", ""),
        "reference_id": data.get("reference_id", ""),
        "status": data.get("status", ""),
        "frozen": bool(freeze.get("ready")),
        "foundation_status": foundation.get("status", ""),
        "foundation_commit": foundation.get("commit", ""),
        "breakpoint_mode": breakpoints.get("mode", ""),
        "breakpoint_source": breakpoints.get("source", ""),
        "breakpoint_names": [value.get("name", "") for value in breakpoints.get("values", [])],
    }


def frozen_errors(summary: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if summary["status"] != "FROZEN":
        errors.append("status must be FROZEN")
    if summary["frozen"] is not True:
        errors.append("freeze.ready must be true")
    if summary["foundation_status"] != "VERIFIED":
        errors.append("foundation.status must be VERIFIED")
    if not summary["foundation_commit"]:
        errors.append("foundation.commit is required")
    if summary["breakpoint_mode"] == "UNKNOWN":
        errors.append("breakpoint mode cannot be UNKNOWN")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Print the immutable fingerprint/lineage metadata for a Shared Contract."
    )
    parser.add_argument("contract", help="Repository-relative shared-contract YAML path")
    parser.add_argument(
        "--check-frozen",
        action="store_true",
        help="Exit non-zero unless the contract is ready for section workers",
    )
    parser.add_argument(
        "--shell",
        action="store_true",
        help="Print key=value lines instead of JSON",
    )
    args = parser.parse_args()

    try:
        path = resolve_repo_path(args.contract)
        data = load_yaml(path)
        summary = summarize(path, data)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if args.shell:
        for key, value in summary.items():
            rendered = json.dumps(value, ensure_ascii=False) if isinstance(value, (list, dict, bool)) else str(value)
            print(f"{key}={rendered}")
    else:
        print(json.dumps(summary, ensure_ascii=False, indent=2))

    if args.check_frozen:
        errors = frozen_errors(summary)
        if errors:
            for error in errors:
                print(f"ERROR: {error}", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
