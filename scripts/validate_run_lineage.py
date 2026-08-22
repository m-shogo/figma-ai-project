#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import sys
from pathlib import Path
from typing import Any

import yaml

from validate_records import SECTION_SCHEMA, load_json as load_schema_json, validate_schema

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"RUNNING", "COMPLETE"}
SECTION_SCOPES = {"SECTION", "INTEGRATION"}
OBSERVATION_LINEAGE_RUN_SCHEMA_VERSION = 13
OBSERVATION_COVERAGE_SECTION_SCHEMA_VERSION = 9


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def linked_file(value: str, label: str) -> tuple[Path | None, list[str]]:
    text = value.strip()
    if not text:
        return None, [f"{label} is required"]
    try:
        path = repo_path(text)
    except ValueError as exc:
        return None, [str(exc)]
    if not path.is_file():
        return path, [f"{label} does not exist: {text}"]
    return path, []


def require_hash(path: Path | None, expected: str, label: str) -> list[str]:
    errors: list[str] = []
    if not expected.strip():
        errors.append(f"{label} sha256 is required")
        return errors
    if path is None or not path.is_file():
        return errors
    actual = file_sha256(path)
    if actual != expected:
        errors.append(f"{label} sha256 mismatch: expected {expected}, actual {actual}")
    return errors


def candidate_runs() -> list[Path]:
    found: list[Path] = [ROOT / "templates" / "run-record.yaml"]
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "run.yaml" or path.name.endswith("run.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def validate_company_policy_lineage(
    contract: dict[str, Any], coordination: dict[str, Any]
) -> list[str]:
    errors: list[str] = []
    binding = contract.get("company_policy", {})
    if not isinstance(binding, dict) or binding.get("status") != "BOUND":
        return errors

    expected_path = str(binding.get("path", ""))
    expected_hash = str(binding.get("sha256", ""))
    expected_id = str(binding.get("policy_id", ""))
    run_path = str(coordination.get("company_policy_path", ""))
    run_hash = str(coordination.get("company_policy_sha256", ""))
    run_id = str(coordination.get("company_policy_id", ""))

    if run_path != expected_path:
        errors.append("run Company Policy path does not match Shared Contract binding")
    if run_hash != expected_hash:
        errors.append("run Company Policy hash does not match Shared Contract binding")
    if run_id != expected_id:
        errors.append("run Company Policy id does not match Shared Contract binding")

    policy_path, link_errors = linked_file(run_path, "coordination.company_policy_path")
    errors.extend(link_errors)
    errors.extend(require_hash(policy_path, run_hash, "Company Policy"))
    if policy_path and policy_path.is_file():
        try:
            policy = load_yaml(policy_path)
            if str(policy.get("policy_id", "")) != run_id:
                errors.append("run Company Policy id does not match linked policy file")
            if policy.get("status") != "ACTIVE":
                errors.append("active run must use an ACTIVE Company Policy")
        except Exception as exc:
            errors.append(f"cannot read Company Policy: {exc}")
    return errors


def validate_run(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    status = str(data.get("status", "PLANNED"))
    if status not in ACTIVE:
        return errors

    reference = data.get("reference", {})
    coordination = data.get("coordination", {})
    scope = str(coordination.get("scope", ""))

    reference_path, link_errors = linked_file(
        str(reference.get("manifest_path", "")), "reference.manifest_path"
    )
    errors.extend(link_errors)
    errors.extend(
        require_hash(
            reference_path,
            str(reference.get("manifest_sha256", "")),
            "reference manifest",
        )
    )

    if reference_path and reference_path.is_file():
        try:
            reference_data = load_yaml(reference_path)
            if reference_data.get("reference_id") != reference.get("reference_id"):
                errors.append("run reference_id does not match linked reference manifest")
        except Exception as exc:
            errors.append(f"cannot read reference manifest: {exc}")

    if scope not in SECTION_SCOPES:
        return errors

    contract_path, contract_link_errors = linked_file(
        str(coordination.get("shared_contract_path", "")),
        "coordination.shared_contract_path",
    )
    errors.extend(contract_link_errors)
    errors.extend(
        require_hash(
            contract_path,
            str(coordination.get("shared_contract_sha256", "")),
            "shared contract",
        )
    )

    manifest_path, manifest_link_errors = linked_file(
        str(coordination.get("section_manifest_path", "")),
        "coordination.section_manifest_path",
    )
    errors.extend(manifest_link_errors)
    errors.extend(
        require_hash(
            manifest_path,
            str(coordination.get("section_manifest_sha256", "")),
            "section manifest",
        )
    )

    profile_path, profile_link_errors = linked_file(
        str(coordination.get("figma_structure_profile_path", "")),
        "coordination.figma_structure_profile_path",
    )
    errors.extend(profile_link_errors)
    errors.extend(
        require_hash(
            profile_path,
            str(coordination.get("figma_structure_profile_sha256", "")),
            "Figma Structure Profile",
        )
    )

    contract: dict[str, Any] | None = None
    if contract_path and contract_path.is_file():
        try:
            contract = load_yaml(contract_path)
            if contract.get("reference_id") != reference.get("reference_id"):
                errors.append("run reference_id does not match shared contract reference_id")
            foundation = contract.get("foundation", {})
            if isinstance(foundation, dict) and foundation.get("commit"):
                if foundation.get("commit") != coordination.get("foundation_commit"):
                    errors.append("run foundation commit does not match shared contract foundation.commit")
            errors.extend(validate_company_policy_lineage(contract, coordination))
        except Exception as exc:
            errors.append(f"cannot read shared contract: {exc}")

    profile: dict[str, Any] | None = None
    if profile_path and profile_path.is_file():
        try:
            profile = load_yaml(profile_path)
            if profile.get("reference_id") != reference.get("reference_id"):
                errors.append("run reference_id does not match Figma Structure Profile reference_id")
        except Exception as exc:
            errors.append(f"cannot read Figma Structure Profile: {exc}")

    if manifest_path is None or not manifest_path.is_file():
        return errors

    try:
        manifest = load_yaml(manifest_path)
    except Exception as exc:
        errors.append(f"cannot read section manifest: {exc}")
        return errors

    run_schema_version = int(data.get("schema_version", 0) or 0)
    if run_schema_version >= OBSERVATION_LINEAGE_RUN_SCHEMA_VERSION:
        manifest_schema_version = int(manifest.get("schema_version", 0) or 0)
        if manifest_schema_version < OBSERVATION_COVERAGE_SECTION_SCHEMA_VERSION:
            errors.append(
                "active schema-v13+ SECTION/INTEGRATION run requires Section Manifest schema v9+ Observation Coverage"
            )
        else:
            schema_errors = validate_schema(manifest, load_schema_json(SECTION_SCHEMA))
            errors.extend(f"section manifest schema v9 invalid: {error}" for error in schema_errors)

    if manifest.get("reference_id") != reference.get("reference_id"):
        errors.append("run reference_id does not match section manifest reference_id")
    if manifest.get("shared_contract_sha256") != coordination.get("shared_contract_sha256"):
        errors.append("run shared contract hash does not match section manifest")
    if manifest.get("foundation_commit") != coordination.get("foundation_commit"):
        errors.append("run foundation commit does not match section manifest")

    manifest_profile_path = str(manifest.get("figma_structure_profile", ""))
    manifest_profile_hash = str(manifest.get("figma_structure_profile_sha256", ""))
    if manifest_profile_path != str(coordination.get("figma_structure_profile_path", "")):
        errors.append("run Figma Structure Profile path does not match section manifest")
    if manifest_profile_hash != str(coordination.get("figma_structure_profile_sha256", "")):
        errors.append("run Figma Structure Profile hash does not match section manifest")

    if scope == "INTEGRATION":
        return errors

    section_id = str(coordination.get("section_id", "")).strip()
    if not section_id:
        errors.append("SECTION run requires coordination.section_id")
        return errors

    section = next(
        (item for item in manifest.get("sections", []) if item.get("section_id") == section_id),
        None,
    )
    if section is None:
        errors.append(f"SECTION run section_id not found in manifest: {section_id}")
        return errors

    if profile is not None:
        profile_section = next(
            (item for item in profile.get("sections", []) if item.get("section_id") == section_id),
            None,
        )
        if profile_section is None:
            errors.append(f"SECTION run section_id not found in Figma Structure Profile: {section_id}")
        elif profile_section.get("recommended_translation_mode") == "UNKNOWN":
            errors.append("SECTION run cannot use UNKNOWN recommended_translation_mode")

    worker = section.get("worker", {})
    isolation = worker.get("isolation", {})

    if worker.get("contract_sha256") != coordination.get("shared_contract_sha256"):
        errors.append("section worker contract_sha256 does not match run shared contract hash")

    run_group = str(coordination.get("parallel_group", "")).strip()
    worker_group = str(worker.get("parallel_group", "")).strip()
    if run_group != worker_group:
        errors.append(
            f"run parallel_group {run_group!r} does not match section worker group {worker_group!r}"
        )

    run_mode = str(coordination.get("isolation_mode", "")).strip()
    worker_mode = str(isolation.get("mode", "")).strip()
    if run_mode != worker_mode:
        errors.append(
            f"run isolation_mode {run_mode!r} does not match section worker mode {worker_mode!r}"
        )

    run_ref = str(coordination.get("isolation_ref", "")).strip()
    worker_ref = str(isolation.get("ref", "")).strip()
    if run_ref != worker_ref:
        errors.append(
            f"run isolation_ref {run_ref!r} does not match section worker ref {worker_ref!r}"
        )

    return errors


def main() -> int:
    failures = 0
    for path in candidate_runs():
        try:
            errors = validate_run(load_yaml(path))
        except Exception as exc:
            errors = [str(exc)]

        relative = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {relative}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {relative}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
