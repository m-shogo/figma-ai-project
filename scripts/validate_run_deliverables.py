#!/usr/bin/env python3
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import yaml

from validate_acf_export import validate_path as validate_acf_export_path

ROOT = Path(__file__).resolve().parents[1]


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def candidate_runs() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "run.yaml" or path.name.endswith("run.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def validate_run(data: dict[str, Any]) -> list[str]:
    if data.get("status") != "COMPLETE":
        return []
    coordination = data.get("coordination", {})
    profile_raw = str(coordination.get("implementation_profile_path", "")).strip()
    if not profile_raw:
        # Legacy completed research run. New production runs cannot start without a profile pin.
        return []
    profile_path = repo_path(profile_raw)
    if not profile_path.is_file():
        return [f"Implementation Profile does not exist: {profile_raw}"]
    expected_hash = str(coordination.get("implementation_profile_sha256", "")).strip()
    if not expected_hash or file_sha256(profile_path) != expected_hash:
        return ["completed run Implementation Profile hash is stale"]
    profile = load_yaml(profile_path)
    requirement = profile.get("delivery_requirements", {}).get("acf", {})
    if requirement.get("required") is not True:
        return []

    errors: list[str] = []
    delivery = data.get("deliverables", {}).get("acf", {})
    if delivery.get("required") is not True:
        errors.append("ACF-enabled completed run requires deliverables.acf.required=true")
        return errors

    export = delivery.get("export_json", {})
    if export.get("required") is not True:
        errors.append("ACF-enabled completed run requires export_json.required=true")
    target_path = str(export.get("target_repo_path", "")).strip()
    if not target_path.endswith(".json"):
        errors.append("ACF target_repo_path must point to the delivered .json export")
    evidence_raw = str(export.get("evidence_json_path", "")).strip()
    if not evidence_raw:
        errors.append("ACF completed run requires evidence_json_path copied into research evidence")
    else:
        evidence_path = repo_path(evidence_raw)
        acf_errors = validate_acf_export_path(evidence_path)
        errors.extend(f"ACF export evidence: {error}" for error in acf_errors)
    if export.get("validation_status") != "PASS":
        errors.append("ACF export validation_status must be PASS before run completion")

    smoke = delivery.get("import_smoke", {})
    if smoke.get("required") is True:
        if smoke.get("status") != "PASS":
            errors.append("ACF import/sync smoke must PASS before run completion")
        method = str(smoke.get("method", "")).strip()
        accepted = {str(value) for value in smoke.get("accepted_methods", [])}
        if not method or method not in accepted:
            errors.append("ACF import/sync smoke method must be one accepted by the Implementation Profile")
        if not smoke.get("evidence"):
            errors.append("ACF import/sync smoke requires evidence")

    local_json = delivery.get("local_json", {})
    if local_json.get("required") is True and not local_json.get("evidence_files"):
        errors.append("required ACF Local JSON delivery needs evidence_files")
    return errors


def main() -> int:
    failures = 0
    for path in candidate_runs():
        try:
            errors = validate_run(load_yaml(path))
        except Exception as exc:
            errors = [str(exc)]
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel} deliverables")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel} deliverables")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
