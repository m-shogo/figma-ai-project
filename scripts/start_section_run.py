#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml

from validate_run_lineage import validate_run

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_PREFLIGHT = (
    "figma_release_notes_checked",
    "figma_mcp_docs_checked",
    "agent_docs_checked",
    "community_scan_checked",
)


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def atomic_write(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def preflight_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    preflight = data.get("tooling_preflight", {})
    if not isinstance(preflight, dict):
        return ["tooling_preflight must be an object"]
    if not str(preflight.get("checked_at", "")).strip():
        errors.append("tooling_preflight.checked_at is required")
    for field in REQUIRED_PREFLIGHT:
        if preflight.get(field) is not True:
            errors.append(f"tooling_preflight.{field} must be true")
    return errors


def start(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("status", "PLANNED"))
    if status != "PLANNED":
        raise ValueError(f"only PLANNED runs can start; current status={status}")
    if data.get("coordination", {}).get("scope") != "SECTION":
        raise ValueError("start_section_run.py only starts SECTION runs")

    errors = preflight_errors(data)
    if errors:
        raise ValueError("preflight incomplete:\n- " + "\n- ".join(errors))

    candidate = dict(data)
    candidate["status"] = "RUNNING"
    lineage_errors = validate_run(candidate)
    if lineage_errors:
        raise ValueError("run lineage invalid:\n- " + "\n- ".join(lineage_errors))

    return candidate


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Transition a pinned SECTION run from PLANNED to RUNNING only after real preflight evidence is recorded"
    )
    parser.add_argument("run_record", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    path = args.run_record if args.run_record.is_absolute() else ROOT / args.run_record
    if not path.is_file():
        raise ValueError(f"run record does not exist: {path}")

    current = load_yaml(path)
    started = start(current)

    if args.apply:
        atomic_write(path, started)
        print(f"UPDATED {path.relative_to(ROOT)} → RUNNING")
    else:
        print(f"DRY-RUN {path.relative_to(ROOT)} → RUNNING")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
