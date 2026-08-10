#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def atomic_create_yaml(path: Path, data: dict[str, Any]) -> None:
    if path.exists():
        raise ValueError(f"refusing to overwrite existing file: {path}")
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


def repo_relative(path: Path) -> str:
    resolved = path.resolve()
    if resolved != ROOT and ROOT not in resolved.parents:
        raise ValueError(f"path escapes repository root: {path}")
    return resolved.relative_to(ROOT).as_posix()


def build_records(experiment_id: str, reference_id: str) -> dict[Path, dict[str, Any]]:
    reference_path = ROOT / "references" / reference_id / "reference.yaml"
    contract_path = ROOT / "contracts" / experiment_id / "shared-contract.yaml"
    experiment_dir = ROOT / "experiments" / experiment_id
    section_path = experiment_dir / "section-manifest.yaml"
    profile_path = experiment_dir / "figma-structure-profile.yaml"

    reference = copy.deepcopy(load_yaml(ROOT / "templates" / "reference-manifest.yaml"))
    reference["reference_id"] = reference_id
    reference["status"] = "WAITING_FOR_REFERENCE"
    reference["freeze"]["ready"] = False

    contract = copy.deepcopy(load_yaml(ROOT / "templates" / "shared-contract.yaml"))
    contract["contract_id"] = f"CONTRACT-{experiment_id}"
    contract["reference_id"] = reference_id
    contract["status"] = "DRAFT"
    contract["freeze"]["ready"] = False

    profile = copy.deepcopy(load_yaml(ROOT / "templates" / "figma-structure-profile.yaml"))
    profile["reference_id"] = reference_id

    section = copy.deepcopy(load_yaml(ROOT / "templates" / "section-manifest.yaml"))
    section["reference_id"] = reference_id
    section["page_id"] = ""
    section["shared_contract"] = repo_relative(contract_path)
    section["shared_contract_sha256"] = ""
    section["figma_structure_profile"] = repo_relative(profile_path)
    section["figma_structure_profile_sha256"] = ""
    section["foundation_commit"] = ""

    return {
        reference_path: reference,
        contract_path: contract,
        profile_path: profile,
        section_path: section,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create an empty, linked experiment skeleton without inventing any design values"
    )
    parser.add_argument("--experiment-id", required=True)
    parser.add_argument("--reference-id", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    experiment_id = args.experiment_id.strip()
    reference_id = args.reference_id.strip()
    if not experiment_id or not reference_id:
        raise ValueError("experiment/reference IDs must not be empty")
    if "/" in experiment_id or "/" in reference_id or ".." in experiment_id or ".." in reference_id:
        raise ValueError("experiment/reference IDs must be simple path-safe identifiers")

    records = build_records(experiment_id, reference_id)
    existing = [path for path in records if path.exists()]
    if existing:
        names = ", ".join(repo_relative(path) for path in existing)
        raise ValueError(f"refusing partial/duplicate bootstrap because files already exist: {names}")

    for path in records:
        print(f"CREATE {repo_relative(path)}")

    if not args.apply:
        print("DRY-RUN: pass --apply to create the linked skeleton")
        return 0

    created: list[Path] = []
    try:
        for path, data in records.items():
            atomic_create_yaml(path, data)
            created.append(path)
    except Exception:
        # Fail closed: do not leave a half-created experiment skeleton.
        for path in reversed(created):
            path.unlink(missing_ok=True)
        raise

    print("BOOTSTRAP COMPLETE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
