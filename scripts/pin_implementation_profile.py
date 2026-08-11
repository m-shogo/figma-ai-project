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


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


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


def pin(run: dict[str, Any]) -> dict[str, Any]:
    if run.get("status") != "PLANNED":
        raise ValueError("Implementation Profile can only be pinned while run status=PLANNED")
    coordination = dict(run.get("coordination", {}))
    contract_raw = str(coordination.get("shared_contract_path", "")).strip()
    if not contract_raw:
        raise ValueError("run coordination.shared_contract_path is required")
    contract_path = repo_path(contract_raw)
    if not contract_path.is_file():
        raise ValueError(f"Shared Contract does not exist: {contract_raw}")
    expected_contract_hash = str(coordination.get("shared_contract_sha256", "")).strip()
    if not expected_contract_hash or file_sha256(contract_path) != expected_contract_hash:
        raise ValueError("run Shared Contract hash is stale before Implementation Profile pin")

    contract = load_yaml(contract_path)
    binding = contract.get("implementation_profile", {})
    if not isinstance(binding, dict) or binding.get("status") != "BOUND":
        raise ValueError("Shared Contract has no BOUND Implementation Profile")
    profile_raw = str(binding.get("path", "")).strip()
    profile_hash = str(binding.get("sha256", "")).strip()
    profile_id = str(binding.get("profile_id", "")).strip()
    if not profile_raw or not profile_hash or not profile_id:
        raise ValueError("BOUND Implementation Profile requires path/hash/id")
    profile_path = repo_path(profile_raw)
    if not profile_path.is_file():
        raise ValueError(f"Implementation Profile does not exist: {profile_raw}")
    if file_sha256(profile_path) != profile_hash:
        raise ValueError("Implementation Profile hash changed after Shared Contract binding")

    profile = load_yaml(profile_path)
    if profile.get("profile_id") != profile_id:
        raise ValueError("Implementation Profile id does not match Shared Contract binding")
    errors = semantic_errors(profile, load_yaml(TARGETS_PATH))
    if errors:
        raise ValueError("Implementation Profile is not production-ready:\n- " + "\n- ".join(errors))
    if profile.get("status") != "FROZEN" or profile.get("freeze", {}).get("ready") is not True:
        raise ValueError("Implementation Profile must remain FROZEN")

    profile_repo = profile.get("repository", {})
    run_code = run.get("code", {})
    if str(profile_repo.get("repository", "")) != str(run_code.get("repository", "")):
        raise ValueError("Implementation Profile repository does not match run code.repository")

    coordination.update(
        {
            "implementation_profile_path": profile_raw,
            "implementation_profile_sha256": profile_hash,
            "implementation_profile_id": profile_id,
            "implementation_family": profile.get("effective", {}).get("family", ""),
            "implementation_variant": profile.get("effective", {}).get("variant", ""),
        }
    )

    acf_requirement = profile.get("delivery_requirements", {}).get("acf", {})
    acf_required = acf_requirement.get("required") is True
    deliverables = dict(run.get("deliverables", {}))
    deliverables["acf"] = {
        "required": acf_required,
        "export_json": {
            "required": bool(acf_requirement.get("export_json", {}).get("required")) if acf_required else False,
            "target_repo_path": acf_requirement.get("export_json", {}).get("target_repo_path", "") if acf_required else "",
            "evidence_json_path": "",
            "validation_status": "PENDING" if acf_required else "NOT_REQUIRED",
        },
        "local_json": {
            "required": bool(acf_requirement.get("local_json", {}).get("required")) if acf_required else False,
            "target_repo_dir": acf_requirement.get("local_json", {}).get("target_repo_dir", "") if acf_required else "",
            "evidence_files": [],
        },
        "import_smoke": {
            "required": bool(acf_requirement.get("import_or_sync_smoke_required")) if acf_required else False,
            "status": "PENDING" if acf_required else "NOT_REQUIRED",
            "method": "",
            "evidence": [],
            "accepted_methods": list(acf_requirement.get("accepted_methods", [])) if acf_required else [],
        },
    }

    updated = dict(run)
    updated["coordination"] = coordination
    updated["deliverables"] = deliverables
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description="Pin the Shared Contract's FROZEN Implementation Profile into a PLANNED run")
    parser.add_argument("run_record", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = args.run_record if args.run_record.is_absolute() else ROOT / args.run_record
    if not path.is_file():
        raise ValueError(f"run record does not exist: {path}")
    updated = pin(load_yaml(path))
    if args.apply:
        atomic_write(path, updated)
        print(f"UPDATED {path.relative_to(ROOT)} implementation_profile=pinned")
    else:
        print(f"DRY-RUN {path.relative_to(ROOT)} implementation_profile=pinned")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
