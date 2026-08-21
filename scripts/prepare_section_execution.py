#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml

from section_planner import build_plan
from validate_records import SECTION_SCHEMA, load_json as load_schema_json, validate_schema

ROOT = Path(__file__).resolve().parents[1]
IMMUTABLE_WORKER_STATES = {"READY", "RUNNING", "COMPLETE"}
OBSERVATION_COVERAGE_SCHEMA_VERSION = 9


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_relative(path: Path, root: Path) -> str:
    resolved = path.resolve()
    if resolved != root and root not in resolved.parents:
        raise ValueError(f"path escapes repository root: {path}")
    return resolved.relative_to(root).as_posix()


def resolve_path(root: Path, value: str, label: str) -> Path:
    if not value.strip():
        raise ValueError(f"{label} is required")
    candidate = Path(value)
    path = candidate if candidate.is_absolute() else root / candidate
    resolved = path.resolve()
    if resolved != root and root not in resolved.parents:
        raise ValueError(f"{label} escapes repository root: {value}")
    if not resolved.is_file():
        raise ValueError(f"{label} does not exist: {value}")
    return resolved


def atomic_write_yaml(path: Path, data: dict[str, Any]) -> None:
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


def require_v9_manifest_schema(manifest: dict[str, Any]) -> None:
    """Fail before planning/activation instead of writing an invalid schema-v9 manifest.

    Historical manifests stay on their original lifecycle. New v9 manifests reuse the
    canonical Section schema so Observation Coverage is not reimplemented as another
    validator or silently deferred until CI.
    """

    version = int(manifest.get("schema_version", 0) or 0)
    if version < OBSERVATION_COVERAGE_SCHEMA_VERSION:
        return
    errors = validate_schema(manifest, load_schema_json(SECTION_SCHEMA))
    if errors:
        raise ValueError("Section Manifest schema v9 invalid:\n- " + "\n- ".join(errors))


def require_frozen_contract(contract: dict[str, Any]) -> str:
    freeze = contract.get("freeze", {})
    foundation = contract.get("foundation", {})
    if contract.get("status") != "FROZEN" or freeze.get("ready") is not True:
        raise ValueError("Shared Contract must be FROZEN with freeze.ready=true")
    if foundation.get("status") != "VERIFIED":
        raise ValueError("Shared Contract foundation.status must be VERIFIED")
    commit = str(foundation.get("commit", "")).strip()
    if not commit:
        raise ValueError("Shared Contract foundation.commit is required")
    return commit


def verify_reference_alignment(
    manifest: dict[str, Any],
    contract: dict[str, Any],
    profile: dict[str, Any],
) -> None:
    reference_id = str(manifest.get("reference_id", "")).strip()
    if not reference_id:
        raise ValueError("Section Manifest reference_id is required")
    if str(contract.get("reference_id", "")).strip() != reference_id:
        raise ValueError("Shared Contract reference_id does not match Section Manifest")
    if str(profile.get("reference_id", "")).strip() != reference_id:
        raise ValueError("Figma Structure Profile reference_id does not match Section Manifest")


def ensure_worker_can_repin(
    section_id: str,
    worker: dict[str, Any],
    contract_hash: str,
    foundation_commit: str,
) -> None:
    status = str(worker.get("status", "PLANNED"))
    if status not in IMMUTABLE_WORKER_STATES:
        return

    old_contract = str(worker.get("contract_sha256", "")).strip()
    old_base = str(worker.get("base_commit", "")).strip()
    if old_contract and old_contract != contract_hash:
        raise ValueError(
            f"{section_id} is {status} and pinned to a different Shared Contract; "
            "create a new contract/section execution revision instead of repinning in place"
        )
    if old_base and old_base != foundation_commit:
        raise ValueError(
            f"{section_id} is {status} and pinned to a different foundation commit; "
            "do not rewrite active/completed lineage"
        )


def assign_wave_groups(manifest: dict[str, Any], plan: dict[str, Any]) -> None:
    group_by_section: dict[str, str] = {}
    for wave in plan.get("waves", []):
        group = str(wave.get("recommended_parallel_group", "")).strip()
        for section_id in wave.get("sections", []):
            group_by_section[str(section_id)] = group

    for section in manifest.get("sections", []):
        section_id = str(section.get("section_id", "")).strip()
        worker = section.setdefault("worker", {})
        status = str(worker.get("status", "PLANNED"))
        if status in {"COMPLETE", "BLOCKED"}:
            continue
        group = group_by_section.get(section_id)
        if group:
            if status in {"READY", "RUNNING"}:
                existing = str(worker.get("parallel_group", "")).strip()
                if existing and existing != group:
                    raise ValueError(
                        f"{section_id} is {status} in parallel_group={existing}; "
                        f"planner now recommends {group}. Do not rewrite an active worker group."
                    )
            else:
                worker["parallel_group"] = group


def prepare_manifest(
    manifest_path: Path,
    *,
    root: Path = ROOT,
    shared_contract_override: str | None = None,
    structure_profile_override: str | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    root = root.resolve()
    manifest_path = manifest_path.resolve()
    if manifest_path == root / "templates" / "section-manifest.yaml":
        raise ValueError("do not prepare the canonical template in place; copy it into an experiment first")

    manifest = load_yaml(manifest_path)
    require_v9_manifest_schema(manifest)

    contract_value = shared_contract_override or str(manifest.get("shared_contract", ""))
    profile_value = structure_profile_override or str(manifest.get("figma_structure_profile", ""))
    contract_path = resolve_path(root, contract_value, "Shared Contract")
    profile_path = resolve_path(root, profile_value, "Figma Structure Profile")

    contract = load_yaml(contract_path)
    profile = load_yaml(profile_path)
    verify_reference_alignment(manifest, contract, profile)
    foundation_commit = require_frozen_contract(contract)
    contract_hash = file_sha256(contract_path)
    profile_hash = file_sha256(profile_path)

    for section in manifest.get("sections", []):
        section_id = str(section.get("section_id", "")).strip() or "<unknown>"
        worker = section.setdefault("worker", {})
        ensure_worker_can_repin(section_id, worker, contract_hash, foundation_commit)

    manifest["shared_contract"] = repo_relative(contract_path, root)
    manifest["shared_contract_sha256"] = contract_hash
    manifest["figma_structure_profile"] = repo_relative(profile_path, root)
    manifest["figma_structure_profile_sha256"] = profile_hash
    manifest["foundation_commit"] = foundation_commit

    for section in manifest.get("sections", []):
        worker = section.setdefault("worker", {})
        status = str(worker.get("status", "PLANNED"))
        if status in {"PLANNED", "BLOCKED"}:
            worker["contract_sha256"] = contract_hash
            worker["base_commit"] = foundation_commit

    plan = build_plan(manifest)
    assign_wave_groups(manifest, plan)
    return manifest, plan


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Pin Shared Contract/Profile/Foundation lineage and plan safe section execution waves"
    )
    parser.add_argument("manifest", type=Path, help="experiment section-manifest.yaml")
    parser.add_argument("--shared-contract", help="override Shared Contract repo-relative path")
    parser.add_argument("--structure-profile", help="override Figma Structure Profile repo-relative path")
    parser.add_argument("--apply", action="store_true", help="write prepared manifest atomically")
    parser.add_argument("--json", action="store_true", help="emit machine-readable plan/result")
    args = parser.parse_args()

    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    prepared, plan = prepare_manifest(
        manifest_path,
        root=ROOT,
        shared_contract_override=args.shared_contract,
        structure_profile_override=args.structure_profile,
    )

    if args.apply:
        atomic_write_yaml(manifest_path, prepared)

    result = {
        "manifest": repo_relative(manifest_path, ROOT),
        "applied": args.apply,
        "shared_contract": prepared.get("shared_contract", ""),
        "shared_contract_sha256": prepared.get("shared_contract_sha256", ""),
        "figma_structure_profile": prepared.get("figma_structure_profile", ""),
        "figma_structure_profile_sha256": prepared.get("figma_structure_profile_sha256", ""),
        "foundation_commit": prepared.get("foundation_commit", ""),
        "waves": plan.get("waves", []),
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        action = "UPDATED" if args.apply else "DRY-RUN"
        print(f"{action} {result['manifest']}")
        print(f"Shared Contract: {result['shared_contract_sha256']}")
        print(f"Structure Profile: {result['figma_structure_profile_sha256']}")
        print(f"Foundation: {result['foundation_commit']}")
        for wave in result["waves"]:
            print(
                f"Wave {wave['wave']} {wave['recommended_parallel_group']}: "
                + ", ".join(wave["sections"])
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())