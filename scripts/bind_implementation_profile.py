#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml

from validate_implementation_profile import ROOT, load_yaml, semantic_errors

TARGETS_PATH = ROOT / "config" / "implementation-targets.yaml"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path: Path) -> str:
    resolved = path.resolve()
    if resolved != ROOT and ROOT not in resolved.parents:
        raise ValueError(f"path escapes repository root: {path}")
    return resolved.relative_to(ROOT).as_posix()


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            yaml.safe_dump(value, handle, sort_keys=False, allow_unicode=True)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def bind(contract: dict[str, Any], profile: dict[str, Any], profile_path: Path) -> dict[str, Any]:
    config = load_yaml(TARGETS_PATH)
    errors = semantic_errors(profile, config)
    if errors:
        raise ValueError("Implementation Profile is not production-ready:\n- " + "\n- ".join(errors))
    if profile.get("status") != "FROZEN" or profile.get("freeze", {}).get("ready") is not True:
        raise ValueError("Implementation Profile must be FROZEN before binding")
    if contract.get("freeze", {}).get("ready") is True or contract.get("status") == "FROZEN":
        raise ValueError("bind Implementation Profile before Shared Contract freeze")

    contract_codebase = contract.get("codebase", {})
    profile_repo = profile.get("repository", {})
    contract_repo = str(contract_codebase.get("repository", "")).strip()
    contract_start = str(contract_codebase.get("starting_commit", "")).strip()
    profile_repo_name = str(profile_repo.get("repository", "")).strip()
    profile_start = str(profile_repo.get("starting_commit", "")).strip()
    if contract_repo and contract_repo != profile_repo_name:
        raise ValueError("Shared Contract repository conflicts with Implementation Profile")
    if contract_start and contract_start != profile_start:
        raise ValueError("Shared Contract starting_commit conflicts with Implementation Profile")

    updated = dict(contract)
    updated["implementation_profile"] = {
        "path": relative(profile_path),
        "sha256": sha256(profile_path),
        "profile_id": profile.get("profile_id", ""),
        "status": "BOUND",
        "family": profile.get("effective", {}).get("family", ""),
        "variant": profile.get("effective", {}).get("variant", ""),
    }
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description="Bind a FROZEN Implementation Profile to a DRAFT Shared Contract")
    parser.add_argument("shared_contract", type=Path)
    parser.add_argument("implementation_profile", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    contract_path = args.shared_contract if args.shared_contract.is_absolute() else ROOT / args.shared_contract
    profile_path = args.implementation_profile if args.implementation_profile.is_absolute() else ROOT / args.implementation_profile
    if not contract_path.is_file() or not profile_path.is_file():
        raise ValueError("shared contract and implementation profile must both exist")

    updated = bind(load_yaml(contract_path), load_yaml(profile_path), profile_path)
    if args.apply:
        atomic_write(contract_path, updated)
        print(f"UPDATED {contract_path.relative_to(ROOT)} implementation_profile=BOUND")
    else:
        print(f"DRY-RUN {contract_path.relative_to(ROOT)} implementation_profile=BOUND")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
